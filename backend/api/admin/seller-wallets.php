<?php
require_once __DIR__ . '/../../../vendor/autoload.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../config/jwt.php';
require_once __DIR__ . '/../../middleware/auth.php';
require_once __DIR__ . '/../payout/common.php';

header('Content-Type: application/json; charset=utf-8');

// CORS
header("Access-Control-Allow-Origin: https://uptulathemehub.com");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Credentials: true");

require_jwt(['ADMIN']);

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$conn = getDBConnection();

// Get query parameters for filtering
$search = trim($_GET['search'] ?? '');
$status = trim($_GET['status'] ?? ''); // active, inactive
$page = intval($_GET['page'] ?? 1);
$limit = intval($_GET['limit'] ?? 20);
$offset = ($page - 1) * $limit;

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    // Build the query
    $whereConditions = [];
    $params = [];
    $types = '';

    if ($search) {
        $whereConditions[] = "(s.business_name LIKE ? OR u.full_name LIKE ? OR u.email LIKE ?)";
        $searchParam = "%$search%";
        $params[] = $searchParam;
        $params[] = $searchParam;
        $params[] = $searchParam;
        $types .= 'sss';
    }

    if ($status) {
        if ($status === 'active') {
            $whereConditions[] = "sw.balance > 0";
        } elseif ($status === 'inactive') {
            $whereConditions[] = "(sw.balance IS NULL OR sw.balance = 0)";
        }
    }

    $whereClause = $whereConditions ? 'WHERE ' . implode(' AND ', $whereConditions) : '';

    // Get total count
    $countQuery = "
        SELECT COUNT(*) as total
        FROM sellers s
        LEFT JOIN users u ON s.user_id = u.id
        LEFT JOIN seller_wallet sw ON s.id = sw.seller_id
        $whereClause
    ";

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

    // Get seller wallets with pagination
    $query = "
        SELECT
            s.id,
            s.business_name,
            s.status as seller_status,
            s.total_earnings,
            s.pending_earnings,
            s.created_at as seller_created_at,
            u.full_name,
            u.email,
            u.phone,
            COALESCE(sw.balance, 0) as wallet_balance,
            COALESCE(withdrawn.total_withdrawn, 0) as total_withdrawn,
            COALESCE(pending_wr.pending_amount, 0) as pending_withdrawal_amount,
            COALESCE(kyc.status, 'not_submitted') as kyc_status
        FROM sellers s
        LEFT JOIN users u ON s.user_id = u.id
        LEFT JOIN seller_wallet sw ON s.id = sw.seller_id
        LEFT JOIN seller_kyc kyc ON s.id = kyc.seller_id
        LEFT JOIN (
            SELECT seller_id, SUM(amount) as total_withdrawn
            FROM withdraw_requests
            WHERE status = 'paid'
            GROUP BY seller_id
        ) withdrawn ON s.id = withdrawn.seller_id
        LEFT JOIN (
            SELECT seller_id, SUM(amount) as pending_amount
            FROM withdraw_requests
            WHERE status = 'pending'
            GROUP BY seller_id
        ) pending_wr ON s.id = pending_wr.seller_id
        $whereClause
        ORDER BY s.created_at DESC
        LIMIT ? OFFSET ?
    ";

    $params[] = $limit;
    $params[] = $offset;
    $types .= 'ii';

    $stmt = $conn->prepare($query);
    $stmt->bind_param($types, ...$params);
    $stmt->execute();
    $result = $stmt->get_result();

    $sellers = [];
    while ($row = $result->fetch_assoc()) {
        $row['wallet_balance'] = floatval($row['wallet_balance']);
        $row['total_earnings'] = floatval($row['total_earnings']);
        $row['pending_earnings'] = floatval($row['pending_earnings']);
        $row['total_withdrawn'] = floatval($row['total_withdrawn']);
        $row['pending_withdrawal_amount'] = floatval($row['pending_withdrawal_amount']);
        $sellers[] = $row;
    }
    $stmt->close();

    echo json_encode([
        "success" => true,
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