<?php
/**
 * Test CORS Configuration
 * Use this to verify CORS is working correctly
 */

require_once '../../config/cors.php';

echo json_encode([
    'success' => true,
    'message' => 'CORS is working correctly',
    'timestamp' => date('Y-m-d H:i:s'),
    'method' => $_SERVER['REQUEST_METHOD']
]);
