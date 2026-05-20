<?php
/**
 * Product Approval API (ADMIN)
 * GET  : fetch products by status
 * PUT  : approve / reject / needs_changes
 */

error_reporting(E_ALL);
ini_set('display_errors', 0);

/* ================= CORS ================= */
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    header_remove();
    header('Access-Control-Allow-Origin: https://uptulathemehub.com');
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, Accept');
    header('Access-Control-Allow-Credentials: true');
    header('Access-Control-Max-Age: 86400');
    http_response_code(200);
    exit();
}

header('Access-Control-Allow-Origin: https://uptulathemehub.com');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, Accept');
header('Access-Control-Allow-Credentials: true');
header('Content-Type: application/json; charset=utf-8');

/* ================= DEPENDENCIES ================= */
require_once '../../config/database.php';
require_once '../../middleware/auth.php';

try {
    $payload = require_jwt(['ADMIN']);
    $adminId = $payload['id'];
} catch (Exception $e) {
    http_response_code(401);
    echo json_encode([
        'success' => false,
        'message' => 'Admin authentication failed: ' . $e->getMessage()
    ]);
    exit;
}

/* ================= DB ================= */
$conn = getDBConnection();
$method = $_SERVER['REQUEST_METHOD'];

try {

    /* ================= FETCH PRODUCTS ================= */
    if ($method === 'GET') {

        $status = $_GET['status'] ?? 'pending_review';

        $stmt = $conn->prepare("
            SELECT 
                p.*,
                c.name AS category_name,
                f.name AS framework_name,
                s.business_name AS seller_name,
                u.full_name AS seller_full_name
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            LEFT JOIN frameworks f ON p.framework_id = f.id
            LEFT JOIN sellers s ON p.seller_id = s.id
            LEFT JOIN users u ON s.user_id = u.id
            WHERE p.status = ?
            ORDER BY p.created_at DESC
        ");

        $stmt->bind_param("s", $status);
        $stmt->execute();
        $res = $stmt->get_result();

        $products = [];
        while ($row = $res->fetch_assoc()) {
            $products[] = $row;
        }

        $stmt->close();
        closeDBConnection($conn);

        echo json_encode([
            'success' => true,
            'products' => $products
        ]);
        exit;
    }

    /* ================= UPDATE PRODUCT STATUS ================= */
    if ($method === 'PUT') {

        $input = json_decode(file_get_contents('php://input'), true);

        $productId = intval($input['product_id'] ?? 0);
        $action    = $input['action'] ?? '';
        $feedback  = trim($input['feedback'] ?? '');

        if (!$productId || !in_array($action, ['approve', 'reject', 'needs_changes'])) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => 'Invalid request'
            ]);
            exit;
        }

        $statusMap = [
            'approve'        => 'approved',
            'reject'         => 'rejected',
            'needs_changes'  => 'needs_changes'
        ];

        $status = $statusMap[$action];

        $stmt = $conn->prepare("
            UPDATE products
            SET status = ?,
                admin_feedback = ?,
                reviewed_by = ?,
                reviewed_at = NOW()
            WHERE id = ?
        ");

        $stmt->bind_param("ssii", $status, $feedback, $adminId, $productId);
        $stmt->execute();
        $stmt->close();

        closeDBConnection($conn);

        echo json_encode([
            'success' => true,
            'message' => 'Product updated successfully'
        ]);
        exit;
    }

    /* ================= METHOD NOT ALLOWED ================= */
    http_response_code(405);
    echo json_encode([
        'success' => false,
        'message' => 'Method not allowed'
    ]);
    exit;

} catch (Throwable $e) {

    error_log('Admin Product Approval Error: ' . $e->getMessage());

    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Server error'
    ]);
}
