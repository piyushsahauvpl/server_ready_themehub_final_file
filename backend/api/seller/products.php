<?php
/**
 * Seller Products API - FULL PRODUCTION VERSION
 * Synchronized with Local Logic: GET, POST, PUT, DELETE
 */

session_start();
error_reporting(E_ALL);
ini_set('display_errors', 0); // Production safety: log errors, don't show them
ob_start();

/* ================= 1. CORS & HEADERS (Production Config) ================= */
$origin = 'https://uptulathemehub.com';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    header_remove();
    header("Access-Control-Allow-Origin: $origin");
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type');
    header('Access-Control-Allow-Credentials: true');
    http_response_code(200);
    ob_end_clean();
    exit();
}

header("Access-Control-Allow-Origin: $origin");
header('Access-Control-Allow-Credentials: true');
header('Content-Type: application/json; charset=utf-8');

/* ================= 2. AUTH & DATABASE ================= */
require_once '../../config/database.php';

// Verification: User must be logged in and upgraded to a confirmed seller
if (!isset($_SESSION['user_id'])) {
    ob_end_clean();
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

$conn = getDBConnection();
$method = $_SERVER['REQUEST_METHOD'];

$stmt = $conn->prepare("SELECT id FROM sellers WHERE user_id = ? AND payment_confirmed = 1");
$stmt->bind_param("i", $_SESSION['user_id']);
$stmt->execute();
$seller = $stmt->get_result()->fetch_assoc();

if (!$seller) {
    ob_end_clean();
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Seller account not active']);
    exit;
}

$seller_id = (int)$seller['id'];
ob_end_clean();

/* ================= 3. GET (LIST/SINGLE) ================= */
if ($method === 'GET') {
    $id = $_GET['id'] ?? null;
    if ($id) {
        $stmt = $conn->prepare("SELECT * FROM products WHERE id = ? AND seller_id = ?");
        $stmt->bind_param("ii", $id, $seller_id);
    } else {
        $stmt = $conn->prepare("SELECT p.*, c.name AS category_name, f.name AS framework_name 
                                FROM products p 
                                LEFT JOIN categories c ON p.category_id = c.id 
                                LEFT JOIN frameworks f ON p.framework_id = f.id 
                                WHERE p.seller_id = ? ORDER BY p.created_at DESC");
        $stmt->bind_param("i", $seller_id);
    }
    $stmt->execute();
    $result = $stmt->get_result();
    echo json_encode(['success' => true, $id ? 'product' : 'products' => $id ? $result->fetch_assoc() : $result->fetch_all(MYSQLI_ASSOC)]);
    exit;
}

/* ================= 4. DELETE (REMOVE) ================= */
if ($method === 'DELETE') {
    $id = $_GET['id'] ?? null;
    if (!$id) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'ID required']);
        exit;
    }
    
    // Only delete if seller owns the product
    $stmt = $conn->prepare("DELETE FROM products WHERE id = ? AND seller_id = ?");
    $stmt->bind_param("ii", $id, $seller_id);
    if ($stmt->execute()) {
        echo json_encode(['success' => true, 'message' => 'Product deleted successfully']);
    }
    exit;
}

/* ================= 5. POST & PUT (ADD & EDIT) ================= */
if ($method === 'POST' || $method === 'PUT') {
    $id = ($method === 'PUT') ? ($_GET['id'] ?? null) : null;

    // --- MANUAL MULTIPART PARSER (Fixes Edit/File issues on Server) ---
    if ($method === 'PUT') {
        $contentType = $_SERVER['CONTENT_TYPE'] ?? '';
        if (preg_match('/boundary=([^;\r\n]+)/', $contentType, $m)) {
            $boundary = trim($m[1], '"');
            $input = file_get_contents("php://input");
            $parts = preg_split('/--' . preg_quote($boundary) . '(--)?\r?\n/', $input);
            foreach ($parts as $part) {
                if (empty(trim($part)) || $part === '--') continue;
                $split = preg_split('/\r?\n\r?\n/', $part, 2);
                if (count($split) !== 2) continue;
                list($head, $body) = $split;
                $body = preg_replace('/\r?\n$/', '', $body);
                $name = ''; $filename = '';
                if (preg_match('/name="([^"]*)"/', $head, $m)) $name = $m[1];
                if (preg_match('/filename="([^"]*)"/', $head, $m)) $filename = $m[1];
                if (!empty($filename)) {
                    $tmp = tempnam(sys_get_temp_dir(), 'upl');
                    file_put_contents($tmp, $body);
                    $_FILES[$name] = ['name' => $filename, 'tmp_name' => $tmp, 'size' => strlen($body), 'error' => 0];
                } else { $_POST[$name] = $body; }
            }
        }
    }

    // --- DATA PREPARATION ---
    $name = trim($_POST['name'] ?? '');
    $description = trim($_POST['description'] ?? '');
    $category_id = !empty($_POST['category_id']) ? intval($_POST['category_id']) : null;
    $framework_id = !empty($_POST['framework_id']) ? intval($_POST['framework_id']) : null;
    $price = (float)($_POST['price'] ?? 0);
    $offer_price = (isset($_POST['offer_price']) && $_POST['offer_price'] !== '') ? (float)$_POST['offer_price'] : null;
    $slug = strtolower(trim(preg_replace('/[^a-z0-9]+/', '-', $name), '-'));
    
    // Path configuration
    $uploadDir = __DIR__ . '/../../uploads/products/';
    if (!is_dir($uploadDir)) @mkdir($uploadDir, 0755, true);

    // Initial URLs from existing data (for Edits)
    $image_url = $_POST['image_url'] ?? null;
    $file_url = $_POST['file_url'] ?? null;
    $file_name = $_POST['file_name'] ?? null;
    $preview_url = $_POST['preview_url'] ?? '';

    // --- IMAGE UPLOAD ---
    if (!empty($_FILES['image']) && file_exists($_FILES['image']['tmp_name'])) {
        $imgExt = pathinfo($_FILES['image']['name'], PATHINFO_EXTENSION);
        $imgName = time() . '_' . uniqid() . '.' . $imgExt;
        if (move_uploaded_file($_FILES['image']['tmp_name'], $uploadDir . $imgName)) {
            $image_url = '/backend/uploads/products/' . $imgName;
        }
    }

    // --- ZIP EXTRACTION LOGIC (Matches Local Logic) ---
    if (!empty($_FILES['zip_file']) && file_exists($_FILES['zip_file']['tmp_name'])) {
        $zipBaseName = pathinfo($_FILES['zip_file']['name'], PATHINFO_FILENAME);
        $folderName = strtolower(trim(preg_replace('/[^a-z0-9]+/', '-', $zipBaseName), '-')) ?: uniqid();
        $folderPath = $uploadDir . $folderName . '/';

        // Clean existing folder to prevent storage bloat
        if (is_dir($folderPath)) {
            $it = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($folderPath, RecursiveDirectoryIterator::SKIP_DOTS), RecursiveIteratorIterator::CHILD_FIRST);
            foreach($it as $file) { $file->isDir() ? rmdir($file->getRealPath()) : unlink($file->getRealPath()); }
            rmdir($folderPath);
        }
        @mkdir($folderPath, 0755, true);

        $zipPath = $uploadDir . uniqid() . '.zip';
        if (move_uploaded_file($_FILES['zip_file']['tmp_name'], $zipPath)) {
            $zip = new ZipArchive();
            if ($zip->open($zipPath) === TRUE) {
                $hasIndex = false;
                $allowedExts = ['html', 'htm', 'php', 'css', 'js', 'json', 'png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'woff', 'woff2', 'ttf'];

                for ($i = 0; $i < $zip->numFiles; $i++) {
                    $entry = $zip->getNameIndex($i);
                    if (substr($entry, -1) === '/' || strpos(basename($entry), '.') === 0) continue; 

                    $ext = strtolower(pathinfo($entry, PATHINFO_EXTENSION));
                    if (!empty($ext) && !in_array($ext, $allowedExts)) continue;

                    $target = $folderPath . str_replace('..', '', ltrim($entry, '/'));
                    @mkdir(dirname($target), 0755, true);
                    
                    if (file_put_contents($target, $zip->getFromIndex($i))) {
                        if (basename($target) === 'index.html') $hasIndex = true;
                    }
                }
                $zip->close(); 
                @unlink($zipPath);

                $file_url = '/backend/uploads/products/' . $folderName . '/';
                $file_name = $folderName;
                if ($hasIndex) {
                    $preview_url = 'https://uptulathemehub.com/backend/uploads/products/' . $folderName . '/index.html';
                }
            }
        }
    }

    // --- DATABASE EXECUTION (Status Reset Logic) ---
    if ($method === 'PUT') {
        // RESET STATUS: Product goes back to review and vanishes from live site until re-approved
        $sql = "UPDATE products SET name=?, slug=?, description=?, category_id=?, framework_id=?, price=?, offer_price=?, image_url=?, file_url=?, file_name=?, preview_url=?, status='pending_review' WHERE id=? AND seller_id=?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("sssiiddssssii", $name, $slug, $description, $category_id, $framework_id, $price, $offer_price, $image_url, $file_url, $file_name, $preview_url, $id, $seller_id);
    } else {
        $sql = "INSERT INTO products (seller_id, name, slug, description, category_id, framework_id, price, offer_price, image_url, preview_url, file_url, file_name, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending_review', NOW())";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("isssiiddssss", $seller_id, $name, $slug, $description, $category_id, $framework_id, $price, $offer_price, $image_url, $preview_url, $file_url, $file_name);
    }

    if ($stmt->execute()) {
        echo json_encode(['success' => true, 'message' => $method === 'PUT' ? 'Updated and resubmitted for review' : 'Product submitted successfully']);
    } else {
        echo json_encode(['success' => false, 'message' => $conn->error]);
    }
    
    // Cleanup temporary PUT files
    if ($method === 'PUT') {
        foreach ($_FILES as $f) { if (file_exists($f['tmp_name'])) @unlink($f['tmp_name']); }
    }
    exit;
}