<?php
require_once __DIR__ . '/../../../vendor/autoload.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../config/jwt.php';
require_once __DIR__ . '/../../middleware/auth.php';
require_once __DIR__ . '/../payout/common.php';

header('Content-Type: application/json');

// CORS
header("Access-Control-Allow-Origin: https://uptulathemehub.com");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Credentials: true");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$payload = require_jwt(['ADMIN']);
$conn = getDBConnection();
ensurePayoutTables($conn);

// Get query parameters
$sellerId = intval($_GET['seller_id'] ?? 0);
$status = trim($_GET['status'] ?? '');
$page = intval($_GET['page'] ?? 1);
$limit = intval($_GET['limit'] ?? 20);
$offset = ($page - 1) * $limit;

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    // Build where conditions
    $whereConditions = [];
    $params = [];
    $types = '';

    if ($sellerId > 0) {
        $whereConditions[] = "sp.seller_id = ?";
        $params[] = $sellerId;
        $types .= 'i';
    }

    if ($status && in_array($status, ['pending', 'approved', 'transferred', 'paid', 'failed'])) {
        $whereConditions[] = "sp.status = ?";
        $params[] = $status;
        $types .= 's';
    }

    $whereClause = $whereConditions ? 'WHERE ' . implode(' AND ', $whereConditions) : '';

    // Get total count
    $countQuery = "SELECT COUNT(*) as total FROM seller_payouts sp $whereClause";
    if ($params) {
        $stmt = $conn->prepare($countQuery);
        $stmt->bind_param($types, ...$params);
        $stmt->execute();
        $totalCount = $stmt->get_result()->fetch_assoc()['total'];
        $stmt->close();
    } else {
        $result = $conn->query($countQuery);
        $totalCount = $result->fetch_assoc()['total'];
    }

    // Get payout history
    $query = "
        SELECT
            sp.id,
            sp.seller_id,
            sp.withdraw_request_id,
            sp.razorpay_payout_id,
            sp.status,
            sp.amount,
            sp.failure_reason,
            sp.created_at,
            sp.updated_at,
            s.business_name,
            u.full_name as seller_name,
            u.email as seller_email,
            wr.amount as withdraw_amount,
            wr.created_at as requested_at,
            wr.processed_at
        FROM seller_payouts sp
        JOIN sellers s ON sp.seller_id = s.id
        LEFT JOIN users u ON s.user_id = u.id
        LEFT JOIN withdraw_requests wr ON sp.withdraw_request_id = wr.id
        $whereClause
        ORDER BY sp.created_at DESC
        LIMIT $limit OFFSET $offset
    ";

    $stmt = $conn->prepare($query);
    $stmt->execute();
    $result = $stmt->get_result();

    $payouts = [];
    while ($row = $result->fetch_assoc()) {
        $row['amount'] = floatval($row['amount']);
        $row['withdraw_amount'] = floatval($row['withdraw_amount'] ?? 0);
        $payouts[] = $row;
    }
    $stmt->close();

    // Get unique sellers for filter dropdown
    $sellersQuery = "
        SELECT DISTINCT s.id, s.business_name, u.full_name, u.email
        FROM sellers s
        LEFT JOIN users u ON s.user_id = u.id
        JOIN seller_payouts sp ON s.id = sp.seller_id
        ORDER BY s.business_name
    ";
    $result = $conn->query($sellersQuery);
    $sellers = $result->fetch_all(MYSQLI_ASSOC);

    echo json_encode([
        "success" => true,
        "payouts" => $payouts,
        "sellers" => $sellers,
        "pagination" => [
            "page" => $page,
            "limit" => $limit,
            "total" => intval($totalCount),
            "total_pages" => ceil($totalCount / $limit)
        ]
    ]);
    exit;
}

echo json_encode(["success" => false, "message" => "Method not allowed"]);
?>