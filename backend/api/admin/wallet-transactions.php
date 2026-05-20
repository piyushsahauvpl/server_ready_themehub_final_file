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
ensurePayoutTables($conn);

// Get query parameters
$sellerId = intval($_GET['seller_id'] ?? 0);
$type = trim($_GET['type'] ?? ''); // credit, debit
$dateFrom = trim($_GET['date_from'] ?? '');
$dateTo = trim($_GET['date_to'] ?? '');
$page = intval($_GET['page'] ?? 1);
$limit = intval($_GET['limit'] ?? 50);
$offset = ($page - 1) * $limit;

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    // Build where conditions
    $whereConditions = [];
    $params = [];
    $types = '';

    if ($sellerId > 0) {
        $whereConditions[] = "wt.seller_id = ?";
        $params[] = $sellerId;
        $types .= 'i';
    }

    if ($type && in_array($type, ['credit', 'debit'])) {
        $whereConditions[] = "wt.type = ?";
        $params[] = $type;
        $types .= 's';
    }

    if ($dateFrom) {
        $whereConditions[] = "DATE(wt.created_at) >= ?";
        $params[] = $dateFrom;
        $types .= 's';
    }

    if ($dateTo) {
        $whereConditions[] = "DATE(wt.created_at) <= ?";
        $params[] = $dateTo;
        $types .= 's';
    }

    $whereClause = $whereConditions ? 'WHERE ' . implode(' AND ', $whereConditions) : '';

    // Get total count
    $countQuery = "SELECT COUNT(*) as total FROM wallet_transactions wt $whereClause";
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

    // Get transactions with seller info
    $query = "
        SELECT
            wt.id,
            wt.seller_id,
            wt.type,
            wt.amount,
            wt.balance_after,
            wt.reference_type,
            wt.reference_id,
            wt.note,
            wt.created_at,
            s.business_name,
            u.full_name as seller_name,
            u.email as seller_email
        FROM wallet_transactions wt
        JOIN sellers s ON wt.seller_id = s.id
        LEFT JOIN users u ON s.user_id = u.id
        $whereClause
        ORDER BY wt.created_at DESC
        LIMIT ? OFFSET ?
    ";

    $params[] = $limit;
    $params[] = $offset;
    $types .= 'ii';

    $stmt = $conn->prepare($query);
    $stmt->bind_param($types, ...$params);
    $stmt->execute();
    $result = $stmt->get_result();

    $transactions = [];
    while ($row = $result->fetch_assoc()) {
        $row['amount'] = floatval($row['amount']);
        $row['balance_after'] = floatval($row['balance_after']);
        $transactions[] = $row;
    }
    $stmt->close();

    // Get unique sellers for filter dropdown
    $sellersQuery = "
        SELECT DISTINCT s.id, s.business_name, u.full_name, u.email
        FROM sellers s
        LEFT JOIN users u ON s.user_id = u.id
        JOIN wallet_transactions wt ON s.id = wt.seller_id
        ORDER BY s.business_name
    ";
    $result = $conn->query($sellersQuery);
    $sellers = $result->fetch_all(MYSQLI_ASSOC);

    echo json_encode([
        "success" => true,
        "transactions" => $transactions,
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