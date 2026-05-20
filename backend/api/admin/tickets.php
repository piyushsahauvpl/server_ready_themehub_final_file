<?php
error_reporting(E_ALL);
ini_set('display_errors', 0);

// CORS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    header('Access-Control-Allow-Origin: https://uptulathemehub.com');
    header('Access-Control-Allow-Methods: GET, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, X-Requested-With, Accept, Authorization');
    header('Access-Control-Allow-Credentials: true');
    http_response_code(200);
    exit;
}

header('Access-Control-Allow-Origin: https://uptulathemehub.com');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-Requested-With, Accept, Authorization');
header('Access-Control-Allow-Credentials: true');
header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/../../config/database.php';

// Session config
ini_set('session.cookie_httponly', 1);
ini_set('session.cookie_secure', 1);
ini_set('session.use_only_cookies', 1);
ini_set('session.cookie_samesite', 'Lax');
ini_set('session.cookie_path', '/');

session_name('ADMINSESSID');
session_start();

// Admin auth check
if (empty($_SESSION['admin_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

try {
    $conn = getDBConnection();

    $limit = max((int)($_GET['limit'] ?? 5), 1);

    $sql = "SELECT 
                t.id,
                t.ticket_number,
                t.category,
                t.priority,
                t.status,
                t.created_at,
                u.full_name AS creator_name,
                u.email AS creator_email,
                p.name AS product_name
            FROM tickets t
            LEFT JOIN users u ON t.created_by_id = u.id
            LEFT JOIN products p ON t.product_id = p.id
            ORDER BY t.created_at DESC
            LIMIT ?";

    $stmt = $conn->prepare($sql);
    $stmt->bind_param('i', $limit);
    $stmt->execute();
    $res = $stmt->get_result();

    $tickets = [];
    while ($row = $res->fetch_assoc()) {
        $tickets[] = $row;
    }

    $stmt->close();
    closeDBConnection($conn);

    echo json_encode(['success' => true, 'tickets' => $tickets]);
    exit;

} catch (Exception $e) {
    error_log('admin/tickets error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Server error']);
    exit;
}
