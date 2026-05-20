<?php
require_once __DIR__ . '/../config/jwt.php';
require_once __DIR__ . '/../config/database.php';

/**
 * Extract bearer token from Authorization header
 */
function get_bearer_token(): ?string
{
    // Try getallheaders() first (most common)
    $headers = [];
    if (function_exists('getallheaders')) {
        $headers = getallheaders();
    } else {
        // Fallback: manually parse $_SERVER for Authorization header
        if (isset($_SERVER['HTTP_AUTHORIZATION'])) {
            $headers['Authorization'] = $_SERVER['HTTP_AUTHORIZATION'];
        }
    }
    
    $headerAuth = $headers['Authorization'] ?? $headers['authorization'] ?? null;
    if (is_array($headerAuth)) {
        $headerAuth = reset($headerAuth);
    }

    $serverAuth = $_SERVER['HTTP_AUTHORIZATION'] ?? null;
    if (is_array($serverAuth)) {
        $serverAuth = reset($serverAuth);
    }

    $redirectAuth = $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? null;
    if (is_array($redirectAuth)) {
        $redirectAuth = reset($redirectAuth);
    }

    if ($headerAuth !== null) {
        $auth = $headerAuth;
    } elseif ($serverAuth !== null) {
        $auth = $serverAuth;
    } elseif ($redirectAuth !== null) {
        $auth = $redirectAuth;
    } else {
        return null;
    }

    if (!is_string($auth)) {
        return null;
    }

    if (stripos($auth, 'Bearer ') === 0) {
        $token = trim(substr($auth, 7));
        error_log("  - Extracted token: " . substr($token, 0, 20) . "...");
        return $token;
    }
    return null;
}

/**
 * Validate JWT and optionally enforce roles
 * @param array $allowedRoles (empty means any)
 * @return array payload
 */
function require_jwt(array $allowedRoles = []): array
{
    try {
        $token = get_bearer_token();

        // Fallback to PHP session for existing user/seller flows (non-CS)
        if (!$token) {
            // If a non-admin session is already active but an ADMINSESSID cookie exists,
            // close the current session and switch to the admin session.
            if (session_status() === PHP_SESSION_ACTIVE && session_name() !== 'ADMINSESSID' && !empty($_COOKIE['ADMINSESSID'])) {
                session_write_close();
                session_name('ADMINSESSID');
                @session_start();
            }

            // Try admin session cookie first (separate session name) so admin sessions are isolated from user sessions
            if (session_status() === PHP_SESSION_NONE) {
                if (!empty($_COOKIE['ADMINSESSID'])) {
                    // Start admin session explicitly
                    session_write_close();
                    session_name('ADMINSESSID');
                    @session_start();
                    // If an admin session was not actually established, fallback to default session
                    if (!isset($_SESSION['admin_id'])) {
                        session_write_close();
                        session_name('PHPSESSID');
                        @session_start();
                    }
                } else {
                    @session_start();
                }
            }

            // Check for admin session first
            if (isset($_SESSION['admin_id'])) {
                $payload = [
                    'id' => (int)$_SESSION['admin_id'],
                    'email' => $_SESSION['admin_email'] ?? null,
                    'role' => 'ADMIN',
                    'name' => $_SESSION['admin_username'] ?? null,
                ];

                // Check role permissions
                if (!empty($allowedRoles)) {
                    $roleAllowed = false;
                    foreach ($allowedRoles as $allowedRole) {
                        if (strtoupper($payload['role']) === strtoupper($allowedRole)) {
                            $roleAllowed = true;
                            break;
                        }
                    }
                    if (!$roleAllowed) {
                        http_response_code(403);
                        echo json_encode(['success' => false, 'message' => 'Forbidden: Role ' . $payload['role'] . ' not allowed']);
                        exit;
                    }
                }
                return $payload;
            }

            // Check for regular user session (STRICT: must NOT be seller or admin)
            if (isset($_SESSION['user_id']) && isset($_SESSION['user_role']) && 
                !isset($_SESSION['seller_id']) && !isset($_SESSION['seller_logged_in']) && 
                !isset($_SESSION['admin_id'])) {
                // Normalize role to uppercase
                $role = strtoupper(trim($_SESSION['user_role']));
                // Map common role values (handle both old schema and new schema)
                $roleMap = [
                    'USER' => 'USER',
                    'SELLER' => 'USER',  // If user has SELLER role but no seller session, treat as USER
                    'ADMIN' => 'ADMIN',
                    'CUSTOMER_SUPPORT' => 'CUSTOMER_SUPPORT',
                    'user' => 'USER',
                    'seller' => 'USER',  // If user has seller role but no seller session, treat as USER
                    'admin' => 'ADMIN',
                    'customer_support' => 'CUSTOMER_SUPPORT',
                    'CUSTOMER' => 'USER',  // Map CUSTOMER to USER
                    'customer' => 'USER',  // Map lowercase customer to USER
                    'support' => 'CUSTOMER_SUPPORT',  // Map support to CUSTOMER_SUPPORT
                    'SUPPORT' => 'CUSTOMER_SUPPORT',
                    'manager' => 'ADMIN',  // Map manager to ADMIN
                    'MANAGER' => 'ADMIN',
                ];
                $normalizedRole = $roleMap[$role] ?? $role;
                
                $payload = [
                    'id' => (int)$_SESSION['user_id'],
                    'email' => $_SESSION['user_email'] ?? null,
                    'role' => $normalizedRole,
                    'name' => $_SESSION['user_name'] ?? null,
                ];
                
                // DEBUG: Log payload being returned
                error_log("✅ AUTH SUCCESS (Session-based):");
                error_log("  - Payload ID: " . $payload['id']);
                error_log("  - Payload Role: " . $payload['role']);
                error_log("  - Payload Email: " . ($payload['email'] ?? 'NULL'));
                
                // Check role permissions
                if (!empty($allowedRoles)) {
                    $roleAllowed = false;
                    foreach ($allowedRoles as $allowedRole) {
                        if (strtoupper($payload['role']) === strtoupper($allowedRole)) {
                            $roleAllowed = true;
                            break;
                        }
                    }
                    if (!$roleAllowed) {
                        http_response_code(403);
                        echo json_encode(['success' => false, 'message' => 'Forbidden: Role ' . $payload['role'] . ' not allowed']);
                        exit;
                    }
                }
                return $payload;
            }
            
            // Check for seller session (STRICT: must have seller_logged_in AND seller_id, NOT regular user session)
            if (isset($_SESSION['seller_user_id']) && isset($_SESSION['seller_logged_in']) && 
                $_SESSION['seller_logged_in'] === true && isset($_SESSION['seller_id']) &&
                !isset($_SESSION['logged_in'])) {  // Make sure regular user session is NOT set
                $payload = [
                    'id' => (int)$_SESSION['seller_user_id'],
                    'email' => $_SESSION['seller_email'] ?? null,
                    'role' => 'SELLER',
                    'name' => $_SESSION['seller_name'] ?? null,
                ];
                
                // Check role permissions
                if (!empty($allowedRoles)) {
                    $roleAllowed = false;
                    foreach ($allowedRoles as $allowedRole) {
                        if (strtoupper($payload['role']) === strtoupper($allowedRole)) {
                            $roleAllowed = true;
                            break;
                        }
                    }
                    if (!$roleAllowed) {
                        http_response_code(403);
                        echo json_encode(['success' => false, 'message' => 'Forbidden: Role ' . $payload['role'] . ' not allowed']);
                        exit;
                    }
                }
                return $payload;
            }
            http_response_code(401);
            echo json_encode(['success' => false, 'message' => 'Unauthorized - Please login']);
            exit;
        }

        $payload = jwt_decode($token);
        if (!isset($payload['id'], $payload['role'])) {
            throw new Exception('Invalid token payload');
        }

        $payload['role'] = strtoupper(trim((string)$payload['role']));
        if ($payload['role'] === 'ADMIN' || $payload['role'] === 'MANAGER') {
            $payload['role'] = 'ADMIN';
        }
        
        // DEBUG: Log JWT payload
        error_log("✅ AUTH SUCCESS (JWT Token):");
        error_log("  - Payload ID: " . $payload['id']);
        error_log("  - Payload Role: " . $payload['role']);
        error_log("  - Payload Email: " . ($payload['email'] ?? 'NULL'));
        
        if (!empty($allowedRoles) && !in_array($payload['role'], $allowedRoles, true)) {
            http_response_code(403);
            echo json_encode(['success' => false, 'message' => 'Forbidden']);
            exit;
        }
        return $payload;
    } catch (Exception $e) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Unauthorized', 'error' => $e->getMessage()]);
        exit;
    }
}

/**
 * Helper for backwards compatibility with older admin endpoints
 * Use: checkAuth(['admin']); will exit with 401 if not authorized
 */
function checkAuth(array $roles = []) {
    return require_jwt($roles);
}

/**
 * Auto assign an available support agent (lowest open/assigned count)
 * Returns user_id or null
 */
function auto_assign_support_agent($conn)
{
    $sql = "
        SELECT u.id, COALESCE(open_cnt,0) as open_cnt
        FROM users u
        LEFT JOIN (
            SELECT assigned_to_id, COUNT(*) open_cnt
            FROM tickets
            WHERE status IN ('OPEN','ASSIGNED','IN_PROGRESS','WAITING_FOR_USER')
            GROUP BY assigned_to_id
        ) t ON t.assigned_to_id = u.id
        WHERE u.role = 'CUSTOMER_SUPPORT' AND u.status = 'active'
        ORDER BY open_cnt ASC, u.id ASC
        LIMIT 1
    ";
    $res = $conn->query($sql);
    if ($res && $res->num_rows > 0) {
        $row = $res->fetch_assoc();
        return (int)$row['id'];
    }
    return null;
}
