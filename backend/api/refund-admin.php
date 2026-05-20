<?php
error_reporting(E_ALL);
ini_set('display_errors', 0);

header('Access-Control-Allow-Origin: https://uptulathemehub.com');
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: GET, POST, PUT, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once '../config/database.php';
require_once '../config/razorpay.php';
require_once '../config/rbac.php';

// Admin auth check
$adminId = null;
if (isset($_SESSION['admin_id'])) {
    $adminId = $_SESSION['admin_id'];
} elseif (isset($_SERVER['HTTP_AUTHORIZATION'])) {
    // JWT or token-based auth
    $token = str_replace('Bearer ', '', $_SERVER['HTTP_AUTHORIZATION']);
    // Validate token (implement based on your JWT setup)
}

if (!$adminId) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

$conn = getDBConnection();

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    // Get pending refunds for admin review
    $status = trim($_GET['status'] ?? 'requested');
    $allowedStatuses = ['requested', 'approved', 'rejected', 'refunded'];

    if (!in_array($status, $allowedStatuses)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Invalid status']);
        exit;
    }

    $limit = intval($_GET['limit'] ?? 50);
    $offset = intval($_GET['offset'] ?? 0);

    $stmt = $conn->prepare("
        SELECT 
            r.id, r.order_id, r.user_id, r.seller_id, r.amount, r.reason, 
            r.detailed_reason, r.proof_file_path, r.status, r.created_at,
            o.product_id, p.product_name,
            u.email as buyer_email, u.first_name as buyer_name,
            s.first_name as seller_name, s.email as seller_email
        FROM refunds r
        LEFT JOIN orders o ON r.order_id = o.id
        LEFT JOIN products p ON o.product_id = p.id
        LEFT JOIN users u ON r.user_id = u.id
        LEFT JOIN users s ON r.seller_id = s.id
        WHERE r.status = ?
        ORDER BY r.created_at DESC
        LIMIT ? OFFSET ?
    ");

    $stmt->bind_param("sii", $status, $limit, $offset);
    $stmt->execute();
    $result = $stmt->get_result();

    $refunds = [];
    while ($row = $result->fetch_assoc()) {
        $refunds[] = $row;
    }

    echo json_encode([
        'success' => true,
        'refunds' => $refunds,
        'count' => count($refunds)
    ]);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Approve refund
    $refundId = intval($_POST['refund_id'] ?? 0);
    $action = trim($_POST['action'] ?? ''); // 'approve' or 'reject'
    $adminNotes = trim($_POST['admin_notes'] ?? '');
    $rejectionReason = trim($_POST['rejection_reason'] ?? '');

    if (!$refundId || !in_array($action, ['approve', 'reject'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Invalid request']);
        exit;
    }

    // Get refund details
    $stmt = $conn->prepare("
        SELECT r.*, o.razorpay_order_id, o.razorpay_payment_id, u.email
        FROM refunds r
        LEFT JOIN orders o ON r.order_id = o.id
        LEFT JOIN users u ON r.user_id = u.id
        WHERE r.id = ?
    ");

    $stmt->bind_param("i", $refundId);
    $stmt->execute();
    $refundResult = $stmt->get_result();

    if ($refundResult->num_rows === 0) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Refund not found']);
        exit;
    }

    $refund = $refundResult->fetch_assoc();

    if ($action === 'reject') {
        if (!$rejectionReason) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Rejection reason required']);
            exit;
        }

        $newStatus = 'rejected';
        $stmt = $conn->prepare("
            UPDATE refunds
            SET status = ?, rejection_reason = ?, admin_notes = ?, processed_by_admin_id = ?, updated_at = NOW()
            WHERE id = ?
        ");

        $stmt->bind_param("sssii", $newStatus, $rejectionReason, $adminNotes, $adminId, $refundId);

        if (!$stmt->execute()) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Failed to update refund']);
            exit;
        }

        // Log audit
        $auditAction = 'rejected';
        $stmt = $conn->prepare("
            INSERT INTO refund_approvals_audit (refund_id, admin_id, action, notes)
            VALUES (?, ?, ?, ?)
        ");
        $stmt->bind_param("iiss", $refundId, $adminId, $auditAction, $rejectionReason);
        $stmt->execute();

        echo json_encode([
            'success' => true,
            'message' => 'Refund rejected successfully',
            'status' => 'rejected'
        ]);
        exit;
    }

    if ($action === 'approve') {
        // Approve and process refund via Razorpay
        if (empty($refund['razorpay_payment_id'])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'No Razorpay payment ID found']);
            exit;
        }

        try {
            $api = new Razorpay\Api\Api(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET);

            // Create refund
            $refundResponse = $api->payment($refund['razorpay_payment_id'])->refund([
                'amount' => intval($refund['amount'] * 100), // Convert to paise
                'notes' => [
                    'order_id' => $refund['order_id'],
                    'reason' => $refund['reason']
                ]
            ]);

            $razorpayRefundId = $refundResponse->id;

            // Update refund record
            $newStatus = 'approved';
            $stmt = $conn->prepare("
                UPDATE refunds
                SET status = ?, razorpay_refund_id = ?, admin_notes = ?, processed_by_admin_id = ?, updated_at = NOW()
                WHERE id = ?
            ");

            $stmt->bind_param("sssii", $newStatus, $razorpayRefundId, $adminNotes, $adminId, $refundId);

            if (!$stmt->execute()) {
                http_response_code(500);
                echo json_encode(['success' => false, 'message' => 'Failed to update refund record']);
                exit;
            }

            // 💰 DEDUCT FROM SELLER EARNINGS
            $sellerId = $refund['seller_id'];
            $deductionAmount = $refund['amount'];

            // Insert into seller earnings transactions
            $stmt = $conn->prepare("
                INSERT INTO seller_earnings_transactions (seller_id, refund_id, amount, transaction_type, description)
                VALUES (?, ?, ?, 'deduction', ?)
            ");

            $description = "Refund deduction for order #" . $refund['order_id'];
            $stmt->bind_param("iids", $sellerId, $refundId, $deductionAmount, $description);
            $stmt->execute();

            // Update wallet balance
            $stmt = $conn->prepare("
                UPDATE seller_wallet
                SET balance = balance - ?
                WHERE seller_id = ?
            ");
            $stmt->bind_param("di", $deductionAmount, $sellerId);
            $stmt->execute();

            // Log audit
            $auditAction = 'approved';
            $stmt = $conn->prepare("
                INSERT INTO refund_approvals_audit (refund_id, admin_id, action, razorpay_refund_id, notes)
                VALUES (?, ?, ?, ?, ?)
            ");
            $stmt->bind_param("iisss", $refundId, $adminId, $auditAction, $razorpayRefundId, $adminNotes);
            $stmt->execute();

            error_log("Refund approved - ID: $refundId, Razorpay ID: $razorpayRefundId, Seller: $sellerId, Deduction: $deductionAmount");

            echo json_encode([
                'success' => true,
                'message' => 'Refund approved and processed successfully',
                'status' => 'approved',
                'razorpay_refund_id' => $razorpayRefundId
            ]);
            exit;

        } catch (Exception $e) {
            error_log("Razorpay refund error: " . $e->getMessage());
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Failed to process refund: ' . $e->getMessage()
            ]);
            exit;
        }
    }
}

if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    // Mark refund as processed (when Razorpay confirms)
    $refundId = intval($_POST['refund_id'] ?? 0);

    if (!$refundId) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Refund ID required']);
        exit;
    }

    $newStatus = 'refunded';
    $stmt = $conn->prepare("
        UPDATE refunds
        SET status = ?, updated_at = NOW()
        WHERE id = ?
    ");

    $stmt->bind_param("si", $newStatus, $refundId);

    if ($stmt->execute()) {
        echo json_encode([
            'success' => true,
            'message' => 'Refund marked as processed',
            'status' => 'refunded'
        ]);
    } else {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Failed to update refund status']);
    }
    exit;
}

http_response_code(405);
echo json_encode(['success' => false, 'message' => 'Method not allowed']);
