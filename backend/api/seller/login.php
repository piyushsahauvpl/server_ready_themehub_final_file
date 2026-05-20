<?php
/**
 * Seller Login API
 * Endpoint: POST /api/seller/login.php
 * Sellers login using their user credentials (must be a verified seller)
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

require_once '../../config/database.php';

// Start session with secure settings
session_set_cookie_params([
    'lifetime' => 0,
    'path' => '/',
    'domain' => '.uptulathemehub.com',
    'secure' => true,
    'httponly' => true,
    'samesite' => 'None',
]);
ini_set('session.cookie_httponly', 1);
ini_set('session.cookie_secure', 1);
ini_set('session.use_only_cookies', 1);
session_start();

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

// Rate limiting
if (!isset($_SESSION['seller_login_attempts'])) {
    $_SESSION['seller_login_attempts'] = 0;
    $_SESSION['seller_last_attempt'] = time();
}

if (isset($_SESSION['seller_last_attempt']) && (time() - $_SESSION['seller_last_attempt']) > 900) {
    $_SESSION['seller_login_attempts'] = 0;
}

if ($_SESSION['seller_login_attempts'] >= 5) {
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
    $_SESSION['seller_login_attempts']++;
    $_SESSION['seller_last_attempt'] = time();
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'Email and password are required'
    ]);
    exit;
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    $_SESSION['seller_login_attempts']++;
    $_SESSION['seller_last_attempt'] = time();
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'Invalid email format'
    ]);
    exit;
}

try {
    $conn = getDBConnection();

    // Get user from database
    $stmt = $conn->prepare("SELECT u.id, u.full_name, u.email, u.password, u.status, s.id as seller_id, s.verification_status, s.status as seller_status, s.business_name, s.commission_rate, s.total_earnings, s.pending_earnings FROM users u LEFT JOIN sellers s ON u.id = s.user_id WHERE u.email = ?");
    
    if (!$stmt) {
        throw new Exception("Prepare failed: " . $conn->error);
    }
    
    $stmt->bind_param("s", $email);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows === 0) {
        $_SESSION['seller_login_attempts']++;
        $_SESSION['seller_last_attempt'] = time();
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
        $_SESSION['seller_login_attempts']++;
        $_SESSION['seller_last_attempt'] = time();
        closeDBConnection($conn);
        http_response_code(403);
        echo json_encode([
            'success' => false,
            'message' => 'Your account has been blocked. Please contact support.'
        ]);
        exit;
    }

    // Check if user is a seller
    if (!$user['seller_id']) {
        $_SESSION['seller_login_attempts']++;
        $_SESSION['seller_last_attempt'] = time();
        closeDBConnection($conn);
        http_response_code(403);
        echo json_encode([
            'success' => false,
            'message' => 'You are not registered as a seller. Please apply to become a seller first.'
        ]);
        exit;
    }

    // Check if seller account is active (allow pending verification sellers to login)
    // Only block if status is 'suspended' or 'inactive', not if verification is pending
    if ($user['seller_status'] === 'suspended' || $user['seller_status'] === 'inactive') {
        closeDBConnection($conn);
        http_response_code(403);
        echo json_encode([
            'success' => false,
            'message' => 'Your seller account has been suspended. Please contact support.'
        ]);
        exit;
    }
    
    // Allow login even if verification is pending - they can access dashboard but with limited features

    // Verify password
    if (!password_verify($password, $user['password'])) {
        $_SESSION['seller_login_attempts']++;
        $_SESSION['seller_last_attempt'] = time();
        closeDBConnection($conn);
        http_response_code(401);
        echo json_encode([
            'success' => false,
            'message' => 'Invalid email or password'
        ]);
        exit;
    }

    // Login successful - reset attempts
    $_SESSION['seller_login_attempts'] = 0;
    unset($_SESSION['seller_last_attempt']);

    // Clear ALL user and admin session variables to prevent conflicts
    unset($_SESSION['user_id']);
    unset($_SESSION['user_email']);
    unset($_SESSION['user_name']);
    unset($_SESSION['user_role']);
    unset($_SESSION['logged_in']);
    unset($_SESSION['login_time']);
    unset($_SESSION['login_attempts']);
    unset($_SESSION['last_attempt']);
    unset($_SESSION['admin_id']);
    unset($_SESSION['admin_email']);
    unset($_SESSION['admin_username']);

    // Set SELLER session variables ONLY
    $_SESSION['seller_id'] = $user['seller_id'];
    $_SESSION['seller_user_id'] = $user['id'];
    $_SESSION['seller_email'] = $user['email'];
    $_SESSION['seller_name'] = $user['full_name'];
    $_SESSION['seller_business_name'] = $user['business_name'];
    $_SESSION['seller_verification_status'] = $user['verification_status'];
    $_SESSION['seller_logged_in'] = true;
    $_SESSION['seller_login_time'] = time();
    
    // NOTE: We do NOT set user session variables to keep sessions completely separate
    // For ticket system compatibility, the middleware will use seller_user_id when needed

    // Set remember me cookie (30 days)
    if ($rememberMe) {
        $cookieValue = base64_encode($user['seller_id'] . ':' . hash('sha256', $user['email'] . $user['password']));
        setcookie('seller_remember_token', $cookieValue, time() + (30 * 24 * 60 * 60), '/', '', false, true);
    }

    closeDBConnection($conn);

    // Success response
    echo json_encode([
        'success' => true,
        'message' => 'Login successful',
        'seller' => [
            'id' => $user['seller_id'],
            'user_id' => $user['id'],
            'full_name' => $user['full_name'],
            'email' => $user['email'],
            'business_name' => $user['business_name'],
            'verification_status' => $user['verification_status'],
            'commission_rate' => $user['commission_rate'],
            'total_earnings' => $user['total_earnings'],
            'pending_earnings' => $user['pending_earnings']
        ]
    ]);

} catch (Exception $e) {
    error_log("Seller login error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Server error. Please try again later.'
    ]);
}
