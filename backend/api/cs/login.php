<?php
/**
 * Customer Support Login - JWT
 * POST: { email, password }
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
 
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../config/jwt.php';
 
$raw = file_get_contents('php://input');
$data = json_decode($raw, true);
$email = trim($data['email'] ?? '');
$password = $data['password'] ?? '';
 
if (!$email || !$password) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Email and password required']);
    exit;
}
 
try {
    $conn = getDBConnection();
    $stmt = $conn->prepare("SELECT id, full_name, email, password, role, status FROM users WHERE email = ?");
    $stmt->bind_param("s", $email);
    $stmt->execute();
    $res = $stmt->get_result();
    if ($res->num_rows === 0) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Invalid credentials']);
        exit;
    }
    $user = $res->fetch_assoc();
   
    // Map database roles to expected roles (handle all possible variations)
    $roleMap = [
        'support' => 'CUSTOMER_SUPPORT',
        'SUPPORT' => 'CUSTOMER_SUPPORT',
        'Support' => 'CUSTOMER_SUPPORT',
        'customer_support' => 'CUSTOMER_SUPPORT',
        'CUSTOMER_SUPPORT' => 'CUSTOMER_SUPPORT',
        'Customer_Support' => 'CUSTOMER_SUPPORT',
        'admin' => 'ADMIN',
        'ADMIN' => 'ADMIN',
        'Admin' => 'ADMIN',
        'manager' => 'ADMIN',
        'MANAGER' => 'ADMIN',
        'Manager' => 'ADMIN',
    ];
   
    // Normalize role - try both lowercase and original case
    $userRole = trim($user['role']);
    $userRoleLower = strtolower($userRole);
   
    // Check mapping - try original case first, then lowercase
    if (isset($roleMap[$userRole])) {
        $normalizedRole = $roleMap[$userRole];
    } elseif (isset($roleMap[$userRoleLower])) {
        $normalizedRole = $roleMap[$userRoleLower];
    } else {
        // Fallback: try uppercase
        $normalizedRole = strtoupper($userRole);
    }
   
    // Allow CUSTOMER_SUPPORT and ADMIN roles
    $allowedRoles = ['CUSTOMER_SUPPORT', 'ADMIN'];
   
    // Check if normalized role is allowed (case-insensitive comparison)
    $isAllowed = false;
    $finalRole = null;
    foreach ($allowedRoles as $allowedRole) {
        if (strcasecmp($normalizedRole, $allowedRole) === 0) {
            $isAllowed = true;
            $finalRole = $allowedRole; // Use exact case from allowed roles
            break;
        }
    }
   
    if (!$isAllowed) {
        http_response_code(403);
        error_log("CS Login 403 - User: {$email}, Role from DB: {$userRole}, Lowercase: {$userRoleLower}, Normalized: {$normalizedRole}");
        echo json_encode([
            'success' => false,
            'message' => 'Access denied. This account does not have customer support or admin privileges.',
            'debug_info' => [
                'user_role_from_db' => $user['role'],
                'user_role_trimmed' => $userRole,
                'user_role_lowercase' => $userRoleLower,
                'normalized_role' => $normalizedRole,
                'final_role' => $finalRole,
                'allowed_roles' => $allowedRoles,
                'role_in_map' => isset($roleMap[$userRoleLower])
            ]
        ]);
        exit;
    }
   
    // Use final role for JWT
    $normalizedRole = $finalRole;
    // Check account status BEFORE password verification
    if ($user['status'] !== 'active') {
        http_response_code(403);
        echo json_encode([
            'success' => false,
            'message' => 'Account inactive. Please contact administrator.',
            'debug_info' => [
                'user_status' => $user['status'],
                'expected_status' => 'active'
            ]
        ]);
        exit;
    }
   
    // Verify password
    if (!password_verify($password, $user['password'])) {
        http_response_code(401);
        error_log("CS Login failed - Password mismatch for user: {$email}");
        echo json_encode([
            'success' => false,
            'message' => 'Invalid email or password. Please check your credentials.'
        ]);
        exit;
    }
 
    $token = jwt_encode([
        'id' => $user['id'],
        'email' => $user['email'],
        'role' => $normalizedRole, // Use normalized role in JWT
        'name' => $user['full_name']
    ], 3600 * 4); // 4h
 
    echo json_encode([
        'success' => true,
        'token' => $token,
        'user' => [
            'id' => $user['id'],
            'name' => $user['full_name'],
            'email' => $user['email'],
            'role' => $normalizedRole // Use normalized role
        ]
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Server error', 'error' => $e->getMessage()]);
}
 
 