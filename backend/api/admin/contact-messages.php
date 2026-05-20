<?php
/**
 * Contact Messages API
 * Endpoint: /api/admin/contact-messages.php
 * Methods: GET (list), DELETE (delete)
 */

require_once '../../config/cors.php';
require_once '../../config/database.php';

// Session configuration
ini_set('session.cookie_httponly', 1);
ini_set('session.cookie_secure', 1);
ini_set('session.use_only_cookies', 1);
ini_set('session.cookie_samesite', 'Lax');
ini_set('session.cookie_path', '/');

session_name('ADMINSESSID');
session_start();

header('Content-Type: application/json; charset=utf-8');

// Check authentication
$isAdmin = isset($_SESSION['admin_id']) && !empty($_SESSION['admin_id']);

if (!$isAdmin) {
    http_response_code(401);
    echo json_encode([
        'success' => false,
        'error' => 'Unauthorized - Admin access required'
    ]);
    exit;
}

$conn = getDBConnection();

if (!$conn) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Database connection failed'
    ]);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        // Fetch all contact messages
        $query = "SELECT id, first_name, last_name, email, phone, message, created_at, COALESCE(is_read, 0) as is_read FROM contact ORDER BY created_at DESC";
        
        $result = $conn->query($query);
        
        if (!$result) {
            http_response_code(500);
            error_log("Contact messages query failed: " . $conn->error);
            echo json_encode([
                'success' => false,
                'error' => 'Failed to fetch messages: ' . $conn->error,
                'query_error' => $conn->error
            ]);
            $conn->close();
            exit;
        }
        
        $messages = [];
        while ($row = $result->fetch_assoc()) {
            // Format the response data
            $messages[] = [
                'id' => intval($row['id']),
                'first_name' => $row['first_name'],
                'last_name' => $row['last_name'],
                'email' => $row['email'],
                'phone' => $row['phone'],
                'message' => $row['message'],
                'created_at' => $row['created_at'],
                'is_read' => intval($row['is_read'])
            ];
        }
        
        $result->free();
        
        echo json_encode([
            'success' => true,
            'messages' => $messages,
            'count' => count($messages)
        ]);
        $conn->close();
        break;
        
    case 'DELETE':
        // Delete a specific contact message
        $input = json_decode(file_get_contents('php://input'), true);
        $id = intval($input['id'] ?? 0);
        
        if ($id === 0) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'error' => 'Message ID is required'
            ]);
            $conn->close();
            exit;
        }
        
        // Delete the message
        $stmt = $conn->prepare("DELETE FROM contact WHERE id = ?");
        
        if (!$stmt) {
            http_response_code(500);
            error_log("Prepare failed: " . $conn->error);
            echo json_encode([
                'success' => false,
                'error' => 'Database error: ' . $conn->error
            ]);
            $conn->close();
            exit;
        }
        
        $stmt->bind_param("i", $id);
        
        if ($stmt->execute()) {
            echo json_encode([
                'success' => true,
                'message' => 'Message deleted successfully'
            ]);
        } else {
            http_response_code(500);
            error_log("Delete failed: " . $stmt->error);
            echo json_encode([
                'success' => false,
                'error' => 'Failed to delete message: ' . $stmt->error
            ]);
        }
        $stmt->close();
        $conn->close();
        break;
        
    default:
        http_response_code(405);
        echo json_encode([
            'success' => false,
            'error' => 'Method not allowed'
        ]);
        $conn->close();
        exit;
}
