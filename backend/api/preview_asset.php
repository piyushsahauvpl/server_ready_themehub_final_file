<?php
// Lightweight proxy to serve static files from uploads/products for previewing
header('Access-Control-Allow-Origin: *');
require_once __DIR__ . '/../config/database.php';
 
$id = isset($_GET['id']) ? $_GET['id'] : 0;
$assetPath = isset($_GET['path']) ? $_GET['path'] : '';
$folder = isset($_GET['folder']) ? $_GET['folder'] : '';
 
if (!$id || !$assetPath) {
    http_response_code(400);
    echo 'Bad request';
    exit;
}
 
// Get the product's file_url to determine the base folder
$conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);
if ($conn->connect_error) {
    http_response_code(500);
    echo 'Database error';
    exit;
}
 
// Try both uuid and int formats
$stmt = $conn->prepare("SELECT file_url FROM products WHERE id = ? OR id = ? LIMIT 1");
if (!$stmt) {
    http_response_code(500);
    echo 'Database error';
    exit;
}
 
$id_int = (int)$id;
$id_str = $id;
$stmt->bind_param("is", $id_int, $id_str);
$stmt->execute();
$result = $stmt->get_result();
$product = $result->fetch_assoc();
$stmt->close();
$conn->close();
 
if (!$product) {
    http_response_code(404);
    echo 'Product not found';
    exit;
}
 
// Determine base folder
$baseDir = dirname(__DIR__) . '/uploads/products';
 
// If folder was provided by preview.php, use it directly
if (!empty($folder)) {
    $targetFolder = $baseDir . '/' . $folder;
} else {
    // Fallback: extract from file_url (original logic)
    $fileUrl = $product['file_url'];
    $isFolder = substr(trim($fileUrl), -1) === '/';
    if ($isFolder) {
        $parts = array_filter(explode('/', trim($fileUrl, '/')));
        $folderName = end($parts);
    } else {
        $folderName = substr(basename($fileUrl), 0, -4);
    }
    $targetFolder = $baseDir . '/' . $folderName;
}
 
// Build the full file path and sanitize
// Handle URL-encoded input and strip query strings/fragments (e.g. css/style.css?v=1)
$assetPathRaw = $assetPath;
$assetPath = urldecode($assetPathRaw);
// Keep only the path part (remove ?... and #...)
$assetPath = parse_url($assetPath, PHP_URL_PATH) ?: $assetPath;
$assetPath = str_replace('..', '', $assetPath); // prevent directory traversal
$assetPath = ltrim($assetPath, '/');
$fullPath = rtrim($targetFolder, '\\/') . '/' . $assetPath;
$fullPath = str_replace('\\', '/', $fullPath);
 
// Debug logging: record requests and resolved path
error_log('[preview_asset] Request - id=' . $id . ', folder=' . $folder . ', raw_path=' . $assetPathRaw . ', parsed_path=' . $assetPath);
error_log('[preview_asset] Resolved fullPath=' . $fullPath . ' (exists=' . (file_exists($fullPath) ? 'yes' : 'no') . ')');
 
if (!file_exists($fullPath) || !is_file($fullPath)) {
    // Try fallbacks: 1) strip leading 'assets/' prefix, 2) try basename at folder root, 3) recursive search by basename
    $found = false;
    $basename = basename($assetPath);
    $tryPaths = [];
 
    // If path contains assets/, try without it
    if (stripos($assetPath, 'assets/') === 0) {
        $withoutAssets = substr($assetPath, strlen('assets/'));
        $tryPaths[] = rtrim($targetFolder, '\\/') . '/' . $withoutAssets;
        $tryPaths[] = rtrim($targetFolder, '\\/') . '/' . basename($withoutAssets);
    }
 
    // Try file directly at folder root
    $tryPaths[] = rtrim($targetFolder, '\\/') . '/' . $basename;
 
    foreach ($tryPaths as $p) {
        $p = str_replace('\\', '/', $p);
        if (file_exists($p) && is_file($p)) {
            $fullPath = $p;
            $found = true;
            error_log('[preview_asset] Fallback matched: ' . $p . ' for requested ' . $assetPath);
            break;
        }
    }
 
    if (!$found) {
        // Recursive search for matching basename (case-insensitive)
        try {
            $rii = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($targetFolder, FilesystemIterator::SKIP_DOTS));
            foreach ($rii as $file) {
                if (!$file->isFile()) continue;
                if (strtolower($file->getFilename()) === strtolower($basename)) {
                    $fullPath = $file->getRealPath();
                    $found = true;
                    error_log('[preview_asset] Recursive fallback matched: ' . $fullPath . ' for requested ' . $assetPath);
                    break;
                }
            }
        } catch (UnexpectedValueException $e) {
            error_log('[preview_asset] Recursive search failed: ' . $e->getMessage());
        }
    }
 
    if (!$found) {
        http_response_code(404);
        error_log('[preview_asset] Asset not found: ' . $assetPath . ' (fullPath=' . $fullPath . ')');
        echo 'Asset not found: ' . $assetPath;
        exit;
    }
}
 
// ensure path is under targetFolder
$realBase = str_replace('\\', '/', realpath($targetFolder));
$realFull = str_replace('\\', '/', realpath($fullPath));
if (strpos($realFull, $realBase) !== 0) {
    http_response_code(403);
    echo 'Forbidden';
    exit;
}
 
// Determine MIME type
$mime = 'application/octet-stream';
$ext = strtolower(pathinfo($fullPath, PATHINFO_EXTENSION));
$mimeMap = [
    'html' => 'text/html',
    'htm'  => 'text/html',
    'css'  => 'text/css',
    'js'   => 'application/javascript',
    'json' => 'application/json',
    'png'  => 'image/png',
    'jpg'  => 'image/jpeg',
    'jpeg' => 'image/jpeg',
    'gif'  => 'image/gif',
    'svg'  => 'image/svg+xml',
    'webp' => 'image/webp',
    'woff' => 'font/woff',
    'woff2' => 'font/woff2',
    'ttf'  => 'font/ttf',
    'eot'  => 'application/vnd.ms-fontobject',
];
if (isset($mimeMap[$ext])) {
    $mime = $mimeMap[$ext];
}
 
header('Content-Type: ' . $mime);
header('Cache-Control: public, max-age=3600');
 
// For CSS files, rewrite url(...) to proxy through preview_asset so fonts/images referenced by CSS are served correctly
if ($mime === 'text/css') {
    $protocol = (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https://' : 'http://';
    $host = $_SERVER['HTTP_HOST'];
    $proxyBaseUrl = $protocol . $host . '/backend/api/preview_asset.php?id=' . urlencode($id) . '&folder=' . urlencode($folder) . '&path=';
 
    $css = file_get_contents($fullPath);
    $css = preg_replace_callback(
        '/url\s*\(\s*["\']?([^)"\'\s]+)["\']?\s*\)/i',
        function($m) use ($proxyBaseUrl) {
            $url = $m[1];
            // Skip absolute URLs and data URIs
            if (preg_match('~^(https?:|//|data:)~i', $url)) {
                return $m[0];
            }
            $proxyUrl = $proxyBaseUrl . urlencode($url);
            return 'url("' . htmlspecialchars($proxyUrl, ENT_QUOTES) . '")';
        },
        $css
    );
 
    echo $css;
    exit;
}
 
// Default: stream file
readfile($fullPath);
exit;
?>
 
 
