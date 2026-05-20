<?php
/**
 * Users CRUD API
 * Endpoint: /api/admin/users.php
 */

require_once '../../config/cors.php';
require_once '../../config/database.php';

// Session configuration must be set BEFORE session_start()
ini_set('session.cookie_httponly', 1);
ini_set('session.cookie_secure', 1); // Set to 1 in production with HTTPS
ini_set('session.use_only_cookies', 1);
ini_set('session.cookie_samesite', 'Lax'); // Allow cross-site cookie transmission
ini_set('session.cookie_path', '/'); // Ensure cookie is accessible from all paths

session_name('ADMINSESSID');
session_start();

// Keep any accidental output from breaking JSON responses
if (!ob_get_level()) {
    ob_start();
}

function sendJsonResponse($payload, $status = 200) {
    if (ob_get_length()) {
        ob_clean();
    }
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($payload);
    exit;
}

// Check authentication - only for non-GET requests
// GET requests will proceed but may return empty if not authenticated
$method = $_SERVER['REQUEST_METHOD'];
$isAdmin = isset($_SESSION['admin_id']) || isset($_SESSION['admin_email']) || isset($_SESSION['admin_username']);

// Log for debugging
if ($method !== 'GET') {
    error_log("Users API - Method: $method, IsAdmin: " . ($isAdmin ? 'true' : 'false') . ", Session Keys: " . json_encode(array_keys($_SESSION)));
}

if ($method !== 'GET' && !$isAdmin) {
    sendJsonResponse(['success' => false, 'message' => 'Unauthorized - Please login as admin first'], 401);
}

$conn = getDBConnection();

switch ($method) {
    case 'GET':
        // List all users
        $search = $_GET['search'] ?? '';
        $roleFilter = $_GET['role'] ?? '';
        
        $query = "SELECT id, full_name, email, role, phone, department, status, created_at FROM users WHERE 1=1";
        $params = [];
        $types = '';
        
        if (!empty($search)) {
            $query .= " AND (full_name LIKE ? OR email LIKE ?)";
            $searchTerm = "%$search%";
            $params[] = $searchTerm;
            $params[] = $searchTerm;
            $types .= 'ss';
        }
        
        if (!empty($roleFilter)) {
            $query .= " AND role = ?";
            $params[] = strtolower($roleFilter);
            $types .= 's';
        }
        
        $query .= " ORDER BY created_at DESC";
        
        $stmt = $conn->prepare($query);
        if (!empty($params)) {
            $stmt->bind_param($types, ...$params);
        }
        $stmt->execute();
        $result = $stmt->get_result();
        
        $users = [];
        while ($row = $result->fetch_assoc()) {
            $users[] = $row;
        }
        
        sendJsonResponse(['success' => true, 'users' => $users]);
        $stmt->close();
        break;
        
    case 'POST':
        // Create new user
        $input = json_decode(file_get_contents('php://input'), true);
        $full_name = trim($input['full_name'] ?? '');
        $email = trim($input['email'] ?? '');
        $password = $input['password'] ?? '';
        $role = strtolower($input['role'] ?? 'customer');
        $phone = $input['phone'] ?? null;
        $department = $input['department'] ?? null;
        
        if (empty($full_name) || empty($email) || empty($password)) {
            sendJsonResponse(['success' => false, 'message' => 'Full name, email, and password are required'], 400);
            break;
        }
        
        // Validate role
        $validRoles = ['admin', 'manager', 'support', 'customer'];
        if (!in_array($role, $validRoles)) {
            $role = 'customer';
        }
        
        // Hash password
        $hashedPassword = password_hash($password, PASSWORD_DEFAULT);
        
        $stmt = $conn->prepare("INSERT INTO users (full_name, email, password, role, phone, department) VALUES (?, ?, ?, ?, ?, ?)");
        $stmt->bind_param("ssssss", $full_name, $email, $hashedPassword, $role, $phone, $department);
        
        if ($stmt->execute()) {
            sendJsonResponse([
                'success' => true,
                'message' => 'User created successfully',
                'user' => [
                    'id' => $conn->insert_id,
                    'full_name' => $full_name,
                    'email' => $email,
                    'role' => $role
                ]
            ]);
        } else {
            if ($conn->errno === 1062) {
                sendJsonResponse(['success' => false, 'message' => 'Email already exists'], 409);
            } else {
                sendJsonResponse(['success' => false, 'message' => 'Failed to create user'], 500);
            }
        }
        $stmt->close();
        break;
        
    case 'PUT':
        // Update user
        $input = json_decode(file_get_contents('php://input'), true);
        $id = intval($input['id'] ?? 0);
        $status = $input['status'] ?? null;
        $role = $input['role'] ?? null;
        
        if ($id === 0) {
            sendJsonResponse(['success' => false, 'message' => 'User ID is required'], 400);
            break;
        }
        
        if ($status !== null) {
            $validStatus = ['active', 'blocked'];
            if (in_array($status, $validStatus)) {
                $stmt = $conn->prepare("UPDATE users SET status=? WHERE id=?");
                $stmt->bind_param("si", $status, $id);
                $stmt->execute();
                $stmt->close();
            }
        }
        
        if ($role !== null) {
            $validRoles = ['admin', 'manager', 'support', 'customer'];
            if (in_array(strtolower($role), $validRoles)) {
                $role = strtolower($role);
                $stmt = $conn->prepare("UPDATE users SET role=? WHERE id=?");
                $stmt->bind_param("si", $role, $id);
                $stmt->execute();
                $stmt->close();
            }
        }
        
        sendJsonResponse(['success' => true, 'message' => 'User updated successfully']);
        break;
        
    case 'DELETE':
        // Delete user (including customer support, admin, manager, etc.)
        $input = json_decode(file_get_contents('php://input'), true);
        $id = intval($input['id'] ?? 0);
        
        if ($id === 0) {
            sendJsonResponse(['success' => false, 'message' => 'User ID is required'], 400);
            break;
        }
        
        // Prevent deleting the current admin
        if (isset($_SESSION['admin_id']) && $id == $_SESSION['admin_id']) {
            sendJsonResponse(['success' => false, 'message' => 'Cannot delete your own account'], 400);
            break;
        }
        
        // Check if user exists and get role
        $checkStmt = $conn->prepare("SELECT role FROM users WHERE id = ?");
        $checkStmt->bind_param("i", $id);
        $checkStmt->execute();
        $checkResult = $checkStmt->get_result();
        
        if ($checkResult->num_rows === 0) {
            $checkStmt->close();
            closeDBConnection($conn);
            sendJsonResponse(['success' => false, 'message' => 'User not found'], 404);
            break;
        }
        
        $userData = $checkResult->fetch_assoc();
        $userRole = $userData['role'];
        $checkStmt->close();
        
        // Start transaction
        $conn->begin_transaction();
        
        try {
            // If user is a seller, delete seller record first
            $sellerCheck = $conn->prepare("SELECT id FROM sellers WHERE user_id = ?");
            $sellerCheck->bind_param("i", $id);
            $sellerCheck->execute();
            $sellerResult = $sellerCheck->get_result();
            
            if ($sellerResult->num_rows > 0) {
                $sellerData = $sellerResult->fetch_assoc();
                $sellerId = $sellerData['id'];
                
                // Delete seller reputation
                $repStmt = $conn->prepare("DELETE FROM seller_reputation WHERE seller_id = ?");
                $repStmt->bind_param("i", $sellerId);
                $repStmt->execute();
                $repStmt->close();
                
                // Delete seller
                $sellerDelete = $conn->prepare("DELETE FROM sellers WHERE id = ?");
                $sellerDelete->bind_param("i", $sellerId);
                $sellerDelete->execute();
                $sellerDelete->close();
            }
            $sellerCheck->close();
            
            // Delete user
            $stmt = $conn->prepare("DELETE FROM users WHERE id = ?");
            $stmt->bind_param("i", $id);
            
            if (!$stmt->execute()) {
                throw new Exception("Failed to delete user: " . $stmt->error);
            }
            $stmt->close();
            
            $conn->commit();
            closeDBConnection($conn);
            
            sendJsonResponse([
                'success' => true, 
                'message' => ucfirst($userRole) . ' deleted successfully'
            ]);
        } catch (Exception $e) {
            $conn->rollback();
            closeDBConnection($conn);
            error_log("Delete user error: " . $e->getMessage());
            sendJsonResponse(['success' => false, 'message' => 'Failed to delete user: ' . $e->getMessage()], 500);
        }
        break;
        
    default:
        sendJsonResponse(['success' => false, 'message' => 'Method not allowed'], 405);
}

closeDBConnection($conn);
