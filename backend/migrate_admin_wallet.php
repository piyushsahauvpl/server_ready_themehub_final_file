<?php
require_once 'config/database.php';
require_once 'api/payout/common.php';

header('Content-Type: application/json');

$conn = getDBConnection();

try {
    // Get total balance from all admin_wallet rows
    $stmt = $conn->prepare("SELECT COALESCE(SUM(balance), 0) as total_balance FROM admin_wallet");
    $stmt->execute();
    $result = $stmt->get_result()->fetch_assoc();
    $totalBalance = floatval($result['total_balance']);
    $stmt->close();

    // Get all transactions to recalculate balance_after
    $stmt = $conn->prepare("
        SELECT * FROM admin_wallet_transactions 
        ORDER BY created_at ASC, id ASC
    ");
    $stmt->execute();
    $transactions = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    $stmt->close();

    // Begin transaction
    $conn->begin_transaction();

    // Delete all admin_wallet rows
    $stmt = $conn->prepare("DELETE FROM admin_wallet");
    $stmt->execute();
    $stmt->close();

    // Create new admin_wallet row with id=1 and consolidated balance
    $stmt = $conn->prepare("INSERT INTO admin_wallet (id, balance, created_at, updated_at) VALUES (1, ?, NOW(), NOW())");
    $stmt->bind_param('d', $totalBalance);
    $stmt->execute();
    $stmt->close();

    // Recalculate all transaction balance_after values
    $balance = 0;
    foreach ($transactions as $txn) {
        $amount = floatval($txn['amount']);
        $type = $txn['type'];
        
        if ($type === 'credit') {
            $balance += $amount;
        } else {
            $balance -= $amount;
        }

        // Update transaction with correct balance_after
        $stmt = $conn->prepare("UPDATE admin_wallet_transactions SET balance_after = ? WHERE id = ?");
        $stmt->bind_param('di', $balance, $txn['id']);
        $stmt->execute();
        $stmt->close();
    }

    $conn->commit();

    // Verify the result
    ensurePayoutTables($conn);
    $adminWallet = getAdminWallet($conn);

    echo json_encode([
        "success" => true,
        "message" => "Successfully consolidated admin wallet",
        "summary" => [
            "total_balance_consolidated" => $totalBalance,
            "admin_wallet_now" => $adminWallet,
            "transactions_recalculated" => count($transactions)
        ]
    ], JSON_PRETTY_PRINT);

} catch (Exception $e) {
    $conn->rollback();
    echo json_encode([
        "success" => false,
        "message" => "Migration failed: " . $e->getMessage()
    ], JSON_PRETTY_PRINT);
}
?>
