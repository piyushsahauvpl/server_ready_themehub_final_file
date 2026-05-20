<?php
/**
 * Products CRUD API
 * Endpoint: /api/admin/products.php
 * Methods: GET (list), POST (create), PUT (update), DELETE (delete)
 */

// Suppress any output that might break JSON
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);
ob_start();

// Helper function to convert ini size to bytes
if (!function_exists('return_bytes')) {
    function return_bytes($val) {
        $val = trim($val);
        $last = strtolower($val[strlen($val)-1]);
        $val = (int)$val;
        switch($last) {
            case 'g': $val *= 1024;
            case 'm': $val *= 1024;
            case 'k': $val *= 1024;
        }
        return $val;
    }
}

// Helper function to format bytes
if (!function_exists('formatBytes')) {
    function formatBytes($bytes, $precision = 2) {
        $units = array('B', 'KB', 'MB', 'GB', 'TB');
        $bytes = max($bytes, 0);
        $pow = floor(($bytes ? log($bytes) : 0) / log(1024));
        $pow = min($pow, count($units) - 1);
        $bytes /= pow(1024, $pow);
        return round($bytes, $precision) . ' ' . $units[$pow];
    }
}

// Handle CORS and OPTIONS request FIRST, before any output
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    // Remove any existing headers first
    header_remove();
    
    header('Access-Control-Allow-Origin: https://uptulathemehub.com');
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, Accept');
    header('Access-Control-Allow-Credentials: true');
    header('Access-Control-Max-Age: 86400');
    http_response_code(200);
    ob_end_clean();
    exit();
}

// Set CORS headers for actual requests (remove any existing first)
header_remove('Access-Control-Allow-Origin');
header_remove('Access-Control-Allow-Methods');
header_remove('Access-Control-Allow-Headers');
header_remove('Access-Control-Allow-Credentials');

header('Access-Control-Allow-Origin: https://uptulathemehub.com');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, Accept');
header('Access-Control-Allow-Credentials: true');
header('Content-Type: application/json; charset=utf-8');
// Don't set Content-Type here - it will be set based on request type (JSON or multipart/form-data)

require_once '../../config/database.php';

// Start session with same settings as check-auth
ini_set('session.cookie_httponly', 1);
ini_set('session.cookie_secure', 1);
ini_set('session.use_only_cookies', 1);
ini_set('session.cookie_samesite', 'Lax');
ini_set('session.cookie_path', '/');
session_name('ADMINSESSID');
session_start();

// Set up error handler to catch any PHP errors and output as JSON
set_error_handler(function($errno, $errstr, $errfile, $errline) {
    ob_end_clean();
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Server error: ' . $errstr,
        'error_details' => [
            'file' => $errfile,
            'line' => $errline,
            'code' => $errno
        ]
    ]);
    exit;
});

set_exception_handler(function($exception) {
    ob_end_clean();
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Server error: ' . $exception->getMessage(),
        'error_file' => $exception->getFile(),
        'error_line' => $exception->getLine()
    ]);
    exit;
});

// Check authentication - allow GET requests without strict session if testing
$method = $_SERVER['REQUEST_METHOD'];
if (!isset($_SESSION['admin_id']) && $method !== 'GET') {
    ob_end_clean();
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

$conn = getDBConnection();

// Handle file uploads directory
$uploadDir = '../../uploads/products/';
if (!file_exists($uploadDir)) {
    mkdir($uploadDir, 0777, true);
}

switch ($method) {
    case 'GET':
        // List all products or get single product by ID
        $productId = $_GET['id'] ?? '';
        $search = $_GET['search'] ?? '';
        $categoryFilter = $_GET['category'] ?? '';
        $frameworkFilter = $_GET['framework'] ?? '';
        
        $query = "SELECT p.*, c.name as category_name, f.name as framework_name 
                  FROM products p 
                  LEFT JOIN categories c ON p.category_id = c.id 
                  LEFT JOIN frameworks f ON p.framework_id = f.id 
                  WHERE 1=1";
        $params = [];
        $types = '';
        
        // If ID is provided, fetch only that product
        if (!empty($productId)) {
            $query .= " AND p.id = ?";
            $productId = intval($productId);
            $params[] = $productId;
            $types .= 'i';
        } else {
            // Otherwise apply filters
            if (!empty($search)) {
                $query .= " AND (p.name LIKE ? OR p.description LIKE ?)";
                $searchTerm = "%$search%";
                $params[] = $searchTerm;
                $params[] = $searchTerm;
                $types .= 'ss';
            }
            
            if (!empty($categoryFilter)) {
                $query .= " AND c.name = ?";
                $params[] = $categoryFilter;
                $types .= 's';
            }
            
            if (!empty($frameworkFilter)) {
                $query .= " AND f.name = ?";
                $params[] = $frameworkFilter;
                $types .= 's';
            }
        }
        
        $query .= " ORDER BY p.created_at DESC";
        
        $stmt = $conn->prepare($query);
        if (!empty($params)) {
            $stmt->bind_param($types, ...$params);
        }
        $stmt->execute();
        $result = $stmt->get_result();
        
        $products = [];
        while ($row = $result->fetch_assoc()) {
            // If preview_url points into the local uploads folder, rewrite to the preview proxy to avoid direct folder access
            if (!empty($row['preview_url']) && (stripos($row['preview_url'], '/uploads/products') !== false || stripos($row['preview_url'], '/backend/uploads/products') !== false)) {
                $row['preview_url'] = 'https://' . $_SERVER['HTTP_HOST'] . '/backend/api/preview.php?id=' . $row['id'];
            }
            $products[] = $row;
        }
        
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode(['success' => true, 'products' => $products]);
        $stmt->close();
        break;
        
    case 'POST':
        // Create new product
        // Handle multipart/form-data (file uploads)
        // Debug: Log what we received
        error_log("Products POST - POST data: " . print_r($_POST, true));
        error_log("Products POST - FILES data: " . print_r($_FILES, true));
        
        // Set Content-Type for JSON response
        header('Content-Type: application/json; charset=utf-8');
        
        // Set Content-Type for JSON response
        header('Content-Type: application/json; charset=utf-8');
        
            // Check if file uploads were truncated by PHP's max_file_uploads limit
            // When this happens, $_POST data is present but $_FILES may be incomplete or missing
            // PHP silently drops files without setting error codes
            if (!empty($_POST) && (empty($_FILES['image']) && empty($_FILES['zip_file']) && empty($_FILES['folder_files']))) {
                // Check if content is multipart (indicates files were expected)
                $contentType = $_SERVER['CONTENT_TYPE'] ?? '';
                if (stripos($contentType, 'multipart/form-data') !== false || !empty($_POST)) {
                    // This might be a file truncation issue
                    $maxFileUploads = ini_get('max_file_uploads');
                    error_log("WARNING: Possible file upload truncation - POST data received but no FILES found. max_file_uploads={$maxFileUploads}");
                }
            }
        
            // Additional check: if we have POST data for upload_type='folder' but no folder_files, it's truncated
            $uploadType = isset($_POST['upload_type']) ? $_POST['upload_type'] : 'zip';
            if ($uploadType === 'folder' && !isset($_FILES['folder_files'])) {
                // This indicates file truncation occurred
                $maxFileUploads = ini_get('max_file_uploads');
                ob_end_clean();
                http_response_code(413);
                echo json_encode([
                    'success' => false,
                    'message' => 'File upload limit exceeded. The server encountered an issue processing your folder upload. Please try uploading as a ZIP file instead, or reduce the number of files in your folder.',
                    'error_code' => 'FILE_UPLOAD_TRUNCATED',
                    'max_file_uploads' => $maxFileUploads,
                    'debug' => [
                        'upload_type' => $uploadType,
                        'files_received' => array_keys($_FILES ?? []),
                        'php_max_file_uploads' => ini_get('max_file_uploads'),
                        'content_type' => $_SERVER['CONTENT_TYPE'] ?? 'NOT SET'
                    ]
                ]);
                exit;
            }
        
        // Parse form data - handle multipart/form-data
        $name = isset($_POST['name']) ? trim($_POST['name']) : '';
        $description = isset($_POST['description']) ? trim($_POST['description']) : '';
        $category_id = isset($_POST['category_id']) && $_POST['category_id'] !== '' ? intval($_POST['category_id']) : 0;
        $framework_id = isset($_POST['framework_id']) && $_POST['framework_id'] !== '' ? intval($_POST['framework_id']) : 0;
        $price = isset($_POST['price']) && $_POST['price'] !== '' ? floatval($_POST['price']) : 0;
        $offer_price = isset($_POST['offer_price']) && $_POST['offer_price'] !== '' ? floatval($_POST['offer_price']) : null;
        $preview_url = isset($_POST['preview_url']) ? trim($_POST['preview_url']) : '';
        $is_latest = isset($_POST['is_latest']) && ($_POST['is_latest'] === '1' || $_POST['is_latest'] === 1 || $_POST['is_latest'] === true || $_POST['is_latest'] === 'true') ? 1 : 0;
        $is_featured = isset($_POST['is_featured']) && ($_POST['is_featured'] === '1' || $_POST['is_featured'] === 1 || $_POST['is_featured'] === true || $_POST['is_featured'] === 'true') ? 1 : 0;
        
        // New metadata fields
        $last_update = isset($_POST['last_update']) ? trim($_POST['last_update']) : null;
        $high_resolution = isset($_POST['high_resolution']) && ($_POST['high_resolution'] === '1' || $_POST['high_resolution'] === 1 || $_POST['high_resolution'] === true || $_POST['high_resolution'] === 'true') ? 1 : 0;
        $compatible_browsers = isset($_POST['compatible_browsers']) ? trim($_POST['compatible_browsers']) : null;
        $compatible_with = isset($_POST['compatible_with']) ? trim($_POST['compatible_with']) : null;
        $themeforest_files_included = isset($_POST['themeforest_files_included']) ? trim($_POST['themeforest_files_included']) : null;
        $documentation = isset($_POST['documentation']) ? trim($_POST['documentation']) : 'Well Documented';
        $layout = isset($_POST['layout']) ? trim($_POST['layout']) : 'Responsive';
        $tags = isset($_POST['tags']) ? trim($_POST['tags']) : null;
        
        // Validate required fields with clear error messages
        if (empty($name)) {
            ob_end_clean();
            http_response_code(400);
            echo json_encode([
                'success' => false, 
                'message' => 'Product name is required. Please enter a product name.',
                'debug' => [
                    'received_name' => $name,
                    'all_post_keys' => array_keys($_POST ?? []),
                    'content_type' => $_SERVER['CONTENT_TYPE'] ?? 'NOT SET'
                ]
            ]);
            closeDBConnection($conn);
            exit;
        }
        
        if ($category_id <= 0) {
            ob_end_clean();
            http_response_code(400);
            echo json_encode([
                'success' => false, 
                'message' => 'Category is required. Please select a category from the dropdown.',
                'debug' => [
                    'category_id' => $category_id,
                    'category_post_value' => $_POST['category_id'] ?? 'NOT SET',
                    'category_post_type' => gettype($_POST['category_id'] ?? null)
                ]
            ]);
            closeDBConnection($conn);
            exit;
        }
        
        if ($framework_id <= 0) {
            ob_end_clean();
            http_response_code(400);
            echo json_encode([
                'success' => false, 
                'message' => 'Framework is required. Please select a framework from the dropdown.',
                'debug' => [
                    'framework_id' => $framework_id,
                    'framework_post_value' => $_POST['framework_id'] ?? 'NOT SET',
                    'framework_post_type' => gettype($_POST['framework_id'] ?? null)
                ]
            ]);
            closeDBConnection($conn);
            exit;
        }
        
        // Generate slug
        $slug = strtolower(trim(preg_replace('/[^A-Za-z0-9-]+/', '-', $name)));
        
        // Handle image upload
        $image_url = null;
        if (isset($_FILES['image']) && $_FILES['image']['error'] === UPLOAD_ERR_OK) {
            $imageExt = pathinfo($_FILES['image']['name'], PATHINFO_EXTENSION);
            $imageName = uniqid() . '.' . $imageExt;
            $imagePath = $uploadDir . $imageName;
            
            if (move_uploaded_file($_FILES['image']['tmp_name'], $imagePath)) {
                $image_url = '/backend/uploads/products/' . $imageName;
            }
        }
        
        // Handle file upload (ZIP or Folder)
        $file_url = null;
        $file_name = null;
        $uploadType = isset($_POST['upload_type']) ? $_POST['upload_type'] : 'zip';
        
        // Validate that required files are uploaded based on upload type
        if ($uploadType === 'folder') {
            error_log("[products.php] Validating folder upload - FILES: " . json_encode(isset($_FILES['folder_files']) ? array_keys($_FILES['folder_files']) : 'NOT SET'));
            
            if (!isset($_FILES['folder_files'])) {
                ob_end_clean();
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Please upload a folder containing your template files. The folder must include an index.html file at the root level.'
                ]);
                closeDBConnection($conn);
                exit;
            }
            
            // Check for upload errors
            $folderErrors = $_FILES['folder_files']['error'];
            if (!is_array($folderErrors)) {
                $folderErrors = [$folderErrors];
            }
            
            // If all files have errors, reject
            $hasValidFile = false;
            foreach ($folderErrors as $error) {
                if ($error === UPLOAD_ERR_OK) {
                    $hasValidFile = true;
                    break;
                }
            }
            
            if (!$hasValidFile) {
                ob_end_clean();
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Please upload a folder containing your template files. The folder must include an index.html file at the root level.'
                ]);
                closeDBConnection($conn);
                exit;
            }
        } elseif ($uploadType === 'zip') {
            if (!isset($_FILES['zip_file']) || $_FILES['zip_file']['error'] !== UPLOAD_ERR_OK) {
                ob_end_clean();
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Please upload a ZIP file containing your template. The ZIP file must include an index.html file at the root level.'
                ]);
                closeDBConnection($conn);
                exit;
            }
        }
        
        if ($uploadType === 'folder' && isset($_FILES['folder_files'])) {
            // Handle folder upload
            $folderName = $_POST['folder_name'] ?? uniqid();
            // Sanitize folder name - only allow alphanumeric, hyphens, and underscores
            $folderName = preg_replace('/[^a-zA-Z0-9_-]/', '', $folderName);
            if (empty($folderName)) {
                $folderName = 'template_' . uniqid();
            }
            
            $folderPath = $uploadDir . $folderName . '/';
            
            // Create folder if it doesn't exist
            if (!file_exists($folderPath)) {
                mkdir($folderPath, 0755, true);
            }
            
            // Process all files in the folder
            $files = $_FILES['folder_files'];
            
            // Check if folder_files is an array (multiple files) or single file
            // When using FormData with folder_files[], PHP creates an array structure
            $isArray = is_array($files['name']);
            $fileCount = $isArray ? count($files['name']) : 1;
            $uploadedFiles = [];
            $hasIndexHtml = false;
            $allowedExtensions = ['html', 'htm', 'css', 'js', 'json', 'png', 'jpg', 'jpeg', 'gif', 'svg', 'ico', 'woff', 'woff2', 'ttf', 'eot', 'pdf', 'txt', 'xml', 'md'];
            
            // Handle single file or multiple files
            if ($fileCount === 1 && !is_array($files['name'])) {
                // Single file
                if ($files['error'] === UPLOAD_ERR_OK) {
                    $relativePath = $files['name'];
                    
                    // Security: Prevent path traversal
                    $relativePath = str_replace('..', '', $relativePath);
                    $relativePath = ltrim($relativePath, '/');
                    
                    // Remove folder name prefix if present
                    if (strpos($relativePath, $folderName . '/') === 0) {
                        $relativePath = substr($relativePath, strlen($folderName) + 1);
                    }
                    
                    // Validate file extension
                    $ext = strtolower(pathinfo($relativePath, PATHINFO_EXTENSION));
                    if (!in_array($ext, $allowedExtensions)) {
                        ob_end_clean();
                        http_response_code(400);
                        echo json_encode([
                            'success' => false,
                            'message' => 'Invalid file type: ' . $relativePath . '. Only HTML, CSS, JS, images, and static assets are allowed.'
                        ]);
                        closeDBConnection($conn);
                        exit;
                    }
                    
                    $targetPath = $folderPath . $relativePath;
                    
                    // Create directory if needed
                    $targetDir = dirname($targetPath);
                    if (!file_exists($targetDir)) {
                        mkdir($targetDir, 0755, true);
                    }
                    
                    if (move_uploaded_file($files['tmp_name'], $targetPath)) {
                        $uploadedFiles[] = $relativePath;
                        // Check if this is index.html at root
                        if (strtolower($relativePath) === 'index.html') {
                            $hasIndexHtml = true;
                        }
                    }
                }
            } else {
                // Multiple files
                for ($i = 0; $i < $fileCount; $i++) {
                    if ($files['error'][$i] === UPLOAD_ERR_OK) {
                        // Get relative path
                        $relativePath = $files['name'][$i];
                        
                        // Security: Prevent path traversal
                        $relativePath = str_replace('..', '', $relativePath);
                        $relativePath = ltrim($relativePath, '/');
                        
                        // Remove folder name prefix if present
                        if (strpos($relativePath, $folderName . '/') === 0) {
                            $relativePath = substr($relativePath, strlen($folderName) + 1);
                        }
                        
                        // Validate file extension
                        $ext = strtolower(pathinfo($relativePath, PATHINFO_EXTENSION));
                        if (!in_array($ext, $allowedExtensions)) {
                            // Skip disallowed files but continue processing others
                            error_log("Skipping disallowed file: " . $relativePath);
                            continue;
                        }
                        
                        $targetPath = $folderPath . $relativePath;

                        // Create directory if needed (do this before realpath checks so new files work)
                        $targetDir = dirname($targetPath);
                        if (!file_exists($targetDir)) {
                            if (!mkdir($targetDir, 0755, true)) {
                                error_log("Failed to create directory: $targetDir");
                                continue;
                            }
                        }

                        // Security: Ensure target dir is within upload directory
                        $realTargetDir = realpath($targetDir);
                        $realFolderPath = realpath($folderPath);
                        if ($realTargetDir === false || strpos($realTargetDir, $realFolderPath) !== 0) {
                            error_log("Path traversal attempt blocked: " . $relativePath);
                            continue;
                        }
                        
                        if (move_uploaded_file($files['tmp_name'][$i], $targetPath)) {
                            $uploadedFiles[] = $relativePath;
                            // Check if this is index.html at root level or inside a single top-level folder
                            $normalizedPath = strtolower(ltrim($relativePath, '/'));
                            $pathParts = explode('/', $normalizedPath);
                            $baseName = end($pathParts);
                            // Accept 'index.html' or 'folderName/index.html' (one-level deep)
                            if ($baseName === 'index.html' && count($pathParts) <= 2) {
                                $hasIndexHtml = true;
                            }
                        }
                    }
                }
            }
            
            // Validate that index.html exists
            if (count($uploadedFiles) > 0 && !$hasIndexHtml) {
                // Clean up uploaded files
                foreach ($uploadedFiles as $file) {
                    $filePath = $folderPath . $file;
                    if (file_exists($filePath)) {
                        unlink($filePath);
                    }
                }
                // Remove empty directories
                if (file_exists($folderPath)) {
                    rmdir($folderPath);
                }
                
                ob_end_clean();
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Validation failed: index.html file is required in the root of the uploaded folder. Please ensure your folder contains an index.html file at the root level.'
                ]);
                closeDBConnection($conn);
                exit;
            }
            
            if (count($uploadedFiles) > 0 && $hasIndexHtml) {
                $file_url = '/backend/uploads/products/' . $folderName . '/';
                $file_name = $folderName;
                
                // Always generate preview URL based on actual folder name (override any frontend value)
                $baseUrl = 'https://uptulathemehub.com/backend/uploads/products';
                $preview_url = $baseUrl . '/' . $folderName . '/index.html';
            } else {
                ob_end_clean();
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'No valid files were uploaded or index.html is missing.'
                ]);
                closeDBConnection($conn);
                exit;
            }
        }
        
        // Handle ZIP file upload (only if upload_type is 'zip')
        if ($uploadType === 'zip' && isset($_FILES['zip_file']) && $_FILES['zip_file']['error'] === UPLOAD_ERR_OK) {
            // Handle ZIP file upload
            $zipExt = strtolower(pathinfo($_FILES['zip_file']['name'], PATHINFO_EXTENSION));
            
            // Validate ZIP extension
            if (!in_array($zipExt, ['zip', 'rar', '7z'])) {
                ob_end_clean();
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Invalid file type. Only ZIP, RAR, or 7Z files are allowed.'
                ]);
                closeDBConnection($conn);
                exit;
            }
            
            // For ZIP files, we'll extract and check for index.html
            // Generate a folder name from the ZIP filename (without extension)
            $zipBaseName = pathinfo($_FILES['zip_file']['name'], PATHINFO_FILENAME);
            $folderName = preg_replace('/[^a-zA-Z0-9_-]/', '', $zipBaseName);
            if (empty($folderName)) {
                $folderName = 'template_' . uniqid();
            }
            
            $folderPath = $uploadDir . $folderName . '/';
            
            // Create folder for extraction
            if (!file_exists($folderPath)) {
                mkdir($folderPath, 0755, true);
            }
            
            $zipPath = $uploadDir . uniqid() . '.' . $zipExt;
            
            // Move uploaded ZIP to temp location
            if (move_uploaded_file($_FILES['zip_file']['tmp_name'], $zipPath)) {
                // Check if ZIP extension is available
                if (!extension_loaded('zip') || !class_exists('ZipArchive')) {
                    unlink($zipPath);
                    ob_end_clean();
                    http_response_code(500);
                    echo json_encode([
                        'success' => false,
                        'message' => 'ZIP extraction is not available on this server. To enable it: 1) Go to XAMPP Control Panel 2) Click "Config" on Apache 3) Select "php.ini" 4) Find ";extension=zip" 5) Remove the semicolon and save 6) Restart Apache. Alternatively, use Folder Upload instead of ZIP.'
                    ]);
                    closeDBConnection($conn);
                    exit;
                }
                
                $zip = new ZipArchive();
                $zipResult = $zip->open($zipPath);
                if ($zipResult === TRUE) {
                    $hasIndexHtml = false;
                    $extractedFileCount = 0;
                    $skippedFiles = [];
                    // Expanded list of allowed extensions for template files
                    $allowedExtensions = [
                        'html', 'htm', 'xhtml', 'php', 'asp', 'aspx', 'jsp',
                        'css', 'scss', 'sass', 'less',
                        'js', 'jsx', 'ts', 'tsx', 'json', 'map',
                        'png', 'jpg', 'jpeg', 'gif', 'svg', 'ico', 'webp', 'bmp', 'tiff',
                        'woff', 'woff2', 'ttf', 'eot', 'otf',
                        'pdf', 'txt', 'xml', 'md', 'yml', 'yaml',
                        'mp4', 'webm', 'mp3', 'wav', 'ogg',
                        'zip', 'rar', '7z', // Allow nested archives
                        '' // Allow files without extensions
                    ];
                    
                    // Extract all files
                    for ($i = 0; $i < $zip->numFiles; $i++) {
                        $filename = $zip->getNameIndex($i);
                        
                        // Skip directories
                        if (substr($filename, -1) === '/') {
                            continue;
                        }
                        
                        // Skip hidden files (starting with .)
                        if (strpos(basename($filename), '.') === 0 && basename($filename) !== '.htaccess') {
                            continue;
                        }
                        
                        // Security: Prevent path traversal
                        $filename = str_replace('..', '', $filename);
                        $filename = ltrim($filename, '/');
                        
                        // Skip empty filenames
                        if (empty($filename)) {
                            continue;
                        }
                        
                        // Validate file extension (allow files without extensions too)
                        $ext = strtolower(pathinfo($filename, PATHINFO_EXTENSION));
                        // If file has no extension, treat it as allowed (empty string is in the array)
                        if (!empty($ext) && !in_array($ext, $allowedExtensions)) {
                            // Log skipped files for debugging
                            $skippedFiles[] = $filename . ' (extension: ' . ($ext ?: 'none') . ')';
                            continue; // Skip disallowed files
                        }
                        
                        $targetPath = $folderPath . $filename;
                        
                        // Security: Ensure target path is within upload directory
                        // Normalize paths for comparison
                        $normalizedTargetPath = str_replace('\\', '/', $targetPath);
                        $normalizedFolderPath = str_replace('\\', '/', $folderPath);
                        
                        // Check if target path starts with folder path (prevent directory traversal)
                        if (strpos($normalizedTargetPath, $normalizedFolderPath) !== 0) {
                            error_log("Path traversal attempt blocked in ZIP: " . $filename);
                            $skippedFiles[] = $filename . ' (path traversal blocked)';
                            continue;
                        }
                        
                        // Create directory if needed
                        $targetDir = dirname($targetPath);
                        if (!file_exists($targetDir)) {
                            if (!mkdir($targetDir, 0755, true)) {
                                error_log("Failed to create directory: $targetDir");
                                $skippedFiles[] = $filename . ' (directory creation failed)';
                                continue;
                            }
                        }
                        
                        // Extract file
                        $fileContent = $zip->getFromIndex($i);
                        if ($fileContent !== false) {
                            if (file_put_contents($targetPath, $fileContent) !== false) {
                                $extractedFileCount++;
                                
                                // Check if this is index.html at root level or inside a single top-level folder
                                $normalizedPath = strtolower(ltrim($filename, '/'));
                                $pathParts = explode('/', $normalizedPath);
                                $baseName = end($pathParts);
                                if ($baseName === 'index.html' && count($pathParts) <= 2) {
                                    $hasIndexHtml = true;
                                }
                            } else {
                                error_log("Failed to write file: $targetPath");
                            }
                        }
                    }
                    
                    $zip->close();
                    
                    // Delete the ZIP file after extraction
                    unlink($zipPath);
                    
                    // Check if any files were extracted
                    if ($extractedFileCount === 0) {
                        // Clean up empty folder
                        if (file_exists($folderPath)) {
                            $files = new RecursiveIteratorIterator(
                                new RecursiveDirectoryIterator($folderPath, RecursiveDirectoryIterator::SKIP_DOTS),
                                RecursiveIteratorIterator::CHILD_FIRST
                            );
                            foreach ($files as $file) {
                                if ($file->isDir()) {
                                    rmdir($file->getRealPath());
                                } else {
                                    unlink($file->getRealPath());
                                }
                            }
                            rmdir($folderPath);
                        }
                        
                        // Log skipped files for debugging
                        if (!empty($skippedFiles)) {
                            error_log("ZIP extraction skipped files: " . implode(', ', array_slice($skippedFiles, 0, 10)));
                        }
                        
                        ob_end_clean();
                        http_response_code(400);
                        $errorMsg = 'No valid files were extracted from the ZIP archive.';
                        if (!empty($skippedFiles) && count($skippedFiles) <= 5) {
                            $errorMsg .= ' Skipped files: ' . implode(', ', $skippedFiles);
                        } elseif (!empty($skippedFiles)) {
                            $errorMsg .= ' ' . count($skippedFiles) . ' files were skipped due to invalid extensions.';
                        }
                        $errorMsg .= ' Please ensure the ZIP file contains valid template files (HTML, CSS, JS, images, etc.).';
                        
                        echo json_encode([
                            'success' => false,
                            'message' => $errorMsg
                        ]);
                        closeDBConnection($conn);
                        exit;
                    }
                    
                    // Success - set file URLs (no index.html validation required)
                    $file_url = '/backend/uploads/products/' . $folderName . '/';
                    $file_name = $folderName;
                    
                    // Always generate preview URL based on actual folder name (override any frontend value)
                    $baseUrl = 'https://uptulathemehub.com/backend/uploads/products';
                    if ($hasIndexHtml) {
                        $preview_url = $baseUrl . '/' . $folderName . '/index.html';
                    } else {
                        $preview_url = $baseUrl . '/' . $folderName . '/';
                    }
                } else {
                    // Failed to open ZIP
                    $errorMsg = 'Failed to extract ZIP file.';
                    if ($zipResult === ZipArchive::ER_NOZIP) {
                        $errorMsg = 'The file is not a valid ZIP archive.';
                    } elseif ($zipResult === ZipArchive::ER_READ) {
                        $errorMsg = 'Failed to read the ZIP file.';
                    } elseif ($zipResult === ZipArchive::ER_OPEN) {
                        $errorMsg = 'Failed to open the ZIP file.';
                    }
                    
                    error_log("ZIP extraction failed with code: $zipResult for file: " . $_FILES['zip_file']['name']);
                    unlink($zipPath);
                    ob_end_clean();
                    http_response_code(400);
                    echo json_encode([
                        'success' => false,
                        'message' => $errorMsg . ' Please ensure the file is a valid ZIP archive.'
                    ]);
                    closeDBConnection($conn);
                    exit;
                }
            } else {
                ob_end_clean();
                http_response_code(500);
                echo json_encode([
                    'success' => false,
                    'message' => 'Failed to upload ZIP file.'
                ]);
                closeDBConnection($conn);
                exit;
            }
        }
        
        // Validate that file_url and file_name are set if upload_type was specified
        if (($uploadType === 'zip' || $uploadType === 'folder') && (empty($file_url) || empty($file_name))) {
            ob_end_clean();
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => 'Failed to process uploaded files. Please ensure your ' . ($uploadType === 'zip' ? 'ZIP file' : 'folder') . ' is valid and contains the required files.'
            ]);
            closeDBConnection($conn);
            exit;
        }
        
        // Check if is_latest and is_featured columns exist, if not add them
        $checkLatest = $conn->query("SHOW COLUMNS FROM products LIKE 'is_latest'");
        if ($checkLatest->num_rows === 0) {
            $conn->query("ALTER TABLE products ADD COLUMN is_latest TINYINT(1) DEFAULT 0 AFTER is_featured");
        }
        
        // Admin-added products are automatically approved
        $stmt = $conn->prepare("INSERT INTO products (name, slug, description, category_id, framework_id, price, offer_price, image_url, preview_url, file_url, file_name, status, is_featured, is_latest, last_update, high_resolution, compatible_browsers, compatible_with, themeforest_files_included, documentation, layout, tags) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'approved', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
        $stmt->bind_param("sssiiddssssiisissssss", $name, $slug, $description, $category_id, $framework_id, $price, $offer_price, $image_url, $preview_url, $file_url, $file_name, $is_featured, $is_latest, $last_update, $high_resolution, $compatible_browsers, $compatible_with, $themeforest_files_included, $documentation, $layout, $tags);
        
        if ($stmt->execute()) {
            ob_end_clean();
            header('Content-Type: application/json; charset=utf-8');
            echo json_encode([
                'success' => true,
                'message' => 'Product created successfully',
                'product_id' => $conn->insert_id,
                'preview_url' => $preview_url,
                'file_url' => $file_url,
                'file_name' => $file_name
            ]);
        } else {
            ob_end_clean();
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Failed to create product: ' . $stmt->error]);
        }
        $stmt->close();
        break;
        
    case 'PUT':
        // Update product
        $input = json_decode(file_get_contents('php://input'), true);
        $id = intval($input['id'] ?? 0);
        
        if ($id === 0) {
            ob_end_clean();
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Product ID is required']);
            break;
        }
        
        $name = $input['name'] ?? '';
        $description = $input['description'] ?? '';
        $category_id = intval($input['category_id'] ?? 0);
        $framework_id = intval($input['framework_id'] ?? 0);
        $price = floatval($input['price'] ?? 0);
        $offer_price = !empty($input['offer_price']) ? floatval($input['offer_price']) : null;
        $preview_url = $input['preview_url'] ?? '';
        
        $stmt = $conn->prepare("UPDATE products SET name=?, description=?, category_id=?, framework_id=?, price=?, offer_price=?, preview_url=? WHERE id=?");
        $stmt->bind_param("ssiiddsi", $name, $description, $category_id, $framework_id, $price, $offer_price, $preview_url, $id);
        
        if ($stmt->execute()) {
            ob_end_clean();
            echo json_encode(['success' => true, 'message' => 'Product updated successfully']);
        } else {
            ob_end_clean();
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Failed to update product']);
        }
        $stmt->close();
        break;
        
    case 'DELETE':
        // Delete product
        $input = json_decode(file_get_contents('php://input'), true);
        $id = intval($input['id'] ?? 0);
        
        if ($id === 0) {
            ob_end_clean();
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Product ID is required']);
            break;
        }
        
        // Get file paths before deleting
        $stmt = $conn->prepare("SELECT image_url, file_url FROM products WHERE id=?");
        $stmt->bind_param("i", $id);
        $stmt->execute();
        $result = $stmt->get_result();
        $product = $result->fetch_assoc();
        $stmt->close();
        
        // Delete product
        $stmt = $conn->prepare("DELETE FROM products WHERE id=?");
        $stmt->bind_param("i", $id);
        
        if ($stmt->execute()) {
            // Delete associated files
            if ($product['image_url']) {
                $imagePath = '../../' . ltrim($product['image_url'], '/');
                if (file_exists($imagePath)) unlink($imagePath);
            }
            if ($product['file_url']) {
                $filePath = '../../' . ltrim($product['file_url'], '/');
                if (file_exists($filePath)) unlink($filePath);
            }
            
            ob_end_clean();
            echo json_encode(['success' => true, 'message' => 'Product deleted successfully']);
        } else {
            ob_end_clean();
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Failed to delete product']);
        }
        $stmt->close();
        break;
        
    default:
        ob_end_clean();
        http_response_code(405);
        echo json_encode(['success' => false, 'message' => 'Method not allowed']);
}

closeDBConnection($conn);
