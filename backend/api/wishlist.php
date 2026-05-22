<?php
/**
 * Wishlist API
 * Users can add/remove products from their wishlist
 */

error_reporting(E_ALL);
ini_set('display_errors', 0);
ob_start();

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    header_remove();
    header('Access-Control-Allow-Origin: https://uptulathemehub.com');
    header('Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS');
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
require_once '../config/currency-config.php';
require_once '../helpers/currency-helper.php';

session_start();
ob_end_clean();

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Please login to access wishlist']);
    exit;
}

try {
    $requestedCurrency = strtoupper(trim($_GET['currency'] ?? ''));
    if ($requestedCurrency && preg_match('/^[A-Z]{3}$/', $requestedCurrency)) {
        setUserCurrency($requestedCurrency);
    }

    $currencyInfo = getCurrencyInfo();
    $userCurrency = $currencyInfo['currency'];
    $userSymbol = $currencyInfo['symbol'];
    $conn = getDBConnection();
    $userId = $_SESSION['user_id'];
    $method = $_SERVER['REQUEST_METHOD'];

    // Create wishlist table if it doesn't exist
    $conn->query("CREATE TABLE IF NOT EXISTS wishlist (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        product_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_wishlist (user_id, product_id),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
        INDEX idx_user (user_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

    switch ($method) {
        case 'GET':
            // Get user's wishlist
            $query = "SELECT 
                        w.*,
                        p.name as product_name,
                        p.slug,
                        p.price,
                        p.image_url,
                        p.preview_url,
                        c.name as category_name,
                        f.name as framework_name
                      FROM wishlist w
                      JOIN products p ON w.product_id = p.id
                      LEFT JOIN categories c ON p.category_id = c.id
                      LEFT JOIN frameworks f ON p.framework_id = f.id
                      WHERE w.user_id = ? AND (p.status = 'approved' OR p.seller_id IS NULL)
                      ORDER BY w.created_at DESC";
            
            $stmt = $conn->prepare($query);
            $stmt->bind_param("i", $userId);
            $stmt->execute();
            $result = $stmt->get_result();
            
            $items = [];
            while ($row = $result->fetch_assoc()) {
                // Fix image URL
                if ($row['image_url'] && !str_starts_with($row['image_url'], 'http')) {
                    $row['image_url'] = 'https://uptulathemehub.com' . ($row['image_url'][0] === '/' ? $row['image_url'] : '/' . $row['image_url']);
                }
                $priceINR = floatval($row['price']);
                $row['price'] = $priceINR;
                $row['price_inr'] = $priceINR;
                $row['converted_price'] = convertCurrency($priceINR, $userCurrency);
                $row['currency'] = $userCurrency;
                $row['currency_symbol'] = $userSymbol;
                $items[] = $row;
            }
            
            $stmt->close();
            closeDBConnection($conn);

            echo json_encode([
                'success' => true,
                'items' => $items,
                'currency' => [
                    'code' => $userCurrency,
                    'symbol' => $userSymbol,
                    'country' => $currencyInfo['country'],
                    'is_manual' => $currencyInfo['is_manual']
                ]
            ]);
            break;

        case 'POST':
            // Add to wishlist
            $rawInput = file_get_contents('php://input');
            $input = json_decode($rawInput, true);
            $productId = intval($input['product_id'] ?? 0);

            if ($productId <= 0) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Product ID required']);
                exit;
            }

            // Check if already in wishlist
            $checkStmt = $conn->prepare("SELECT id FROM wishlist WHERE user_id = ? AND product_id = ?");
            $checkStmt->bind_param("ii", $userId, $productId);
            $checkStmt->execute();
            if ($checkStmt->get_result()->num_rows > 0) {
                $checkStmt->close();
                closeDBConnection($conn);
                echo json_encode(['success' => false, 'message' => 'Product already in wishlist']);
                exit;
            }
            $checkStmt->close();

            $insertStmt = $conn->prepare("INSERT INTO wishlist (user_id, product_id) VALUES (?, ?)");
            $insertStmt->bind_param("ii", $userId, $productId);
            
            if ($insertStmt->execute()) {
                closeDBConnection($conn);
                echo json_encode(['success' => true, 'message' => 'Added to wishlist']);
            } else {
                closeDBConnection($conn);
                http_response_code(500);
                echo json_encode(['success' => false, 'message' => 'Failed to add to wishlist']);
            }
            $insertStmt->close();
            break;

        case 'DELETE':
            // Remove from wishlist
            $rawInput = file_get_contents('php://input');
            $input = json_decode($rawInput, true);
            $productId = intval($input['product_id'] ?? 0);

            if ($productId <= 0) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Product ID required']);
                exit;
            }

            $deleteStmt = $conn->prepare("DELETE FROM wishlist WHERE user_id = ? AND product_id = ?");
            $deleteStmt->bind_param("ii", $userId, $productId);
            
            if ($deleteStmt->execute()) {
                closeDBConnection($conn);
                echo json_encode(['success' => true, 'message' => 'Removed from wishlist']);
            } else {
                closeDBConnection($conn);
                http_response_code(500);
                echo json_encode(['success' => false, 'message' => 'Failed to remove from wishlist']);
            }
            $deleteStmt->close();
            break;

        default:
            http_response_code(405);
            echo json_encode(['success' => false, 'message' => 'Method not allowed']);
            break;
    }
} catch (Exception $e) {
    error_log("Wishlist API error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Server error']);
}
