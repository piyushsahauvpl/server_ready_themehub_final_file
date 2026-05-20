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
       
        if (!isset($data['payment_id']) || !isset($data['reason'])) {
            throw new Exception('payment_id and reason are required');
        }
       
        $payment_id = intval($data['payment_id']);
        $reason = mysqli_real_escape_string($db, $data['reason']);
        $admin_id = intval($_SESSION['user_id']);
        $timestamp = date('Y-m-d H:i:s');
       
        // Update payment status to rejected
        $query = "UPDATE seller_payments
                  SET status = 'rejected',
                      notes = '$reason',
                      approved_by = '$admin_id',
                      approved_at = '$timestamp'
                  WHERE id = '$payment_id'";
       
        if (!mysqli_query($db, $query)) {
            throw new Exception(mysqli_error($db));
        }
       
        // Log the action
        $log_query = "INSERT INTO admin_logs (admin_id, action, target_type, target_id, created_at)
                      VALUES ('$admin_id', 'payment_rejected', 'seller_payment', '$payment_id', '$timestamp')";
        mysqli_query($db, $log_query);
       
        echo json_encode([
            'success' => true,
            'message' => 'Payment rejected successfully'
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
 
 