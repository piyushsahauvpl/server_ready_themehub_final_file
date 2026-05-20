<?php
error_reporting(E_ALL);
ini_set('display_errors', 0);

header('Access-Control-Allow-Origin: https://uptulathemehub.com');
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once '../config/database.php';
require_once '../middleware/auth.php';

// Auth check
$userId = checkAuth();
if (!$userId) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

$conn = getDBConnection();

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    // Get refund status for an order
    $orderId = intval($_GET['order_id'] ?? 0);
    
    if (!$orderId) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Order ID required']);
        exit;
    }

    // Check if order belongs to user
    $stmt = $conn->prepare("SELECT id FROM orders WHERE id = ? AND user_id = ?");
    $stmt->bind_param("ii", $orderId, $userId);
    $stmt->execute();
    
    if ($stmt->get_result()->num_rows === 0) {
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => 'Order not found']);
        exit;
    }

    // Get refund status
    $stmt = $conn->prepare("
        SELECT id, status, reason, admin_notes, created_at, updated_at
        FROM refunds
        WHERE order_id = ? AND user_id = ?
        ORDER BY created_at DESC
        LIMIT 1
    ");
    $stmt->bind_param("ii", $orderId, $userId);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows > 0) {
        $refund = $result->fetch_assoc();
        echo json_encode([
            'success' => true,
            'has_refund_request' => true,
            'refund' => $refund
        ]);
    } else {
        echo json_encode([
            'success' => true,
            'has_refund_request' => false,
            'refund' => null
        ]);
    }
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Submit a new refund request
    $orderId = intval($_POST['order_id'] ?? 0);
    $reason = trim($_POST['reason'] ?? '');
    $detailedReason = trim($_POST['detailed_reason'] ?? '');
    
    // Validate inputs
    if (!$orderId || !$reason) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'Order ID and reason are required'
        ]);
        exit;
    }

    // Invalid refund reasons
    $invalidReasons = ['change of mind', 'changed my mind', 'no longer want', 'just browsing'];
    $reasonLower = strtolower($reason);
    foreach ($invalidReasons as $invalid) {
        if (stripos($reasonLower, $invalid) !== false) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => 'Refunds are not allowed for "change of mind". Please contact seller support for assistance.'
            ]);
            exit;
        }
    }

    // 1️⃣ VERIFY ORDER AND 30-DAY ELIGIBILITY
    $stmt = $conn->prepare("
        SELECT o.id, o.user_id, o.seller_id, o.product_id, o.amount, o.created_at, o.status, p.name AS product_name
        FROM orders o
        LEFT JOIN products p ON o.product_id = p.id
        WHERE o.id = ? AND o.user_id = ? AND o.status IN ('completed', 'paid')
    ");
    if (!$stmt) {
        error_log('Refund request prepare failed: ' . $conn->error);
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Server error while verifying order eligibility.']);
        exit;
    }
    $stmt->bind_param("ii", $orderId, $userId);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows === 0) {
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => 'Order not found or not eligible for refund']);
        exit;
    }

    $order = $result->fetch_assoc();
    $sellerId = $order['seller_id'];

    // Check 30-day window
    $purchaseDate = strtotime($order['created_at']);
    $daysDiff = floor((time() - $purchaseDate) / (24 * 60 * 60));
    
    if ($daysDiff > 30) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => "Refund requests must be made within 30 days of purchase. Your purchase was $daysDiff days ago."
        ]);
        exit;
    }

    // 2️⃣ CHECK MANDATORY SELLER SUPPORT
    $stmt = $conn->prepare("
        SELECT id FROM buyer_seller_messages
        WHERE order_id = ? AND sender_id = ? AND receiver_id = ?
        LIMIT 1
    ");
    $stmt->bind_param("iii", $orderId, $userId, $sellerId);
    $stmt->execute();

    if ($stmt->get_result()->num_rows === 0) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'You must contact the seller first. Please use "Contact Seller" to resolve the issue.',
            'requires_seller_contact' => true
        ]);
        exit;
    }

    // 3️⃣ CHECK EXISTING REFUND REQUEST
    $stmt = $conn->prepare("
        SELECT id, status FROM refunds
        WHERE order_id = ? AND user_id = ?
        LIMIT 1
    ");
    $stmt->bind_param("ii", $orderId, $userId);
    $stmt->execute();

    if ($stmt->get_result()->num_rows > 0) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'A refund request already exists for this order']);
        exit;
    }

    $refundAmount = $order['amount'];
    $reasonToStore = $reason;
    if ($detailedReason !== '') {
        $reasonToStore .= ' - ' . $detailedReason;
    }

    $adminNotes = null;
    if (isset($_FILES['proof_file']) && $_FILES['proof_file']['error'] === UPLOAD_ERR_OK) {
        $adminNotes = 'Proof file was uploaded by the buyer.';
    }

    $stmt = $conn->prepare("
        INSERT INTO refunds (
            order_id, user_id, seller_id, amount, reason, status, admin_notes, created_at
        ) VALUES (?, ?, ?, ?, ?, 'requested', ?, NOW())
    ");

    $stmt->bind_param(
        "iiidss",
        $orderId, $userId, $sellerId, $refundAmount, $reasonToStore, $adminNotes
    );

    if (!$stmt->execute()) {
        error_log('Refund request insert failed: ' . $stmt->error);
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Failed to create refund request']);
        exit;
    }

    $refundId = $conn->insert_id;

    // Log the refund request
    error_log("Refund request created - ID: $refundId, Order: $orderId, User: $userId, Seller: $sellerId, Amount: $refundAmount");

    http_response_code(201);
    echo json_encode([
        'success' => true,
        'message' => 'Refund request submitted successfully. Admin will review and contact you within 48 hours.',
        'refund_id' => $refundId,
        'status' => 'requested'
    ]);
    exit;
}

http_response_code(405);
echo json_encode(['success' => false, 'message' => 'Method not allowed']);
