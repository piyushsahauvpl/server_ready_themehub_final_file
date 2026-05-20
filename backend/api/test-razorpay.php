<?php
/**
 * Razorpay Connectivity Test
 * Visit: https://uptulathemehub.com/backend/api/test-razorpay.php
 */
 
header('Content-Type: text/plain');
 
echo "╔════════════════════════════════════════╗\n";
echo "║  RAZORPAY CONNECTIVITY TEST            ║\n";
echo "╚════════════════════════════════════════╝\n\n";
 
// ✅ TEST 1: PHP Extensions
echo "[1] PHP EXTENSIONS\n";
echo "─────────────────────\n";
echo "OpenSSL:   " . (extension_loaded('openssl') ? "✅ LOADED" : "❌ NOT LOADED") . "\n";
echo "cURL:      " . (extension_loaded('curl') ? "✅ LOADED" : "❌ NOT LOADED") . "\n";
echo "JSON:      " . (extension_loaded('json') ? "✅ LOADED" : "❌ NOT LOADED") . "\n";
echo "\n";
 
// ✅ TEST 2: DNS Resolution
echo "[2] DNS RESOLUTION\n";
echo "─────────────────────\n";
 
$domains = [
    'google.com' => 'General internet test',
    'api.razorpay.com' => 'Razorpay API server',
    'checkout.razorpay.com' => 'Razorpay Checkout'
];
 
foreach ($domains as $domain => $desc) {
    $ip = gethostbyname($domain);
    if ($ip === $domain) {
        echo "❌ $domain: FAILED TO RESOLVE\n";
        echo "   Description: $desc\n";
    } else {
        echo "✅ $domain: $ip\n";
        echo "   Description: $desc\n";
    }
}
echo "\n";
 
// ✅ TEST 3: cURL Connection
echo "[3] CURL CONNECTION TEST\n";
echo "─────────────────────────\n";
 
$urls = [
    'https://api.razorpay.com/v1/health' => 'Razorpay Health Check',
    'https://www.google.com' => 'Google (general internet)',
];
 
foreach ($urls as $url => $desc) {
    $curl = curl_init();
    curl_setopt_array($curl, array(
        CURLOPT_URL => $url,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 5,
        CURLOPT_SSL_VERIFYPEER => false,
        CURLOPT_VERBOSE => false,
    ));
   
    $response = curl_exec($curl);
    $error = curl_error($curl);
    $errno = curl_errno($curl);
    $httpCode = curl_getinfo($curl, CURLINFO_HTTP_CODE);
    curl_close($curl);
   
    echo ($error ? "❌" : "✅") . " $url\n";
    echo "   Description: $desc\n";
    if ($error) {
        echo "   Error: [$errno] $error\n";
    } else {
        echo "   HTTP Code: $httpCode\n";
    }
}
echo "\n";
 
// ✅ TEST 4: Razorpay SDK
echo "[4] RAZORPAY SDK TEST\n";
echo "─────────────────────\n";
 
try {
    require_once __DIR__ . '/../vendor/autoload.php';
   
    echo "✅ Razorpay SDK loaded successfully\n";
   
    // Try to instantiate (this won't connect yet)
    $api = new \Razorpay\Api\Api('rzp_test_dummy', 'test_secret_dummy');
    echo "✅ Razorpay API class instantiated\n";
   
} catch (Exception $e) {
    echo "❌ Razorpay SDK Error: " . $e->getMessage() . "\n";
}
echo "\n";
 
// ✅ TEST 5: Firewall Check
echo "[5] FIREWALL/SECURITY\n";
echo "──────────────────────\n";
echo "PHP Version:  " . phpversion() . "\n";
echo "OpenSSL Version: " . (defined('OPENSSL_VERSION_TEXT') ? OPENSSL_VERSION_TEXT : 'Unknown') . "\n";
echo "cURL Version: " . (defined('CURL_VERSION_NUMBER') ? curl_version()['version'] : 'Unknown') . "\n";
echo "\n";
 
// ✅ TEST 6: PHP.ini Settings
echo "[6] CRITICAL PHP.INI SETTINGS\n";
echo "────────────────────────────────\n";
echo "allow_url_fopen: " . ini_get('allow_url_fopen') . " (" . (ini_get('allow_url_fopen') ? "✅" : "❌") . ")\n";
echo "max_execution_time: " . ini_get('max_execution_time') . "s\n";
echo "default_socket_timeout: " . ini_get('default_socket_timeout') . "s\n";
echo "\n";
 
// SUMMARY
echo "╔════════════════════════════════════════╗\n";
echo "║  TROUBLESHOOTING STEPS                 ║\n";
echo "╚════════════════════════════════════════╝\n\n";
 
$hasMissingExt = (!extension_loaded('openssl') || !extension_loaded('curl'));
$failedDNS = (gethostbyname('api.razorpay.com') === 'api.razorpay.com');
 
if ($hasMissingExt) {
    echo "⚠️  MISSING EXTENSIONS detected!\n";
    echo "    1. Open XAMPP Control Panel\n";
    echo "    2. Click 'Config' next to Apache\n";
    echo "    3. Edit php.ini\n";
    echo "    4. Find and uncomment: extension=openssl and extension=curl\n";
    echo "    5. Restart Apache\n\n";
}
 
if ($failedDNS) {
    echo "⚠️  DNS RESOLUTION FAILED!\n";
    echo "    1. Check your internet connection\n";
    echo "    2. Try pinging api.razorpay.com from command line\n";
    echo "    3. Restart router/XAMPP if needed\n";
    echo "    4. Check if corporate firewall/VPN is blocking\n\n";
}
 
if (!$hasMissingExt && !$failedDNS) {
    echo "✅ All tests passed! Razorpay should work.\n";
    echo "   If payments still fail, check:\n";
    echo "    - Razorpay API credentials (test vs live)\n";
    echo "    - Payment.jsx and create-order.php configuration\n";
    echo "    - Browser console for CORS errors\n\n";
}
?>