<?php
/**
 * Seller Profile API
 * Endpoint: GET/PUT /api/seller/profile.php
 * Handles seller profile information retrieval and updates
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

session_start();
ob_end_clean();

// Check if user is logged in (regular user, not necessar need to be an approved seller)
if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Unauthorized - Please log in']);
    exit;
}

// User ID can come from seller session OR regular user session
$userId = $_SESSION['seller_user_id'] ?? $_SESSION['user_id'];
$sellerId = $_SESSION['seller_id'] ?? null; // May be null for non-sellers
$method = $_SERVER['REQUEST_METHOD'];

try {
    $conn = getDBConnection();

    switch ($method) {
        case 'GET':
            // Get seller profile with user details
            // Try by seller_id first, then by user_id
            $seller = null;
            
            if ($sellerId) {
                // User is an approved seller
                $query = "SELECT 
                            s.id,
                            s.user_id,
                            s.business_name,
                            s.bio,
                            s.profile_image,
                            s.verification_status,
                            s.status,
                            s.created_at,
                            u.full_name,
                            u.email,
                            u.phone
                          FROM sellers s
                          LEFT JOIN users u ON s.user_id = u.id
                          WHERE s.id = ?";
                
                $stmt = $conn->prepare($query);
                $stmt->bind_param("i", $sellerId);
                $stmt->execute();
                $result = $stmt->get_result();
                $seller = $result->fetch_assoc();
                $stmt->close();
            } else {
                // User is not yet an approved seller, try to find by user_id anyway
                $query = "SELECT 
                            s.id,
                            s.user_id,
                            s.business_name,
                            s.bio,
                            s.profile_image,
                            s.verification_status,
                            s.status,
                            s.created_at,
                            u.full_name,
                            u.email,
                            u.phone
                          FROM sellers s
                          LEFT JOIN users u ON s.user_id = u.id
                          WHERE s.user_id = ?";
                
                $stmt = $conn->prepare($query);
                $stmt->bind_param("i", $userId);
                $stmt->execute();
                $result = $stmt->get_result();
                $seller = $result->fetch_assoc();
                $stmt->close();
            }
            
            if (!$seller) {
                // User has no seller profile yet - return empty profile template
                $userQuery = "SELECT id, full_name, email, phone FROM users WHERE id = ?";
                $userStmt = $conn->prepare($userQuery);
                $userStmt->bind_param("i", $userId);
                $userStmt->execute();
                $userResult = $userStmt->get_result();
                $user = $userResult->fetch_assoc();
                $userStmt->close();
                
                $seller = [
                    'id' => null,
                    'user_id' => $userId,
                    'business_name' => '',
                    'bio' => '',
                    'profile_image' => null,
                    'verification_status' => 'pending',
                    'status' => null,
                    'created_at' => null,
                    'full_name' => $user['full_name'] ?? '',
                    'email' => $user['email'] ?? '',
                    'phone' => $user['phone'] ?? ''
                ];
            }
            
            echo json_encode([
                'success' => true,
                'seller' => $seller
            ]);
            break;

        case 'PUT':
            // Update seller profile
            $rawInput = file_get_contents('php://input');
            $input = json_decode($rawInput, true);

            if (json_last_error() !== JSON_ERROR_NONE) {
                closeDBConnection($conn);
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Invalid JSON input']);
                exit;
            }

            $updates = [];
            $params = [];
            $types = '';

            // Update business name
            if (isset($input['business_name'])) {
                $updates[] = "business_name = ?";
                $params[] = trim($input['business_name']);
                $types .= 's';
            }

            // Update bio
            if (isset($input['bio'])) {
                $updates[] = "bio = ?";
                $params[] = trim($input['bio']);
                $types .= 's';
            }

            // Handle password change
            if (isset($input['new_password']) && !empty($input['new_password'])) {
                if (!isset($input['current_password']) || empty($input['current_password'])) {
                    closeDBConnection($conn);
                    http_response_code(400);
                    echo json_encode(['success' => false, 'message' => 'Current password is required to change password']);
                    exit;
                }

                // Verify current password
                $userQuery = "SELECT password FROM users WHERE id = ?";
                $userStmt = $conn->prepare($userQuery);
                $userStmt->bind_param("i", $userId);
                $userStmt->execute();
                $userResult = $userStmt->get_result();
                $user = $userResult->fetch_assoc();
                $userStmt->close();

                if (!$user || !password_verify($input['current_password'], $user['password'])) {
                    closeDBConnection($conn);
                    http_response_code(401);
                    echo json_encode(['success' => false, 'message' => 'Current password is incorrect']);
                    exit;
                }

                // Update password
                $hashedPassword = password_hash($input['new_password'], PASSWORD_DEFAULT);
                $passQuery = "UPDATE users SET password = ? WHERE id = ?";
                $passStmt = $conn->prepare($passQuery);
                $passStmt->bind_param("si", $hashedPassword, $userId);
                $passStmt->execute();
                $passStmt->close();
            }

            // Update seller profile if there are updates
            if (!empty($updates)) {
                // First check if seller profile exists for this user
                $checkQuery = "SELECT id FROM sellers WHERE user_id = ?";
                $checkStmt = $conn->prepare($checkQuery);
                $checkStmt->bind_param("i", $userId);
                $checkStmt->execute();
                $checkResult = $checkStmt->get_result();
                $existingSeller = $checkResult->fetch_assoc();
                $checkStmt->close();

                if ($existingSeller) {
                    // Update existing seller profile
                    $query = "UPDATE sellers SET " . implode(", ", $updates) . " WHERE user_id = ?";
                    $params[] = $userId;
                    $types .= 'i';

                    $stmt = $conn->prepare($query);
                    $stmt->bind_param($types, ...$params);
                    $stmt->execute();
                    $stmt->close();
                } else {
                    // Create new seller profile for this user
                    $businessName = isset($input['business_name']) ? trim($input['business_name']) : '';
                    $bio = isset($input['bio']) ? trim($input['bio']) : '';
                    
                    $insertQuery = "INSERT INTO sellers (user_id, business_name, bio, verification_status, created_at) VALUES (?, ?, ?, 'pending', NOW())";
                    $insertStmt = $conn->prepare($insertQuery);
                    $insertStmt->bind_param("iss", $userId, $businessName, $bio);
                    $insertStmt->execute();
                    $insertStmt->close();
                }

                // Update session if business name changed
                if (isset($input['business_name'])) {
                    $_SESSION['seller_business_name'] = trim($input['business_name']);
                }
            }

            closeDBConnection($conn);
            echo json_encode([
                'success' => true,
                'message' => 'Profile updated successfully'
            ]);
            break;

        default:
            closeDBConnection($conn);
            http_response_code(405);
            echo json_encode(['success' => false, 'message' => 'Method not allowed']);
            break;
    }
} catch (Exception $e) {
    error_log("Seller profile error: " . $e->getMessage());
    closeDBConnection($conn);
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'An error occurred while processing your request'
    ]);
}
