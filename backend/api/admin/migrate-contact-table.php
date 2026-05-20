<?php
/**
 * Database Migration - Add is_read column to contact table
 * Run this once to add the is_read column for tracking read/unread messages
 */

require_once __DIR__ . '/../config/database.php';

try {
    $conn = getDBConnection();

    // Check if contact table exists
    $checkTable = $conn->query("SHOW TABLES LIKE 'contact'");
    
    if ($checkTable->num_rows === 0) {
        // Create contact table if it doesn't exist
        $sql = "CREATE TABLE IF NOT EXISTS contact (
            id INT PRIMARY KEY AUTO_INCREMENT,
            first_name VARCHAR(255) NOT NULL,
            last_name VARCHAR(255) NOT NULL,
            email VARCHAR(255) NOT NULL,
            phone VARCHAR(20),
            message TEXT NOT NULL,
            is_read TINYINT(1) DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_email (email),
            INDEX idx_created_at (created_at)
        )";
        
        if ($conn->query($sql)) {
            echo json_encode(['success' => true, 'message' => 'Contact table created successfully']);
        } else {
            throw new Exception('Failed to create contact table: ' . $conn->error);
        }
    } else {
        // Check if is_read column exists
        $checkColumn = $conn->query("SHOW COLUMNS FROM contact LIKE 'is_read'");
        
        if ($checkColumn->num_rows === 0) {
            // Add is_read column
            $sql = "ALTER TABLE contact ADD COLUMN is_read TINYINT(1) DEFAULT 0 AFTER message";
            
            if ($conn->query($sql)) {
                echo json_encode(['success' => true, 'message' => 'is_read column added to contact table']);
            } else {
                throw new Exception('Failed to add is_read column: ' . $conn->error);
            }
        } else {
            echo json_encode(['success' => true, 'message' => 'Contact table already has is_read column']);
        }
    }
    
    closeDBConnection($conn);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Database error: ' . $e->getMessage()]);
}
?>
