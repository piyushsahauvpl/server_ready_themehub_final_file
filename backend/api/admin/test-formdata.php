<?php
/**
 * Test FormData endpoint
 * Use this to verify FormData is being received correctly
 */

// Handle CORS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    header_remove();
    header('Access-Control-Allow-Origin: https://uptulathemehub.com');
    header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type');
    header('Access-Control-Allow-Credentials: true');
    http_response_code(200);
    exit();
}

header_remove('Access-Control-Allow-Origin');
header('Access-Control-Allow-Origin: https://uptulathemehub.com');
header('Access-Control-Allow-Credentials: true');
header('Content-Type: application/json; charset=utf-8');

$response = [
    'success' => true,
    'method' => $_SERVER['REQUEST_METHOD'] ?? 'NOT SET',
    'content_type' => $_SERVER['CONTENT_TYPE'] ?? 'NOT SET',
    'post_data' => $_POST,
    'files_data' => [],
    'post_keys' => array_keys($_POST),
    'has_files' => !empty($_FILES)
];

// List files without exposing full paths
foreach ($_FILES as $key => $file) {
    $response['files_data'][$key] = [
        'name' => $file['name'] ?? 'N/A',
        'type' => $file['type'] ?? 'N/A',
        'size' => $file['size'] ?? 0,
        'error' => $file['error'] ?? 'N/A'
    ];
}

echo json_encode($response, JSON_PRETTY_PRINT);
