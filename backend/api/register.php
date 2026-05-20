<?php
/**
 * User Registration API
 * Endpoint: POST /api/register.php
 * Secure registration with password hashing and validation
 */

error_reporting(E_ALL);
ini_set('display_errors', 0);
ob_start();

// Handle CORS and OPTIONS request FIRST
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    header_remove();
    header('Access-Control-Allow-Origin: https://uptulathemehub.com');
    header('Access-Control-Allow-Methods: POST, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, X-Requested-With, Accept');
    header('Access-Control-Allow-Credentials: true');
    header('Access-Control-Max-Age: 86400');
    http_response_code(200);
    ob_end_clean();
    exit();
}

// Set CORS headers
header_remove('Access-Control-Allow-Origin');
header_remove('Access-Control-Allow-Methods');
header_remove('Access-Control-Allow-Headers');
header_remove('Access-Control-Allow-Credentials');

header('Access-Control-Allow-Origin: https://uptulathemehub.com');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-Requested-With, Accept');
header('Access-Control-Allow-Credentials: true');
header('Content-Type: application/json; charset=utf-8');

require_once '../config/database.php';

// Start session
session_start();
ob_end_clean();

// Only allow POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode([
        'success' => false,
        'message' => 'Method not allowed'
    ]);
    exit;
}

// Get JSON input
$rawInput = file_get_contents('php://input');
$input = json_decode($rawInput, true);

if (json_last_error() !== JSON_ERROR_NONE) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'Invalid JSON input'
    ]);
    exit;
}

// Validate input
$fullName = trim($input['full_name'] ?? $input['fullName'] ?? '');
$email = trim($input['email'] ?? '');
$password = $input['password'] ?? '';

// Input validation
$errors = [];

if (empty($fullName)) {
    $errors[] = 'Full name is required';
} elseif (strlen($fullName) < 2) {
    $errors[] = 'Full name must be at least 2 characters';
} elseif (strlen($fullName) > 255) {
    $errors[] = 'Full name must be less than 255 characters';
}

if (empty($email)) {
    $errors[] = 'Email is required';
} elseif (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    $errors[] = 'Invalid email format';
} elseif (strlen($email) > 255) {
    $errors[] = 'Email must be less than 255 characters';
}

if (empty($password)) {
    $errors[] = 'Password is required';
} elseif (strlen($password) < 8) {
    $errors[] = 'Password must be at least 8 characters';
} elseif (strlen($password) > 72) {
    $errors[] = 'Password must be less than 72 characters';
} elseif (!preg_match('/[A-Z]/', $password) || !preg_match('/[a-z]/', $password) || !preg_match('/[0-9]/', $password)) {
    $errors[] = 'Password must contain at least one uppercase letter, one lowercase letter, and one number';
}

if (!empty($errors)) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => implode('. ', $errors)
    ]);
    exit;
}

try {
    $conn = getDBConnection();

    // Check if email already exists
    $stmt = $conn->prepare("SELECT id FROM users WHERE email = ?");
    if (!$stmt) {
        throw new Exception("Prepare failed: " . $conn->error);
    }
    
    $stmt->bind_param("s", $email);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows > 0) {
        $stmt->close();
        closeDBConnection($conn);
        http_response_code(409);
        echo json_encode([
            'success' => false,
            'message' => 'Email already registered'
        ]);
        exit;
    }
    $stmt->close();

    // Hash password securely
    $hashedPassword = password_hash($password, PASSWORD_DEFAULT);
    
    if (!$hashedPassword) {
        throw new Exception("Password hashing failed");
    }

    // Insert new user with default role 'customer' and status 'active'
    $role = 'customer';
    $status = 'active';
    $stmt = $conn->prepare("INSERT INTO users (full_name, email, password, role, status) VALUES (?, ?, ?, ?, ?)");
    
    if (!$stmt) {
        throw new Exception("Prepare failed: " . $conn->error);
    }
    
    $stmt->bind_param("sssss", $fullName, $email, $hashedPassword, $role, $status);
    
    if (!$stmt->execute()) {
        throw new Exception("Execute failed: " . $stmt->error);
    }
    
    $userId = $conn->insert_id;
    $stmt->close();
    closeDBConnection($conn);

    // Success response (don't include password hash)
    http_response_code(201);
    echo json_encode([
        'success' => true,
        'message' => 'Registration successful',
        'user' => [
            'id' => $userId,
            'full_name' => $fullName,
            'email' => $email,
            'role' => $role,
            'status' => $status
        ]
    ]);

} catch (Exception $e) {
    error_log("Registration error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Registration failed. Please try again later.'
    ]);
}
