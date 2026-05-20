<?php
/**
 * Public Frameworks API
 * Endpoint: GET /api/frameworks.php
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

ob_end_clean();

try {
    $conn = getDBConnection();
    $result = $conn->query("SELECT * FROM frameworks ORDER BY name ASC");
    
    $frameworks = [];
    while ($row = $result->fetch_assoc()) {
        $frameworks[] = $row;
    }
    
    closeDBConnection($conn);
    
    echo json_encode(['success' => true, 'frameworks' => $frameworks]);
} catch (Exception $e) {
    error_log("Frameworks API error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Server error']);
}
