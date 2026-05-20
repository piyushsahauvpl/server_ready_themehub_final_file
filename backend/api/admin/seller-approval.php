<?php
error_reporting(E_ALL);
ini_set('display_errors', 0);

header('Access-Control-Allow-Origin: https://uptulathemehub.com');
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../middleware/auth.php';

require_jwt(['ADMIN']);

try {
    $conn = getDBConnection();

    /**
     * ✅ SELLERS WAITING FOR ADMIN APPROVAL
     * verified_by_admin = 0 (NOT approved yet)
     */
    $sql = "
        SELECT
            s.id,
            s.user_id,
            u.full_name,
            u.email,
            s.business_name,
            s.bio AS business_description,
            s.mobile AS phone,
            s.category AS business_category,
            s.created_at
        FROM sellers s
        JOIN users u ON u.id = s.user_id
        WHERE s.verified_by_admin = 0 OR s.verified_by_admin IS NULL
        ORDER BY s.created_at DESC
    ";

    $stmt = $conn->prepare($sql);
    $stmt->execute();
    $result = $stmt->get_result();

    $sellers = [];
    while ($row = $result->fetch_assoc()) {
        $sellers[] = $row;
    }

    $stmt->close();
    closeDBConnection($conn);

    echo json_encode([
        'success' => true,
        'count'   => count($sellers),
        'sellers' => $sellers
    ]);
    exit;

} catch (Throwable $e) {
    error_log('seller-approval error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Server error'
    ]);
    exit;
}
