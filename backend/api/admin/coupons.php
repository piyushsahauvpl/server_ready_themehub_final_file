<?php
/**
 * Coupons Management API
 */

error_reporting(E_ALL);
ini_set('display_errors', 0);
ob_start();

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    header_remove();
    header('Access-Control-Allow-Origin: https://uptulathemehub.com');
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type');
    header('Access-Control-Allow-Credentials: true');
    http_response_code(200);
    ob_end_clean();
    exit();
}

header_remove('Access-Control-Allow-Origin');
header('Access-Control-Allow-Origin: https://uptulathemehub.com');
header('Access-Control-Allow-Credentials: true');
header('Content-Type: application/json; charset=utf-8');

require_once '../../config/database.php';

session_name('ADMINSESSID');
session_start();
ob_end_clean();

if (!isset($_SESSION['admin_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];
$adminId = $_SESSION['admin_id'];

try {
    $conn = getDBConnection();

    switch ($method) {
        case 'GET':
            $query = "SELECT 
                        c.*,
                        cat.name as category_name,
                        s.business_name as seller_name,
                        a.username as created_by_name
                      FROM coupons c
                      LEFT JOIN categories cat ON c.category_id = cat.id
                      LEFT JOIN sellers s ON c.seller_id = s.id
                      LEFT JOIN admins a ON c.created_by = a.id
                      ORDER BY c.created_at DESC";
            
            $result = $conn->query($query);
            $coupons = [];
            while ($row = $result->fetch_assoc()) {
                $coupons[] = $row;
            }
            
            closeDBConnection($conn);
            echo json_encode(['success' => true, 'coupons' => $coupons]);
            break;

        case 'POST':
            $rawInput = file_get_contents('php://input');
            $input = json_decode($rawInput, true);

            $code = strtoupper(trim($input['code'] ?? ''));
            $name = trim($input['name'] ?? '');
            $discountType = $input['discount_type'] ?? 'percentage';
            $discountValue = floatval($input['discount_value'] ?? 0);
            $minPurchase = floatval($input['min_purchase'] ?? 0);
            $maxDiscount = floatval($input['max_discount'] ?? null);
            $usageLimit = intval($input['usage_limit'] ?? null);
            $userLimit = intval($input['user_limit'] ?? 1);
            $sellerId = intval($input['seller_id'] ?? null) ?: null;
            $categoryId = intval($input['category_id'] ?? null) ?: null;
            $startDate = $input['start_date'] ?? '';
            $endDate = $input['end_date'] ?? '';

            if (empty($code) || empty($name) || $discountValue <= 0) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Invalid input']);
                exit;
            }

            $stmt = $conn->prepare("INSERT INTO coupons (code, name, discount_type, discount_value, min_purchase, max_discount, usage_limit, user_limit, seller_id, category_id, start_date, end_date, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
            $stmt->bind_param("sssdddiissii", $code, $name, $discountType, $discountValue, $minPurchase, $maxDiscount, $usageLimit, $userLimit, $sellerId, $categoryId, $startDate, $endDate, $adminId);
            $stmt->execute();
            $couponId = $conn->insert_id;
            $stmt->close();

            closeDBConnection($conn);
            echo json_encode(['success' => true, 'message' => 'Coupon created', 'coupon_id' => $couponId]);
            break;

        case 'PUT':
            $rawInput = file_get_contents('php://input');
            $input = json_decode($rawInput, true);

            $couponId = intval($input['id'] ?? 0);
            $status = trim($input['status'] ?? '');

            if ($couponId <= 0 || !in_array($status, ['active', 'inactive', 'expired'])) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Invalid input']);
                exit;
            }

            $stmt = $conn->prepare("UPDATE coupons SET status = ? WHERE id = ?");
            $stmt->bind_param("si", $status, $couponId);
            $stmt->execute();
            $stmt->close();

            closeDBConnection($conn);
            echo json_encode(['success' => true, 'message' => 'Coupon updated']);
            break;

        default:
            http_response_code(405);
            echo json_encode(['success' => false, 'message' => 'Method not allowed']);
            break;
    }

} catch (Exception $e) {
    error_log("Coupons API error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Server error']);
}
