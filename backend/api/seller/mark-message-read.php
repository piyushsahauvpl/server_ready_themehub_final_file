<?php
header('Content-Type: application/json');
require_once '../config/cors.php';
require_once '../config/database.php';
require_once '../middleware/auth.php';
 
$method = $_SERVER['REQUEST_METHOD'];
 
if ($method === 'POST') {
    try {
        if (!isset($_SESSION['user_id'])) {
            throw new Exception('Unauthorized');
        }
 
        $data = json_decode(file_get_contents('php://input'), true);
       
        if (!isset($data['message_id'])) {
            throw new Exception('message_id is required');
        }
       
        $message_id = intval($data['message_id']);
        $user_id = intval($_SESSION['user_id']);
        $timestamp = date('Y-m-d H:i:s');
       
        // Mark message as read
        $query = "UPDATE seller_messages
                  SET is_read = 1, read_at = '$timestamp'
                  WHERE id = '$message_id' AND seller_id = '$user_id'";
       
        if (!mysqli_query($db, $query)) {
            throw new Exception(mysqli_error($db));
        }
       
        echo json_encode([
            'success' => true,
            'message' => 'Message marked as read'
        ]);
       
    } catch (Exception $e) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => $e->getMessage()
        ]);
    }
} else {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
}
?>
 
 