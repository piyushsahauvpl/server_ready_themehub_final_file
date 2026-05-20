<?php
/**
 * Admin Sellers API
 * Handles seller management, approval, and analytics
 */

error_reporting(E_ALL);
ini_set('display_errors', 0);

// -------------------- CORS (ALWAYS FIRST) --------------------
header('Access-Control-Allow-Origin: https://uptulathemehub.com');
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-Requested-With, Accept, Authorization');
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// -------------------- INCLUDES --------------------
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../config/jwt.php';
require_once __DIR__ . '/../../middleware/auth.php';

$payload = require_jwt(['ADMIN']);

$method = $_SERVER['REQUEST_METHOD'];

try {
    $conn = getDBConnection();

    switch ($method) {

        /* =====================================================
           GET: LIST SELLERS
           ===================================================== */
        case 'GET':
            $search = $_GET['search'] ?? '';
            $statusFilter = $_GET['status'] ?? '';

            $query = "
                SELECT 
    s.id,
    s.user_id,
    s.business_name,
    s.bio,
    s.profile_image,
    s.commission_rate,
    s.total_earnings,
    s.pending_earnings,
    s.badge,
    s.status,
    s.created_at,
    s.mobile AS phone,

    u.full_name,
    u.email,

    COALESCE(rep.average_rating, 0) AS average_rating,
    COALESCE(rep.total_reviews, 0) AS total_reviews,

    (SELECT COUNT(*) 
        FROM products 
        WHERE seller_id = s.id
    ) AS total_products,

    (SELECT COUNT(*) 
        FROM products 
        WHERE seller_id = s.id 
        AND status = 'approved'
    ) AS approved_products,

    /* 🔑 DERIVED FLAGS FOR UI */
    s.verified_by_admin,
    s.payment_confirmed,

    CASE
        WHEN s.verified_by_admin = 0 THEN 'pending_approval'
        WHEN s.verified_by_admin = 1 AND s.payment_confirmed = 0 THEN 'approved_unpaid'
        WHEN s.verified_by_admin = 1 AND s.payment_confirmed = 1 THEN 'active'
        ELSE 'unknown'
    END AS seller_stage

FROM sellers s
LEFT JOIN users u ON s.user_id = u.id
LEFT JOIN seller_reputation rep ON s.id = rep.seller_id

WHERE 1 = 1

            ";

            $params = [];
            $types = '';

            if (!empty($search)) {
                $query .= " AND (u.full_name LIKE ? OR u.email LIKE ? OR s.business_name LIKE ?)";
                $searchTerm = "%$search%";
                $params[] = $searchTerm;
                $params[] = $searchTerm;
                $params[] = $searchTerm;
                $types .= 'sss';
            }

            if (!empty($statusFilter)) {
                $query .= " AND s.status = ?";
                $params[] = $statusFilter;
                $types .= 's';
            }

            $query .= " ORDER BY s.created_at DESC";

            $stmt = $conn->prepare($query);
            if (!empty($params)) {
                $stmt->bind_param($types, ...$params);
            }

            $stmt->execute();
            $result = $stmt->get_result();

            $sellers = [];
            while ($row = $result->fetch_assoc()) {
                $sellers[] = $row;
            }

            $stmt->close();
            closeDBConnection($conn);

            echo json_encode([
                'success' => true,
                'sellers' => $sellers
            ]);
            break;

        /* =====================================================
           POST: CREATE SELLER
           ===================================================== */
        case 'POST':
            $input = json_decode(file_get_contents('php://input'), true);

            if (json_last_error() !== JSON_ERROR_NONE) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Invalid JSON']);
                exit;
            }

            $userId = intval($input['user_id'] ?? 0);
            $businessName = trim($input['business_name'] ?? '');
            $bio = trim($input['bio'] ?? '');
            $commissionRate = floatval($input['commission_rate'] ?? 70.00);

            if ($userId <= 0) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Invalid user ID']);
                exit;
            }

            $checkStmt = $conn->prepare("SELECT id FROM sellers WHERE user_id = ?");
            $checkStmt->bind_param("i", $userId);
            $checkStmt->execute();

            if ($checkStmt->get_result()->num_rows > 0) {
                $checkStmt->close();
                closeDBConnection($conn);
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Seller already exists']);
                exit;
            }
            $checkStmt->close();

            $stmt = $conn->prepare(
                "INSERT INTO sellers (user_id, business_name, bio, commission_rate)
                 VALUES (?, ?, ?, ?)"
            );
            $stmt->bind_param("issd", $userId, $businessName, $bio, $commissionRate);

            if (!$stmt->execute()) {
                throw new Exception($stmt->error);
            }

            $sellerId = $conn->insert_id;
            $stmt->close();

            $repStmt = $conn->prepare("INSERT INTO seller_reputation (seller_id) VALUES (?)");
            $repStmt->bind_param("i", $sellerId);
            $repStmt->execute();
            $repStmt->close();

            closeDBConnection($conn);

            echo json_encode([
                'success' => true,
                'seller_id' => $sellerId
            ]);
            break;

        /* =====================================================
           PUT: UPDATE SELLER
           ===================================================== */
        case 'PUT':
            $input = json_decode(file_get_contents('php://input'), true);

            if (json_last_error() !== JSON_ERROR_NONE) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Invalid JSON']);
                exit;
            }

            $sellerId = intval($input['id'] ?? 0);
            if ($sellerId <= 0) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Invalid seller ID']);
                exit;
            }

            $updates = [];
            $params = [];
            $types = '';

            if (isset($input['status'])) {
                $updates[] = "status = ?";
                $params[] = $input['status'];
                $types .= 's';
            }

            if (isset($input['commission_rate'])) {
                $updates[] = "commission_rate = ?";
                $params[] = floatval($input['commission_rate']);
                $types .= 'd';
            }

            if (isset($input['badge'])) {
                $updates[] = "badge = ?";
                $params[] = $input['badge'];
                $types .= 's';
            }

            if (isset($input['business_name'])) {
                $updates[] = "business_name = ?";
                $params[] = trim($input['business_name']);
                $types .= 's';
            }

            if (isset($input['bio'])) {
                $updates[] = "bio = ?";
                $params[] = trim($input['bio']);
                $types .= 's';
            }

            if (isset($input['payment_confirmed'])) {
                $updates[] = "payment_confirmed = ?";
                $params[] = intval($input['payment_confirmed']);
                $types .= 'i';
            }

            if (empty($updates)) {
                closeDBConnection($conn);
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'No fields to update']);
                exit;
            }

            $params[] = $sellerId;
            $types .= 'i';

            $stmt = $conn->prepare(
                "UPDATE sellers SET " . implode(', ', $updates) . " WHERE id = ?"
            );
            $stmt->bind_param($types, ...$params);

            if (!$stmt->execute()) {
                throw new Exception($stmt->error);
            }

            $stmt->close();
            closeDBConnection($conn);

            echo json_encode(['success' => true]);
            break;

        /* =====================================================
           DELETE: REMOVE SELLER
           ===================================================== */
        case 'DELETE':
            $input = json_decode(file_get_contents('php://input'), true);

            if (json_last_error() !== JSON_ERROR_NONE) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Invalid JSON']);
                exit;
            }

            $sellerId = intval($input['id'] ?? 0);
            if ($sellerId <= 0) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Invalid seller ID']);
                exit;
            }

            $stmt = $conn->prepare("DELETE FROM sellers WHERE id = ?");
            $stmt->bind_param("i", $sellerId);
            $stmt->execute();
            $stmt->close();

            closeDBConnection($conn);

            echo json_encode(['success' => true]);
            break;

        default:
            http_response_code(405);
            echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    }

} catch (Throwable $e) {
    error_log("Sellers API error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Server error'
    ]);
}
