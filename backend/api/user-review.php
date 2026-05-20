<?php
/**
 * Get user's review for a product (including pending reviews)
 * Endpoint: GET /api/user-review.php?product_id=123
 */

error_reporting(E_ALL);
ini_set('display_errors', 0);
ob_start();

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    header_remove();
    header('Access-Control-Allow-Origin: https://uptulathemehub.com');
    header('Access-Control-Allow-Methods: GET, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type');
    header('Access-Control-Allow-Credentials: true');
    http_response_code(200);
    ob_end_clean();
    exit();
}

header_remove('Access-Control-Allow-Origin');
header('Access-Control-Allow-Origin: https://uptulathemehub.com');
header('Access-Control-Allow-Credentials: true');
header('Content-Type: application/json; charset=utf-8');

require_once '../config/database.php';

session_start();
ob_end_clean();

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

$productId = intval($_GET['product_id'] ?? 0);
$userId = $_SESSION['user_id'];

if ($productId <= 0) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Product ID required']);
    exit;
}

try {
    $conn = getDBConnection();
    
    // Get user's review (including pending ones)
    $query = "SELECT * FROM product_reviews WHERE user_id = ? AND product_id = ? LIMIT 1";
    $stmt = $conn->prepare($query);
    $stmt->bind_param("ii", $userId, $productId);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows > 0) {
        $review = $result->fetch_assoc();
        $stmt->close();
        closeDBConnection($conn);
        echo json_encode([
            'success' => true,
            'review' => $review
        ]);
    } else {
        $stmt->close();
        closeDBConnection($conn);
        echo json_encode([
            'success' => false,
            'review' => null
        ]);
    }
} catch (Exception $e) {
    error_log("User review API error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Server error']);
}
