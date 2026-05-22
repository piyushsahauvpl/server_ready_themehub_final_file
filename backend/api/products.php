<?php
/**
 * Public Products API
 * Returns only approved products for public display
 * Endpoint: GET /api/products.php
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
require_once '../config/currency-config.php';
require_once '../helpers/currency-helper.php';
 
ob_end_clean();
 
try {
    $requestedCurrency = strtoupper(trim($_GET['currency'] ?? ''));
    if ($requestedCurrency && preg_match('/^[A-Z]{3}$/', $requestedCurrency)) {
        setUserCurrency($requestedCurrency);
    }

    // Get currency information for user
    $currencyInfo = getCurrencyInfo();
    $userCurrency = $currencyInfo['currency'];
    $userSymbol = $currencyInfo['symbol'];
    
    $conn = getDBConnection();
    $reviewJoin = "";
    $reviewFields = ", 0 as avg_rating, 0 as review_count";

    $reviewsTableExists = $conn->query("SHOW TABLES LIKE 'product_reviews'");
    if ($reviewsTableExists && $reviewsTableExists->num_rows > 0) {
        $reviewJoin = "LEFT JOIN (
                          SELECT product_id, ROUND(AVG(rating), 1) AS avg_rating, COUNT(*) AS review_count
                          FROM product_reviews
                          WHERE status = 'approved'
                          GROUP BY product_id
                        ) pr ON p.id = pr.product_id";
        $reviewFields = ", COALESCE(pr.avg_rating, 0) as avg_rating, COALESCE(pr.review_count, 0) as review_count";
    }
   
    // Get query parameters
    $id = $_GET['id'] ?? null;
    $category = $_GET['category'] ?? null;
    $framework = $_GET['framework'] ?? null;
    $limit = intval($_GET['limit'] ?? 0);
    $offset = intval($_GET['offset'] ?? 0);
   
    if ($id) {
        // Get single product by ID or slug
        $query = "SELECT
                    p.*,
                    c.name as category_name,
                    f.name as framework_name,
                    s.business_name as seller_name,
                    u.full_name as seller_full_name
                    {$reviewFields}
                  FROM products p
                  LEFT JOIN categories c ON p.category_id = c.id
                  LEFT JOIN frameworks f ON p.framework_id = f.id
                  LEFT JOIN sellers s ON p.seller_id = s.id
                  LEFT JOIN users u ON s.user_id = u.id
                  {$reviewJoin}
                  WHERE (p.status = 'approved' OR p.seller_id IS NULL) AND (p.id = ? OR p.slug = ?)
                  LIMIT 1";
       
        $stmt = $conn->prepare($query);
        $stmt->bind_param("is", $id, $id);
        $stmt->execute();
        $result = $stmt->get_result();
       
        if ($result->num_rows > 0) {
            $product = $result->fetch_assoc();
            // Fix image URL if needed
            if ($product['image_url'] && !str_starts_with($product['image_url'], 'http')) {
                $product['image_url'] = 'https://uptulathemehub.com' . ($product['image_url'][0] === '/' ? $product['image_url'] : '/' . $product['image_url']);
            } else if ($product['image_url'] && str_contains($product['image_url'], 'https://uptulathemehub.com') && !str_contains($product['image_url'], '/Theme_hub_local_dipu/')) {
                // Fix URLs that have the wrong domain prefix
                $product['image_url'] = str_replace('https://uptulathemehub.com', 'https://uptulathemehub.com', $product['image_url']);
            }
            // Also fix preview_url if it has the wrong path
            if ($product['preview_url'] && !str_starts_with($product['preview_url'], 'http')) {
                $product['preview_url'] = 'https://uptulathemehub.com' . ($product['preview_url'][0] === '/' ? $product['preview_url'] : '/' . $product['preview_url']);
            } else if ($product['preview_url'] && str_contains($product['preview_url'], 'https://uptulathemehub.com') && !str_contains($product['preview_url'], '/Theme_hub_local_dipu/')) {
                // Fix URLs that have the wrong domain prefix
                $product['preview_url'] = str_replace('https://uptulathemehub.com', 'https://uptulathemehub.com', $product['preview_url']);
            }
 
            // If preview_url points into the local uploads folder, rewrite to the preview proxy to avoid direct folder access
            if (!empty($product['preview_url']) && (stripos($product['preview_url'], '/uploads/products') !== false || stripos($product['preview_url'], '/backend/uploads/products') !== false)) {
                $product['preview_url'] = 'https://' . $_SERVER['HTTP_HOST'] . '/backend/api/preview.php?id=' . $product['id'];
            }

            $product['rating'] = isset($product['avg_rating']) ? floatval($product['avg_rating']) : 0;
            $product['review_count'] = isset($product['review_count']) ? intval($product['review_count']) : 0;
            $product['is_latest'] = intval($product['is_latest'] ?? 0);
            $product['tags'] = !empty($product['tags'])
                ? array_values(array_filter(array_map('trim', explode(',', $product['tags']))))
                : [];
            if ($product['is_latest'] === 1) {
                $product['badge'] = 'New';
            }
            
            // Add currency conversion for single product
            $priceINR = floatval($product['price']);
            $product['price_inr'] = $priceINR;
            $product['price'] = $priceINR;
            $product['converted_price'] = convertCurrency($priceINR, $userCurrency);
            $product['currency'] = $userCurrency;
            $product['currency_symbol'] = $userSymbol;
            if ($product['offer_price']) {
                $product['offer_price_inr'] = floatval($product['offer_price']);
                $product['offer_price'] = $product['offer_price_inr'];
                $product['converted_offer_price'] = convertCurrency($product['offer_price_inr'], $userCurrency);
            }
            
            echo json_encode([
                'success' => true,
                'data' => $product,
                'currency' => [
                    'code' => $userCurrency,
                    'symbol' => $userSymbol,
                    'country' => $currencyInfo['country'],
                    'is_manual' => $currencyInfo['is_manual']
                ]
            ]);
        } else {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Product not found']);
        }
        $stmt->close();
    } else {
        // Get list of approved products OR products added by admin (seller_id IS NULL means admin-added)
        $where = "(p.status = 'approved' OR p.seller_id IS NULL)";
        $params = [];
        $types = "";
       
        if ($category) {
            $where .= " AND (c.name = ? OR c.slug = ?)";
            $params[] = $category;
            $params[] = $category;
            $types .= "ss";
        }
       
        if ($framework) {
            $where .= " AND f.name = ?";
            $params[] = $framework;
            $types .= "s";
        }
       
        $query = "SELECT
                    p.*,
                    c.name as category_name,
                    f.name as framework_name,
                    s.business_name as seller_name,
                    u.full_name as seller_full_name
                    {$reviewFields}
                  FROM products p
                  LEFT JOIN categories c ON p.category_id = c.id
                  LEFT JOIN frameworks f ON p.framework_id = f.id
                  LEFT JOIN sellers s ON p.seller_id = s.id
                  LEFT JOIN users u ON s.user_id = u.id
                  {$reviewJoin}
                  WHERE $where
                  ORDER BY p.created_at DESC";
       
        if ($limit > 0) {
            $query .= " LIMIT ?";
            $params[] = $limit;
            $types .= "i";
            if ($offset > 0) {
                $query .= " OFFSET ?";
                $params[] = $offset;
                $types .= "i";
            }
        }
       
        $stmt = $conn->prepare($query);
        if (!empty($params)) {
            $stmt->bind_param($types, ...$params);
        }
        $stmt->execute();
        $result = $stmt->get_result();
       
        $products = [];
        while ($row = $result->fetch_assoc()) {
            // Fix image URL if needed
            if ($row['image_url'] && !str_starts_with($row['image_url'], 'http')) {
                $row['image_url'] = 'https://uptulathemehub.com' . ($row['image_url'][0] === '/' ? $row['image_url'] : '/' . $row['image_url']);
            } else if ($row['image_url'] && str_contains($row['image_url'], 'https://uptulathemehub.com') && !str_contains($row['image_url'], '/Theme_hub_local_dipu/')) {
                // Fix URLs that have the wrong domain prefix
                $row['image_url'] = str_replace('https://uptulathemehub.com', 'https://uptulathemehub.com', $row['image_url']);
            }
            // Also fix preview_url if it has the wrong path
            if ($row['preview_url'] && !str_starts_with($row['preview_url'], 'http')) {
                $row['preview_url'] = 'https://uptulathemehub.com' . ($row['preview_url'][0] === '/' ? $row['preview_url'] : '/' . $row['preview_url']);
            } else if ($row['preview_url'] && str_contains($row['preview_url'], 'https://uptulathemehub.com') && !str_contains($row['preview_url'], '/Theme_hub_local_dipu/')) {
                // Fix URLs that have the wrong domain prefix
                $row['preview_url'] = str_replace('https://uptulathemehub.com', 'https://uptulathemehub.com', $row['preview_url']);
            }
 
            // If preview_url points into the local uploads folder, rewrite to the preview proxy to avoid direct folder access
            if (!empty($row['preview_url']) && (stripos($row['preview_url'], '/uploads/products') !== false || stripos($row['preview_url'], '/backend/uploads/products') !== false)) {
                $row['preview_url'] = 'https://' . $_SERVER['HTTP_HOST'] . '/backend/api/preview.php?id=' . $row['id'];
            }
            // Map to expected format for frontend
            $priceINR = floatval($row['price']);
            $priceConverted = convertCurrency($priceINR, $userCurrency);
            $oldPriceConverted = $row['offer_price'] ? convertCurrency(floatval($row['offer_price']), $userCurrency) : null;
            
            $products[] = [
                'id' => $row['id'],
                'title' => $row['name'],
                'name' => $row['name'],
                'slug' => $row['slug'],
                'description' => $row['description'],
                'price' => $priceINR,
                'price_inr' => $priceINR,     // Original INR price
                'converted_price' => $priceConverted,
                'currency' => $userCurrency,
                'currency_symbol' => $userSymbol,
                'old_price' => $row['offer_price'] ? floatval($row['offer_price']) : null,
                'old_price_inr' => $row['offer_price'] ? floatval($row['offer_price']) : null,
                'converted_old_price' => $oldPriceConverted,
                'image' => $row['image_url'],
                'image_url' => $row['image_url'],
                'preview_url' => $row['preview_url'],
                'category_name' => $row['category_name'],
                'framework_name' => $row['framework_name'],
                'seller_name' => $row['seller_name'] || $row['seller_full_name'],
                'downloads' => intval($row['downloads'] ?? 0),
                'rating' => isset($row['avg_rating']) ? floatval($row['avg_rating']) : 0,
                'review_count' => isset($row['review_count']) ? intval($row['review_count']) : 0,
                'created_at' => $row['created_at'],
                'is_latest' => intval($row['is_latest'] ?? 0),
                'tags' => !empty($row['tags'])
                    ? array_values(array_filter(array_map('trim', explode(',', $row['tags']))))
                    : [],
                'badge' => !empty($row['is_latest']) ? 'New' : null,
            ];
        }
       
        $stmt->close();
        closeDBConnection($conn);
       
        echo json_encode([
            'success' => true,
            'data' => $products,
            'currency' => [
                'code' => $userCurrency,
                'symbol' => $userSymbol,
                'country' => $currencyInfo['country'],
                'is_manual' => $currencyInfo['is_manual']
            ]
        ]);
    }
} catch (Exception $e) {
    error_log("Products API error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Server error']);
}
 
 
