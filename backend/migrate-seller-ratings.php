<?php
/**
 * Backfill Seller ID in Product Reviews & Recalculate Seller Reputation
 */

$conn = new mysqli('localhost', 'root', '', 'themehub_db');

if ($conn->connect_error) {
    die('Connection Error: ' . $conn->connect_error);
}

$conn->set_charset("utf8mb4");

echo "🔄 Starting migration...\n\n";

// ============================================
// STEP 1: Backfill seller_id from products
// ============================================
echo "Step 1: Backfilling seller_id in product_reviews...\n";

$query1 = "
    UPDATE product_reviews pr
    INNER JOIN products p ON pr.product_id = p.id
    SET pr.seller_id = p.seller_id
    WHERE pr.seller_id IS NULL AND p.seller_id IS NOT NULL
";

if ($conn->query($query1)) {
    $affectedRows = $conn->affected_rows;
    echo "✓ Updated $affectedRows reviews with seller_id\n\n";
} else {
    echo "✗ Error: " . $conn->error . "\n\n";
}

// ============================================
// STEP 2: Truncate and recalculate seller_reputation
// ============================================
echo "Step 2: Recalculating seller_reputation...\n";

// Clear existing reputation data
$conn->query("TRUNCATE TABLE seller_reputation");

// Insert updated reputation for all sellers with reviews
$query2 = "
    INSERT INTO seller_reputation (
        seller_id,
        average_rating,
        total_reviews,
        five_star_count,
        four_star_count,
        three_star_count,
        two_star_count,
        one_star_count
    )
    SELECT
        pr.seller_id,
        ROUND(AVG(pr.rating), 2) as avg_rating,
        COUNT(*) as total_count,
        SUM(CASE WHEN pr.rating = 5 THEN 1 ELSE 0 END),
        SUM(CASE WHEN pr.rating = 4 THEN 1 ELSE 0 END),
        SUM(CASE WHEN pr.rating = 3 THEN 1 ELSE 0 END),
        SUM(CASE WHEN pr.rating = 2 THEN 1 ELSE 0 END),
        SUM(CASE WHEN pr.rating = 1 THEN 1 ELSE 0 END)
    FROM product_reviews pr
    WHERE pr.seller_id IS NOT NULL
    AND pr.status = 'approved'
    GROUP BY pr.seller_id
";

if ($conn->query($query2)) {
    $rowsAffected = $conn->affected_rows;
    echo "✓ Recalculated reputation for $rowsAffected sellers\n\n";
} else {
    echo "✗ Error: " . $conn->error . "\n\n";
}

// ============================================
// STEP 3: Verify the data
// ============================================
echo "Step 3: Verification...\n";

$verifyQuery = "
    SELECT
        s.id,
        s.business_name,
        sr.average_rating,
        sr.total_reviews,
        (SELECT COUNT(*) FROM product_reviews WHERE seller_id = s.id) as all_reviews
    FROM sellers s
    LEFT JOIN seller_reputation sr ON s.id = sr.seller_id
    WHERE sr.total_reviews > 0
    ORDER BY sr.average_rating DESC
    LIMIT 10
";

$result = $conn->query($verifyQuery);

if ($result && $result->num_rows > 0) {
    echo "\nTop Sellers by Rating:\n";
    echo str_repeat("-", 80) . "\n";
    printf("%-30s %-15s %-15s\n", "Business Name", "Rating", "Reviews");
    echo str_repeat("-", 80) . "\n";
    
    while ($row = $result->fetch_assoc()) {
        printf("%-30s %-15s %-15s\n",
            substr($row['business_name'] ?? 'Unknown', 0, 28),
            round($row['average_rating'] ?? 0, 2) . " ⭐",
            intval($row['total_reviews'] ?? 0)
        );
    }
    echo str_repeat("-", 80) . "\n";
} else {
    echo "ℹ️  No sellers with reviews yet\n";
}

echo "\n✓ Migration completed successfully!\n";

$conn->close();
?>
