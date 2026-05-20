<?php
/**
 * Admin Logout API
 * Endpoint: POST /api/admin/logout.php
 */

require_once '../../config/cors.php';

// Ensure we destroy the admin session specifically
session_name('ADMINSESSID');
if (session_status() === PHP_SESSION_NONE) session_start();
// Clear all session data and destroy
$_SESSION = [];
if (ini_get('session.use_cookies')) {
    $params = session_get_cookie_params();
    setcookie(session_name(), '', time() - 42000, '/', $params['domain'], $params['secure'], $params['httponly']);
}
session_destroy();

// Also send success
echo json_encode([
    'success' => true,
    'message' => 'Logged out successfully (admin session cleared)'
]);
