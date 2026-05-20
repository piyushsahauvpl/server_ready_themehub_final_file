<?php
/**
 * ADMIN - Seller Payouts Management
 * View pending earnings and process payouts to sellers
 *
 * GET  /admin/seller-payouts.php            - View all pending payouts
 * GET  /admin/seller-payouts.php?seller_id= - View single seller payout details
 * POST /admin/seller-payouts.php?action=process - Process payout for seller
 */

error_reporting(E_ALL);
ini_set('display_errors', 0);

// CORS Headers
header('Access-Control-Allow-Origin: https://uptulathemehub.com');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS, PUT');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Credentials: true');
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once '../../config/database.php';
require_once '../../middleware/auth.php';
require_once '../../api/payout/common.php';

try {
    // Verify admin authentication
    $payload = require_jwt(['ADMIN']);
    $adminId = $payload['id'];

    error_log("✅ [SELLER-PAYOUTS] Admin authenticated: $adminId");

    $conn   = getDBConnection();
    ensurePayoutTables($conn);

    $method = $_SERVER['REQUEST_METHOD'];
    $action = $_GET['action'] ?? null;

    // ============================================================
    // GET - View single seller payout details
    // ============================================================
    if ($method === 'GET' && isset($_GET['seller_id'])) {
        $sellerId = intval($_GET['seller_id']);
        if ($sellerId <= 0) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Invalid seller_id']);
            exit;
        }

        $stmt = $conn->prepare("
            SELECT s.id AS seller_id, s.user_id, s.business_name, s.pending_earnings,
                   s.total_earnings, s.commission_rate,
                   u.full_name, u.email, u.phone AS user_phone
            FROM sellers s
            JOIN users u ON s.user_id = u.id
            WHERE s.id = ?
            LIMIT 1
        ");
        $stmt->bind_param('i', $sellerId);
        $stmt->execute();
        $seller = $stmt->get_result()->fetch_assoc();
        $stmt->close();

        if (!$seller) {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Seller not found']);
            exit;
        }

        $earningsStmt = $conn->prepare("
            SELECT id, order_id, amount, commission_rate, status, created_at
            FROM seller_earnings
            WHERE seller_id = ? AND status = 'pending'
        ");
        $earningsStmt->bind_param('i', $sellerId);
        $earningsStmt->execute();
        $earningsResult = $earningsStmt->get_result();

        $earnings      = [];
        $pendingAmount = 0.0;
        $payableAmount = 0.0;

        while ($row = $earningsResult->fetch_assoc()) {
            $amount         = floatval($row['amount']);
            $commissionRate = floatval($row['commission_rate'] ?? 100);
            $sellerAmount   = round($amount * ($commissionRate / 100), 2);

            $earnings[] = [
                'id'              => intval($row['id']),
                'order_id'        => intval($row['order_id']),
                'amount'          => $amount,
                'commission_rate' => $commissionRate,
                'seller_amount'   => $sellerAmount,
                'status'          => $row['status'],
                'created_at'      => $row['created_at']
            ];

            $pendingAmount += $amount;
            $payableAmount += $sellerAmount;
        }
        $earningsStmt->close();

        $bankStmt = $conn->prepare("
            SELECT account_holder, bank_name, account_number, ifsc_code, branch_name, account_type
            FROM seller_bank_details
            WHERE seller_id = ?
            LIMIT 1
        ");
        $bankStmt->bind_param('i', $sellerId);
        $bankStmt->execute();
        $bankDetails = $bankStmt->get_result()->fetch_assoc();
        $bankStmt->close();

        if ($bankDetails && !empty($bankDetails['account_number'])) {
            $encryptionKey                  = getenv('SELLER_ENC_KEY') ?: 'default_key_change_in_production!';
            $bankDetails['account_number']  = decryptValue($bankDetails['account_number'], $encryptionKey);
        }

        echo json_encode([
            'success' => true,
            'seller'  => [
                'seller_id'        => intval($seller['seller_id']),
                'user_id'          => intval($seller['user_id']),
                'full_name'        => $seller['full_name'],
                'email'            => $seller['email'],
                'phone'            => $seller['user_phone'],
                'business_name'    => $seller['business_name'],
                'pending_earnings' => floatval($seller['pending_earnings']),
                'total_earnings'   => floatval($seller['total_earnings']),
                'commission_rate'  => floatval($seller['commission_rate'] ?? 100)
            ],
            'bank_details'   => $bankDetails,
            'pending_amount' => round($pendingAmount, 2),
            'payable_amount' => round($payableAmount, 2),
            'earnings'       => $earnings
        ]);
        exit;
    }

    // ============================================================
    // GET - View all sellers with pending earnings
    // ============================================================
    if ($method === 'GET') {
        $query = "
            SELECT
                s.id AS seller_id,
                s.business_name,
                u.full_name,
                u.email,
                s.pending_earnings,
                s.total_earnings,
                COUNT(se.id)          AS pending_orders,
                GROUP_CONCAT(se.id)   AS pending_earning_ids
            FROM sellers s
            LEFT JOIN users u ON s.user_id = u.id
            LEFT JOIN seller_earnings se ON s.id = se.seller_id AND se.status = 'pending'
            WHERE s.pending_earnings > 0
            GROUP BY s.id
            ORDER BY s.pending_earnings DESC
        ";

        $result = $conn->query($query);
        if (!$result) {
            throw new Exception("Query failed: " . $conn->error);
        }

        $payouts      = [];
        $totalPending = 0;

        while ($row = $result->fetch_assoc()) {
            $payouts[] = [
                'seller_id'           => $row['seller_id'],
                'business_name'       => $row['business_name'],
                'full_name'           => $row['full_name'],
                'email'               => $row['email'],
                'pending_amount'      => floatval($row['pending_earnings']),
                'total_earned'        => floatval($row['total_earnings']),
                'pending_orders_count'=> intval($row['pending_orders']),
                'earnings_ids'        => array_filter(explode(',', $row['pending_earning_ids'] ?? ''))
            ];
            $totalPending += floatval($row['pending_earnings']);
        }

        error_log("📊 [SELLER-PAYOUTS] Found " . count($payouts) . " sellers with pending earnings. Total: ₹$totalPending");

        echo json_encode([
            'success' => true,
            'summary' => [
                'total_sellers'        => count($payouts),
                'total_pending_amount' => $totalPending,
                'timestamp'            => date('Y-m-d H:i:s')
            ],
            'payouts' => $payouts
        ]);
        exit;
    }

    // ============================================================
    // POST - Process Payout for a Seller
    // ============================================================
    if ($method === 'POST' && $action === 'process') {
        $input = json_decode(file_get_contents('php://input'), true);

        if (!$input || !isset($input['seller_id'])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'seller_id is required']);
            exit;
        }

        $sellerId = intval($input['seller_id']);
        if ($sellerId <= 0) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Invalid seller_id']);
            exit;
        }

        $notes = trim($input['notes'] ?? '');

        error_log("💰 [SELLER-PAYOUTS] Processing payout for seller_id: $sellerId");

        // ── Load seller ───────────────────────────────────────────
        $stmt = $conn->prepare("
            SELECT s.id AS seller_id, s.user_id, s.business_name,
                   s.pending_earnings, s.total_earnings,
                   u.full_name,
                   u.email    AS user_email,
                   u.phone    AS user_phone          -- ✅ correct alias
            FROM sellers s
            JOIN users u ON s.user_id = u.id
            WHERE s.id = ?
            LIMIT 1
        ");
        $stmt->bind_param('i', $sellerId);
        $stmt->execute();
        $seller = $stmt->get_result()->fetch_assoc();
        $stmt->close();

        if (!$seller) {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Seller not found']);
            exit;
        }

        if (floatval($seller['pending_earnings']) <= 0) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Seller has no pending earnings to transfer']);
            exit;
        }

        error_log("✅ [SELLER-PAYOUTS] Seller found: {$seller['business_name']}, pending: ₹{$seller['pending_earnings']}");

        // ── Load pending earnings ─────────────────────────────────
        $earningsStmt = $conn->prepare("
            SELECT id, amount, commission_rate
            FROM seller_earnings
            WHERE seller_id = ? AND status = 'pending'
        ");
        $earningsStmt->bind_param('i', $sellerId);
        $earningsStmt->execute();
        $earningsResult = $earningsStmt->get_result();

        $pendingEarningIds = [];
        $totalPending      = 0.0;
        $totalPayable      = 0.0;

        while ($earning = $earningsResult->fetch_assoc()) {
            $earningId      = intval($earning['id']);
            $amount         = floatval($earning['amount']);
            $commissionRate = floatval($earning['commission_rate'] ?? 100);
            $sellerAmount   = round($amount * ($commissionRate / 100), 2);

            $pendingEarningIds[] = $earningId;
            $totalPending       += $amount;
            $totalPayable       += $sellerAmount;
        }
        $earningsStmt->close();

        if (count($pendingEarningIds) === 0) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'No pending earnings found for this seller']);
            exit;
        }

        if ($totalPayable <= 0) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Calculated payout amount is zero or invalid']);
            exit;
        }

        // ── Load bank details ─────────────────────────────────────
        $bankStmt = $conn->prepare("
            SELECT account_holder, bank_name, account_number, ifsc_code, branch_name, account_type
            FROM seller_bank_details
            WHERE seller_id = ?
            LIMIT 1
        ");
        $bankStmt->bind_param('i', $sellerId);
        $bankStmt->execute();
        $bankDetails = $bankStmt->get_result()->fetch_assoc();
        $bankStmt->close();

        if (!$bankDetails || empty($bankDetails['account_number']) || empty($bankDetails['ifsc_code'])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Seller bank details are incomplete or missing']);
            exit;
        }

        $encryptionKey                 = getenv('SELLER_ENC_KEY') ?: 'default_key_change_in_production!';
        $bankDetails['account_number'] = decryptValue($bankDetails['account_number'], $encryptionKey);
        $bankDetails['account_number'] = preg_replace('/\D/', '', $bankDetails['account_number']);
        $bankDetails['ifsc_code']      = strtoupper(preg_replace('/\s+/', '', $bankDetails['ifsc_code']));

        if (!preg_match('/^[A-Z]{4}0[A-Z0-9]{6}$/', $bankDetails['ifsc_code'])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Seller IFSC code is invalid. Please verify the code in seller bank details.']);
            exit;
        }

        // ── Build contact & bank arrays for Razorpay ──────────────
        $razorpayBankDetails = [
            'account_holder_name' => $bankDetails['account_holder'],
            'account_number'      => $bankDetails['account_number'],
            'ifsc'                => $bankDetails['ifsc_code']
        ];

        // ✅ FIXED: use 'user_phone' key (matches SQL alias above)
        $sellerContact = [
            'id'            => intval($seller['seller_id']),
            'business_name' => $seller['business_name'],
            'user_name'     => $seller['full_name'],
            'user_email'    => $seller['user_email'],
            'user_phone'    => $seller['user_phone']   // ✅ was $seller['phone'] — WRONG
        ];

        // ── Process payout in a transaction ───────────────────────
        $conn->begin_transaction();

        try {
            // Call Razorpay payout processing
            $result = initiateDirectRazorpayPayoutProcessing($conn, $sellerContact, $razorpayBankDetails, $totalPayable);
            $payoutRecordId = $result['payout_record_id'];
            $payoutId   = $result['payout_id'];
            $responseJson = json_encode($result['response']);

            // Update payout record to processing (already done in function)

            // Mark earnings as paid
            $idList = implode(',', array_map('intval', $pendingEarningIds));
            $updateEarnings = $conn->prepare("
                UPDATE seller_earnings
                SET status = 'paid', paid_at = NOW()
                WHERE id IN ($idList) AND seller_id = ?
            ");
            $updateEarnings->bind_param('i', $sellerId);
            $updateEarnings->execute();
            $updateEarnings->close();

            // Update seller earnings balance
            $sellerUpdateStmt = $conn->prepare("
                UPDATE sellers
                SET pending_earnings = GREATEST(COALESCE(pending_earnings, 0) - ?, 0),
                    total_earnings   = COALESCE(total_earnings, 0) + ?
                WHERE id = ?
            ");
            $sellerUpdateStmt->bind_param('ddi', $totalPending, $totalPending, $sellerId);
            $sellerUpdateStmt->execute();
            $sellerUpdateStmt->close();

            $conn->commit();

            echo json_encode([
                'success' => true,
                'message' => "Payout of ₹{$totalPayable} initiated for {$seller['business_name']}",
                'payout'  => [
                    'id'                 => $payoutRecordId,
                    'seller_id'          => $sellerId,
                    'amount'             => $totalPayable,
                    'status'             => 'processing',
                    'razorpay_payout_id' => $payoutId,
                    'response'           => $result['response']
                ]
            ]);
            exit;

        } catch (Exception $e) {
            $conn->rollback();

            // Save failure record
            $failureReason = $e->getMessage();
            $failureNote   = json_encode(['error' => $failureReason]);
            $failStmt = $conn->prepare("
                UPDATE seller_payouts
                SET status = 'failed', failure_reason = ?, response = ?, updated_at = NOW()
                WHERE id = ?
            ");
            $failStmt->bind_param('ssi', $failureReason, $failureNote, $payoutRecordId);
            $failStmt->execute();
            $failStmt->close();

            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Payout failed: ' . $e->getMessage()]);
            exit;
        }
    }

    // Invalid request
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Invalid request method or action']);
    $conn->close();

} catch (Exception $e) {
    error_log('❌ [SELLER-PAYOUTS] Error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
}

if (!function_exists('tableExists')) {
    function tableExists($conn, $tableName) {
        $result = $conn->query("SHOW TABLES LIKE '$tableName'");
        return $result && $result->num_rows > 0;
    }
}
?>