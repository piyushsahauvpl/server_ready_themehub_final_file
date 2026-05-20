<?php
/**
 * Verify Database Setup
 * Check if admin user exists and password is correct
 */

// Handle CORS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    header('Access-Control-Allow-Origin: https://uptulathemehub.com');
    header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type');
    header('Access-Control-Allow-Credentials: true');
    http_response_code(200);
    exit();
}

header('Access-Control-Allow-Origin: https://uptulathemehub.com');
header('Access-Control-Allow-Credentials: true');
header('Content-Type: application/json; charset=utf-8');

require_once '../../config/database.php';

try {
    $conn = getDBConnection();
    
    // Check if admins table exists
    $result = $conn->query("SHOW TABLES LIKE 'admins'");
    $tableExists = $result->num_rows > 0;
    
    $response = [
        'database_connected' => true,
        'admins_table_exists' => $tableExists
    ];
    
    if ($tableExists) {
        // Check admin user
        $stmt = $conn->prepare("SELECT id, username, email, password FROM admins WHERE email = ?");
        $email = 'admin@themehub.com';
        $stmt->bind_param("s", $email);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($result->num_rows > 0) {
            $admin = $result->fetch_assoc();
            
            // Test password verification
            $testPassword = 'Admin@1437';
            $passwordMatch = password_verify($testPassword, $admin['password']);
            
            // If password doesn't match, try to update it
            if (!$passwordMatch) {
                $newHash = password_hash($testPassword, PASSWORD_DEFAULT);
                $updateStmt = $conn->prepare("UPDATE admins SET password = ? WHERE email = ?");
                $updateStmt->bind_param("ss", $newHash, $email);
                $updateStmt->execute();
                $updateStmt->close();
                
                // Verify again
                $passwordMatch = password_verify($testPassword, $newHash);
            }
            
            $response['admin_found'] = true;
            $response['admin_id'] = $admin['id'];
            $response['admin_email'] = $admin['email'];
            $response['admin_username'] = $admin['username'];
            $response['password_hash_exists'] = !empty($admin['password']);
            $response['password_verification'] = $passwordMatch;
            $response['password_updated'] = !$passwordMatch;
        } else {
            // Create admin user if doesn't exist
            $password = password_hash('Admin@1437', PASSWORD_DEFAULT);
            $username = 'admin';
            $insertStmt = $conn->prepare("INSERT INTO admins (username, email, password) VALUES (?, ?, ?)");
            $insertStmt->bind_param("sss", $username, $email, $password);
            $insertStmt->execute();
            $insertStmt->close();
            
            $response['admin_found'] = false;
            $response['admin_created'] = true;
            $response['admin_id'] = $conn->insert_id;
        }
        
        $stmt->close();
    }
    
    closeDBConnection($conn);
    $response['success'] = true;
    
} catch (Exception $e) {
    $response = [
        'success' => false,
        'error' => $e->getMessage(),
        'database_connected' => false
    ];
}

echo json_encode($response, JSON_PRETTY_PRINT);
