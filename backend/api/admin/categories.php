<?php
/**
 * Categories & Frameworks CRUD API
 * Endpoint: /api/admin/categories.php
 */
 
require_once '../../config/cors.php';
require_once '../../config/database.php';
 
// Session configuration must be set BEFORE session_start()
ini_set('session.cookie_httponly', 1);
ini_set('session.cookie_secure', 1);
ini_set('session.use_only_cookies', 1);
ini_set('session.cookie_samesite', 'Lax');
ini_set('session.cookie_path', '/');
 
session_name('ADMINSESSID');
session_start();
 
// Check authentication - only for non-GET requests
$method = $_SERVER['REQUEST_METHOD'];
$isAdmin = isset($_SESSION['admin_id']);
 
if ($method !== 'GET' && !$isAdmin) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}
 
$conn = getDBConnection();
$type = $_GET['type'] ?? 'category'; // category or framework
 
switch ($method) {
    case 'GET':
        // List categories or frameworks
        if ($type === 'framework') {
            $result = $conn->query("SELECT * FROM frameworks ORDER BY name ASC");
            $items = [];
            while ($row = $result->fetch_assoc()) {
                $items[] = $row;
            }
            echo json_encode(['success' => true, 'frameworks' => $items]);
        } else {
            $result = $conn->query("SELECT * FROM categories ORDER BY name ASC");
            $items = [];
            while ($row = $result->fetch_assoc()) {
                $items[] = $row;
            }
            echo json_encode(['success' => true, 'categories' => $items]);
        }
        break;
       
    case 'POST':
        // Create category or framework
        $input = json_decode(file_get_contents('php://input'), true);
        $name = trim($input['name'] ?? '');
        $type = $input['type'] ?? 'category';
       
        if (empty($name)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Name is required']);
            break;
        }
       
        $table = $type === 'framework' ? 'frameworks' : 'categories';
        $stmt = $conn->prepare("INSERT INTO $table (name) VALUES (?)");
        $stmt->bind_param("s", $name);
       
        if ($stmt->execute()) {
            echo json_encode([
                'success' => true,
                'message' => ucfirst($type) . ' created successfully',
                'id' => $conn->insert_id
            ]);
        } else {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Failed to create ' . $type]);
        }
        $stmt->close();
        break;
       
    case 'PUT':
        // Update category or framework
        $input = json_decode(file_get_contents('php://input'), true);
        $id = intval($input['id'] ?? 0);
        $name = trim($input['name'] ?? '');
        $type = $input['type'] ?? 'category';
       
        if ($id === 0 || empty($name)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'ID and name are required']);
            break;
        }
       
        $table = $type === 'framework' ? 'frameworks' : 'categories';
        $stmt = $conn->prepare("UPDATE $table SET name=? WHERE id=?");
        $stmt->bind_param("si", $name, $id);
       
        if ($stmt->execute()) {
            echo json_encode(['success' => true, 'message' => ucfirst($type) . ' updated successfully']);
        } else {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Failed to update ' . $type]);
        }
        $stmt->close();
        break;
       
    case 'DELETE':
        // Delete category or framework
        $input = json_decode(file_get_contents('php://input'), true);
        $id = intval($input['id'] ?? 0);
        $type = $input['type'] ?? 'category';
       
        if ($id === 0) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'ID is required']);
            break;
        }
       
        $table = $type === 'framework' ? 'frameworks' : 'categories';
        $stmt = $conn->prepare("DELETE FROM $table WHERE id=?");
        $stmt->bind_param("i", $id);
       
        if ($stmt->execute()) {
            echo json_encode(['success' => true, 'message' => ucfirst($type) . ' deleted successfully']);
        } else {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Failed to delete ' . $type]);
        }
        $stmt->close();
        break;
       
    default:
        http_response_code(405);
        echo json_encode(['success' => false, 'message' => 'Method not allowed']);
}
 
closeDBConnection($conn);
 
 