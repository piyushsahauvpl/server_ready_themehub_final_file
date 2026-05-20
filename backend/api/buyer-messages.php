<?php
/**
 * Buyer-Seller Messages API
 * POST /api/buyer-messages.php
 *   fields: order_id, message
 * GET /api/buyer-messages.php?order_id=#
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
        send_message($conn);
    } elseif ($method === 'GET' && isset($_GET['order_id'])) {
        get_messages($conn, (int)$_GET['order_id']);
    } else {
        http_response_code(405);
        echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Server error', 'error' => $e->getMessage()]);
}

function send_message($conn) {
    // Check if user is logged in
    if (!isset($_SESSION['user_id'])) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Unauthorized']);
        return;
    }

    $user_id = (int)$_SESSION['user_id'];
    $order_id = isset($_POST['order_id']) ? (int)$_POST['order_id'] : null;
    $message = isset($_POST['message']) ? trim($_POST['message']) : '';

    if (!$order_id || empty($message)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Order ID and message are required']);
        return;
    }

    // Check if order exists and belongs to user
    $stmt = $conn->prepare("
        SELECT o.id, p.seller_id
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
    $seller_id = $order['seller_id'];
    $stmt->close();

    // Insert message
    $stmt = $conn->prepare("
        INSERT INTO buyer_seller_messages (order_id, sender_id, receiver_id, message, sender_type, created_at)
        VALUES (?, ?, ?, ?, 'buyer', NOW())
    ");
    $stmt->bind_param("iiis", $order_id, $user_id, $seller_id, $message);

    if ($stmt->execute()) {
        $message_id = $conn->insert_id;
        $stmt->close();

        echo json_encode([
            'success' => true,
            'message' => 'Message sent successfully',
            'message_id' => $message_id
        ]);
    } else {
        $stmt->close();
        throw new Exception('Failed to send message');
    }
}

function get_messages($conn, $order_id) {
    // Check if user is logged in
    if (!isset($_SESSION['user_id'])) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Unauthorized']);
        return;
    }

    $user_id = (int)$_SESSION['user_id'];

    // Check if order belongs to user
    $stmt = $conn->prepare("
        SELECT o.id, p.seller_id
        FROM orders o
        LEFT JOIN products p ON o.product_id = p.id
        WHERE o.id = ? AND (o.user_id = ? OR p.seller_id = ?)
    ");
    $stmt->bind_param("iii", $order_id, $user_id, $user_id);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows === 0) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Order not found']);
        return;
    }

    $order = $result->fetch_assoc();
    $stmt->close();

    // Get messages for this order
    $stmt = $conn->prepare("
        SELECT
            m.id,
            m.message,
            m.sender_type,
            m.created_at,
            CASE
                WHEN m.sender_type = 'buyer' THEN u.full_name
                WHEN m.sender_type = 'seller' THEN s.business_name
                ELSE 'Unknown'
            END as sender_name
        FROM buyer_seller_messages m
        LEFT JOIN users u ON m.sender_id = u.id AND m.sender_type = 'buyer'
        LEFT JOIN sellers s ON m.sender_id = s.user_id AND m.sender_type = 'seller'
        WHERE m.order_id = ?
        ORDER BY m.created_at ASC
    ");
    $stmt->bind_param("i", $order_id);
    $stmt->execute();
    $result = $stmt->get_result();

    $messages = [];
    while ($row = $result->fetch_assoc()) {
        $messages[] = $row;
    }

    $stmt->close();

    echo json_encode([
        'success' => true,
        'messages' => $messages
    ]);
}
?>