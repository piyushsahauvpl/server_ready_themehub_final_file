<?php
/**
 * Seller Status Check API
 * GET /api/seller/check.php
 */

error_reporting(E_ALL);
ini_set('display_errors', 0);

// 🔐 CORS (adjust ports if needed)
$allowedOrigins = [
    "https://uptulathemehub.com",
    "https://www.uptulathemehub.com",
    "https://uptulathemehub.com",
];

if (isset($_SERVER['HTTP_ORIGIN']) && in_array($_SERVER['HTTP_ORIGIN'], $allowedOrigins)) {
    header("Access-Control-Allow-Origin: " . $_SERVER['HTTP_ORIGIN']);
}

header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode([
        'success' => false,
        'message' => 'Method not allowed'
    ]);
    exit;
}

require_once '../../config/database.php';

// 🔐 session config (important for Chrome)
session_set_cookie_params([
    'lifetime' => 0,
    'path' => '/',
    'httponly' => true,
    'samesite' => 'None',
    'secure' => true, // true only in HTTPS
]);
session_start();

// ✅ If not logged in as either a regular user or seller, return success with null seller.
if (!isset($_SESSION['user_id']) && !isset($_SESSION['seller_user_id']) && !isset($_SESSION['seller_id'])) {
    echo json_encode([
        'success' => true,
        'seller' => null
    ]);
    exit;
}

$userId = isset($_SESSION['user_id']) ? (int) $_SESSION['user_id'] : (isset($_SESSION['seller_user_id']) ? (int) $_SESSION['seller_user_id'] : null);
$sellerSessionId = isset($_SESSION['seller_id']) ? (int) $_SESSION['seller_id'] : null;

try {
    $conn = getDBConnection();

    if ($sellerSessionId) {
        $stmt = $conn->prepare("
            SELECT
                id,
                status,
                verified_by_admin,
                payment_confirmed,
                rejection_reason,
                business_name,
                bio,
                mobile,
                category
            FROM sellers
            WHERE id = ?
            LIMIT 1
        ");
        $stmt->bind_param("i", $sellerSessionId);
    } else {
        $stmt = $conn->prepare("
            SELECT
                id,
                status,
                verified_by_admin,
                payment_confirmed,
                rejection_reason,
                business_name,
                bio,
                mobile,
                category
            FROM sellers
            WHERE user_id = ?
            LIMIT 1
        ");
        $stmt->bind_param("i", $userId);
    }
    $stmt->execute();
    $result = $stmt->get_result();

    // ❌ user never applied as seller
    if ($result->num_rows === 0) {
        echo json_encode([
            'success' => true,
            'seller' => null
        ]);
        exit;
    }

    $seller = $result->fetch_assoc();
    $stmt->close();
    closeDBConnection($conn);

    // ✅ derived fields (single truth)
    $verificationStatus = 'pending'; // default
    
    if ((int)$seller['verified_by_admin'] === 1) {
        $verificationStatus = 'approved';
    } elseif ((int)$seller['verified_by_admin'] === 0 && !empty($seller['rejection_reason'])) {
        $verificationStatus = 'rejected';
    }

    // ✅ FINAL ACTIVE LOGIC (IMPORTANT)
    $isActive =
        ((int) $seller['verified_by_admin'] === 1) &&
        ((int) $seller['payment_confirmed'] === 1);

    echo json_encode([
        'success' => true,
        'seller' => [
            'seller_id'           => (int) $seller['id'],
            'user_id'             => $userId,
            'verification_status' => $verificationStatus,
            'payment_confirmed'   => (int) $seller['payment_confirmed'],
            'rejection_reason'    => $seller['rejection_reason'],
            'business_name'       => $seller['business_name'],
            'business_description'=> $seller['bio'],
            'mobile'              => $seller['mobile'],
            'category'            => $seller['category'],
            'status'              => $seller['status'], // kept for reference
            'is_active'           => $isActive
        ]
    ]);
    exit;

} catch (Throwable $e) {
    error_log('seller/check.php error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Server error'
    ]);
    exit;
}
