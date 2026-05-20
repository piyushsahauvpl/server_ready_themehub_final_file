<?php
/**
 * Admin Orders API
 * Endpoint: GET /api/admin/orders.php
 */

error_reporting(E_ALL);
ini_set('display_errors', 0);
ob_start();

// Handle CORS and OPTIONS request FIRST
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    header_remove();
    header('Access-Control-Allow-Origin: https://uptulathemehub.com');
    header('Access-Control-Allow-Methods: GET, PUT, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, X-Requested-With, Accept');
    header('Access-Control-Allow-Credentials: true');
    header('Access-Control-Max-Age: 86400');
    http_response_code(200);
    ob_end_clean();
    exit();
}

// Set CORS headers
header_remove('Access-Control-Allow-Origin');
header_remove('Access-Control-Allow-Methods');
header_remove('Access-Control-Allow-Headers');
header_remove('Access-Control-Allow-Credentials');

header('Access-Control-Allow-Origin: https://uptulathemehub.com');
header('Access-Control-Allow-Methods: GET, PUT, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-Requested-With, Accept');
header('Access-Control-Allow-Credentials: true');
header('Content-Type: application/json; charset=utf-8');

require_once '../../config/database.php';

session_name('ADMINSESSID');
// Start session
session_start();
ob_end_clean();

// Check admin authentication
if (!isset($_SESSION['admin_id'])) {
    http_response_code(401);
    echo json_encode([
        'success' => false,
        'message' => 'Unauthorized'
    ]);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];

try {
    $conn = getDBConnection();

    switch ($method) {
        case 'GET':
            // Get all orders with user and product details
            $search = $_GET['search'] ?? '';
            $statusFilter = $_GET['status'] ?? '';
            
            // Check if billing_address and payment_method columns exist
            $columns = $conn->query("SHOW COLUMNS FROM orders LIKE 'billing_address'");
            $hasBillingAddress = $columns->num_rows > 0;
            
            if ($hasBillingAddress) {
                $query = "SELECT 
                            o.id,
                            o.user_id,
                            o.product_id,
                            o.amount,
                            o.status,
                            o.billing_address,
                            o.payment_method,
                            o.created_at,
                            u.full_name as customer_name,
                            u.email as customer_email,
                            p.name as product_name,
                            p.image_url as product_image
                          FROM orders o
                          LEFT JOIN users u ON o.user_id = u.id
                          LEFT JOIN products p ON o.product_id = p.id
                          WHERE 1=1";
            } else {
                $query = "SELECT 
                            o.id,
                            o.user_id,
                            o.product_id,
                            o.amount,
                            o.status,
                            o.created_at,
                            u.full_name as customer_name,
                            u.email as customer_email,
                            p.name as product_name,
                            p.image_url as product_image
                          FROM orders o
                          LEFT JOIN users u ON o.user_id = u.id
                          LEFT JOIN products p ON o.product_id = p.id
                          WHERE 1=1";
            }
            
            $params = [];
            $types = '';
            
            if (!empty($search)) {
                $query .= " AND (u.full_name LIKE ? OR u.email LIKE ? OR p.name LIKE ?)";
                $searchTerm = "%$search%";
                $params[] = $searchTerm;
                $params[] = $searchTerm;
                $params[] = $searchTerm;
                $types .= 'sss';
            }
            
            if (!empty($statusFilter)) {
                $query .= " AND o.status = ?";
                $params[] = strtolower($statusFilter);
                $types .= 's';
            }
            
            $query .= " ORDER BY o.created_at DESC";
            
            $stmt = $conn->prepare($query);
            if (!empty($params)) {
                $stmt->bind_param($types, ...$params);
            }
            $stmt->execute();
            $result = $stmt->get_result();
            
            $orders = [];
            while ($row = $result->fetch_assoc()) {
                $orders[] = $row;
            }
            
            $stmt->close();
            closeDBConnection($conn);

            echo json_encode([
                'success' => true,
                'orders' => $orders
            ]);
            break;

        case 'PUT':
            // Update order status
            $rawInput = file_get_contents('php://input');
            $input = json_decode($rawInput, true);

            if (json_last_error() !== JSON_ERROR_NONE) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Invalid JSON input'
                ]);
                exit;
            }

            $orderId = intval($input['id'] ?? 0);
            $status = trim($input['status'] ?? '');

            if ($orderId <= 0) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Invalid order ID'
                ]);
                exit;
            }

            $validStatuses = ['pending', 'completed', 'cancelled'];
            if (!in_array(strtolower($status), $validStatuses)) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Invalid status'
                ]);
                exit;
            }

            $stmt = $conn->prepare("UPDATE orders SET status = ? WHERE id = ?");
            $stmt->bind_param("si", $status, $orderId);

            if (!$stmt->execute()) {
                throw new Exception("Update failed: " . $stmt->error);
            }

            $stmt->close();
            closeDBConnection($conn);

            echo json_encode([
                'success' => true,
                'message' => 'Order status updated successfully'
            ]);
            break;

        default:
            http_response_code(405);
            echo json_encode([
                'success' => false,
                'message' => 'Method not allowed'
            ]);
            break;
    }

} catch (Exception $e) {
    error_log("Admin Orders API error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Server error'
    ]);
}
