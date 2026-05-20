<?php
error_reporting(E_ALL);
ini_set('display_errors', 0);

// =============== CORS FIRST ===============
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    header('Access-Control-Allow-Origin: https://uptulathemehub.com');
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, Accept');
    header('Access-Control-Allow-Credentials: true');
    header('Access-Control-Max-Age: 86400');
    http_response_code(200);
    exit();
}

header('Access-Control-Allow-Origin: https://uptulathemehub.com');
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, Accept');
header('Content-Type: application/json');

// =============== REQUIRES ===============
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../middleware/auth.php';
 
$method = $_SERVER['REQUEST_METHOD'];
 
// Check authentication
try {
    checkAuth(['ADMIN']);
} catch (Exception $e) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Unauthorized', 'error' => $e->getMessage()]);
    exit;
}
 
if ($method === 'GET') {
    try {
        $status = isset($_GET['status']) ? mysqli_real_escape_string($db, $_GET['status']) : '';
       
        // Build query
        $query = "SELECT
                    p.id,
                    p.seller_id,
                    u.full_name as seller_name,
                    u.email as seller_email,
                    p.transaction_id,
                    p.amount,
                    p.currency,
                    p.payment_method,
                    p.status,
                    p.notes,
                    p.created_at,
                    p.approved_at,
                    p.approved_by
                FROM seller_payments p
                JOIN users u ON p.seller_id = u.id
                WHERE p.seller_id IN (SELECT user_id FROM sellers)";
       
        if ($status) {
            $query .= " AND p.status = '$status'";
        }
       
        $query .= " ORDER BY p.created_at DESC";
       
        $result = mysqli_query($db, $query);
       
        if (!$result) {
            throw new Exception(mysqli_error($db));
        }
       
        $payments = [];
        while ($row = mysqli_fetch_assoc($result)) {
            $payments[] = $row;
        }
       
        echo json_encode([
            'success' => true,
            'payments' => $payments,
            'count' => count($payments)
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
 
 