<?php
require_once 'config/database.php';
require_once 'api/payout/common.php';

header('Content-Type: application/json');

$conn = getDBConnection();
ensurePayoutTables($conn);

// Get current admin balance
$stmt = $conn->prepare("SELECT balance FROM admin_wallet WHERE id = 1 LIMIT 1");
$stmt->execute();
$adminWallet = floatval($stmt->get_result()->fetch_assoc()['balance']);
$stmt->close();

// Find a seller with a single pending earning we can afford
$approvalAmount = $adminWallet * 0.5; // Try to approve 50% of balance
$stmt = $conn->prepare("
    SELECT se.id, se.seller_id, se.amount, s.business_name
    FROM seller_earnings se
    JOIN sellers s ON se.seller_id = s.id
    WHERE se.status = 'pending' AND se.amount <= ?
    ORDER BY se.amount DESC
    LIMIT 1
");
$stmt->bind_param("d", $approvalAmount);
$stmt->execute();
$earning = $stmt->get_result()->fetch_assoc();
$stmt->close();

if (!$earning) {
    echo json_encode([
        "success" => false,
        "message" => "No affordable pending earnings found",
        "current_admin_balance" => $adminWallet,
        "available_for_approval" => $approvalAmount
    ], JSON_PRETTY_PRINT);
    exit;
}

$earningId = intval($earning['id']);
$sellerId = intval($earning['seller_id']);
$amount = floatval($earning['amount']);

echo json_encode([
    "message" => "Simulating Admin Approval",
    "approval_plan" => [
        "earning_id" => $earningId,
        "seller_id" => $sellerId,
        "seller_name" => $earning['business_name'],
        "approval_amount" => $amount,
        "admin_balance_before" => $adminWallet,
        "admin_balance_expected_after" => $adminWallet - $amount
    ]
], JSON_PRETTY_PRINT);

try {
    $conn->begin_transaction();

    // Exactly replicate what approve-earnings.php does
    
    // Credit seller wallet
    $stmt = $conn->prepare("INSERT INTO seller_wallet (seller_id, balance) VALUES (?, ?) ON DUPLICATE KEY UPDATE balance = balance + VALUES(balance)");
    $stmt->bind_param("id", $sellerId, $amount);
    if (!$stmt->execute()) {
        throw new Exception("Failed to credit seller wallet: " . $stmt->error);
    }
    $stmt->close();

    // Get new seller balance
    $stmt = $conn->prepare("SELECT balance FROM seller_wallet WHERE seller_id = ? LIMIT 1");
    $stmt->bind_param("i", $sellerId);
    $stmt->execute();
    $walletRow = $stmt->get_result()->fetch_assoc();
    $stmt->close();
    $balanceAfter = floatval($walletRow['balance'] ?? 0);

    // Log seller transaction
    addWalletTransaction($conn, $sellerId, 'credit', $amount, $balanceAfter, 'earning_approval', $earningId, 'Earnings approved by admin');

    // Debit admin wallet
    $adminBalanceAfter = updateAdminWalletBalance($conn, $amount, 'debit', 'earning_approval', $earningId, 'Seller payout approved');

    // Update seller earnings status
    $stmt = $conn->prepare("UPDATE seller_earnings SET status = 'paid', paid_at = NOW() WHERE id = ?");
    $stmt->bind_param("i", $earningId);
    if (!$stmt->execute()) {
        throw new Exception("Failed to update earning status: " . $stmt->error);
    }
    $stmt->close();

    // Update seller totals
    $stmt = $conn->prepare("UPDATE sellers SET pending_earnings = COALESCE(pending_earnings, 0) - ?, total_earnings = COALESCE(total_earnings, 0) + ? WHERE id = ?");
    $stmt->bind_param("ddi", $amount, $amount, $sellerId);
    if (!$stmt->execute()) {
        throw new Exception("Failed to update seller totals: " . $stmt->error);
    }
    $stmt->close();

    $conn->commit();

    // Get final states
    $stmt = $conn->prepare("SELECT balance FROM admin_wallet WHERE id = 1 LIMIT 1");
    $stmt->execute();
    $finalAdminBalance = floatval($stmt->get_result()->fetch_assoc()['balance']);
    $stmt->close();

    $stmt = $conn->prepare("SELECT balance FROM seller_wallet WHERE seller_id = ? LIMIT 1");
    $stmt->bind_param("i", $sellerId);
    $stmt->execute();
    $finalSellerBalance = floatval($stmt->get_result()->fetch_assoc()['balance']);
    $stmt->close();

    echo json_encode([
        "success" => true,
        "message" => "✅ APPROVAL SUCCESSFUL!",
        "results" => [
            "admin_wallet" => [
                "before" => $adminWallet,
                "after" => $finalAdminBalance,
                "deducted" => $adminWallet - $finalAdminBalance,
                "correct" => (abs(($adminWallet - $finalAdminBalance) - $amount) < 0.01) ? "YES ✓" : "NO ✗"
            ],
            "seller_wallet" => [
                "before" => 0,
                "after" => $finalSellerBalance,
                "credited" => $finalSellerBalance,
                "correct" => (abs($finalSellerBalance - $amount) < 0.01) ? "YES ✓" : "NO ✗"
            ],
            "earning_status" => "paid"
        ]
    ], JSON_PRETTY_PRINT);

} catch (Exception $e) {
    $conn->rollback();
    echo json_encode([
        "success" => false,
        "message" => "❌ APPROVAL FAILED: " . $e->getMessage(),
        "error_location" => [
            "file" => $e->getFile(),
            "line" => $e->getLine()
        ]
    ], JSON_PRETTY_PRINT);
}
?>
