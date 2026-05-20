<?php
/**
 * Seller Logout API
 * Endpoint: POST /api/seller/logout.php
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

session_start();

// Clear ALL SELLER session variables
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

// Delete seller remember me cookie only
if (isset($_COOKIE['seller_remember_token'])) {
    setcookie('seller_remember_token', '', time() - 3600, '/', '', false, true);
}

// Don't destroy entire session - keep user/admin sessions intact if they exist

ob_end_clean();

echo json_encode([
    'success' => true,
    'message' => 'Logged out successfully'
]);
