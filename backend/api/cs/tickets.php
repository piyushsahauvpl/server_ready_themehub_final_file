<?php
/**
 * CS Tickets API - Simplified
 * Endpoint: GET /api/cs/tickets.php
 * Returns tickets for customer support dashboard
 */
 
// Allow CORS for local dev (frontend at https://uptulathemehub.com)
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$allowed_origin = 'https://uptulathemehub.com';
if ($origin === $allowed_origin) {
    header('Access-Control-Allow-Origin: ' . $allowed_origin);
} else {
    header('Access-Control-Allow-Origin: ' . $allowed_origin);
}
header('Access-Control-Allow-Credentials: true');
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-Requested-With, Accept, Authorization');
 
// Respond to preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}
 
require_once __DIR__ . '/../../config/database.php';
 
try {
    $conn = getDBConnection();
   
    // Get all tickets with all columns
    $query = "SELECT * FROM tickets ORDER BY created_at DESC";
   
    $result = $conn->query($query);
   
    if (!$result) {
        throw new Exception("Query failed: " . $conn->error);
    }
   
    $tickets = [];
    while ($row = $result->fetch_assoc()) {
        // Normalize status to uppercase
        $status = isset($row['status']) ? strtoupper($row['status']) : 'OPEN';
        $priority = isset($row['priority']) ? strtoupper($row['priority']) : 'LOW';
       
        $tickets[] = [
            'id' => $row['id'] ?? null,
            'ticket_number' => $row['ticket_number'] ?? null,
            'subject' => $row['subject'] ?? null,
            'status' => $status,
            'priority' => $priority,
            'created_by_id' => $row['created_by_id'] ?? null,
            'created_at' => $row['created_at'] ?? null,
            'updated_at' => $row['updated_at'] ?? null
        ];
    }
   
    $conn->close();
   
    echo json_encode([
        'success' => true,
        'tickets' => $tickets,
        'count' => count($tickets)
    ]);
   
} catch (Exception $e) {
    error_log("CS Tickets API error: " . $e->getMessage());
    echo json_encode([
        'success' => false,
        'message' => 'Failed to fetch tickets',
        'error' => $e->getMessage()
    ]);
}
?>
 
 