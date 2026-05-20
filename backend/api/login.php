<?php
/**
 * User Login API
 * Endpoint: POST /api/login.php
 * Secure login with session management
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

// Start session with secure settings
ini_set('session.cookie_httponly', 1);
ini_set('session.cookie_secure', 1); // Set to 1 in production with HTTPS
ini_set('session.use_only_cookies', 1);
ini_set('session.cookie_samesite', 'Lax'); // Allow cross-site cookie transmission
ini_set('session.cookie_path', '/'); // Ensure cookie is accessible from all paths
session_start();

// Regenerate session ID to prevent session fixation
if (!isset($_SESSION['initiated'])) {
    session_regenerate_id(true);
    $_SESSION['initiated'] = true;
}

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

// Rate limiting: Check login attempts
if (!isset($_SESSION['login_attempts'])) {
    $_SESSION['login_attempts'] = 0;
    $_SESSION['last_attempt'] = time();
}

// Reset attempts after 15 minutes
if (isset($_SESSION['last_attempt']) && (time() - $_SESSION['last_attempt']) > 900) {
    $_SESSION['login_attempts'] = 0;
}

// Block after 5 failed attempts
if ($_SESSION['login_attempts'] >= 5) {
    http_response_code(429);
    echo json_encode([
        'success' => false,
        'message' => 'Too many login attempts. Please try again in 15 minutes.'
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

$email = trim($input['email'] ?? '');
$password = $input['password'] ?? '';
$rememberMe = isset($input['remember_me']) && $input['remember_me'] === true;

// Validate input
if (empty($email) || empty($password)) {
    $_SESSION['login_attempts']++;
    $_SESSION['last_attempt'] = time();
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'Email and password are required'
    ]);
    exit;
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    $_SESSION['login_attempts']++;
    $_SESSION['last_attempt'] = time();
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'Invalid email format'
    ]);
    exit;
}

try {
    $conn = getDBConnection();

    // First, check if it's an admin login
    $adminStmt = $conn->prepare("SELECT id, username, email, password, role_id FROM admins WHERE email = ?");
    if (!$adminStmt) {
        throw new Exception("Prepare failed: " . $conn->error);
    }
    
    $adminStmt->bind_param("s", $email);
    $adminStmt->execute();
    $adminResult = $adminStmt->get_result();

    if ($adminResult->num_rows > 0) {
        // Admin found, verify password
        $admin = $adminResult->fetch_assoc();
        $adminStmt->close();

        // Verify password
        if (!password_verify($password, $admin['password'])) {
            $_SESSION['login_attempts']++;
            $_SESSION['last_attempt'] = time();
            closeDBConnection($conn);
            http_response_code(401);
            echo json_encode([
                'success' => false,
                'message' => 'Invalid email or password'
            ]);
            exit;
        }

        // Admin login successful - reset attempts
        $_SESSION['login_attempts'] = 0;
        unset($_SESSION['last_attempt']);

        // Clear user session variables
        unset($_SESSION['user_id']);
        unset($_SESSION['user_email']);
        unset($_SESSION['user_name']);
        unset($_SESSION['user_role']);
        unset($_SESSION['logged_in']);
        unset($_SESSION['seller_id']);
        unset($_SESSION['seller_user_id']);
        unset($_SESSION['seller_email']);
        unset($_SESSION['seller_name']);
        unset($_SESSION['seller_business_name']);
        unset($_SESSION['seller_verification_status']);
        unset($_SESSION['seller_logged_in']);
        unset($_SESSION['seller_login_time']);
        unset($_SESSION['seller_login_attempts']);
        unset($_SESSION['seller_last_attempt']);

        // Set ADMIN session variables
        $_SESSION['admin_id'] = $admin['id'];
        $_SESSION['admin_email'] = $admin['email'];
        $_SESSION['admin_username'] = $admin['username'];
        $_SESSION['role_id'] = $admin['role_id'];
        $_SESSION['logged_in'] = true;
        $_SESSION['user_type'] = 'admin';
        $_SESSION['login_time'] = time();

        closeDBConnection($conn);

        // Success response for admin
        echo json_encode([
            'success' => true,
            'message' => 'Login successful',
            'user_type' => 'admin',
            'user' => [
                'id' => $admin['id'],
                'username' => $admin['username'],
                'email' => $admin['email'],
                'role_id' => $admin['role_id']
            ]
        ]);
        exit;
    }

    $adminStmt->close();

    // Not an admin, check users table
    $stmt = $conn->prepare("SELECT id, full_name, email, password, role, status FROM users WHERE email = ?");
    if (!$stmt) {
        throw new Exception("Prepare failed: " . $conn->error);
    }
    
    $stmt->bind_param("s", $email);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows === 0) {
        $_SESSION['login_attempts']++;
        $_SESSION['last_attempt'] = time();
        $stmt->close();
        closeDBConnection($conn);
        http_response_code(401);
        echo json_encode([
            'success' => false,
            'message' => 'Invalid email or password'
        ]);
        exit;
    }

    $user = $result->fetch_assoc();
    $stmt->close();

    // Check if user is blocked
    if ($user['status'] !== 'active') {
        $_SESSION['login_attempts']++;
        $_SESSION['last_attempt'] = time();
        closeDBConnection($conn);
        http_response_code(403);
        echo json_encode([
            'success' => false,
            'message' => 'Your account has been blocked. Please contact support.'
        ]);
        exit;
    }

    // Verify password
    if (!password_verify($password, $user['password'])) {
        $_SESSION['login_attempts']++;
        $_SESSION['last_attempt'] = time();
        closeDBConnection($conn);
        http_response_code(401);
        echo json_encode([
            'success' => false,
            'message' => 'Invalid email or password'
        ]);
        exit;
    }

    // User login successful - reset attempts
    $_SESSION['login_attempts'] = 0;
    unset($_SESSION['last_attempt']);

    // Clear ALL admin and seller session variables to prevent conflicts
    unset($_SESSION['admin_id']);
    unset($_SESSION['admin_email']);
    unset($_SESSION['admin_username']);
    unset($_SESSION['seller_id']);
    unset($_SESSION['seller_user_id']);
    unset($_SESSION['seller_email']);
    unset($_SESSION['seller_name']);
    unset($_SESSION['seller_business_name']);
    unset($_SESSION['seller_verification_status']);
    unset($_SESSION['seller_logged_in']);
    unset($_SESSION['seller_login_time']);
    unset($_SESSION['seller_login_attempts']);
    unset($_SESSION['seller_last_attempt']);

    // Set USER session variables ONLY
    $_SESSION['user_id'] = $user['id'];
    $_SESSION['user_email'] = $user['email'];
    $_SESSION['user_name'] = $user['full_name'];
    $_SESSION['user_role'] = $user['role'];
    $_SESSION['user_type'] = 'user';
    $_SESSION['logged_in'] = true;
    $_SESSION['login_time'] = time();

    // Set remember me cookie (30 days)
    if ($rememberMe) {
        $cookieValue = base64_encode($user['id'] . ':' . hash('sha256', $user['email'] . $user['password']));
        setcookie('remember_token', $cookieValue, time() + (30 * 24 * 60 * 60), '/', '', false, true);
    }

    closeDBConnection($conn);

    // Success response (don't include password)
    echo json_encode([
        'success' => true,
        'message' => 'Login successful',
        'user_type' => 'user',
        'user' => [
            'id' => $user['id'],
            'full_name' => $user['full_name'],
            'email' => $user['email'],
            'role' => $user['role']
        ]
    ]);

} catch (Exception $e) {
    error_log("Login error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Login failed. Please try again later.'
    ]);
}
