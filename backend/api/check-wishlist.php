<?php
/**
 * Check if product is in user's wishlist
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
    echo json_encode(['success' => true, 'in_wishlist' => false]);
    exit;
}

try {
    $conn = getDBConnection();
    $userId = $_SESSION['user_id'];
    $productId = intval($_GET['product_id'] ?? 0);

    if ($productId <= 0) {
        echo json_encode(['success' => true, 'in_wishlist' => false]);
        exit;
    }

    $stmt = $conn->prepare("SELECT id FROM wishlist WHERE user_id = ? AND product_id = ? LIMIT 1");
    $stmt->bind_param("ii", $userId, $productId);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $inWishlist = $result->num_rows > 0;
    $stmt->close();
    closeDBConnection($conn);

    echo json_encode(['success' => true, 'in_wishlist' => $inWishlist]);
} catch (Exception $e) {
    echo json_encode(['success' => true, 'in_wishlist' => false]);
}
