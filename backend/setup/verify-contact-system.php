<?php
/**
 * Contact System Setup & Verification
 * Ensures the contact table has all required columns
 */

require_once '../config/database.php';

$conn = getDBConnection();

if (!$conn) {
    die(json_encode([
        'success' => false,
        'error' => 'Database connection failed'
    ]));
}

$output = [
    'success' => false,
    'checks' => [],
    'errors' => []
];

// 1. Check if contact table exists
$tableExists = $conn->query("SHOW TABLES LIKE 'contact'")->num_rows > 0;
$output['checks'][] = [
    'name' => 'Contact table exists',
    'status' => $tableExists ? 'OK' : 'FAILED'
];

if (!$tableExists) {
    // Create the contact table
    $createTableSQL = "
    CREATE TABLE contact (
        id INT AUTO_INCREMENT PRIMARY KEY,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        email VARCHAR(150) NOT NULL,
        phone VARCHAR(20),
        message TEXT NOT NULL,
        is_read INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ";
    
    if ($conn->query($createTableSQL)) {
        $output['checks'][] = [
            'name' => 'Contact table created',
            'status' => 'SUCCESS'
        ];
    } else {
        $output['errors'][] = 'Failed to create contact table: ' . $conn->error;
    }
} else {
    // 2. Check required columns
    $requiredColumns = ['id', 'first_name', 'last_name', 'email', 'phone', 'message', 'created_at', 'is_read'];
    $existingColumns = [];
    
    $result = $conn->query("SHOW COLUMNS FROM contact");
    while ($row = $result->fetch_assoc()) {
        $existingColumns[] = $row['Field'];
    }
    
    foreach ($requiredColumns as $column) {
        if (in_array($column, $existingColumns)) {
            $output['checks'][] = [
                'name' => "Column '{$column}' exists",
                'status' => 'OK'
            ];
        } else {
            // Try to add the missing column
            $addColumnSQL = "";
            switch ($column) {
                case 'is_read':
                    $addColumnSQL = "ALTER TABLE contact ADD COLUMN is_read INT DEFAULT 0 AFTER message";
                    break;
                case 'created_at':
                    $addColumnSQL = "ALTER TABLE contact ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP";
                    break;
            }
            
            if ($addColumnSQL && $conn->query($addColumnSQL)) {
                $output['checks'][] = [
                    'name' => "Column '{$column}' added",
                    'status' => 'ADDED'
                ];
            } else {
                $output['errors'][] = "Failed to add column '{$column}': " . $conn->error;
                $output['checks'][] = [
                    'name' => "Column '{$column}' missing",
                    'status' => 'FAILED'
                ];
            }
        }
    }
    
    // 3. Check table indexes
    $indexResult = $conn->query("SHOW INDEX FROM contact");
    $hasIndex = $indexResult->num_rows > 0;
    $output['checks'][] = [
        'name' => 'Table has indexes',
        'status' => $hasIndex ? 'OK' : 'WARNING'
    ];
}

// Final verification
$finalCheck = $conn->query("SHOW COLUMNS FROM contact");
if ($finalCheck) {
    $columnCount = $finalCheck->num_rows;
    $output['checks'][] = [
        'name' => "Total columns in contact table: {$columnCount}",
        'status' => 'OK'
    ];
    $output['success'] = count($output['errors']) === 0;
}

$conn->close();

header('Content-Type: application/json');
echo json_encode($output, JSON_PRETTY_PRINT);
?>
