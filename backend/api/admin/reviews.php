<?php
/**
 * Reviews Management API
 * Handles product reviews moderation
 */

error_reporting(E_ALL);
ini_set('display_errors', 0);
ob_start();

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    header_remove();
    header('Access-Control-Allow-Origin: https://uptulathemehub.com');
    header('Access-Control-Allow-Methods: GET, PUT, OPTIONS');
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

session_name('ADMINSESSID');
session_start();
ob_end_clean();

if (!isset($_SESSION['admin_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];

try {
    $conn = getDBConnection();

    switch ($method) {
        case 'GET':
            $statusFilter = $_GET['status'] ?? '';
            $productFilter = intval($_GET['product_id'] ?? 0);
            
            $query = "SELECT 
                        r.*,
                        p.name as product_name,
                        u.full_name as user_name,
                        u.email as user_email
                      FROM product_reviews r
                      JOIN products p ON r.product_id = p.id
                      JOIN users u ON r.user_id = u.id
                      WHERE 1=1";
            
            $params = [];
            $types = '';
            
            if (!empty($statusFilter)) {
                $query .= " AND r.status = ?";
                $params[] = $statusFilter;
                $types .= 's';
            }
            
            if ($productFilter > 0) {
                $query .= " AND r.product_id = ?";
                $params[] = $productFilter;
                $types .= 'i';
            }
            
            $query .= " ORDER BY r.created_at DESC";
            
            $stmt = $conn->prepare($query);
            if (!empty($params)) {
                $stmt->bind_param($types, ...$params);
            }
            $stmt->execute();
            $result = $stmt->get_result();
            
            $reviews = [];
            while ($row = $result->fetch_assoc()) {
                $reviews[] = $row;
            }
            
            $stmt->close();
            closeDBConnection($conn);

            echo json_encode(['success' => true, 'reviews' => $reviews]);
            break;

        case 'PUT':
            $rawInput = file_get_contents('php://input');
            $input = json_decode($rawInput, true);

            $reviewId = intval($input['id'] ?? 0);
            $status = trim($input['status'] ?? '');
            $adminNotes = trim($input['admin_notes'] ?? '');

            if ($reviewId <= 0 || !in_array($status, ['pending', 'approved', 'rejected', 'flagged'])) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Invalid input']);
                exit;
            }

            $stmt = $conn->prepare("UPDATE product_reviews SET status = ?, admin_notes = ? WHERE id = ?");
            $stmt->bind_param("ssi", $status, $adminNotes, $reviewId);
            $stmt->execute();
            $stmt->close();

            // Update seller reputation if approved
            if ($status === 'approved') {
                $review = $conn->query("SELECT product_id, rating FROM product_reviews WHERE id = $reviewId")->fetch_assoc();
                if ($review) {
                    $product = $conn->query("SELECT seller_id FROM products WHERE id = {$review['product_id']}")->fetch_assoc();
                    if ($product && $product['seller_id']) {
                        // Update reputation (simplified - in production, use stored procedure)
                        $conn->query("
                            INSERT INTO seller_reputation (seller_id, average_rating, total_reviews, 
                                five_star_count, four_star_count, three_star_count, two_star_count, one_star_count)
                            VALUES ({$product['seller_id']}, {$review['rating']}, 1, 
                                " . ($review['rating'] == 5 ? 1 : 0) . ",
                                " . ($review['rating'] == 4 ? 1 : 0) . ",
                                " . ($review['rating'] == 3 ? 1 : 0) . ",
                                " . ($review['rating'] == 2 ? 1 : 0) . ",
                                " . ($review['rating'] == 1 ? 1 : 0) . ")
                            ON DUPLICATE KEY UPDATE
                                total_reviews = total_reviews + 1,
                                five_star_count = five_star_count + " . ($review['rating'] == 5 ? 1 : 0) . ",
                                four_star_count = four_star_count + " . ($review['rating'] == 4 ? 1 : 0) . ",
                                three_star_count = three_star_count + " . ($review['rating'] == 3 ? 1 : 0) . ",
                                two_star_count = two_star_count + " . ($review['rating'] == 2 ? 1 : 0) . ",
                                one_star_count = one_star_count + " . ($review['rating'] == 1 ? 1 : 0) . ",
                                average_rating = (
                                    (five_star_count * 5 + four_star_count * 4 + three_star_count * 3 + 
                                     two_star_count * 2 + one_star_count * 1) / total_reviews
                                )
                        ");
                    }
                }
            }

            closeDBConnection($conn);

            echo json_encode(['success' => true, 'message' => 'Review updated']);
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
