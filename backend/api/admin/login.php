<?php
// Frontend/backend/api/admin/login.php
// Use explicit origin and allow credentials so cookies work from React dev server
header('Content-Type: application/json; charset=utf-8');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    header('Access-Control-Allow-Origin: https://uptulathemehub.com');
    header('Access-Control-Allow-Methods: POST, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, Accept');
    header('Access-Control-Allow-Credentials: true');
    http_response_code(200);
    exit;
}
// For actual responses
header('Access-Control-Allow-Origin: https://uptulathemehub.com');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, Accept');
header('Access-Control-Allow-Credentials: true');

require_once __DIR__ . '/../../config/jwt.php';

$raw = file_get_contents('php://input');
$input = json_decode($raw, true);

if (!is_array($input)) {
    $input = $_POST;
}

$email = isset($input['email']) ? trim($input['email']) : '';
$password = isset($input['password']) ? $input['password'] : '';

if ($email === '' || $password === '') {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Missing email or password']);
    exit;
}

// Try to reuse an existing DB include; otherwise fallback to defaults.
$mysqli = null;

// Attempt typical includes used in this project (adjust paths if needed)
$possible = [
    __DIR__ . '/../../db.php',
    __DIR__ . '/../db.php',
    __DIR__ . '/../../config.php',
];

foreach ($possible as $p) {
    if (file_exists($p)) {
        include_once $p;
    }
}

// After including, try to detect $mysqli, $conn, or $pdo
if (isset($mysqli) && $mysqli instanceof mysqli) {
    $db = $mysqli;
} elseif (isset($conn) && $conn instanceof mysqli) {
    $db = $conn;
} elseif (isset($pdo) && $pdo instanceof PDO) {
    $db = $pdo;
} else {
    // Fall back to default local XAMPP settings (adjust user/password if you use them)
    $db_host = '127.0.0.1';
    $db_user = 'root';
    $db_pass = '';
    $db_name = 'themehub_db';
    $db = new mysqli($db_host, $db_user, $db_pass, $db_name);
    if ($db->connect_errno) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Database connection failed']);
        exit;
    }
}

// Query the admin by email (use prepared statements)
try {
    if ($db instanceof PDO) {
        $stmt = $db->prepare('SELECT id, username, email, password, role_id FROM admins WHERE email = ? LIMIT 1');
        $stmt->execute([$email]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
    } else {
        $stmt = $db->prepare('SELECT id, username, email, password, role_id FROM admins WHERE email = ? LIMIT 1');
        $stmt->bind_param('s', $email);
        $stmt->execute();
        $res = $stmt->get_result();
        $user = $res ? $res->fetch_assoc() : null;
    }

    if (!$user) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Invalid email or password']);
        exit;
    }

    $hashed = $user['password'];

    $verified = false;
    if ($hashed && password_verify($password, $hashed)) {
        $verified = true;
    } else {
        // In case the stored password is not hashed (rare), try direct comparison
        if ($password === $hashed) {
            // Re-hash the password to bcrypt if possible (best-effort)
            if (function_exists('password_hash')) {
                $newHash = password_hash($password, PASSWORD_BCRYPT);
                if ($newHash) {
                    if ($db instanceof PDO) {
                        $u = $db->prepare('UPDATE admins SET password = ? WHERE id = ?');
                        $u->execute([$newHash, $user['id']]);
                    } else {
                        $up = $db->prepare('UPDATE admins SET password = ? WHERE id = ?');
                        $up->bind_param('si', $newHash, $user['id']);
                        $up->execute();
                    }
                }
            }
            $verified = true;
        }
    }

    if (!$verified) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Invalid email or password']);
        exit;
    }

    // Login success: secure session creation and clean up other session types (user/seller)
    if (session_status() === PHP_SESSION_NONE) {
        // Use a separate session name for admin to isolate sessions from regular users
        session_name('ADMINSESSID');
        // Use a root-scoped admin cookie so all admin APIs can access the same session.
        session_set_cookie_params([
            'lifetime' => 0,
            'path' => '/',
            'domain' => '',
            'secure' => true, // set true in production with HTTPS
            'httponly' => true,
            'samesite' => 'Lax'
        ]);

        // secure session cookie flags for dev (turn on secure in prod)
        ini_set('session.cookie_httponly', 1);
        ini_set('session.cookie_secure', 1);
        ini_set('session.use_only_cookies', 1);
        ini_set('session.cookie_samesite', 'Lax');
        session_start();
    }

    // Prevent session fixation
    session_regenerate_id(true);

    // Remove any user/seller session variables from the DEFAULT session (if present)
    // to avoid displaying admin info on the public site
    if (isset($_COOKIE[session_name()]) && session_name() === 'ADMINSESSID') {
        // Try to also clean the default PHPSESSID if exists
        if (!empty($_COOKIE['PHPSESSID'])) {
            // Start default session and clear user keys
            session_write_close();
            session_name('PHPSESSID');
            session_start();
            $toUnsetDefault = ['user_id','user_email','user_name','user_role','user_type','logged_in','seller_id','seller_user_id','seller_email','seller_name','seller_logged_in'];
            foreach ($toUnsetDefault as $k) {
                if (isset($_SESSION[$k])) unset($_SESSION[$k]);
            }
            session_write_close();
            // Restore admin session
            session_name('ADMINSESSID');
            session_start();
        }
    }

    // Set admin session values and flags
    $_SESSION['admin_id'] = $user['id'];
    $_SESSION['admin_email'] = $user['email'];
    $_SESSION['admin_username'] = $user['username'];
    $_SESSION['role_id'] = $user['role_id'];
    $_SESSION['is_admin'] = true;
    $_SESSION['user_type'] = 'admin';
    $_SESSION['login_time'] = time();

    $token = jwt_encode([
        'id' => $user['id'],
        'email' => $user['email'],
        'username' => $user['username'],
        'role' => 'ADMIN',
        'role_id' => $user['role_id']
    ]);

    http_response_code(200);
    echo json_encode([
        'success' => true,
        'message' => 'Login successful',
        'token' => $token,
        'user' => [
            'id' => $user['id'],
            'email' => $user['email'],
            'username' => $user['username'],
            'role_id' => $user['role_id']
        ],
        'data' => [
            'id' => $user['id'],
            'email' => $user['email'],
            'username' => $user['username'],
            'role_id' => $user['role_id']
        ]
    ]);
    exit;

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Server error']);
    exit;
}