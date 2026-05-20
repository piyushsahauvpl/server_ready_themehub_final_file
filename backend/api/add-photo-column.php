<?php
/**
 * Helper script to add photo_url column to users table
 * Run this once: https://uptulathemehub.com/backend/api/add-photo-column.php
 */

require_once '../config/database.php';

try {
    $conn = getDBConnection();
    
    // Check if column exists
    $result = $conn->query("SHOW COLUMNS FROM users LIKE 'photo_url'");
    
    if ($result->num_rows > 0) {
        echo json_encode([
            'success' => true,
            'message' => 'photo_url column already exists'
        ]);
    } else {
        // Add column
        $sql = "ALTER TABLE users ADD COLUMN photo_url VARCHAR(500) DEFAULT NULL AFTER phone";
        if ($conn->query($sql)) {
            echo json_encode([
                'success' => true,
                'message' => 'photo_url column added successfully'
            ]);
        } else {
            echo json_encode([
                'success' => false,
                'message' => 'Error: ' . $conn->error
            ]);
        }
    }
    
    closeDBConnection($conn);
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Error: ' . $e->getMessage()
    ]);
}
