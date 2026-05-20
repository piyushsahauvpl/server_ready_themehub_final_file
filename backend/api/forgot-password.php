<?php
/**
 * Forgot Password API
 * Endpoint: POST /api/forgot-password.php
 * Allows users to reset their password
 */
 
error_reporting(E_ALL);
ini_set('display_errors', 0);
ob_start();
 
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    header_remove();
    header('Access-Control-Allow-Origin: https://uptulathemehub.com');
    header('Access-Control-Allow-Methods: POST, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type');
    header('Access-Control-Allow-Credentials: true');
    http_response_code(200);
    ob_end_clean();
    exit();
}
 
header_remove('Access-Control-Allow-Origin');
header('Access-Control-Allow-Origin: https://uptulathemehub.com');
header('Access-Control-Allow-Credentials: true');
header('Content-Type: application/json; charset=utf-8');
 
require_once '../config/database.php';
 
ob_end_clean();
 
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}
 
try {
    $input = json_decode(file_get_contents('php://input'), true);
   
    $email = $input['email'] ?? null;
    $new_password = $input['new_password'] ?? null;
    $confirm_password = $input['confirm_password'] ?? null;
   
    // Validate inputs
    if (!$email || !$new_password || !$confirm_password) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'All fields are required']);
        exit;
    }
   
    if ($new_password !== $confirm_password) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Passwords do not match']);
        exit;
    }
   
    if (strlen($new_password) < 6) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Password must be at least 6 characters']);
        exit;
    }
   
    $conn = getDBConnection();
   
    // Check if user exists with this email
    $query = "SELECT id, email FROM users WHERE email = ?";
    $stmt = $conn->prepare($query);
    $stmt->bind_param("s", $email);
    $stmt->execute();
    $result = $stmt->get_result();
   
    if ($result->num_rows === 0) {
        $stmt->close();
        closeDBConnection($conn);
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'User with this email not found']);
        exit;
    }
   
    $user = $result->fetch_assoc();
    $user_id = $user['id'];
    $stmt->close();
   
    // Hash the new password
    $hashed_password = password_hash($new_password, PASSWORD_BCRYPT);
   
    // Update user password
    $update_query = "UPDATE users SET password = ? WHERE id = ?";
    $update_stmt = $conn->prepare($update_query);
    $update_stmt->bind_param("si", $hashed_password, $user_id);
   
    if ($update_stmt->execute()) {
        $update_stmt->close();
        closeDBConnection($conn);
       
        http_response_code(200);
        echo json_encode([
            'success' => true,
            'message' => 'Password updated successfully'
        ]);
    } else {
        $update_stmt->close();
        closeDBConnection($conn);
       
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => 'Failed to update password'
        ]);
    }
   
} catch (Exception $e) {
    error_log("Forgot password API error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Server error']);
}
?>
 
 