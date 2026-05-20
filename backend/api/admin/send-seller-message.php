<?php
header('Content-Type: application/json');
require_once '../config/cors.php';
require_once '../config/database.php';
require_once '../middleware/auth.php';
 
$method = $_SERVER['REQUEST_METHOD'];
 
// Check authentication
checkAuth(['admin']);
 
if ($method === 'POST') {
    try {
        $data = json_decode(file_get_contents('php://input'), true);
       
        if (!isset($data['seller_id']) || !isset($data['message']) || !isset($data['message_type'])) {
            throw new Exception('Missing required fields');
        }
       
        $seller_id = intval($data['seller_id']);
        $message = mysqli_real_escape_string($db, $data['message']);
        $message_type = mysqli_real_escape_string($db, $data['message_type']);
       
        // Get current admin user ID
        $admin_id = $_SESSION['user_id'];
        $timestamp = date('Y-m-d H:i:s');
       
        // Insert message into database
        $query = "INSERT INTO seller_messages (sender_id, seller_id, message, message_type, created_at, is_read, sender_type)
                  VALUES ('$admin_id', '$seller_id', '$message', '$message_type', '$timestamp', 0, 'admin')";
       
        if (!mysqli_query($db, $query)) {
            throw new Exception(mysqli_error($db));
        }
       
        // If message type is payment_approval, send notification to seller
        if ($message_type === 'payment_approval') {
            // Update seller's notification or send email
            $notif_query = "UPDATE sellers SET has_payment_message = 1, last_message_time = '$timestamp' WHERE user_id = '$seller_id'";
            mysqli_query($db, $notif_query);
           
            // Optional: Send email notification to seller
            $seller_email_query = "SELECT email FROM users WHERE id = '$seller_id'";
            $result = mysqli_query($db, $seller_email_query);
            $seller = mysqli_fetch_assoc($result);
           
            if ($seller && $seller['email']) {
                // You can send email here if needed
                // mail($seller['email'], 'Payment Approval Message', $message);
            }
        }
       
        echo json_encode([
            'success' => true,
            'message' => 'Message sent successfully',
            'message_id' => mysqli_insert_id($db)
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
 
 