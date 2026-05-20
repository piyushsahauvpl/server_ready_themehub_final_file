<?php
require_once 'config/database.php';
$conn = getDBConnection();

// Check distinct statuses
$result = $conn->query("SELECT DISTINCT status FROM products");
echo "Current product statuses:\n";
while ($row = $result->fetch_assoc()) {
    echo "- " . $row['status'] . "\n";
}

// Count pending_review
$result = $conn->query("SELECT COUNT(*) as cnt FROM products WHERE status='pending_review'");
$data = $result->fetch_assoc();
echo "\nProducts with status='pending_review': " . $data['cnt'] . "\n";

// Count pending (old status)
$result = $conn->query("SELECT COUNT(*) as cnt FROM products WHERE status='pending'");
$data = $result->fetch_assoc();
echo "Products with status='pending': " . $data['cnt'] . "\n";

// Update old 'pending' products to 'pending_review'
$conn->query("UPDATE products SET status='pending_review' WHERE status='pending'");
echo "\nUpdated all pending->pending_review\n";

closeDBConnection($conn);
?>
