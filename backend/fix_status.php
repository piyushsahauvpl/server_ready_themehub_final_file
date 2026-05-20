<?php
require_once 'config/database.php';
$conn = getDBConnection();

// Update products with empty status to pending_review
$result = $conn->query("UPDATE products SET status='pending_review' WHERE status='' OR status IS NULL");
echo "Updated products with empty status to pending_review\n";

// Also update any products with status='pending' (if there are any)
$result = $conn->query("UPDATE products SET status='pending_review' WHERE status='pending'");
echo "Updated products with status='pending' to 'pending_review'\n";

// Verify the update
$result = $conn->query("SELECT COUNT(*) as cnt FROM products WHERE status='pending_review'");
$data = $result->fetch_assoc();
echo "\nTotal products now with status='pending_review': " . $data['cnt'] . "\n";

// Show all statuses again
$result = $conn->query("SELECT status, COUNT(*) as count FROM products GROUP BY status");
echo "\nProduct status distribution:\n";
while ($row = $result->fetch_assoc()) {
    $status = $row['status'] ?: '(empty)';
    echo "- " . $status . ": " . $row['count'] . "\n";
}

closeDBConnection($conn);
?>
