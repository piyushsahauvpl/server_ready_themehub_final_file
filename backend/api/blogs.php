<?php
/**
 * Public Blogs API
 * Returns only published blogs for public display
 * Endpoint: GET /api/blogs.php
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
    
    // Check if status column exists
    $checkStatus = $conn->query("SHOW COLUMNS FROM blogs LIKE 'status'");
    $hasStatusColumn = $checkStatus->num_rows > 0;
    
    // Get query parameters
    $id = $_GET['id'] ?? null;
    $slug = $_GET['slug'] ?? null;
    $page = intval($_GET['page'] ?? 1);
    $perPage = intval($_GET['per_page'] ?? 10);
    $perPage = min(max(1, $perPage), 200); // Limit between 1 and 200
    
    if ($id || $slug) {
        // Get single blog by ID or slug
        if ($hasStatusColumn) {
            $query = "SELECT * FROM blogs WHERE (id = ? OR slug = ?) AND (status = 'published' OR status IS NULL) LIMIT 1";
        } else {
            $query = "SELECT * FROM blogs WHERE (id = ? OR slug = ?) LIMIT 1";
        }
        $stmt = $conn->prepare($query);
        $searchValue = $id ?: $slug;
        $stmt->bind_param("is", $searchValue, $searchValue);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($result->num_rows > 0) {
            $blog = $result->fetch_assoc();
            // Fix image URL if needed
            if ($blog['image_url'] && !str_starts_with($blog['image_url'], 'http')) {
                $blog['image_url'] = 'https://uptulathemehub.com' . ($blog['image_url'][0] === '/' ? $blog['image_url'] : '/' . $blog['image_url']);
            }
            echo json_encode(['success' => true, 'data' => $blog]);
        } else {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Blog not found']);
        }
        $stmt->close();
    } else {
        // Get list of published blogs with pagination
        $offset = ($page - 1) * $perPage;
        
        // Get total count
        if ($hasStatusColumn) {
            $countQuery = "SELECT COUNT(*) as total FROM blogs WHERE status = 'published' OR status IS NULL";
        } else {
            $countQuery = "SELECT COUNT(*) as total FROM blogs";
        }
        $countResult = $conn->query($countQuery);
        $total = $countResult->fetch_assoc()['total'];
        
        // Get blogs
        if ($hasStatusColumn) {
            $query = "SELECT * FROM blogs WHERE status = 'published' OR status IS NULL ORDER BY created_at DESC LIMIT ? OFFSET ?";
        } else {
            $query = "SELECT * FROM blogs ORDER BY created_at DESC LIMIT ? OFFSET ?";
        }
        $stmt = $conn->prepare($query);
        $stmt->bind_param("ii", $perPage, $offset);
        $stmt->execute();
        $result = $stmt->get_result();
        
        $blogs = [];
        while ($row = $result->fetch_assoc()) {
            // Fix image URL if needed
            if ($row['image_url'] && !str_starts_with($row['image_url'], 'http')) {
                $row['image_url'] = 'https://uptulathemehub.com' . ($row['image_url'][0] === '/' ? $row['image_url'] : '/' . $row['image_url']);
            }
            $blogs[] = $row;
        }
        
        $stmt->close();
        closeDBConnection($conn);
        
        echo json_encode([
            'success' => true,
            'data' => $blogs,
            'meta' => [
                'page' => $page,
                'per_page' => $perPage,
                'total' => $total,
                'total_pages' => ceil($total / $perPage)
            ]
        ]);
    }
} catch (Exception $e) {
    error_log("Blogs API error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Server error']);
}
