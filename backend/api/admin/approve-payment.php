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
       
        if (!isset($data['payment_id'])) {
            throw new Exception('payment_id is required');
        }
       
        $payment_id = intval($data['payment_id']);
        $admin_id = intval($_SESSION['user_id']);
        $timestamp = date('Y-m-d H:i:s');
       
        // Verify payment exists
        $verify_query = "SELECT seller_id FROM seller_payments WHERE id = '$payment_id'";
        $result = mysqli_query($db, $verify_query);
        $payment = mysqli_fetch_assoc($result);
       
        if (!$payment) {
            throw new Exception('Payment not found');
        }
       
        // Update payment status to approved
        $query = "UPDATE seller_payments
                  SET status = 'approved',
                      approved_at = '$timestamp',
                      approved_by = '$admin_id'
                  WHERE id = '$payment_id'";
       
        if (!mysqli_query($db, $query)) {
            throw new Exception(mysqli_error($db));
        }
       
        // Update seller verification status to active
        $seller_id = $payment['seller_id'];
        $update_seller = "UPDATE sellers
                         SET verification_status = 'active',
                             payment_confirmed = 1,
                             payment_confirmed_date = '$timestamp'
                         WHERE user_id = '$seller_id'";
        mysqli_query($db, $update_seller);
       
        // Update user role
        $update_user = "UPDATE users SET role = 'seller' WHERE id = '$seller_id'";
        mysqli_query($db, $update_user);
       
        // Log the action
        $log_query = "INSERT INTO admin_logs (admin_id, action, target_type, target_id, created_at)
                      VALUES ('$admin_id', 'payment_approved', 'seller_payment', '$payment_id', '$timestamp')";
        mysqli_query($db, $log_query);
       
        echo json_encode([
            'success' => true,
            'message' => 'Payment approved successfully'
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
 
 