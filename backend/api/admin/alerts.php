<?php
/**
 * Alerts/Notifications API
 * Endpoint: /api/admin/alerts.php
 */

require_once '../../config/cors.php';
require_once '../../config/database.php';

session_name('ADMINSESSID');
session_start();

// Check authentication
if (!isset($_SESSION['admin_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

$conn = getDBConnection();
$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        // Get all alerts
        $unreadOnly = $_GET['unread'] ?? false;
        
        $query = "SELECT * FROM alerts";
        if ($unreadOnly) {
            $query .= " WHERE is_read = 0";
        }
        $query .= " ORDER BY created_at DESC";
        
        $result = $conn->query($query);
        $alerts = [];
        while ($row = $result->fetch_assoc()) {
            $alerts[] = $row;
        }
        
        echo json_encode(['success' => true, 'alerts' => $alerts]);
        break;
        
    case 'POST':
        // Create new alert
        $input = json_decode(file_get_contents('php://input'), true);
        $title = trim($input['title'] ?? '');
        $message = trim($input['message'] ?? '');
        $type = $input['type'] ?? 'info';
        
        if (empty($title) || empty($message)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Title and message are required']);
            break;
        }
        
        $validTypes = ['info', 'success', 'warning', 'error'];
        if (!in_array($type, $validTypes)) {
            $type = 'info';
        }
        
        $stmt = $conn->prepare("INSERT INTO alerts (title, message, type) VALUES (?, ?, ?)");
        $stmt->bind_param("sss", $title, $message, $type);
        
        if ($stmt->execute()) {
            echo json_encode([
                'success' => true,
                'message' => 'Alert created successfully',
                'alert_id' => $conn->insert_id
            ]);
        } else {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Failed to create alert']);
        }
        $stmt->close();
        break;
        
    case 'PUT':
        // Mark alert as read
        $input = json_decode(file_get_contents('php://input'), true);
        $id = intval($input['id'] ?? 0);
        
        if ($id === 0) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Alert ID is required']);
            break;
        }
        
        $stmt = $conn->prepare("UPDATE alerts SET is_read = 1 WHERE id = ?");
        $stmt->bind_param("i", $id);
        
        if ($stmt->execute()) {
            echo json_encode(['success' => true, 'message' => 'Alert marked as read']);
        } else {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Failed to update alert']);
        }
        $stmt->close();
        break;
        
    case 'DELETE':
        // Delete alert
        $input = json_decode(file_get_contents('php://input'), true);
        $id = intval($input['id'] ?? 0);
        
        if ($id === 0) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Alert ID is required']);
            break;
        }
        
        $stmt = $conn->prepare("DELETE FROM alerts WHERE id = ?");
        $stmt->bind_param("i", $id);
        
        if ($stmt->execute()) {
            echo json_encode(['success' => true, 'message' => 'Alert deleted successfully']);
        } else {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Failed to delete alert']);
        }
        $stmt->close();
        break;
        
    default:
        http_response_code(405);
        echo json_encode(['success' => false, 'message' => 'Method not allowed']);
}

closeDBConnection($conn);
