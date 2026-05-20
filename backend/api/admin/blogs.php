<?php
/**
 * Blogs CRUD API
 * Endpoint: /api/admin/blogs.php
 */

require_once '../../config/cors.php';
require_once '../../config/database.php';

// Session configuration must be set BEFORE session_start()
ini_set('session.cookie_httponly', 1);
ini_set('session.cookie_secure', 1); // Set to 1 in production with HTTPS
ini_set('session.use_only_cookies', 1);
ini_set('session.cookie_samesite', 'Lax'); // Allow cross-site cookie transmission
ini_set('session.cookie_path', '/'); // Ensure cookie is accessible from all paths

session_name('ADMINSESSID');
session_start();

// Check authentication - only for non-GET requests
$method = $_SERVER['REQUEST_METHOD'];
$isAdmin = isset($_SESSION['admin_id']) && !empty($_SESSION['admin_id']);

if ($method !== 'GET' && !$isAdmin) {
    // Log the issue for debugging
    error_log("Unauthorized blog request - Session info: " . json_encode([
        'has_admin_id' => isset($_SESSION['admin_id']),
        'session_id' => session_id(),
        'session_data' => $_SESSION,
        'cookies' => $_COOKIE
    ]));
    
    http_response_code(401);
    echo json_encode([
        'success' => false, 
        'message' => 'Unauthorized - Please login again',
        'debug' => [
            'session_id' => session_id(),
            'has_admin_id' => isset($_SESSION['admin_id']),
            'has_session_data' => !empty($_SESSION)
        ]
    ]);
    exit;
}

$conn = getDBConnection();

// Handle file uploads directory
$uploadDir = '../../uploads/blogs/';
if (!file_exists($uploadDir)) {
    mkdir($uploadDir, 0777, true);
}

switch ($method) {
    case 'GET':
        // List all blogs or get single blog
        $id = $_GET['id'] ?? null;
        
        if ($id) {
            // Get single blog
            $stmt = $conn->prepare("SELECT * FROM blogs WHERE id=?");
            $stmt->bind_param("i", $id);
            $stmt->execute();
            $result = $stmt->get_result();
            
            if ($result->num_rows > 0) {
                echo json_encode(['success' => true, 'blog' => $result->fetch_assoc()]);
            } else {
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'Blog not found']);
            }
            $stmt->close();
        } else {
            // List all blogs
            $result = $conn->query("SELECT * FROM blogs ORDER BY created_at DESC");
            $blogs = [];
            while ($row = $result->fetch_assoc()) {
                $blogs[] = $row;
            }
            echo json_encode(['success' => true, 'blogs' => $blogs]);
        }
        break;
        
    case 'POST':
        // Create new blog
        $title = $_POST['title'] ?? '';
        $content = $_POST['content'] ?? '';
        
        if (empty($title) || empty($content)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Title and content are required']);
            break;
        }
        
        // Generate slug
        $slug = strtolower(trim(preg_replace('/[^A-Za-z0-9-]+/', '-', $title)));
        
        // Handle image upload
        $image_url = null;
        if (isset($_FILES['image']) && $_FILES['image']['error'] === UPLOAD_ERR_OK) {
            $imageExt = pathinfo($_FILES['image']['name'], PATHINFO_EXTENSION);
            $imageName = uniqid() . '.' . $imageExt;
            $imagePath = $uploadDir . $imageName;
            
            if (move_uploaded_file($_FILES['image']['tmp_name'], $imagePath)) {
                $image_url = '/backend/uploads/blogs/' . $imageName;
            }
        }
        
        // Check if status column exists, if not add it
        $checkStatus = $conn->query("SHOW COLUMNS FROM blogs LIKE 'status'");
        if ($checkStatus->num_rows === 0) {
            $conn->query("ALTER TABLE blogs ADD COLUMN status VARCHAR(20) DEFAULT 'published' AFTER image_url");
        }
        
        // Set status to 'published' by default for admin-created blogs
        // This ensures they appear on the public blog page
        $status = $_POST['status'] ?? 'published';
        
        $stmt = $conn->prepare("INSERT INTO blogs (title, slug, content, image_url, status) VALUES (?, ?, ?, ?, ?)");
        $stmt->bind_param("sssss", $title, $slug, $content, $image_url, $status);
        
        if ($stmt->execute()) {
            echo json_encode([
                'success' => true,
                'message' => 'Blog created successfully',
                'blog_id' => $conn->insert_id
            ]);
        } else {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Failed to create blog']);
        }
        $stmt->close();
        break;
        
    case 'PUT':
        // Update blog
        $input = json_decode(file_get_contents('php://input'), true);
        $id = intval($input['id'] ?? 0);
        $title = $input['title'] ?? '';
        $content = $input['content'] ?? '';
        
        if ($id === 0 || empty($title) || empty($content)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'ID, title, and content are required']);
            break;
        }
        
        // Generate slug
        $slug = strtolower(trim(preg_replace('/[^A-Za-z0-9-]+/', '-', $title)));
        
        $stmt = $conn->prepare("UPDATE blogs SET title=?, slug=?, content=? WHERE id=?");
        $stmt->bind_param("sssi", $title, $slug, $content, $id);
        
        if ($stmt->execute()) {
            echo json_encode(['success' => true, 'message' => 'Blog updated successfully']);
        } else {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Failed to update blog']);
        }
        $stmt->close();
        break;
        
    case 'DELETE':
        // Delete blog
        $input = json_decode(file_get_contents('php://input'), true);
        $id = intval($input['id'] ?? 0);
        
        if ($id === 0) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Blog ID is required']);
            break;
        }
        
        // Get image path before deleting
        $stmt = $conn->prepare("SELECT image_url FROM blogs WHERE id=?");
        $stmt->bind_param("i", $id);
        $stmt->execute();
        $result = $stmt->get_result();
        $blog = $result->fetch_assoc();
        $stmt->close();
        
        // Delete blog
        $stmt = $conn->prepare("DELETE FROM blogs WHERE id=?");
        $stmt->bind_param("i", $id);
        
        if ($stmt->execute()) {
            // Delete associated image
            if ($blog['image_url']) {
                $imagePath = '../../' . ltrim($blog['image_url'], '/');
                if (file_exists($imagePath)) unlink($imagePath);
            }
            
            echo json_encode(['success' => true, 'message' => 'Blog deleted successfully']);
        } else {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Failed to delete blog']);
        }
        $stmt->close();
        break;
        
    default:
        http_response_code(405);
        echo json_encode(['success' => false, 'message' => 'Method not allowed']);
}

closeDBConnection($conn);
