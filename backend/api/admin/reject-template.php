<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
 
require_once "../../config/database.php";
 
// Check if user is admin
session_start();
if (!isset($_SESSION['user_id']) || $_SESSION['role'] !== 'admin') {
    http_response_code(403);
    echo json_encode([
        'success' => false,
        'message' => 'Unauthorized: Admin access required'
    ]);
    exit;
}
 
// Get request data
$data = json_decode(file_get_contents("php://input"), true);
 
if (empty($data['template_id'])) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'Template ID is required'
    ]);
    exit;
}
 
$reason = $data['reason'] ?? 'No reason provided';
 
try {
    // Update template status to rejected
    $stmt = $pdo->prepare("
        UPDATE seller_templates
        SET status = 'rejected', rejected_at = NOW(), rejected_by = ?, rejection_reason = ?
        WHERE id = ? AND status = 'pending'
    ");
   
    $stmt->execute([$_SESSION['user_id'], $reason, $data['template_id']]);
   
    if ($stmt->rowCount() > 0) {
        echo json_encode([
            'success' => true,
            'message' => 'Template rejected successfully!'
        ]);
    } else {
        http_response_code(404);
        echo json_encode([
            'success' => false,
            'message' => 'Template not found or already processed'
        ]);
    }
   
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Database error: ' . $e->getMessage()
    ]);
}
?>
 
 