<?php
set_time_limit(300);
header('Access-Control-Allow-Origin: *');
 
// Enable error logging for debugging
error_log('[preview.php] Request received - GET params: ' . json_encode($_GET));
 
// Get product ID from query parameter
$id = isset($_GET['id']) ? $_GET['id'] : 0;
 
if (!$id) {
    error_log('[preview.php] Error: No product ID provided');
    echo 'Error: Product ID required';
    exit;
}
 
// Get product from database
require_once __DIR__ . '/../config/database.php';
$conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);
 
if ($conn->connect_error) {
    echo 'Error: Database connection failed';
    exit;
}
 
$conn->set_charset("utf8mb4");
 
// Query for product preview_url and file_url - try both uuid and int formats
$stmt = $conn->prepare("SELECT preview_url, file_url FROM products WHERE id = ? OR id = ? LIMIT 1");
if (!$stmt) {
    error_log('[preview.php] SQL Error: ' . $conn->error);
    echo 'Error: Database prepare failed';
    exit;
}
 
$id_int = (int)$id;
$id_str = (string)$id;
$stmt->bind_param("is", $id_int, $id_str);
$stmt->execute();
$result = $stmt->get_result();
$product = $result->fetch_assoc();
$stmt->close();
$conn->close();
 
if (!$product) {
    error_log('[preview.php] Error: Product not found for ID: ' . $id);
    echo 'Error: Product not found (ID: ' . $id . ')';
    exit;
}
 
// Get preview_url and file_url from product
$previewUrl = $product['preview_url'] ?? '';
$fileUrl = $product['file_url'] ?? '';
 
// If preview_url is a full URL, decide whether to redirect or serve locally
if (!empty($previewUrl) && filter_var($previewUrl, FILTER_VALIDATE_URL)) {
    // If the URL points into our uploads folder on this host, serve it from filesystem
    if (strpos($previewUrl, '/backend/uploads/products') !== false) {
        $urlPath = parse_url($previewUrl, PHP_URL_PATH);
        $parts = array_filter(explode('/', trim($urlPath, '/')));
        // Get all parts of the path
        $partsList = array_values($parts);
       
        // Find the 'products' index and get the folder after it
        $productsIndex = array_search('products', $partsList);
        if ($productsIndex !== false && isset($partsList[$productsIndex + 1])) {
            // The folder is the one after 'products'
            $folderName = $partsList[$productsIndex + 1];
            $isFolder = true;
        } else {
            // Fallback: use last part (old logic)
            $last = end($parts);
            if (substr($last, -5) === '.html' || substr($last, -4) === '.htm') {
                $isFolder = false;
                $folderName = substr($last, 0, strrpos($last, '.'));
            } else {
                $isFolder = true;
                $folderName = $last;
            }
        }
        // overwrite $previewUrl variable to fall through to local-serving logic
        error_log('[preview.php] Detected internal uploads URL, serving local folder: ' . $folderName);
    } else {
        error_log('[preview.php] Redirecting to external preview URL: ' . $previewUrl);
        header('Location: ' . $previewUrl);
        exit;
    }
}
 
// If we reached here we will serve from filesystem
$baseDir = dirname(__DIR__) . '/uploads/products';
 
// Determine folder to serve from. Prefer explicit folder determined from preview_url (when it pointed into uploads),
// otherwise use the stored file_url column as the source of truth.
if (!isset($folderName) || empty($folderName)) {
    if (!empty($fileUrl)) {
        // Extract folder name from file_url
        $isFolder = substr(trim($fileUrl), -1) === '/';
        if ($isFolder) {
            $parts = array_filter(explode('/', trim($fileUrl, '/')));
            $folderName = end($parts);
        } else {
            $folderName = substr(basename($fileUrl), 0, -4);
        }
    } else {
        error_log('[preview.php] Error: no file_url or folder info for product ID: ' . $id);
        echo 'Error: target folder not found: ' . $baseDir . '/';
        exit;
    }
}
 
$targetFolder = $baseDir . '/' . $folderName;
 
// Find index.html by searching the extracted folder recursively
$foundPath = null;
$path = null;
 
error_log('[preview.php] Looking for index.html in: ' . $targetFolder);
 
if (!is_dir($targetFolder)) {
    error_log('[preview.php] Error: target folder not found: ' . $targetFolder);
    echo 'Error: target folder not found: ' . $targetFolder;
    exit;
}
 
try {
    $rii = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($targetFolder, FilesystemIterator::SKIP_DOTS));
    foreach ($rii as $file) {
        if (!$file->isFile()) continue;
        $name = strtolower($file->getFilename());
        if (in_array($name, ['index.html', 'index.htm'])) {
            $path = $file->getPathname();
            $relativePath = str_replace($baseDir, '', $path);
            $foundPath = '/backend/uploads/products' . str_replace('\\', '/', $relativePath);
            error_log('[preview.php] Found index.html at: ' . $path);
            // keep $path (filesystem path to index) for serving
            break;
        }
    }
} catch (UnexpectedValueException $e) {
    // Directory iterator failed
    error_log('[preview.php] Error: could not read target folder: ' . $targetFolder . ' - ' . $e->getMessage());
    echo 'Error: could not read target folder: ' . $targetFolder;
    exit;
}
 
if (!$foundPath) {
    error_log('[preview.php] Error: index.html not found in ' . $targetFolder);
    echo 'Error: index.html not found in ' . $targetFolder;
    exit;
}
 
// Serve the index.html through PHP to avoid directory access restrictions.
$protocol = (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https://' : 'http://';
$host = $_SERVER['HTTP_HOST'];
 
// $path should contain the filesystem path to the discovered index.html
if (!isset($path) || !file_exists($path)) {
    error_log('[preview.php] Error: discovered index file missing: ' . (isset($path) ? $path : 'path not set'));
    echo 'Error: discovered index file missing: ' . (isset($path) ? $path : '');
    exit;
}
 
$html = file_get_contents($path);
// Build a proxy base URL so relative asset requests are routed through preview_asset.php
$indexDir = dirname($path); // The directory containing index.html
$relativeDir = str_replace('\\', '/', str_replace($baseDir, '', $indexDir));
// Remove leading slash for cleaner URL params
$relativeDir = ltrim($relativeDir, '/');
 
// Construct proxy base URL - pass the relative directory so preview_asset.php knows where to look
$proxyBaseUrl = $protocol . $host . '/backend/api/preview_asset.php?id=' . urlencode($id) . '&folder=' . urlencode($relativeDir) . '&path=';
 
error_log('[preview.php] Serving preview - ID: ' . $id . ', Index: ' . $path . ', RelativeDir: ' . $relativeDir);
 
// Rewrite asset URLs to use the proxy
// Match: href="relative/path", src="relative/path", data-src="relative/path"
$html = preg_replace_callback(
    '/(href|src|data-src)\s*=\s*["\']([^"\']+)["\']/i',
    function($m) use ($proxyBaseUrl) {
        $attr = $m[1];
        $url = $m[2];
       
        // Skip absolute URLs, data URIs, and anchors
        if (preg_match('~^(https?:|//|data:|#)~i', $url)) {
            return $m[0];
        }
       
        // Convert relative URLs to proxy URLs
        $proxyUrl = $proxyBaseUrl . urlencode($url);
        error_log('[preview.php] Rewriting ' . $attr . ': ' . $url . ' -> ' . $proxyUrl);
        return $attr . '="' . htmlspecialchars($proxyUrl, ENT_QUOTES) . '"';
    },
    $html
);
 
// Rewrite srcset attributes (comma-separated URLs)
$html = preg_replace_callback(
    '/srcset\s*=\s*["\']([^"\']+)["\']/i',
    function($m) use ($proxyBaseUrl) {
        $entries = array_map('trim', explode(',', $m[1]));
        $newEntries = [];
        foreach ($entries as $entry) {
            // entry format: 'url [descriptor]'
            $parts = preg_split('/\s+/', $entry, 2);
            $url = $parts[0];
            $descriptor = isset($parts[1]) ? ' ' . $parts[1] : '';
            if (preg_match('~^(https?:|//|data:|#)~i', $url)) {
                $newEntries[] = $entry;
                continue;
            }
            $proxyUrl = $proxyBaseUrl . urlencode($url);
            error_log('[preview.php] Rewriting srcset url: ' . $url . ' -> ' . $proxyUrl);
            $newEntries[] = $proxyUrl . $descriptor;
        }
        return 'srcset="' . implode(', ', $newEntries) . '"';
    },
    $html
);
 
// Rewrite url(...) inside inline <style> blocks
$html = preg_replace_callback(
    '/<style[^>]*>(.*?)<\/style>/is',
    function($m) use ($proxyBaseUrl) {
        $style = $m[1];
        $style = preg_replace_callback(
            '/url\s*\(\s*["\']?([^\)"\'\s]+)["\']?\s*\)/i',
            function($sm) use ($proxyBaseUrl) {
                $url = $sm[1];
                if (preg_match('~^(https?:|//|data:)~i', $url)) return $sm[0];
                $proxyUrl = $proxyBaseUrl . urlencode($url);
                error_log('[preview.php] Rewriting inline style url: ' . $url . ' -> ' . $proxyUrl);
                return 'url("' . htmlspecialchars($proxyUrl, ENT_QUOTES) . '")';
            },
            $style
        );
        return str_replace($m[1], $style, $m[0]);
    },
    $html
);
 
// Also rewrite CSS url() patterns
$html = preg_replace_callback(
    '/url\s*\(\s*["\']?([^)"\'\s]+)["\']?\s*\)/i',
    function($m) use ($proxyBaseUrl) {
        $url = trim($m[1], '\'"');
       
        // Skip absolute URLs and data URIs
        if (preg_match('~^(https?:|//|data:)~i', $url)) {
            return $m[0];
        }
       
        // Convert relative URLs to proxy URLs
        $proxyUrl = $proxyBaseUrl . urlencode($url);
        return 'url("' . htmlspecialchars($proxyUrl, ENT_QUOTES) . '")';
    },
    $html
);
 
header('Content-Type: text/html; charset=utf-8');
echo $html;
exit;
?>
 
 
 