<?php
/**
 * Migration: Add is_read column to contact table
 * Run this file to add the missing column
 */

require_once '../config/database.php';

$conn = getDBConnection();

if (!$conn) {
    die('Database connection failed');
}

// Check if is_read column exists
$query = "SHOW COLUMNS FROM contact LIKE 'is_read'";
$result = $conn->query($query);

if ($result->num_rows === 0) {
    // Column doesn't exist, add it
    $addColumnQuery = "ALTER TABLE contact ADD COLUMN is_read INT DEFAULT 0 AFTER message";
    
    if ($conn->query($addColumnQuery)) {
        echo json_encode([
            'success' => true,
            'message' => 'Column is_read added successfully to contact table'
        ]);
    } else {
        echo json_encode([
            'success' => false,
            'error' => 'Failed to add is_read column: ' . $conn->error
        ]);
    }
} else {
    echo json_encode([
        'success' => true,
        'message' => 'Column is_read already exists'
    ]);
}

$conn->close();
?>
