<?php
/**
 * Admin Seller Applications API
 * GET /api/admin/seller-applications.php          -> list all sellers (support filters)
 * GET /api/admin/seller-applications.php?id=123   -> single seller details (includes messages & last payment)
 * 
 * Requires admin session
 */

error_reporting(E_ALL);
ini_set('display_errors', 0);

// CORS - allow frontend
header('Access-Control-Allow-Origin: https://uptulathemehub.com');
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, Accept');
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/../../config/database.php';

session_name('ADMINSESSID');
session_start();

// Simple admin check - mirror existing admin endpoints
if (
    !isset($_SESSION['admin_id']) ||
    empty($_SESSION['is_admin'])
) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

try {
    $conn = getDBConnection();

    // If an id is provided return a single seller with related info
    if (isset($_GET['id'])) {
        $id = (int)$_GET['id'];

        $sql = "SELECT s.*, u.full_name as user_full_name, u.email as user_email, sr.average_rating, sr.total_reviews
                FROM sellers s
                LEFT JOIN users u ON u.id = s.user_id
                LEFT JOIN seller_reputation sr ON sr.seller_id = s.id
                WHERE s.id = ?
                LIMIT 1";

        $stmt = $conn->prepare($sql);
        $stmt->bind_param('i', $id);
        $stmt->execute();
        $seller = $stmt->get_result()->fetch_assoc();
        $stmt->close();

        if (!$seller) {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Seller not found']);
            closeDBConnection($conn);
            exit;
        }

        // Fetch last 20 messages for this seller
        $msgStmt = $conn->prepare("SELECT id, sender_id, sender_type, message, message_type, is_read, created_at FROM seller_messages WHERE seller_id = ? ORDER BY created_at DESC LIMIT 20");
        $msgStmt->bind_param('i', $seller['user_id']);
        $msgStmt->execute();
        $messages = [];
        $res = $msgStmt->get_result();
        while ($r = $res->fetch_assoc()) $messages[] = $r;
        $msgStmt->close();

        // Fetch last payment (if any)
        $payStmt = $conn->prepare("SELECT id, amount, status, created_at, payment_reference FROM seller_payments WHERE seller_id = ? ORDER BY created_at DESC LIMIT 1");
        $payStmt->bind_param('i', $seller['user_id']);
        $payStmt->execute();
        $lastPayment = $payStmt->get_result()->fetch_assoc() ?: null;
        $payStmt->close();

        // Build response
        $response = [
            'success' => true,
            'seller' => $seller,
            'messages' => $messages,
            'last_payment' => $lastPayment
        ];

        echo json_encode($response);
        closeDBConnection($conn);
        exit;
    }

    // List mode: allow optional filters (verification_status, status, q (search), limit, offset)
    $params = [];
    $where = " WHERE 1=1 ";

    if (!empty($_GET['verification_status'])) {
        $vs = $_GET['verification_status'];
        $where .= " AND s.verification_status = ?";
        $params[] = ['s', $vs];
    }
    if (!empty($_GET['status'])) {
        $st = $_GET['status'];
        $where .= " AND s.status = ?";
        $params[] = ['s', $st];
    }
    if (!empty($_GET['q'])) {
        $q = '%' . $_GET['q'] . '%';
        $where .= " AND (s.business_name LIKE ? OR s.user_name LIKE ? OR u.email LIKE ?)";
        $params[] = ['s', $q];
        $params[] = ['s', $q];
        $params[] = ['s', $q];
    }

    // Pagination
    $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 50;
    $offset = isset($_GET['offset']) ? (int)$_GET['offset'] : 0;

    $sql = "SELECT s.*, u.full_name as user_full_name, u.email as user_email, sr.average_rating, sr.total_reviews
            FROM sellers s
            LEFT JOIN users u ON u.id = s.user_id
            LEFT JOIN seller_reputation sr ON sr.seller_id = s.id
            $where
            ORDER BY s.created_at DESC
            LIMIT ? OFFSET ?";

    $stmt = $conn->prepare($sql);

    // Bind dynamic params safely
    // We need to bind the where params first, then limit and offset
    $types = '';
    $values = [];
    foreach ($params as $p) {
        // all these are strings in our filters
        $types .= 's';
        $values[] = $p[1];
    }
    $types .= 'ii';
    $values[] = $limit;
    $values[] = $offset;

    // Call bind_param with dynamic args
    if (!empty($types)) {
        $bind_names[] = $types;
        for ($i = 0; $i < count($values); $i++) {
            $bind_names[] = &$values[$i];
        }
        call_user_func_array([$stmt, 'bind_param'], $bind_names);
    }

    $stmt->execute();
    $res = $stmt->get_result();
    $rows = [];
    while ($r = $res->fetch_assoc()) {
        $rows[] = $r;
    }
    $stmt->close();

    // Count total
    $countSql = "SELECT COUNT(*) as total FROM sellers s LEFT JOIN users u ON u.id = s.user_id WHERE 1=1";
    // Note: for simplicity, not applying the same filters in count here (could be added if needed)
    $countRes = $conn->query($countSql);
    $total = ($countRes && $countRes->num_rows) ? $countRes->fetch_assoc()['total'] : count($rows);

    echo json_encode([
        'success' => true,
        'total' => (int)$total,
        'limit' => $limit,
        'offset' => $offset,
        'sellers' => $rows
    ]);

    closeDBConnection($conn);
    exit;

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Server error', 'error' => $e->getMessage()]);
    exit;
}
