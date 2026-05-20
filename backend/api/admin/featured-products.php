<?php
/**
 * Featured Products API
 * Endpoint: /api/admin/featured-products.php
 * Handles GET, POST, DELETE for featured products
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

require_once '../../config/database.php';
require_once '../../middleware/auth.php';

session_name('ADMINSESSID');
session_start();
ob_end_clean();

// Check admin authentication
$payload = require_jwt(['ADMIN']);
if (!$payload) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];

try {
    $conn = getDBConnection();

    // Check if is_featured column exists, if not add it
    $checkColumn = $conn->query("SHOW COLUMNS FROM products LIKE 'is_featured'");
    if ($checkColumn->num_rows === 0) {
        $conn->query("ALTER TABLE products ADD COLUMN is_featured TINYINT(1) DEFAULT 0 AFTER status");
    }

    switch ($method) {
        case 'GET':
            // Get all featured products
            $query = "SELECT 
                        p.*,
                        c.name as category_name,
                        f.name as framework_name,
                        s.business_name as seller_name
                      FROM products p
                      LEFT JOIN categories c ON p.category_id = c.id
                      LEFT JOIN frameworks f ON p.framework_id = f.id
                      LEFT JOIN sellers s ON p.seller_id = s.id
                      WHERE p.is_featured = 1 AND p.status = 'approved'
                      ORDER BY p.created_at DESC";
            
            $result = $conn->query($query);
            $products = [];
            
            while ($row = $result->fetch_assoc()) {
                // Fix image URL if needed
                if ($row['image_url'] && !str_starts_with($row['image_url'], 'http')) {
                    $row['image_url'] = 'https://uptulathemehub.com' . ($row['image_url'][0] === '/' ? $row['image_url'] : '/' . $row['image_url']);
                }
                $products[] = $row;
            }
            
            echo json_encode(['success' => true, 'products' => $products]);
            break;

        case 'POST':
            // Add product to featured
            $rawInput = file_get_contents('php://input');
            $input = json_decode($rawInput, true);

            if (json_last_error() !== JSON_ERROR_NONE || !isset($input['product_id'])) {
                closeDBConnection($conn);
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Invalid input']);
                exit;
            }

            $productId = intval($input['product_id']);

            // Verify product exists and is approved
            $checkStmt = $conn->prepare("SELECT id, status FROM products WHERE id = ?");
            $checkStmt->bind_param("i", $productId);
            $checkStmt->execute();
            $checkResult = $checkStmt->get_result();
            $product = $checkResult->fetch_assoc();
            $checkStmt->close();

            if (!$product) {
                closeDBConnection($conn);
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'Product not found']);
                exit;
            }

            if ($product['status'] !== 'approved') {
                closeDBConnection($conn);
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Only approved products can be featured']);
                exit;
            }

            // Update product to featured
            $stmt = $conn->prepare("UPDATE products SET is_featured = 1 WHERE id = ?");
            $stmt->bind_param("i", $productId);
            $stmt->execute();
            $stmt->close();

            closeDBConnection($conn);
            echo json_encode(['success' => true, 'message' => 'Product added to featured']);
            break;

        case 'DELETE':
            // Remove product from featured
            $rawInput = file_get_contents('php://input');
            $input = json_decode($rawInput, true);

            if (json_last_error() !== JSON_ERROR_NONE || !isset($input['product_id'])) {
                closeDBConnection($conn);
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Invalid input']);
                exit;
            }

            $productId = intval($input['product_id']);

            // Update product to not featured
            $stmt = $conn->prepare("UPDATE products SET is_featured = 0 WHERE id = ?");
            $stmt->bind_param("i", $productId);
            $stmt->execute();
            $stmt->close();

            closeDBConnection($conn);
            echo json_encode(['success' => true, 'message' => 'Product removed from featured']);
            break;

        default:
            closeDBConnection($conn);
            http_response_code(405);
            echo json_encode(['success' => false, 'message' => 'Method not allowed']);
            break;
    }
} catch (Exception $e) {
    error_log("Featured products error: " . $e->getMessage());
    closeDBConnection($conn);
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'An error occurred while processing your request'
    ]);
}
