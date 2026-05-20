<?php
/**
 * User Profile API
 * Endpoint: GET /api/profile.php (get profile)
 * Endpoint: PUT /api/profile.php (update profile)
 */

error_reporting(E_ALL);
ini_set('display_errors', 0);
ob_start();

// Handle CORS and OPTIONS request FIRST
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    header_remove();
    header('Access-Control-Allow-Origin: https://uptulathemehub.com');
    header('Access-Control-Allow-Methods: GET, POST, PUT, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, X-Requested-With, Accept');
    header('Access-Control-Allow-Credentials: true');
    header('Access-Control-Max-Age: 86400');
    http_response_code(200);
    ob_end_clean();
    exit();
}

// Set CORS headers
header_remove('Access-Control-Allow-Origin');
header_remove('Access-Control-Allow-Methods');
header_remove('Access-Control-Allow-Headers');
header_remove('Access-Control-Allow-Credentials');

header('Access-Control-Allow-Origin: https://uptulathemehub.com');
header('Access-Control-Allow-Methods: GET, POST, PUT, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-Requested-With, Accept');
header('Access-Control-Allow-Credentials: true');
header('Content-Type: application/json; charset=utf-8');

require_once '../config/database.php';

// Start session
session_start();
ob_end_clean();

// Check authentication
if (!isset($_SESSION['logged_in']) || $_SESSION['logged_in'] !== true) {
    http_response_code(401);
    echo json_encode([
        'success' => false,
        'message' => 'Unauthorized'
    ]);
    exit;
}

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode([
        'success' => false,
        'message' => 'User ID not found in session'
    ]);
    exit;
}

$userId = $_SESSION['user_id'];
$method = $_SERVER['REQUEST_METHOD'];

try {
    $conn = getDBConnection();

    switch ($method) {
        case 'GET':
            // Get user profile
            $requestUserId = $_GET['user_id'] ?? $userId;
            
            // Users can only view their own profile
            if ($requestUserId != $userId) {
                http_response_code(403);
                echo json_encode([
                    'success' => false,
                    'message' => 'Forbidden'
                ]);
                exit;
            }

            // Check if photo_url column exists, if not use a query without it
            $columns = $conn->query("SHOW COLUMNS FROM users LIKE 'photo_url'");
            $hasPhotoUrl = $columns->num_rows > 0;
            
            if ($hasPhotoUrl) {
                $stmt = $conn->prepare("SELECT id, full_name, email, phone, photo_url, role, status, created_at FROM users WHERE id = ?");
            } else {
                $stmt = $conn->prepare("SELECT id, full_name, email, phone, role, status, created_at FROM users WHERE id = ?");
            }
            
            $stmt->bind_param("i", $userId);
            $stmt->execute();
            $result = $stmt->get_result();
            
            if ($result->num_rows === 0) {
                $stmt->close();
                closeDBConnection($conn);
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'message' => 'User not found'
                ]);
                exit;
            }

            $user = $result->fetch_assoc();
            // If photo_url column doesn't exist, set it to null
            if (!$hasPhotoUrl) {
                $user['photo_url'] = null;
            }
            $stmt->close();
            closeDBConnection($conn);

            echo json_encode([
                'success' => true,
                'user' => $user
            ]);
            break;

        case 'PUT':
        case 'POST':
            // Update user profile
            // Support both POST (traditional FormData) and PUT (API clients)
            $fullName = '';
            $phone = '';

            if ($_SERVER['REQUEST_METHOD'] === 'POST') {
                // Normal form POST: PHP fills $_POST and $_FILES
                $fullName = trim($_POST['full_name'] ?? '');
                $phone = trim($_POST['phone'] ?? '');
            } else {
                // PUT: Handle FormData vs. raw input
                $putData = [];
                if (!empty($_SERVER['CONTENT_TYPE']) && strpos($_SERVER['CONTENT_TYPE'], 'multipart/form-data') !== false) {
                    // FormData - many PHP setups don't populate $_POST/$_FILES for PUT
                    // Try to fallback to parsing input stream if possible
                    // Note: For browser FormData with PUT, it's more reliable to use POST.
                    $fullName = trim($_POST['full_name'] ?? '');
                    $phone = trim($_POST['phone'] ?? '');
                } else {
                    // JSON or other format - parse input stream
                    $rawInput = file_get_contents('php://input');
                    parse_str($rawInput, $putData);
                    $fullName = trim($putData['full_name'] ?? '');
                    $phone = trim($putData['phone'] ?? '');
                }
            }

            // Validate input
            if (empty($fullName)) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Full name is required'
                ]);
                exit;
            }

            if (strlen($fullName) < 2 || strlen($fullName) > 255) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Full name must be between 2 and 255 characters'
                ]);
                exit;
            }

            // Handle photo upload
            $photoUrl = null;
            if (isset($_FILES['photo']) && $_FILES['photo']['error'] === UPLOAD_ERR_OK) {
                $file = $_FILES['photo'];
                
                // Validate file
                $allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
                $maxSize = 5 * 1024 * 1024; // 5MB
                
                if (!in_array($file['type'], $allowedTypes)) {
                    http_response_code(400);
                    echo json_encode([
                        'success' => false,
                        'message' => 'Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.'
                    ]);
                    exit;
                }
                
                if ($file['size'] > $maxSize) {
                    http_response_code(400);
                    echo json_encode([
                        'success' => false,
                        'message' => 'File size must be less than 5MB'
                    ]);
                    exit;
                }

                // Create upload directory if it doesn't exist
                $uploadDir = '../../uploads/profiles/';
                if (!file_exists($uploadDir)) {
                    mkdir($uploadDir, 0777, true);
                }

                // Generate unique filename
                $ext = pathinfo($file['name'], PATHINFO_EXTENSION);
                $filename = 'profile_' . $userId . '_' . time() . '.' . $ext;
                $filepath = $uploadDir . $filename;

                // Check if photo_url column exists before trying to upload
                $columns = $conn->query("SHOW COLUMNS FROM users LIKE 'photo_url'");
                $hasPhotoUrl = $columns->num_rows > 0;
                
                if (!$hasPhotoUrl) {
                    // Add photo_url column if it doesn't exist
                    $conn->query("ALTER TABLE users ADD COLUMN photo_url VARCHAR(500) DEFAULT NULL AFTER phone");
                }
                
                // Move uploaded file
                if (move_uploaded_file($file['tmp_name'], $filepath)) {
                    // Delete old photo if exists
                    $stmt = $conn->prepare("SELECT photo_url FROM users WHERE id = ?");
                    $stmt->bind_param("i", $userId);
                    $stmt->execute();
                    $result = $stmt->get_result();
                    if ($result->num_rows > 0) {
                        $oldUser = $result->fetch_assoc();
                        if ($oldUser['photo_url'] && file_exists('../../' . $oldUser['photo_url'])) {
                            unlink('../../' . $oldUser['photo_url']);
                        }
                    }
                    $stmt->close();

                    $photoUrl = '/backend/uploads/profiles/' . $filename;
                } else {
                    http_response_code(500);
                    echo json_encode([
                        'success' => false,
                        'message' => 'Failed to upload photo'
                    ]);
                    exit;
                }
            }

            // Check if photo_url column exists
            $columns = $conn->query("SHOW COLUMNS FROM users LIKE 'photo_url'");
            $hasPhotoUrl = $columns->num_rows > 0;
            
            // Update user profile
            if ($photoUrl && $hasPhotoUrl) {
                $stmt = $conn->prepare("UPDATE users SET full_name = ?, phone = ?, photo_url = ? WHERE id = ?");
                $stmt->bind_param("sssi", $fullName, $phone, $photoUrl, $userId);
            } else {
                $stmt = $conn->prepare("UPDATE users SET full_name = ?, phone = ? WHERE id = ?");
                $stmt->bind_param("ssi", $fullName, $phone, $userId);
            }

            if (!$stmt->execute()) {
                throw new Exception("Update failed: " . $stmt->error);
            }

            $stmt->close();

            // Get updated user data
            $columns = $conn->query("SHOW COLUMNS FROM users LIKE 'photo_url'");
            $hasPhotoUrl = $columns->num_rows > 0;
            
            if ($hasPhotoUrl) {
                $stmt = $conn->prepare("SELECT id, full_name, email, phone, photo_url, role, status, created_at FROM users WHERE id = ?");
            } else {
                $stmt = $conn->prepare("SELECT id, full_name, email, phone, role, status, created_at FROM users WHERE id = ?");
            }
            $stmt->bind_param("i", $userId);
            $stmt->execute();
            $result = $stmt->get_result();
            $updatedUser = $result->fetch_assoc();
            if (!$hasPhotoUrl) {
                $updatedUser['photo_url'] = null;
            }
            $stmt->close();
            closeDBConnection($conn);

            echo json_encode([
                'success' => true,
                'message' => 'Profile updated successfully',
                'user' => $updatedUser
            ]);
            break;

        default:
            http_response_code(405);
            echo json_encode([
                'success' => false,
                'message' => 'Method not allowed'
            ]);
            break;
    }

} catch (Exception $e) {
    error_log("Profile API error: " . $e->getMessage());
    error_log("Profile API error trace: " . $e->getTraceAsString());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Server error: ' . $e->getMessage()
    ]);
}
