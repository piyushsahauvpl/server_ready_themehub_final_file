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

    if (empty($data['seller_id'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'seller_id is required']);
        exit;
    }

    $sellerId = (int)$data['seller_id'];
    $adminId  = $_SESSION['admin_id'];

    $conn = getDBConnection();

    // Approve seller: set verified_by_admin = 1 (approved)
    $verified = 1;
    $stmt = $conn->prepare("
        UPDATE sellers
        SET 
            status = 'active',
            verified_by_admin = ?,
            rejection_reason = NULL,
            updated_at = NOW()
        WHERE id = ?
    ");
    $stmt->bind_param('ii', $verified, $sellerId);

    if (!$stmt->execute()) {
        throw new Exception($stmt->error);
    }

    $stmt->close();
    closeDBConnection($conn);

    echo json_encode([
        'success' => true,
        'message' => 'Seller approved. Payment pending.'
    ]);
    exit;

} catch (Throwable $e) {
    error_log('approve-seller error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Server error'
    ]);
    exit;
}
