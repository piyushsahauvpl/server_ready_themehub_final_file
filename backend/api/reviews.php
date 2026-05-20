<?php
/**
 * Public Reviews API
 * Users can view and submit reviews for products they purchased
 */
 
error_reporting(E_ALL);
ini_set('display_errors', 0);
ob_start();
 
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    header_remove();
    header('Access-Control-Allow-Origin: https://uptulathemehub.com');
    header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
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
 
try {
    $conn = getDBConnection();
    $method = $_SERVER['REQUEST_METHOD'];
 
    switch ($method) {
        case 'GET':
            // Get reviews for a product (only approved reviews)
            $productId = intval($_GET['product_id'] ?? 0);
           
            if ($productId <= 0) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Product ID required']);
                exit;
            }
 
            $query = "SELECT
                        r.*,
                        u.full_name as user_name,
                        u.email as user_email,
                        u.photo_url as user_photo
                      FROM product_reviews r
                      JOIN users u ON r.user_id = u.id
                      WHERE r.product_id = ? AND r.status = 'approved'
                      ORDER BY r.created_at DESC";
           
            $stmt = $conn->prepare($query);
            $stmt->bind_param("i", $productId);
            $stmt->execute();
            $result = $stmt->get_result();
           
            $reviews = [];
            while ($row = $result->fetch_assoc()) {
                $reviews[] = $row;
            }
           
            // Calculate average rating
            $avgQuery = "SELECT AVG(rating) as avg_rating, COUNT(*) as total_reviews
                         FROM product_reviews
                         WHERE product_id = ? AND status = 'approved'";
            $avgStmt = $conn->prepare($avgQuery);
            $avgStmt->bind_param("i", $productId);
            $avgStmt->execute();
            $avgResult = $avgStmt->get_result();
            $avgData = $avgResult->fetch_assoc();
           
            $stmt->close();
            $avgStmt->close();
            closeDBConnection($conn);
 
            echo json_encode([
                'success' => true,
                'reviews' => $reviews,
                'average_rating' => round($avgData['avg_rating'] ?? 0, 1),
                'total_reviews' => intval($avgData['total_reviews'] ?? 0)
            ]);
            break;
 
        case 'POST':
            // Submit a review (only if user purchased the product)
            if (!isset($_SESSION['user_id'])) {
                http_response_code(401);
                echo json_encode(['success' => false, 'message' => 'Please login to submit a review']);
                exit;
            }
 
            $rawInput = file_get_contents('php://input');
            $input = json_decode($rawInput, true);
 
            $productId = intval($input['product_id'] ?? 0);
            $rating = intval($input['rating'] ?? 0);
            $title = trim($input['title'] ?? '');
            $reviewText = trim($input['review_text'] ?? '');
            $userId = $_SESSION['user_id'];
 
            if ($productId <= 0 || $rating < 1 || $rating > 5 || empty($reviewText)) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Invalid input']);
                exit;
            }
 
            // Check if user purchased this product
            $purchaseCheck = $conn->prepare("SELECT id FROM orders WHERE user_id = ? AND product_id = ? AND status = 'completed' LIMIT 1");
            $purchaseCheck->bind_param("ii", $userId, $productId);
            $purchaseCheck->execute();
            $purchaseResult = $purchaseCheck->get_result();
           
            if ($purchaseResult->num_rows === 0) {
                $purchaseCheck->close();
                closeDBConnection($conn);
                http_response_code(403);
                echo json_encode(['success' => false, 'message' => 'You can only review products you have purchased']);
                exit;
            }
            $purchaseCheck->close();
 
            // Get seller_id from product
            $sellerQuery = $conn->prepare("SELECT seller_id FROM products WHERE id = ?");
            $sellerQuery->bind_param("i", $productId);
            $sellerQuery->execute();
            $sellerResult = $sellerQuery->get_result();
            $product = $sellerResult->fetch_assoc();
            $sellerId = $product['seller_id'] ?? null;
            $sellerQuery->close();
 
            // Check if user already has a review for this product (update instead of insert)
            $existingCheck = $conn->prepare("SELECT id, status FROM product_reviews WHERE user_id = ? AND product_id = ? LIMIT 1");
            $existingCheck->bind_param("ii", $userId, $productId);
            $existingCheck->execute();
            $existingResult = $existingCheck->get_result();
            $existingReview = $existingResult->fetch_assoc();
            $existingCheck->close();
 
            if ($existingReview) {
                // Update existing review (status: approved for immediate visibility)
                $updateStmt = $conn->prepare("UPDATE product_reviews SET rating = ?, title = ?, review_text = ?, status = 'approved', updated_at = CURRENT_TIMESTAMP WHERE id = ?");
                $updateStmt->bind_param("issi", $rating, $title, $reviewText, $existingReview['id']);
               
                if ($updateStmt->execute()) {
                    // Update seller reputation when review is updated
                    if ($sellerId) {
                        updateSellerReputation($conn, $sellerId);
                    }
                    closeDBConnection($conn);
                    echo json_encode(['success' => true, 'message' => 'Review updated successfully!']);
                } else {
                    closeDBConnection($conn);
                    http_response_code(500);
                    echo json_encode(['success' => false, 'message' => 'Failed to update review']);
                }
                $updateStmt->close();
            } else {
                // Insert new review (status: approved for immediate visibility)
                $insertStmt = $conn->prepare("INSERT INTO product_reviews (product_id, user_id, seller_id, rating, title, review_text, status) VALUES (?, ?, ?, ?, ?, ?, 'approved')");
                $insertStmt->bind_param("iiisss", $productId, $userId, $sellerId, $rating, $title, $reviewText);
               
                if ($insertStmt->execute()) {
                    // Update seller reputation when review is added
                    if ($sellerId) {
                        updateSellerReputation($conn, $sellerId);
                    }
                    closeDBConnection($conn);
                    echo json_encode(['success' => true, 'message' => 'Review submitted successfully!']);
                } else {
                    closeDBConnection($conn);
                    http_response_code(500);
                    echo json_encode(['success' => false, 'message' => 'Failed to submit review']);
                }
                $insertStmt->close();
            }
            break;
 
        default:
            http_response_code(405);
            echo json_encode(['success' => false, 'message' => 'Method not allowed']);
            break;
    }
} catch (Exception $e) {
    error_log("Reviews API error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Server error']);
}
 
/**
 * Update or insert seller reputation based on reviews
 */
function updateSellerReputation($conn, $sellerId) {
   
    // Calculate new reputation
    $calcStmt = $conn->prepare("
        SELECT
            COALESCE(AVG(rating), 0) as avg_rating,
            COUNT(*) as total_count,
            SUM(CASE WHEN rating = 5 THEN 1 ELSE 0 END) as five_star,
            SUM(CASE WHEN rating = 4 THEN 1 ELSE 0 END) as four_star,
            SUM(CASE WHEN rating = 3 THEN 1 ELSE 0 END) as three_star,
            SUM(CASE WHEN rating = 2 THEN 1 ELSE 0 END) as two_star,
            SUM(CASE WHEN rating = 1 THEN 1 ELSE 0 END) as one_star
        FROM product_reviews
        WHERE seller_id = ? AND status = 'approved'
    ");
   
    $calcStmt->bind_param("i", $sellerId);
    $calcStmt->execute();
    $result = $calcStmt->get_result();
    $data = $result->fetch_assoc();
    $calcStmt->close();
   
    // Update or insert reputation
    $checkStmt = $conn->prepare("SELECT id FROM seller_reputation WHERE seller_id = ?");
    $checkStmt->bind_param("i", $sellerId);
    $checkStmt->execute();
    $checkResult = $checkStmt->get_result();
    $exists = $checkResult->num_rows > 0;
    $checkStmt->close();
   
    if ($exists) {
        // Update
        $avgRating = floatval($data['avg_rating']);
        $totalCount = intval($data['total_count']);
        $fiveStar = intval($data['five_star'] ?? 0);
        $fourStar = intval($data['four_star'] ?? 0);
        $threeStar = intval($data['three_star'] ?? 0);
        $twoStar = intval($data['two_star'] ?? 0);
        $oneStar = intval($data['one_star'] ?? 0);
       
        $updateStmt = $conn->prepare("
            UPDATE seller_reputation
            SET average_rating = ?, total_reviews = ?,
                five_star_count = ?, four_star_count = ?,
                three_star_count = ?, two_star_count = ?, one_star_count = ?
            WHERE seller_id = ?
        ");
        $updateStmt->bind_param(
            "diiiiiii",
            $avgRating, $totalCount,
            $fiveStar, $fourStar, $threeStar,
            $twoStar, $oneStar, $sellerId
        );
        $updateStmt->execute();
        $updateStmt->close();
    } else {
        // Insert
        $avgRating = floatval($data['avg_rating']);
        $totalCount = intval($data['total_count']);
        $fiveStar = intval($data['five_star'] ?? 0);
        $fourStar = intval($data['four_star'] ?? 0);
        $threeStar = intval($data['three_star'] ?? 0);
        $twoStar = intval($data['two_star'] ?? 0);
        $oneStar = intval($data['one_star'] ?? 0);
       
        $insertStmt = $conn->prepare("
            INSERT INTO seller_reputation
            (seller_id, average_rating, total_reviews, five_star_count, four_star_count, three_star_count, two_star_count, one_star_count)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ");
        $insertStmt->bind_param(
            "idiiiiii",
            $sellerId, $avgRating, $totalCount,
            $fiveStar, $fourStar, $threeStar,
            $twoStar, $oneStar
        );
        $insertStmt->execute();
        $insertStmt->close();
    }
}
?>
 
 