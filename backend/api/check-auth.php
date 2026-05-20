<?php
/**
 * Check Authentication Status
 * Endpoint: GET /api/check-auth.php
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
header('Access-Control-Allow-Headers: Content-Type, X-Requested-With, Accept');
header('Access-Control-Allow-Credentials: true');
header('Content-Type: application/json; charset=utf-8');

// Start session only if existing session cookie exists (prevents creating empty session by different API calls)
$secure = !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off';
ini_set('session.cookie_httponly', 1);
ini_set('session.cookie_secure', $secure ? 1 : 0);
ini_set('session.use_only_cookies', 1);
ini_set('session.cookie_samesite', $secure ? 'None' : 'Lax');
ini_set('session.cookie_path', '/');
if (isset($_COOKIE[session_name()])) {
    session_start();
}
ob_end_clean();

// Check if ADMIN is logged in FIRST
if (isset($_SESSION['admin_id']) && isset($_SESSION['admin_email'])) {
    echo json_encode([
        'success' => true,
        'authenticated' => true,
        'user_type' => 'admin',
        'user' => [
            'id' => $_SESSION['admin_id'],
            'email' => $_SESSION['admin_email'],
            'username' => $_SESSION['admin_username'] ?? '',
            'role_id' => $_SESSION['role_id'] ?? null
        ]
    ]);
    exit;
}

// Check if USER is logged in (not admin or seller)
// STRICT CHECK: Must have user_id AND logged_in, AND must NOT have seller_id or admin_id
if (isset($_SESSION['user_id']) && isset($_SESSION['logged_in']) && $_SESSION['logged_in'] === true) {
    // STRICT: Make sure it's NOT admin or seller session
    // Check that seller_id is NOT set and admin_id is NOT set
    if (!isset($_SESSION['admin_id']) && !isset($_SESSION['seller_id']) && !isset($_SESSION['seller_logged_in'])) {
        // Fetch full user data from database to ensure accuracy
        try {
            require_once '../config/database.php';
            $conn = getDBConnection();
            $userId = intval($_SESSION['user_id']);
            
            $stmt = $conn->prepare("SELECT id, full_name, email, role, photo_url, phone FROM users WHERE id = ? AND status = 'active'");
            $stmt->bind_param("i", $userId);
            $stmt->execute();
            $result = $stmt->get_result();
            
            if ($result->num_rows > 0) {
                $userData = $result->fetch_assoc();
                $stmt->close();
                closeDBConnection($conn);
                
                echo json_encode([
                    'success' => true,
                    'authenticated' => true,
                    'user_type' => 'user',
                    'user' => [
                        'id' => $userData['id'],
                        'email' => $userData['email'],
                        'full_name' => $userData['full_name'],
                        'role' => $userData['role'],
                        'photo_url' => $userData['photo_url'],
                        'phone' => $userData['phone']
                    ]
                ]);
            } else {
                // User not found or inactive, clear session
                session_destroy();
                $stmt->close();
                closeDBConnection($conn);
                echo json_encode([
                    'success' => true,
                    'authenticated' => false,
                    'user' => null
                ]);
            }
        } catch (Exception $e) {
            // Fallback to session data if DB query fails
            echo json_encode([
                'success' => true,
                'authenticated' => true,
                'user' => [
                    'id' => $_SESSION['user_id'] ?? null,
                    'email' => $_SESSION['user_email'] ?? null,
                    'full_name' => $_SESSION['user_name'] ?? null,
                    'role' => $_SESSION['user_role'] ?? null
                ]
            ]);
        }
    } else {
        // Admin or seller is logged in, not regular user
        echo json_encode([
            'success' => true,
            'authenticated' => false,
            'user' => null,
            'message' => 'Admin or seller session active'
        ]);
    }
} else {
    echo json_encode([
        'success' => true,
        'authenticated' => false,
        'user' => null
    ]);
}
