<?php
// This simulates what happens when admin clicks approve button for a seller
require_once 'config/database.php';
require_once 'config/jwt.php';
require_once 'api/payout/common.php';

header('Content-Type: application/json');

$conn = getDBConnection();
ensurePayoutTables($conn);

// Get a seller with pending earnings
$stmt = $conn->prepare("
    SELECT s.id, s.user_id, s.business_name, 
           COUNT(se.id) as pending_count, 
           COALESCE(SUM(se.amount), 0) as pending_total
    FROM sellers s
    LEFT JOIN seller_earnings se ON s.id = se.seller_id AND se.status = 'pending'
    GROUP BY s.id, s.user_id, s.business_name
    HAVING pending_count > 0
    LIMIT 1
");
$stmt->execute();
$seller = $stmt->get_result()->fetch_assoc();
$stmt->close();

if (!$seller) {
    echo json_encode([
        "success" => false,
        "message" => "No sellers with pending earnings found"
    ], JSON_PRETTY_PRINT);
    exit;
}

$sellerId = intval($seller['id']);

// Simulate the admin API call
echo json_encode([
    "message" => "Simulating Admin Approval API Call",
    "seller_info" => [
        "seller_id" => $sellerId,
        "business_name" => $seller['business_name'],
        "pending_earnings_count" => intval($seller['pending_count']),
        "pending_earnings_total" => floatval($seller['pending_total'])
    ]
], JSON_PRETTY_PRINT);

// Now process the approval just like the API would
try {
    $conn->begin_transaction();

    // Get all pending earnings for this seller
    $stmt = $conn->prepare("
        SELECT se.id, se.seller_id, se.amount, se.order_id, s.business_name, u.email
        FROM seller_earnings se
        JOIN sellers s ON se.seller_id = s.id
        JOIN users u ON s.user_id = u.id
        WHERE se.seller_id = ? AND se.status = 'pending'
    ");
    $stmt->bind_param("i", $sellerId);
    $stmt->execute();
    $earnings = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    $stmt->close();

    $approvedEarnings = [];

    foreach ($earnings as $earning) {
        $earningId = $earning['id'];
        $amount = floatval($earning['amount']);

        // Credit seller wallet
        $stmt = $conn->prepare("INSERT INTO seller_wallet (seller_id, balance) VALUES (?, ?) ON DUPLICATE KEY UPDATE balance = balance + VALUES(balance)");
        $stmt->bind_param("id", $sellerId, $amount);
        $stmt->execute();
        $stmt->close();

        // Get new balance
        $stmt = $conn->prepare("SELECT balance FROM seller_wallet WHERE seller_id = ? LIMIT 1");
        $stmt->bind_param("i", $sellerId);
        $stmt->execute();
        $walletRow = $stmt->get_result()->fetch_assoc();
        $stmt->close();
        $balanceAfter = floatval($walletRow['balance'] ?? 0);

        // Log seller transaction
        addWalletTransaction($conn, $sellerId, 'credit', $amount, $balanceAfter, 'earning_approval', $earningId, 'Earnings approved by admin');

        // Debit admin wallet for seller payout
        $adminBalanceAfter = updateAdminWalletBalance($conn, $amount, 'debit', 'earning_approval', $earningId, 'Seller payout approved');

        // Update seller earnings status
        $stmt = $conn->prepare("UPDATE seller_earnings SET status = 'paid', paid_at = NOW() WHERE id = ?");
        $stmt->bind_param("i", $earningId);
        $stmt->execute();
        $stmt->close();

        // Update seller totals
        $stmt = $conn->prepare("UPDATE sellers SET pending_earnings = COALESCE(pending_earnings, 0) - ?, total_earnings = COALESCE(total_earnings, 0) + ? WHERE id = ?");
        $stmt->bind_param("ddi", $amount, $amount, $sellerId);
        $stmt->execute();
        $stmt->close();

        $approvedEarnings[] = [
            'id' => $earningId,
            'amount' => $amount,
            'order_id' => $earning['order_id'],
            'seller_wallet_after' => $balanceAfter,
            'admin_wallet_after' => $adminBalanceAfter
        ];
    }

    $conn->commit();

    // Get final states
    $stmt = $conn->prepare("SELECT balance FROM admin_wallet WHERE id = 1 LIMIT 1");
    $stmt->execute();
    $finalAdminWallet = floatval($stmt->get_result()->fetch_assoc()['balance']);
    $stmt->close();

    $stmt = $conn->prepare("SELECT balance FROM seller_wallet WHERE seller_id = ? LIMIT 1");
    $stmt->bind_param("i", $sellerId);
    $stmt->execute();
    $finalSellerWallet = floatval($stmt->get_result()->fetch_assoc()['balance']);
    $stmt->close();

    echo json_encode([
        "success" => true,
        "message" => "✅ Successfully approved " . count($approvedEarnings) . " earnings",
        "approval_results" => [
            "approved_count" => count($approvedEarnings),
            "approved_earnings" => $approvedEarnings,
            "final_state" => [
                "admin_wallet_balance" => $finalAdminWallet,
                "seller_wallet_balance" => $finalSellerWallet
            ]
        ]
    ], JSON_PRETTY_PRINT);

} catch (Exception $e) {
    $conn->rollback();
    echo json_encode([
        "success" => false,
        "message" => "❌ Approval failed: " . $e->getMessage(),
        "error_details" => [
            "file" => $e->getFile(),
            "line" => $e->getLine()
        ]
    ], JSON_PRETTY_PRINT);
}
?>
