<?php
/**
 * Ticket Management API
 * Supports roles: USER, SELLER, CUSTOMER_SUPPORT, ADMIN
 * Endpoints:
 *  POST /tickets.php                    -> create ticket
 *  GET /tickets.php?my=1                -> list my tickets
 *  GET /tickets.php?id={id}             -> ticket detail
 *  PATCH /tickets.php?id={id}&status=   -> update status
 *  POST /tickets.php?id={id}&assign=1   -> assign (CS/Admin only)
 */
error_reporting(E_ALL);
ini_set('display_errors', 0);

// Set CORS headers FIRST before anything else
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: https://uptulathemehub.com');
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: GET, POST, PATCH, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Handle preflight OPTIONS request BEFORE session/database
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Start session AFTER headers are set
if (session_status() === PHP_SESSION_NONE) {
    @session_start();
}

require_once __DIR__ . '/../middleware/auth.php';
require_once __DIR__ . '/../config/database.php';

$method = $_SERVER['REQUEST_METHOD'];

try {
    $conn = getDBConnection();
    if ($method === 'POST' && !isset($_GET['id'])) {
        create_ticket($conn);
    } elseif ($method === 'GET' && isset($_GET['id'])) {
        get_ticket($conn, (int)$_GET['id']);
    } elseif ($method === 'GET' && isset($_GET['my'])) {
        list_my_tickets($conn);
    } elseif ($method === 'PATCH' && isset($_GET['id']) && isset($_GET['status'])) {
        update_status($conn, (int)$_GET['id'], $_GET['status']);
    } elseif ($method === 'POST' && isset($_GET['id']) && isset($_GET['assign'])) {
        assign_ticket($conn, (int)$_GET['id']);
    } else {
        http_response_code(405);
        echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Server error', 'error' => $e->getMessage()]);
}

function get_payload(array $roles = [])
{
    return require_jwt($roles);
}

function create_ticket($conn)
{
    $payload = get_payload(['USER', 'SELLER', 'CUSTOMER_SUPPORT', 'ADMIN']);
    $body = json_decode(file_get_contents('php://input'), true);
    $category = $body['category'] ?? null;
    $priority = $body['priority'] ?? 'MEDIUM';
    $product_id = $body['product_id'] ?? null;
    $order_id = $body['order_id'] ?? null;
    $subject = trim($body['subject'] ?? '');
    $message = trim($body['message'] ?? '');

    if (!$category || !$message) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'category and message are required']);
        return;
    }

    // Ownership checks for USER/SELLER (only if product_id or order_id is provided)
    if (in_array($payload['role'], ['USER', 'SELLER'])) {
        // For USER: Check order ownership if order_id provided
        if ($order_id && $payload['role'] === 'USER') {
            $stmt = $conn->prepare("SELECT id FROM orders WHERE id = ? AND user_id = ?");
            $stmt->bind_param("ii", $order_id, $payload['id']);
            $stmt->execute();
            if ($stmt->get_result()->num_rows === 0) {
                http_response_code(403);
                echo json_encode(['success' => false, 'message' => 'Order not owned by user']);
                return;
            }
            $stmt->close();
        }
        
        // For USER: Check product ownership through orders if product_id provided
        if ($product_id && $payload['role'] === 'USER') {
            $stmt = $conn->prepare("SELECT o.id FROM orders o WHERE o.product_id = ? AND o.user_id = ? LIMIT 1");
            $stmt->bind_param("ii", $product_id, $payload['id']);
            $stmt->execute();
            if ($stmt->get_result()->num_rows === 0) {
                // Allow ticket creation even if product not purchased (for general inquiries)
                // Just log a warning but don't block
            }
            $stmt->close();
        }
        
        // For SELLER: Check product ownership if product_id provided
        if ($payload['role'] === 'SELLER' && $product_id) {
            $stmt = $conn->prepare("SELECT id FROM products WHERE id = ? AND seller_id = ?");
            $stmt->bind_param("ii", $product_id, $payload['id']);
            $stmt->execute();
            if ($stmt->get_result()->num_rows === 0) {
                http_response_code(403);
                echo json_encode(['success' => false, 'message' => 'Product not owned by seller']);
                return;
            }
            $stmt->close();
        }
    }

    $ticket_number = 'T-' . strtoupper(bin2hex(random_bytes(4)));
    $created_by_id = (int)$payload['id'];
    
    // Determine role: Check if user is currently a seller
    $created_by_role = $payload['role'];
    if ($payload['role'] === 'USER') {
        // Check if this user has a verified seller account
        $stmt = $conn->prepare("SELECT id FROM sellers WHERE user_id = ? AND payment_confirmed = 1");
        $stmt->bind_param("i", $payload['id']);
        $stmt->execute();
        if ($stmt->get_result()->num_rows > 0) {
            $created_by_role = 'SELLER'; // User is now a verified seller
        }
        $stmt->close();
    }
    
    $assigned_to_id = auto_assign_support_agent($conn);

    // Check if subject column exists
    $checkColumn = $conn->query("SHOW COLUMNS FROM tickets LIKE 'subject'");
    $hasSubjectColumn = $checkColumn && $checkColumn->num_rows > 0;

    if ($hasSubjectColumn) {
        $stmt = $conn->prepare("INSERT INTO tickets (ticket_number, created_by_id, created_by_role, assigned_to_id, product_id, order_id, category, priority, status, subject) VALUES (?,?,?,?,?,?,?,?, 'OPEN', ?)");
        $stmt->bind_param(
            "sisiissss",
            $ticket_number,
            $created_by_id,
            $created_by_role,
            $assigned_to_id,
            $product_id,
            $order_id,
            $category,
            $priority,
            $subject
        );
    } else {
        $stmt = $conn->prepare("INSERT INTO tickets (ticket_number, created_by_id, created_by_role, assigned_to_id, product_id, order_id, category, priority, status) VALUES (?,?,?,?,?,?,?,?, 'OPEN')");
        $stmt->bind_param(
            "sisiisss",
            $ticket_number,
            $created_by_id,
            $created_by_role,
            $assigned_to_id,
            $product_id,
            $order_id,
            $category,
            $priority
        );
    }
    if (!$stmt->execute()) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Failed to create ticket']);
        return;
    }
    $ticket_id = $conn->insert_id;

    // Insert initial message
    $msgStmt = $conn->prepare("INSERT INTO messages (ticket_id, sender_id, sender_role, message) VALUES (?,?,?,?)");
    $msgStmt->bind_param("iiss", $ticket_id, $created_by_id, $created_by_role, $message);
    $msgStmt->execute();

    echo json_encode([
        'success' => true,
        'ticket_id' => $ticket_id,
        'ticket_number' => $ticket_number,
        'assigned_to_id' => $assigned_to_id
    ]);
}

function list_my_tickets($conn)
{
    $payload = get_payload(['USER', 'SELLER', 'CUSTOMER_SUPPORT', 'ADMIN']);
    
    // Build query with joins for product and user details
    $baseQuery = "SELECT 
                    t.*,
                    u_creator.full_name as creator_name,
                    u_creator.email as creator_email,
                    u_assignee.full_name as assignee_name,
                    u_assignee.email as assignee_email,
                    p.name as product_name,
                    p.image_url as product_image
                  FROM tickets t
                  JOIN users u_creator ON t.created_by_id = u_creator.id
                  LEFT JOIN users u_assignee ON t.assigned_to_id = u_assignee.id
                  LEFT JOIN products p ON t.product_id = p.id";
    
    if (in_array($payload['role'], ['CUSTOMER_SUPPORT', 'ADMIN'])) {
        // Support/Admin: list all or filtered by assigned_to_id
        $assignedOnly = isset($_GET['assigned']) ? (int)$_GET['assigned'] : 0;
        if ($assignedOnly) {
            $query = $baseQuery . " WHERE t.assigned_to_id = ? ORDER BY t.created_at DESC";
            $stmt = $conn->prepare($query);
            $stmt->bind_param("i", $payload['id']);
        } else {
            $query = $baseQuery . " ORDER BY t.created_at DESC";
            $stmt = $conn->prepare($query);
        }
    } else {
        // User/Seller: list own created tickets
        $query = $baseQuery . " WHERE t.created_by_id = ? ORDER BY t.created_at DESC";
        $stmt = $conn->prepare($query);
        $stmt->bind_param("i", $payload['id']);
    }
    
    $stmt->execute();
    $res = $stmt->get_result();
    $rows = [];
    while ($row = $res->fetch_assoc()) {
        $rows[] = $row;
    }
    echo json_encode(['success' => true, 'tickets' => $rows]);
}

function get_ticket($conn, int $id)
{
    $payload = get_payload(['USER', 'SELLER', 'CUSTOMER_SUPPORT', 'ADMIN']);
    
    $query = "SELECT 
                t.*,
                u_creator.full_name as creator_name,
                u_creator.email as creator_email,
                u_assignee.full_name as assignee_name,
                u_assignee.email as assignee_email,
                p.name as product_name,
                p.image_url as product_image,
                o.id as order_ref_id,
                o.amount as order_amount
              FROM tickets t
              JOIN users u_creator ON t.created_by_id = u_creator.id
              LEFT JOIN users u_assignee ON t.assigned_to_id = u_assignee.id
              LEFT JOIN products p ON t.product_id = p.id
              LEFT JOIN orders o ON t.order_id = o.id
              WHERE t.id = ?";
    
    $stmt = $conn->prepare($query);
    $stmt->bind_param("i", $id);
    $stmt->execute();
    $res = $stmt->get_result();
    if ($res->num_rows === 0) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Not found']);
        return;
    }
    $ticket = $res->fetch_assoc();
    if (in_array($payload['role'], ['CUSTOMER_SUPPORT', 'ADMIN']) ||
        $ticket['created_by_id'] == $payload['id']) {
        echo json_encode(['success' => true, 'ticket' => $ticket]);
        return;
    }
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Forbidden']);
}

function update_status($conn, int $id, string $status)
{
    $payload = get_payload(['CUSTOMER_SUPPORT', 'ADMIN']);
    $allowed = ['OPEN','ASSIGNED','IN_PROGRESS','WAITING_FOR_USER','RESOLVED','CLOSED'];
    if (!in_array($status, $allowed, true)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Invalid status']);
        return;
    }
    
    // Verify ticket exists
    $checkStmt = $conn->prepare("SELECT id FROM tickets WHERE id = ?");
    $checkStmt->bind_param("i", $id);
    $checkStmt->execute();
    $checkRes = $checkStmt->get_result();
    if ($checkRes->num_rows === 0) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Ticket not found']);
        return;
    }
    $checkStmt->close();
    
    $stmt = $conn->prepare("UPDATE tickets SET status = ?, updated_at = NOW() WHERE id = ?");
    if (!$stmt) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Database error', 'error' => $conn->error]);
        return;
    }
    
    $stmt->bind_param("si", $status, $id);
    $ok = $stmt->execute();
    
    if (!$ok) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Failed to update status', 'error' => $stmt->error]);
    } else {
        echo json_encode(['success' => true, 'message' => 'Status updated successfully', 'status' => $status]);
    }
    $stmt->close();
}

function assign_ticket($conn, int $id)
{
    $payload = get_payload(['CUSTOMER_SUPPORT', 'ADMIN']);
    $assignee = $payload['id'];
    $stmt = $conn->prepare("UPDATE tickets SET assigned_to_id = ?, status = 'ASSIGNED' WHERE id = ?");
    $stmt->bind_param("ii", $assignee, $id);
    $ok = $stmt->execute();
    echo json_encode(['success' => $ok, 'assigned_to_id' => $assignee]);
}
