<?php
/**
 * Test Login Endpoint - Debug version
 * This helps identify login issues
 */

// Suppress any output that might break JSON
error_reporting(E_ALL);
ini_set('display_errors', 0);
ob_start();

// Handle CORS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    header('Access-Control-Allow-Origin: https://uptulathemehub.com');
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, Accept');
    header('Access-Control-Allow-Credentials: true');
    header('Access-Control-Max-Age: 86400');
    http_response_code(200);
    ob_end_clean();
    exit();
}

header('Access-Control-Allow-Origin: https://uptulathemehub.com');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, Accept');
header('Access-Control-Allow-Credentials: true');
header('Content-Type: application/json; charset=utf-8');

require_once '../../config/database.php';
session_start();
ob_end_clean();

// Test database connection
try {
    $conn = getDBConnection();
    
    // Test query
    $stmt = $conn->prepare("SELECT id, username, email, password FROM admins WHERE email = ?");
    $testEmail = 'admin@themehub.com';
    $stmt->bind_param("s", $testEmail);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $response = [
        'success' => true,
        'database_connected' => true,
        'admin_found' => $result->num_rows > 0,
        'method' => $_SERVER['REQUEST_METHOD'],
        'has_input' => !empty(file_get_contents('php://input'))
    ];
    
    if ($result->num_rows > 0) {
        $admin = $result->fetch_assoc();
        $response['admin_id'] = $admin['id'];
        $response['admin_email'] = $admin['email'];
        $response['has_password_hash'] = !empty($admin['password']);
        $response['password_hash_length'] = strlen($admin['password']);
    }
    
    $stmt->close();
    closeDBConnection($conn);
    
} catch (Exception $e) {
    $response = [
        'success' => false,
        'error' => $e->getMessage(),
        'database_connected' => false
    ];
}

echo json_encode($response);
