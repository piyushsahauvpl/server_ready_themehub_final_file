<?php
/**
 * CS Password Reset API
 * Endpoint: POST /api/cs/reset-password.php
 * Allows CS agents to reset user passwords
 */
 
error_reporting(E_ALL);
ini_set('display_errors', 0);
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: https://uptulathemehub.com');
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
 
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}
 
require_once __DIR__ . '/../../middleware/auth.php';
require_once __DIR__ . '/../../config/database.php';
 
// Start session for session-based auth fallback
if (session_status() === PHP_SESSION_NONE) {
    @session_start();
}
 
try {
    // Require CS or Admin role
    $payload = require_jwt(['CUSTOMER_SUPPORT', 'ADMIN']);
   
    $body = json_decode(file_get_contents('php://input'), true);
   
    if (!isset($body['user_id']) || !isset($body['new_password'])) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'user_id and new_password are required'
        ]);
        exit;
    }
   
    $userId = (int)$body['user_id'];
    $newPassword = trim($body['new_password']);
   
    // Validate password strength
    if (strlen($newPassword) < 8) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'Password must be at least 8 characters long'
        ]);
        exit;
    }
   
    $conn = getDBConnection();
   
    // Check if user exists
    $stmt = $conn->prepare("SELECT id, email, full_name FROM users WHERE id = ?");
    $stmt->bind_param("i", $userId);
    $stmt->execute();
    $result = $stmt->get_result();
   
    if ($result->num_rows === 0) {
        $stmt->close();
        closeDBConnection($conn);
        http_response_code(404);
        echo json_encode([
            'success' => false,
            'message' => 'User not found'
        ]);
        exit;
    }
   
    $user = $result->fetch_assoc();
    $stmt->close();
   
    // Hash the new password
    $hashedPassword = password_hash($newPassword, PASSWORD_DEFAULT);
   
    // Update password
    $updateStmt = $conn->prepare("UPDATE users SET password = ? WHERE id = ?");
    $updateStmt->bind_param("si", $hashedPassword, $userId);
    $updateSuccess = $updateStmt->execute();
    $updateStmt->close();
   
    closeDBConnection($conn);
   
    if ($updateSuccess) {
        echo json_encode([
            'success' => true,
            'message' => 'Password reset successfully',
            'user' => [
                'id' => $user['id'],
                'email' => $user['email'],
                'full_name' => $user['full_name']
            ]
        ]);
    } else {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => 'Failed to reset password'
        ]);
    }
   
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Server error',
        'error' => $e->getMessage()
    ]);
}
 
 