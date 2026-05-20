<?php
/**
 * Refund API
 * POST /api/refund.php
 *   fields: order_id, reason
 * GET /api/refund.php?order_id=#
 */

error_reporting(E_ALL);
ini_set('display_errors', 0);

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: https://uptulathemehub.com');
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/../middleware/auth.php';
require_once __DIR__ . '/../config/database.php';

$method = $_SERVER['REQUEST_METHOD'];

try {
    $conn = getDBConnection();

    if ($method === 'POST') {
        handle_refund_request($conn);
    } elseif ($method === 'GET' && isset($_GET['order_id'])) {
        get_refund_status($conn, (int)$_GET['order_id']);
    } else {
        http_response_code(405);
        echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Server error', 'error' => $e->getMessage()]);
}

function handle_refund_request($conn) {
    // Check if user is logged in
    if (!isset($_SESSION['user_id'])) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Unauthorized']);
        return;
    }

    $user_id = (int)$_SESSION['user_id'];
    $order_id = isset($_POST['order_id']) ? (int)$_POST['order_id'] : null;
    $reason = isset($_POST['reason']) ? trim($_POST['reason']) : '';

    if (!$order_id || empty($reason)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Order ID and reason are required']);
        return;
    }

    // Check if order exists and belongs to user
    $stmt = $conn->prepare("
        SELECT o.id, o.status, o.created_at, o.amount, p.seller_id
        FROM orders o
        LEFT JOIN products p ON o.product_id = p.id
        WHERE o.id = ? AND o.user_id = ?
    ");
    $stmt->bind_param("ii", $order_id, $user_id);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows === 0) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Order not found']);
        return;
    }

    $order = $result->fetch_assoc();
    $stmt->close();

    // Check if order is eligible for refund (within 30 days and completed)
    $order_date = new DateTime($order['created_at']);
    $now = new DateTime();
    $days_diff = $now->diff($order_date)->days;

    if ($days_diff > 30) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Refund requests must be made within 30 days of purchase']);
        return;
    }

    if ($order['status'] !== 'completed') {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Only completed orders can be refunded']);
        return;
    }

    // Check if refund already exists
    $stmt = $conn->prepare("SELECT id, status FROM refunds WHERE order_id = ?");
    $stmt->bind_param("i", $order_id);
    $stmt->execute();
    $refund_result = $stmt->get_result();

    if ($refund_result->num_rows > 0) {
        $refund = $refund_result->fetch_assoc();
        if ($refund['status'] === 'refunded') {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Order has already been refunded']);
            return;
        } elseif ($refund['status'] === 'requested') {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Refund already requested for this order']);
            return;
        }
    }
    $stmt->close();

    // Create refund request
    $stmt = $conn->prepare("
        INSERT INTO refunds (order_id, user_id, seller_id, amount, reason, status, created_at)
        VALUES (?, ?, ?, ?, ?, 'requested', NOW())
    ");
    $stmt->bind_param("iiids", $order_id, $user_id, $order['seller_id'], $order['amount'], $reason);

    if ($stmt->execute()) {
        $refund_id = $conn->insert_id;
        $stmt->close();

        echo json_encode([
            'success' => true,
            'message' => 'Refund request submitted successfully',
            'refund_id' => $refund_id
        ]);
    } else {
        $stmt->close();
        throw new Exception('Failed to create refund request');
    }
}

function get_refund_status($conn, $order_id) {
    // Check if user is logged in
    if (!isset($_SESSION['user_id'])) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Unauthorized']);
        return;
    }

    $user_id = (int)$_SESSION['user_id'];

    // Check if order belongs to user
    $stmt = $conn->prepare("SELECT id FROM orders WHERE id = ? AND user_id = ?");
    $stmt->bind_param("ii", $order_id, $user_id);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows === 0) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Order not found']);
        return;
    }
    $stmt->close();

    // Get refund status
    $stmt = $conn->prepare("
        SELECT id, status, reason, admin_notes, created_at, updated_at
        FROM refunds
        WHERE order_id = ?
        ORDER BY created_at DESC
        LIMIT 1
    ");
    $stmt->bind_param("i", $order_id);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows === 0) {
        echo json_encode([
            'success' => true,
            'refund_status' => 'not_requested'
        ]);
        return;
    }

    $refund = $result->fetch_assoc();
    $stmt->close();

    echo json_encode([
        'success' => true,
        'refund' => $refund,
        'refund_status' => $refund['status']
    ]);
}
?>