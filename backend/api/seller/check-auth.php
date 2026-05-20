<?php
/**
 * Seller Authentication Check
 * Endpoint: GET /api/seller/check-auth.php
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

require_once '../../config/database.php';

session_start();
ob_end_clean();

// FIRST: seller-specific session
if (isset($_SESSION['seller_logged_in']) && $_SESSION['seller_logged_in'] === true && isset($_SESSION['seller_id'])) {
    // Make sure regular user session is NOT active (seller should not have logged_in set)
    if (isset($_SESSION['logged_in']) && !isset($_SESSION['seller_id'])) {
        echo json_encode([
            'success' => true,
            'authenticated' => false,
            'seller' => null,
            'message' => 'Regular user session active, not seller'
        ]);
        exit;
    }
    echo json_encode([
        'success' => true,
        'authenticated' => true,
        'seller' => [
            'id' => $_SESSION['seller_id'] ?? null,
            'user_id' => $_SESSION['seller_user_id'] ?? null,
            'email' => $_SESSION['seller_email'] ?? null,
            'name' => $_SESSION['seller_name'] ?? null,
            'business_name' => $_SESSION['seller_business_name'] ?? null,
            'verification_status' => $_SESSION['seller_verification_status'] ?? null
        ]
    ]);
    exit;
}

// SECOND: fallback for a regular user session who is also a seller
if (isset($_SESSION['user_id']) && empty($_SESSION['seller_logged_in'])) {
    $userId = (int) $_SESSION['user_id'];
    try {
        $conn = getDBConnection();
        $stmt = $conn->prepare("SELECT id, business_name, verified_by_admin, payment_confirmed FROM sellers WHERE user_id = ? LIMIT 1");
        $stmt->bind_param('i', $userId);
        $stmt->execute();
        $sellerRow = $stmt->get_result()->fetch_assoc();
        $stmt->close();
        closeDBConnection($conn);

        if ($sellerRow) {
            echo json_encode([
                'success' => true,
                'authenticated' => true,
                'seller' => [
                    'id' => (int) $sellerRow['id'],
                    'user_id' => $userId,
                    'business_name' => $sellerRow['business_name'],
                    'verification_status' => ((int) $sellerRow['verified_by_admin'] === 1 ? 'approved' : 'pending'),
                    'payment_confirmed' => (int) $sellerRow['payment_confirmed']
                ]
            ]);
            exit;
        }
    } catch (Throwable $e) {
        error_log('seller/check-auth.php error: ' . $e->getMessage());
    }
}

// Default: not authenticated as seller
echo json_encode([
    'success' => true,
    'authenticated' => false,
    'seller' => null
]);
