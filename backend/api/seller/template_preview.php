<?php

set_time_limit(300);

header('Access-Control-Allow-Origin: *');
 
require_once __DIR__ . '/../config/database.php';
 
/* --------------------------------------------------

   1. INPUT

-------------------------------------------------- */

$type  = $_GET['type'] ?? '';

$id    = $_GET['id'] ?? 0;

$asset = $_GET['asset'] ?? null;
 
if (!$type || !$id) {

    http_response_code(400);

    exit('Invalid request');

}
 
/* --------------------------------------------------

   2. TYPE CONFIG (EXTENDABLE)

-------------------------------------------------- */

$config = [

    'admin' => [

        'table' => 'admin_templates',

        'dir'   => 'admin_templates',

    ],

    'seller' => [

        'table' => 'seller_templates',

        'dir'   => 'seller_templates',

    ],

    'user' => [

        'table' => 'user_templates',

        'dir'   => 'user_templates',

    ],

];
 
if (!isset($config[$type])) {

    http_response_code(403);

    exit('Invalid preview type');

}
 
$table   = $config[$type]['table'];

$baseDir = dirname(__DIR__) . '/uploads/' . $config[$type]['dir'];
 
/* --------------------------------------------------

   3. FETCH TEMPLATE INFO

-------------------------------------------------- */

$conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);

$stmt = $conn->prepare("SELECT file_url, preview_url FROM {$table} WHERE id = ? LIMIT 1");

$stmt->bind_param("i", $id);

$stmt->execute();

$data = $stmt->get_result()->fetch_assoc();

$stmt->close();

$conn->close();
 
if (!$data) {

    exit('Template not found');

}
 
/* --------------------------------------------------

   4. RESOLVE TEMPLATE FOLDER

-------------------------------------------------- */

$fileUrl = trim($data['file_url']);

$isFolder = substr($fileUrl, -1) === '/';
 
$folder = $isFolder

    ? basename(rtrim($fileUrl, '/'))

    : pathinfo($fileUrl, PATHINFO_FILENAME);
 
$templateDir = realpath($baseDir . '/' . $folder);
 
if (!$templateDir || !is_dir($templateDir)) {

    exit('Template folder missing');

}
 
/* --------------------------------------------------

   5. ASSET MODE (CSS / JS / IMG)

-------------------------------------------------- */

if ($asset !== null) {

    $asset = urldecode($asset);

    $asset = parse_url($asset, PHP_URL_PATH);

    $asset = ltrim(str_replace('..', '', $asset), '/');
 
    $fullPath = realpath($templateDir . '/' . $asset);
 
    if (!$fullPath || strpos($fullPath, $templateDir) !== 0) {

        http_response_code(404);

        exit('Asset not found');

    }
 
    $mimeMap = [

        'css'=>'text/css','js'=>'application/javascript',

        'png'=>'image/png','jpg'=>'image/jpeg','jpeg'=>'image/jpeg',

        'gif'=>'image/gif','svg'=>'image/svg+xml',

        'woff'=>'font/woff','woff2'=>'font/woff2',

        'ttf'=>'font/ttf','html'=>'text/html'

    ];
 
    $ext = strtolower(pathinfo($fullPath, PATHINFO_EXTENSION));

    header('Content-Type: ' . ($mimeMap[$ext] ?? 'application/octet-stream'));
 
    // Rewrite CSS url()

    if ($ext === 'css') {

        $base = $_SERVER['REQUEST_SCHEME'].'://'.$_SERVER['HTTP_HOST']

              . $_SERVER['PHP_SELF']

              . "?type=$type&id=$id&asset=";
 
        $css = file_get_contents($fullPath);

        $css = preg_replace_callback('/url\(([^)]+)\)/i', function($m) use ($base){

            $url = trim($m[1], "'\"");

            if (preg_match('~^(https?:|data:)~', $url)) return $m[0];

            return 'url("'.$base.urlencode($url).'")';

        }, $css);
 
        echo $css;

        exit;

    }
 
    readfile($fullPath);

    exit;

}
 
/* --------------------------------------------------

   6. FIND index.html

-------------------------------------------------- */

$indexFile = null;

$rii = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($templateDir));

foreach ($rii as $file) {

    if (strtolower($file->getFilename()) === 'index.html') {

        $indexFile = $file->getPathname();

        break;

    }

}
 
if (!$indexFile) {

    exit('index.html not found');

}
 
/* --------------------------------------------------

   7. LOAD & REWRITE HTML

-------------------------------------------------- */

$html = file_get_contents($indexFile);
 
$base = $_SERVER['REQUEST_SCHEME'].'://'.$_SERVER['HTTP_HOST']

      . $_SERVER['PHP_SELF']

      . "?type=$type&id=$id&asset=";
 
$html = preg_replace_callback(

    '/(src|href)=["\']([^"\']+)["\']/i',

    function($m) use ($base){

        if (preg_match('~^(https?:|data:|#)~', $m[2])) return $m[0];

        return $m[1].'="'.$base.urlencode($m[2]).'"';

    },

    $html

);
 
header('Content-Type: text/html; charset=utf-8');

echo $html;

exit;

 
 
 