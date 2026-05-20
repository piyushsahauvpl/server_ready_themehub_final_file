<?php
header('Content-Type: application/json');
require_once '../config/cors.php';
require_once '../config/database.php';
require_once '../middleware/auth.php';
 
$method = $_SERVER['REQUEST_METHOD'];
 
// Check authentication - must be logged in
if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}
 
if ($method === 'GET') {
    try {
        $user_id = intval($_SESSION['user_id']);
       
        // Get messages for this seller
        $query = "SELECT * FROM seller_messages
                  WHERE seller_id = '$user_id'
                  ORDER BY created_at DESC";
       
        $result = mysqli_query($db, $query);
       
        if (!$result) {
            throw new Exception(mysqli_error($db));
        }
       
        $messages = [];
        while ($row = mysqli_fetch_assoc($result)) {
            $messages[] = $row;
        }
       
        echo json_encode([
            'success' => true,
            'messages' => $messages,
            'count' => count($messages)
        ]);
       
    } catch (Exception $e) {
        http_response_code(500);
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
 
 