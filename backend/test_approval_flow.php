<?php
require_once 'config/database.php';
require_once 'api/payout/common.php';

header('Content-Type: application/json');

$conn = getDBConnection();
ensurePayoutTables($conn);

// Get a smaller pending earning to test
$stmt = $conn->prepare("
    SELECT id, seller_id, amount FROM seller_earnings 
    WHERE status = 'pending' AND amount < 2000 
    ORDER BY created_at DESC LIMIT 1
");
$stmt->execute();
$earning = $stmt->get_result()->fetch_assoc();
$stmt->close();

if (!$earning) {
    echo json_encode([
        "success" => false,
        "message" => "No suitable pending earnings found for testing"
    ], JSON_PRETTY_PRINT);
    exit;
}

$earningId = intval($earning['id']);
$sellerId = intval($earning['seller_id']);
$amount = floatval($earning['amount']);

try {
    // Get initial state
    $stmt = $conn->prepare("SELECT balance FROM admin_wallet WHERE id = 1 LIMIT 1");
    $stmt->execute();
    $initialAdminWallet = floatval($stmt->get_result()->fetch_assoc()['balance']);
    $stmt->close();

    $stmt = $conn->prepare("SELECT balance FROM seller_wallet WHERE seller_id = ? LIMIT 1");
    $stmt->bind_param('i', $sellerId);
    $stmt->execute();
    $walletRow = $stmt->get_result()->fetch_assoc();
    $stmt->close();
    $initialSellerBalance = $walletRow ? floatval($walletRow['balance']) : 0;

    echo json_encode([
        "message" => "Testing approval flow...",
        "test_data" => [
            "earning_id" => $earningId,
            "seller_id" => $sellerId,
            "approval_amount" => $amount,
            "initial_admin_balance" => $initialAdminWallet,
            "initial_seller_balance" => $initialSellerBalance
        ]
    ], JSON_PRETTY_PRINT);

    // Begin transaction
    $conn->begin_transaction();

    try {
        // APPROVE THE EARNING
        
        // Credit seller wallet
        $stmt = $conn->prepare("INSERT INTO seller_wallet (seller_id, balance) VALUES (?, ?) ON DUPLICATE KEY UPDATE balance = balance + VALUES(balance)");
        $stmt->bind_param("id", $sellerId, $amount);
        $stmt->execute();
        $stmt->close();

        // Get new seller balance
        $stmt = $conn->prepare("SELECT balance FROM seller_wallet WHERE seller_id = ? LIMIT 1");
        $stmt->bind_param("i", $sellerId);
        $stmt->execute();
        $newSellerBalance = floatval($stmt->get_result()->fetch_assoc()['balance']);
        $stmt->close();

        // Log seller transaction
        addWalletTransaction($conn, $sellerId, 'credit', $amount, $newSellerBalance, 'earning_approval', $earningId, 'Test: Earnings approved by admin');

        // Debit admin wallet
        $newAdminBalance = updateAdminWalletBalance($conn, $amount, 'debit', 'earning_approval', $earningId, 'Test: Seller payout approved');

        // Update earning status
        $stmt = $conn->prepare("UPDATE seller_earnings SET status = 'paid', paid_at = NOW() WHERE id = ?");
        $stmt->bind_param("i", $earningId);
        $stmt->execute();
        $stmt->close();

        $conn->commit();

        // Get final state
        $stmt = $conn->prepare("SELECT balance FROM admin_wallet WHERE id = 1 LIMIT 1");
        $stmt->execute();
        $finalAdminWallet = floatval($stmt->get_result()->fetch_assoc()['balance']);
        $stmt->close();

        $stmt = $conn->prepare("SELECT balance FROM seller_wallet WHERE seller_id = ? LIMIT 1");
        $stmt->bind_param("i", $sellerId);
        $stmt->execute();
        $finalSellerBalance = floatval($stmt->get_result()->fetch_assoc()['balance']);
        $stmt->close();

        // Verify transaction records
        $stmt = $conn->prepare("SELECT * FROM admin_wallet_transactions ORDER BY id DESC LIMIT 1");
        $stmt->execute();
        $lastAdminTxn = $stmt->get_result()->fetch_assoc();
        $stmt->close();

        $stmt = $conn->prepare("SELECT * FROM wallet_transactions WHERE seller_id = ? ORDER BY id DESC LIMIT 1");
        $stmt->bind_param('i', $sellerId);
        $stmt->execute();
        $lastSellerTxn = $stmt->get_result()->fetch_assoc();
        $stmt->close();

        echo json_encode([
            "success" => true,
            "message" => "✅ Approval test completed successfully!",
            "test_results" => [
                "admin_wallet" => [
                    "before" => $initialAdminWallet,
                    "after" => $finalAdminWallet,
                    "deducted" => round($initialAdminWallet - $finalAdminWallet, 2),
                    "expected_deduction" => $amount,
                    "correct" => (abs(($initialAdminWallet - $finalAdminWallet) - $amount) < 0.01) ? "YES" : "NO"
                ],
                "seller_wallet" => [
                    "before" => $initialSellerBalance,
                    "after" => $finalSellerBalance,
                    "credited" => round($finalSellerBalance - $initialSellerBalance, 2),
                    "expected_credit" => $amount,
                    "correct" => (abs(($finalSellerBalance - $initialSellerBalance) - $amount) < 0.01) ? "YES" : "NO"
                ],
                "wallet_transactions" => [
                    "last_admin_transaction" => $lastAdminTxn,
                    "last_seller_transaction" => $lastSellerTxn
                ]
            ]
        ], JSON_PRETTY_PRINT);

    } catch (Exception $e) {
        $conn->rollback();
        throw $e;
    }

} catch (Exception $e) {
    echo json_encode([
        "success" => false,
        "message" => "❌ Test failed: " . $e->getMessage()
    ], JSON_PRETTY_PRINT);
}
?>
