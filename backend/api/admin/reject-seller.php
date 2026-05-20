<?php
error_reporting(E_ALL);
ini_set('display_errors', 0);
 
header('Access-Control-Allow-Origin: https://uptulathemehub.com');
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json');
 
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}
 
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../middleware/auth.php';
 
require_jwt(['ADMIN']);
 
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}
 
try {
    $data = json_decode(file_get_contents('php://input'), true);
 
    if (empty($data['seller_id']) || empty($data['rejection_reason'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'seller_id and rejection_reason are required']);
        exit;
    }
 
    $sellerId = (int)$data['seller_id'];
    $rejectionReason = trim($data['rejection_reason']);
    $adminId = $_SESSION['admin_id'] ?? null;
 
    if (!$adminId) {
        throw new Exception('Admin ID not found in session');
    }
 
    $conn = getDBConnection();
 
    // Get seller details (user_id) first
    $stmt = $conn->prepare("SELECT user_id FROM sellers WHERE id = ?");
    $stmt->bind_param('i', $sellerId);
    $stmt->execute();
    $result = $stmt->get_result();
    $seller = $result->fetch_assoc();
    $stmt->close();
 
    if (!$seller) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Seller not found']);
        closeDBConnection($conn);
        exit;
    }
 
    $userId = $seller['user_id'];
 
    // Reject seller: set verified_by_admin = 0 (disapproved)
    $verified = 0;
    $stmt = $conn->prepare("
        UPDATE sellers
        SET
            verified_by_admin = ?,
            rejection_reason = ?,
            status = 'inactive',
            updated_at = NOW()
        WHERE id = ?
    ");
    $stmt->bind_param('isi', $verified, $rejectionReason, $sellerId);

    if (!$stmt->execute()) {
        throw new Exception($stmt->error);
    }
    $stmt->close();
 
    // Create notification for the seller (store as system message/notification)
    $notificationMsg = "Your seller application has been rejected. Reason: " . $rejectionReason;
    $stmt = $conn->prepare("
        INSERT INTO email_notifications (recipient_type, recipient_id, recipient_email, subject, body, type, status)
        SELECT 'seller', ?, u.email, 'Seller Application Rejected', ?, 'verification', 'pending'
        FROM users u
        WHERE u.id = ?
    ");
    $stmt->bind_param('ssi', $sellerId, $notificationMsg, $userId);
    $stmt->execute();
    $stmt->close();
 
    closeDBConnection($conn);
 
    echo json_encode([
        'success' => true,
        'message' => 'Seller rejected successfully and notification sent'
    ]);
    exit;
 
} catch (Throwable $e) {
    error_log('reject-seller error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Server error: ' . $e->getMessage()
    ]);
    exit;
}
 
 