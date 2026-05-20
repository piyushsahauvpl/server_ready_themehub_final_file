<?php
/**
 * Refund System Setup Script
 * Ensures all tables exist and required directories are created
 */

define('BASE_PATH', dirname(__FILE__));

echo "🔧 Refund System Setup\n";
echo "======================\n\n";

require_once 'config/database.php';

$conn = getDBConnection();

// Check if tables exist
$requiredTables = ['refunds', 'seller_earnings_transactions', 'refund_approvals_audit', 'buyer_seller_messages'];
$missingTables = [];

foreach ($requiredTables as $table) {
    $result = $conn->query("SHOW TABLES LIKE '$table'");
    if ($result->num_rows === 0) {
        $missingTables[] = $table;
    } else {
        echo "✓ Table '$table' exists\n";
    }
}

if (!empty($missingTables)) {
    echo "\n❌ Missing tables: " . implode(', ', $missingTables) . "\n";
    echo "Run: mysql -u root -p < backend/database/create_refund_tables.sql\n";
    exit(1);
}

// Create upload directories
$uploadDirs = [
    'backend/uploads/refund_proofs'
];

foreach ($uploadDirs as $dir) {
    $fullPath = BASE_PATH . '/' . $dir;
    if (!is_dir($fullPath)) {
        if (mkdir($fullPath, 0755, true)) {
            echo "✓ Created directory: $dir\n";
        } else {
            echo "❌ Failed to create directory: $dir\n";
        }
    } else {
        echo "✓ Directory exists: $dir\n";
    }
}

// Verify configuration
echo "\n📋 Configuration Check:\n";

if (defined('RAZORPAY_KEY_ID') && RAZORPAY_KEY_ID) {
    echo "✓ Razorpay Key ID configured\n";
} else {
    echo "❌ Razorpay Key ID not configured\n";
}

if (defined('RAZORPAY_KEY_SECRET') && RAZORPAY_KEY_SECRET) {
    echo "✓ Razorpay Key Secret configured\n";
} else {
    echo "❌ Razorpay Key Secret not configured\n";
}

// Check file permissions
echo "\n🔒 Permission Check:\n";

foreach ($uploadDirs as $dir) {
    $fullPath = BASE_PATH . '/' . $dir;
    if (is_writable($fullPath)) {
        echo "✓ Directory is writable: $dir\n";
    } else {
        echo "⚠ Directory not writable: $dir (chmod 755)\n";
    }
}

echo "\n✅ Refund system setup complete!\n";
echo "📚 See REFUND_SYSTEM_GUIDE.md for full documentation\n";
