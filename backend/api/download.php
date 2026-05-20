<?php
error_reporting(E_ALL);
ini_set('display_errors', 0);

header('Access-Control-Allow-Origin: https://uptulathemehub.com');
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once '../config/database.php';

function ensureDownloadsColumn($conn) {
    $column = $conn->query("SHOW COLUMNS FROM products LIKE 'downloads'");
    if ($column && $column->num_rows > 0) {
        return true;
    }

    return $conn->query("ALTER TABLE products ADD COLUMN downloads INT NOT NULL DEFAULT 0") === true;
}

function incrementDownloadCount($conn, $productId) {
    try {
        if (!ensureDownloadsColumn($conn)) {
            return;
        }

        $stmt = $conn->prepare("UPDATE products SET downloads = COALESCE(downloads, 0) + 1 WHERE id = ?");
        if (!$stmt) {
            return;
        }

        $stmt->bind_param("i", $productId);
        $stmt->execute();
        $stmt->close();
    } catch (Throwable $e) {
        error_log("Download count update failed: " . $e->getMessage());
    }
}

// Do not create clean empty session when no session cookie is sent (prevents overriding main user session)
$secure = !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off';
if (isset($_COOKIE[session_name()])) {
    ini_set('session.cookie_httponly', 1);
    ini_set('session.cookie_secure', $secure ? 1 : 0);
    ini_set('session.use_only_cookies', 1);
    ini_set('session.cookie_samesite', $secure ? 'None' : 'Lax');
    ini_set('session.cookie_path', '/');
    session_start();
}

// ✅ Auth check
if (!isset($_SESSION['logged_in']) || $_SESSION['logged_in'] !== true) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

$userId = $_SESSION['user_id'];
$productId = intval($_GET['product_id'] ?? 0);
$fileParam = trim($_GET['file'] ?? '');

$conn = getDBConnection();

// Allow old legacy used by some frontend paths: file=path/to/file
if (!$productId && $fileParam) {
    // Normalize file path and attempt to resolve via product file_url
    $fileParam = ltrim(str_replace('..', '', $fileParam), '/');

    $stmt = $conn->prepare("SELECT id FROM products WHERE file_url = ? OR file_url LIKE CONCAT('%', ?, '%') LIMIT 1");
    $stmt->bind_param('ss', $fileParam, $fileParam);
    $stmt->execute();
    $res = $stmt->get_result();

    if ($res && $res->num_rows > 0) {
        $productId = intval($res->fetch_assoc()['id']);
    }
    $stmt->close();
}

if (!$productId) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Product ID required']);
    exit;
}

// 🔐 STEP 1: CHECK PURCHASE
$stmt = $conn->prepare(
    "SELECT * FROM orders WHERE user_id = ? AND product_id = ? AND status IN ('completed','paid')"
);

$stmt->bind_param("ii", $userId, $productId);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 0) {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Access denied']);
    exit;
}

// 🔐 STEP 2: GET FILE FROM DB
$stmt = $conn->prepare("SELECT file_url FROM products WHERE id = ?");
$stmt->bind_param("i", $productId);
$stmt->execute();
$product = $stmt->get_result()->fetch_assoc();

if (!$product || empty($product['file_url'])) {
    http_response_code(404);
    echo json_encode(['success' => false, 'message' => 'File not found']);
    exit;
}

// Convert stored file_url value to a secure local path
$basePath = realpath(dirname(__DIR__) . '/uploads/products/') . '/';
$fileUrl = trim($product['file_url'] ?? '');
$fileName = trim($product['file_name'] ?? '');
$fileUrl = str_replace('\\', '/', $fileUrl);

// If file_url has the full frontend path, reduce it to API-relative form
$fileUrl = preg_replace('#^#i', '', $fileUrl);

// Normalize common URL forms to local relative folder or file path
if (stripos($fileUrl, 'http://') === 0 || stripos($fileUrl, 'https://') === 0) {
    $urlPath = parse_url($fileUrl, PHP_URL_PATH);
    $fileUrl = $urlPath ?: '';
}

// Fallback to file_name folder if file_url appears invalid or empty
if (empty($fileUrl) && !empty($fileName)) {
    $fileUrl = '/backend/uploads/products/' . trim($fileName, '/') . '/';
}

foreach (['/backend/uploads/products/', '/uploads/products/', '/backend/uploads/products/', '/uploads/products/', 'backend/uploads/products/', 'uploads/products/'] as $prefix) {
    if (stripos($fileUrl, $prefix) === 0) {
        $fileUrl = substr($fileUrl, strlen($prefix));
        break;
    }
}

$fileUrl = ltrim($fileUrl, '/');
$maybePath = $basePath . $fileUrl;

if (is_dir($maybePath)) {
    // If a folder is stored, point to index.html where possible, then ZIP full folder.
    $indexHtml = rtrim($maybePath, '/') . '/index.html';
    $indexHtm = rtrim($maybePath, '/') . '/index.htm';

    if (file_exists($indexHtml)) {
        $fullPath = realpath($indexHtml);
    } elseif (file_exists($indexHtm)) {
        $fullPath = realpath($indexHtm);
    } else {
        // allow direct folder download as ZIP via folder path
        $folderPath = realpath(rtrim($maybePath, '/'));
        if ($folderPath && strpos($folderPath, rtrim($basePath, '/')) === 0) {
            $fullPath = $folderPath;
        } else {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Template folder not found']);
            exit;
        }
    }
} else {
    $fullPath = realpath($maybePath);
}

if (!$fullPath || strpos($fullPath, rtrim($basePath, '/')) !== 0) {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Invalid file path']);
    exit;
}

if (!file_exists($fullPath)) {
    http_response_code(404);
    echo json_encode(['success' => false, 'message' => 'File not found']);
    exit;
}

$fileName = basename($fullPath);
$ext = strtolower(pathinfo($fullPath, PATHINFO_EXTENSION));

/* =============================
   🔥 ZIP LOGIC (KEEP YOUR CODE)
============================= */

// If we have a folder path, pack that entire folder
$zipFolderPath = null;
if (is_dir($fullPath)) {
    $zipFolderPath = $fullPath;
} elseif (($ext === 'html' || $ext === 'htm') && $fileName === 'index.html') {
    $zipFolderPath = dirname($fullPath);
}

if ($zipFolderPath) {
    $templateDir = $zipFolderPath;
    $templateName = basename($templateDir);
    $zipFileName = $templateName . '.zip';
    $tempZipPath = sys_get_temp_dir() . '/' . $zipFileName;

    if (class_exists('ZipArchive')) {
        $zip = new ZipArchive();

        if ($zip->open($tempZipPath, ZipArchive::CREATE | ZipArchive::OVERWRITE) === TRUE) {

            $files = new RecursiveIteratorIterator(
                new RecursiveDirectoryIterator($templateDir),
                RecursiveIteratorIterator::LEAVES_ONLY
            );

            foreach ($files as $file) {
                if (!$file->isDir()) {
                    $filePath = $file->getRealPath();
                    $relativePath = substr($filePath, strlen($templateDir) + 1);
                    $zip->addFile($filePath, $templateName . '/' . $relativePath);
                }
            }

            $zip->close();

            if (file_exists($tempZipPath)) {
                incrementDownloadCount($conn, $productId);
                header('Content-Type: application/zip');
                header('Content-Disposition: attachment; filename="' . $zipFileName . '"');
                readfile($tempZipPath);
                @unlink($tempZipPath);
                exit;
            }
        }
    }
}

/* =============================
   📦 NORMAL DOWNLOAD
============================= */

$mimeTypes = [
    'zip' => 'application/zip',
    'pdf' => 'application/pdf',
    'jpg' => 'image/jpeg',
    'png' => 'image/png'
];

$mimeType = $mimeTypes[$ext] ?? 'application/octet-stream';

header('Content-Type: ' . $mimeType);
header('Content-Disposition: attachment; filename="' . $fileName . '"');

incrementDownloadCount($conn, $productId);
readfile($fullPath);
exit;
