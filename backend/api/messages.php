<?php
/**
 * Ticket Messages API
 * GET /messages.php?ticket_id=#
 * POST /messages.php (multipart/form-data)
 *   fields: ticket_id, message, (optional file 'attachment')
 */
error_reporting(E_ALL);
ini_set('display_errors', 0);

// Start session FIRST before any headers
if (session_status() === PHP_SESSION_NONE) {
    @session_start();
}

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: https://uptulathemehub.com');
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS');
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
    if ($method === 'GET' && isset($_GET['ticket_id'])) {
        get_messages($conn, (int)$_GET['ticket_id']);
    } elseif ($method === 'POST') {
        post_message($conn);
    } elseif ($method === 'DELETE' && isset($_GET['ticket_id'])) {
        clear_messages($conn, (int)$_GET['ticket_id']);
    } else {
        http_response_code(405);
        echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Server error', 'error' => $e->getMessage()]);
}

function get_messages($conn, int $ticket_id)
{
    $payload = require_jwt(['USER','SELLER','CUSTOMER_SUPPORT','ADMIN']);
    if (!can_access_ticket($conn, $payload, $ticket_id)) {
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => 'Forbidden']);
        return;
    }
    // Get messages with sender info - get full_name directly, don't use COALESCE
    $stmt = $conn->prepare("
        SELECT 
            m.*,
            u.full_name as sender_name,
            u.email as sender_email,
            u.photo_url as sender_photo,
            u.role as user_role
        FROM messages m
        LEFT JOIN users u ON m.sender_id = u.id
        WHERE m.ticket_id = ? 
        ORDER BY m.created_at ASC
    ");
    $stmt->bind_param("i", $ticket_id);
    $stmt->execute();
    $res = $stmt->get_result();
    $rows = [];
    while ($row = $res->fetch_assoc()) {
        // Simple approach: Keep sender_name as-is from database, only set fallback if empty
        $senderName = trim($row['sender_name'] ?? '');
        $senderEmail = trim($row['sender_email'] ?? '');
        
        // Only set fallback if sender_name is truly empty
        if (empty($senderName) || $senderName === 'null' || $senderName === 'undefined') {
            if (!empty($senderEmail)) {
                // Use email username as fallback
                $emailParts = explode('@', $senderEmail);
                $row['sender_name'] = $emailParts[0];
            } else {
                // Last resort: use role-based name
                $roleDisplayMap = [
                    'USER' => 'Customer',
                    'SELLER' => 'Seller',
                    'CUSTOMER_SUPPORT' => 'Support Agent',
                    'ADMIN' => 'Admin',
                ];
                $row['sender_name'] = $roleDisplayMap[$row['sender_role']] ?? 'Unknown User';
            }
        } else {
            // Keep the actual name from database
            $row['sender_name'] = $senderName;
        }
        
        // Fix attachment URL if relative
        if ($row['attachment_url'] && !str_starts_with($row['attachment_url'], 'http')) {
            $row['attachment_url'] = 'https://uptulathemehub.com' . ($row['attachment_url'][0] === '/' ? $row['attachment_url'] : '/' . $row['attachment_url']);
        }
        // Fix sender photo URL if relative
        if ($row['sender_photo'] && !str_starts_with($row['sender_photo'], 'http')) {
            $row['sender_photo'] = 'https://uptulathemehub.com' . ($row['sender_photo'][0] === '/' ? $row['sender_photo'] : '/' . $row['sender_photo']);
        }
        $rows[] = $row;
    }
    echo json_encode(['success' => true, 'messages' => $rows]);
}

function post_message($conn)
{
    $payload = require_jwt(['USER','SELLER','CUSTOMER_SUPPORT','ADMIN']);

    // DEBUG: Log authentication info
    error_log("🔍 POST MESSAGE DEBUG:");
    error_log("  - Payload ID: " . ($payload['id'] ?? 'NULL'));
    error_log("  - Payload Role: " . ($payload['role'] ?? 'NULL'));
    error_log("  - Payload Email: " . ($payload['email'] ?? 'NULL'));
    error_log("  - Session user_id: " . ($_SESSION['user_id'] ?? 'NULL'));
    error_log("  - Session seller_user_id: " . ($_SESSION['seller_user_id'] ?? 'NULL'));
    error_log("  - Session user_role: " . ($_SESSION['user_role'] ?? 'NULL'));
    error_log("  - Has JWT Token: " . (get_bearer_token() ? 'YES' : 'NO'));

    $ticket_id = (int)($_POST['ticket_id'] ?? 0);
    $message = trim($_POST['message'] ?? '');
    if ($ticket_id <= 0 || !$message) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'ticket_id and message required']);
        return;
    }
    if (!can_access_ticket($conn, $payload, $ticket_id)) {
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => 'Forbidden']);
        return;
    }

    $attachment_url = null;
    if (isset($_FILES['attachment']) && $_FILES['attachment']['error'] === UPLOAD_ERR_OK) {
        $uploadDir = __DIR__ . '/../uploads/ticket_attachments/';
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0775, true);
        }
        $tmpName = $_FILES['attachment']['tmp_name'];
        $name = basename($_FILES['attachment']['name']);
        $ext = pathinfo($name, PATHINFO_EXTENSION);
        $safeName = 'att_' . time() . '_' . bin2hex(random_bytes(4)) . ($ext ? ".$ext" : '');
        $dest = $uploadDir . $safeName;
        if (!move_uploaded_file($tmpName, $dest)) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Failed to upload attachment']);
            return;
        }
        $attachment_url = '/backend/uploads/ticket_attachments/' . $safeName;
    }

    // CRITICAL: Ensure we're using the correct sender_id
    $sender_id = (int)$payload['id'];
    $sender_role = $payload['role'];
    
    // DEBUG: Log what we're about to insert
    error_log("📤 INSERTING MESSAGE:");
    error_log("  - Ticket ID: $ticket_id");
    error_log("  - Sender ID: $sender_id");
    error_log("  - Sender Role: $sender_role");
    error_log("  - Message: " . substr($message, 0, 50));
    
    $stmt = $conn->prepare("INSERT INTO messages (ticket_id, sender_id, sender_role, message, attachment_url) VALUES (?,?,?,?,?)");
    $stmt->bind_param("iisss", $ticket_id, $sender_id, $sender_role, $message, $attachment_url);
    $ok = $stmt->execute();
    
    if (!$ok) {
        error_log("❌ INSERT FAILED: " . $stmt->error);
    } else {
        error_log("✅ INSERT SUCCESS: Message ID = " . $conn->insert_id);
    }
    
    if ($ok) {
        $message_id = $conn->insert_id;
        // Get the created message with sender info
        $msgStmt = $conn->prepare("
            SELECT 
                m.*,
                u.full_name as sender_name,
                u.email as sender_email,
                u.photo_url as sender_photo
            FROM messages m
            LEFT JOIN users u ON m.sender_id = u.id
            WHERE m.id = ?
        ");
        $msgStmt->bind_param("i", $message_id);
        $msgStmt->execute();
        $msgRes = $msgStmt->get_result();
        $messageData = $msgRes->fetch_assoc();
        
        // Fix URLs if relative
        if ($messageData['attachment_url'] && !str_starts_with($messageData['attachment_url'], 'http')) {
            $messageData['attachment_url'] = 'https://uptulathemehub.com' . ($messageData['attachment_url'][0] === '/' ? $messageData['attachment_url'] : '/' . $messageData['attachment_url']);
        }
        if ($messageData['sender_photo'] && !str_starts_with($messageData['sender_photo'], 'http')) {
            $messageData['sender_photo'] = 'https://uptulathemehub.com' . ($messageData['sender_photo'][0] === '/' ? $messageData['sender_photo'] : '/' . $messageData['sender_photo']);
        }
        
        echo json_encode([
            'success' => true, 
            'message_id' => $message_id, 
            'attachment_url' => $attachment_url,
            'data' => $messageData
        ]);
    } else {
        echo json_encode(['success' => false, 'message' => 'Failed to send message']);
    }
}

function clear_messages($conn, int $ticket_id)
{
    // Only CS agents and admins can clear messages
    $payload = require_jwt(['CUSTOMER_SUPPORT', 'ADMIN']);
    if (!can_access_ticket($conn, $payload, $ticket_id)) {
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => 'Forbidden']);
        return;
    }
    
    // Delete all messages for this ticket
    $stmt = $conn->prepare("DELETE FROM messages WHERE ticket_id = ?");
    $stmt->bind_param("i", $ticket_id);
    $ok = $stmt->execute();
    
    if ($ok) {
        echo json_encode(['success' => true, 'message' => 'Chat cleared successfully']);
    } else {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Failed to clear chat']);
    }
}

function can_access_ticket($conn, $payload, int $ticket_id): bool
{
    $stmt = $conn->prepare("SELECT created_by_id FROM tickets WHERE id = ?");
    $stmt->bind_param("i", $ticket_id);
    $stmt->execute();
    $res = $stmt->get_result();
    if ($res->num_rows === 0) return false;
    $row = $res->fetch_assoc();
    if (in_array($payload['role'], ['CUSTOMER_SUPPORT', 'ADMIN'])) return true;
    return $row['created_by_id'] == $payload['id'];
}
