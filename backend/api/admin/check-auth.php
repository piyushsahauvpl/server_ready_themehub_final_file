<?php
/**
 * Check Admin Authentication
 * Endpoint: GET /api/admin/check-auth.php
 */

error_reporting(E_ALL);
ini_set('display_errors', 0);
ob_start();

// Handle CORS and OPTIONS request FIRST
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    header_remove();
    header('Access-Control-Allow-Origin: https://uptulathemehub.com');
    header('Access-Control-Allow-Methods: GET, OPTIONS');
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
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-Requested-With, Accept, Authorization');
header('Access-Control-Allow-Credentials: true');
header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/../../config/jwt.php';

if (!function_exists('getallheaders')) {
    function getallheaders() {
        $headers = [];
        foreach ($_SERVER as $name => $value) {
            if (substr($name, 0, 5) === 'HTTP_') {
                $headerName = str_replace(' ', '-', ucwords(strtolower(str_replace('_', ' ', substr($name, 5)))));
                $headers[$headerName] = $value;
            }
        }
        return $headers;
    }
}

$headers = getallheaders();
$authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? '';

$authenticated = false;
$user = null;

if ($authHeader && preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
    try {
        $decoded = jwt_decode($matches[1]);
        $role = isset($decoded['role']) ? strtoupper(trim((string)$decoded['role'])) : '';
        if (in_array($role, ['ADMIN', 'MANAGER'], true)) {
            $authenticated = true;
            $user = [
                'id' => $decoded['id'] ?? null,
                'email' => $decoded['email'] ?? '',
                'username' => $decoded['username'] ?? '',
                'role_id' => $decoded['role_id'] ?? null,
            ];
        }
    } catch (Exception $e) {
        // ignore invalid token and fall back to session auth
    }
}

// Session fallback
if (!$authenticated) {
    ini_set('session.cookie_httponly', 1);
    ini_set('session.cookie_secure', 1);
    ini_set('session.use_only_cookies', 1);
    ini_set('session.cookie_samesite', 'Lax');

    session_name('ADMINSESSID');
    session_set_cookie_params([
        'lifetime' => 0,
        'path' => '/',
        'domain' => '',
        'secure' => true,
        'httponly' => true,
        'samesite' => 'Lax'
    ]);
    @session_start();

    if (empty($_SESSION['admin_id'])) {
        session_write_close();
        session_name('PHPSESSID');
        session_set_cookie_params([
            'lifetime' => 0,
            'path' => '/',
            'domain' => '',
            'secure' => true,
            'httponly' => true,
            'samesite' => 'Lax'
        ]);
        @session_start();
    }

    if (isset($_SESSION['admin_id'])) {
        $authenticated = true;
        $user = [
            'id' => $_SESSION['admin_id'],
            'email' => $_SESSION['admin_email'] ?? '',
            'username' => $_SESSION['admin_username'] ?? ''
        ];
    }
}

ob_end_clean();

if ($authenticated) {
    echo json_encode([
        'success' => true,
        'authenticated' => true,
        'user' => $user
    ]);
    exit;
}

http_response_code(401);
echo json_encode([
    'success' => false,
    'authenticated' => false,
    'message' => 'Not authenticated'
]);

// Preferred: ADMINSESSID
session_name('ADMINSESSID');
session_set_cookie_params([
    'lifetime' => 0,
    'path' => '/',
    'domain' => '',
    'secure' => true,
    'httponly' => true,
    'samesite' => 'Lax'
]);
@session_start();

// If ADMINSESSID didn't yield an authenticated admin, attempt default session
if (empty($_SESSION['admin_id'])) {
    // Close current session and try default session name
    session_write_close();
    session_name('PHPSESSID');
    session_set_cookie_params([
        'lifetime' => 0,
        'path' => '/',
        'domain' => '',
        'secure' => true,
        'httponly' => true,
        'samesite' => 'Lax'
    ]);
    @session_start();
}
ob_end_clean();

if (isset($_SESSION['admin_id'])) {
    echo json_encode([
        'success' => true,
        'authenticated' => true,
        'user' => [
            'id' => $_SESSION['admin_id'],
            'email' => $_SESSION['admin_email'] ?? '',
            'username' => $_SESSION['admin_username'] ?? ''
        ]
    ]);
} else {
    http_response_code(401);
    echo json_encode([
        'success' => false,
        'authenticated' => false,
        'message' => 'Not authenticated'
    ]);
}
