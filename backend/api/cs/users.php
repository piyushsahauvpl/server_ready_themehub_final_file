<?php
/**
 * CS Users API - Search and get user details
 * Endpoint: GET /api/cs/users.php?id={id} or ?email={email}
 */
 
error_reporting(E_ALL);
ini_set('display_errors', 0);
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: https://uptulathemehub.com');
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
 
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}
 
require_once __DIR__ . '/../../middleware/auth.php';
require_once __DIR__ . '/../../config/database.php';
 
// Start session for session-based auth fallback
if (session_status() === PHP_SESSION_NONE) {
    @session_start();
}
 
try {
    $payload = require_jwt(['CUSTOMER_SUPPORT', 'ADMIN']);
   
    $conn = getDBConnection();
   
    $userId = $_GET['id'] ?? null;
    $userEmail = $_GET['email'] ?? null;
 
    // If id or email provided -> return single user
    if ($userId || $userEmail) {
        if ($userId) {
            $stmt = $conn->prepare("SELECT id, full_name, email, phone, photo_url, role, status, created_at FROM users WHERE id = ?");
            $stmt->bind_param("i", $userId);
        } else {
            $stmt = $conn->prepare("SELECT id, full_name, email, phone, photo_url, role, status, created_at FROM users WHERE email = ?");
            $stmt->bind_param("s", $userEmail);
        }
 
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
 
        // Fix photo URL if relative
        if (!empty($user['photo_url']) && !str_starts_with($user['photo_url'], 'http')) {
            $user['photo_url'] = 'https://uptulathemehub.com' . ($user['photo_url'][0] === '/' ? $user['photo_url'] : '/' . $user['photo_url']);
        }
 
        $stmt->close();
        closeDBConnection($conn);
 
        echo json_encode([
            'success' => true,
            'user' => $user
        ]);
        exit;
    }
 
    // Otherwise return paginated list for CS dashboard
    $page = max(1, intval($_GET['page'] ?? 1));
    $per_page = max(1, intval($_GET['per_page'] ?? 8));
    $offset = ($page - 1) * $per_page;
 
    $search = trim($_GET['search'] ?? '');
 
    $baseQuery = "SELECT SQL_CALC_FOUND_ROWS id, full_name, email, phone, photo_url, role, status, created_at FROM users WHERE 1=1";
    $params = [];
    $types = '';
 
    if ($search !== '') {
        $baseQuery .= " AND (full_name LIKE ? OR email LIKE ?)";
        $searchTerm = "%$search%";
        $params[] = $searchTerm;
        $params[] = $searchTerm;
        $types .= 'ss';
    }
 
    $baseQuery .= " ORDER BY created_at DESC LIMIT ?, ?";
    $params[] = $offset;
    $params[] = $per_page;
    $types .= 'ii';
 
    $stmt = $conn->prepare($baseQuery);
    if ($types !== '') {
        $stmt->bind_param($types, ...$params);
    }
 
    $stmt->execute();
    $result = $stmt->get_result();
 
    $users = [];
    while ($row = $result->fetch_assoc()) {
        if (!empty($row['photo_url']) && !str_starts_with($row['photo_url'], 'http')) {
            $row['photo_url'] = 'https://uptulathemehub.com' . ($row['photo_url'][0] === '/' ? $row['photo_url'] : '/' . $row['photo_url']);
        }
        $users[] = $row;
    }
 
    // Get total rows
    $countRes = $conn->query("SELECT FOUND_ROWS() as total");
    $total = ($countRes && $countRes->num_rows) ? intval($countRes->fetch_assoc()['total']) : count($users);
 
    $stmt->close();
    closeDBConnection($conn);
 
    echo json_encode([
        'success' => true,
        'users' => $users,
        'meta' => [
            'page' => $page,
            'per_page' => $per_page,
            'total' => $total
        ]
    ]);
   
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Server error',
        'error' => $e->getMessage()
    ]);
}
 
 
