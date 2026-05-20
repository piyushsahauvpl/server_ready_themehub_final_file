<?php
/**
 * ADMIN - Test Razorpay Payout Configuration
 * 
 * Usage: https://uptulathemehub.com/backend/api/admin/test-payout.php
 * 
 * Tests:
 * 1. Database connection and tables
 * 2. Razorpay API credentials
 * 3. RazorpayX account configuration
 * 4. Sample payout API request (dry-run)
 */

error_reporting(E_ALL);
ini_set('display_errors', 1);

require_once '../../config/database.php';
require_once '../../config/razorpay.php';
require_once '../../api/payout/common.php';

header('Content-Type: application/json; charset=utf-8');

$results = [
    "timestamp" => date('Y-m-d H:i:s'),
    "tests" => [],
    "status" => "RUNNING"
];

try {
    // ─── TEST 1: Database Connection ───
    $results["tests"]["database"] = ["name" => "Database Connection", "status" => "PENDING"];
    $conn = getDBConnection();
    if ($conn && !$conn->connect_error) {
        $results["tests"]["database"]["status"] = "✅ PASS";
        $results["tests"]["database"]["message"] = "Connected successfully";
    } else {
        throw new Exception("Database connection failed: " . $conn->connect_error);
    }

    // ─── TEST 2: Payout Tables ───
    $results["tests"]["tables"] = ["name" => "Payout Tables", "status" => "PENDING"];
    ensurePayoutTables($conn);
    
    $requiredTables = ['seller_payouts', 'seller_earnings', 'admin_wallet'];
    $missingTables = [];
    
    foreach ($requiredTables as $table) {
        $res = $conn->query("SHOW TABLES LIKE '$table'");
        if (!$res || $res->num_rows === 0) {
            $missingTables[] = $table;
        }
    }
    
    if (empty($missingTables)) {
        $results["tests"]["tables"]["status"] = "✅ PASS";
        $results["tests"]["tables"]["message"] = "All required tables exist";
        $results["tests"]["tables"]["tables"] = $requiredTables;
    } else {
        $results["tests"]["tables"]["status"] = "❌ FAIL";
        $results["tests"]["tables"]["message"] = "Missing tables: " . implode(', ', $missingTables);
    }

    // ─── TEST 3: Razorpay Credentials ───
    $results["tests"]["credentials"] = ["name" => "Razorpay Credentials", "status" => "PENDING"];
    
    $keyIdOk = !empty(RAZORPAY_KEY_ID) && RAZORPAY_KEY_ID !== 'rzp_test_your_key_here';
    $keySecretOk = !empty(RAZORPAY_KEY_SECRET) && RAZORPAY_KEY_SECRET !== 'rzp_test_your_secret_here';
    $accountOk = !empty(RAZORPAY_ACCOUNT_NUMBER);
    
    if ($keyIdOk && $keySecretOk && $accountOk) {
        $results["tests"]["credentials"]["status"] = "✅ PASS";
        $results["tests"]["credentials"]["keyId"] = substr(RAZORPAY_KEY_ID, 0, 15) . "...";
        $results["tests"]["credentials"]["accountNumber"] = RAZORPAY_ACCOUNT_NUMBER;
    } else {
        $results["tests"]["credentials"]["status"] = "❌ FAIL";
        $results["tests"]["credentials"]["keyId_ok"] = $keyIdOk;
        $results["tests"]["credentials"]["keySecret_ok"] = $keySecretOk;
        $results["tests"]["credentials"]["accountNumber_ok"] = $accountOk;
        $results["tests"]["credentials"]["message"] = "Missing or invalid Razorpay credentials in config/razorpay.php";
    }

    // ─── TEST 4: Sample Seller Data ───
    $results["tests"]["sample_data"] = ["name" => "Sample Seller Data", "status" => "PENDING"];
    
    $stmt = $conn->prepare("
        SELECT s.id as seller_id, s.business_name, s.pending_earnings, bd.account_holder, bd.account_number, bd.ifsc_code
        FROM sellers s
        LEFT JOIN seller_bank_details bd ON s.id = bd.seller_id
        WHERE s.pending_earnings > 0
        LIMIT 1
    ");
    $stmt->execute();
    $seller = $stmt->get_result()->fetch_assoc();
    $stmt->close();
    
    if ($seller) {
        $results["tests"]["sample_data"]["status"] = "✅ FOUND";
        $results["tests"]["sample_data"]["seller_id"] = $seller['seller_id'];
        $results["tests"]["sample_data"]["business_name"] = $seller['business_name'];
        $results["tests"]["sample_data"]["pending_earnings"] = floatval($seller['pending_earnings']);
        $results["tests"]["sample_data"]["bank_details_set"] = !empty($seller['account_holder']) && !empty($seller['account_number']) && !empty($seller['ifsc_code']);
    } else {
        $results["tests"]["sample_data"]["status"] = "⚠️  NO DATA";
        $results["tests"]["sample_data"]["message"] = "No sellers with pending earnings found - create a test order first";
    }

    // ─── TEST 5: Razorpay API Connectivity ───
    $results["tests"]["api_connection"] = ["name" => "Razorpay API Connection", "status" => "PENDING"];
    
    try {
        $testPayload = [
            'contact' => 'test@example.com'
        ];
        
        $response = razorpayRequest('GET', 'contacts');
        
        $results["tests"]["api_connection"]["status"] = "✅ PASS";
        $results["tests"]["api_connection"]["message"] = "Successfully connected to Razorpay API";
    } catch (Exception $e) {
        $results["tests"]["api_connection"]["status"] = "❌ FAIL";
        $results["tests"]["api_connection"]["error"] = $e->getMessage();
    }

    $results["status"] = "COMPLETE";
    $allPassed = array_every($results["tests"], function($test) {
        return strpos($test["status"], "✅") === 0;
    });
    $results["all_tests_passed"] = $allPassed;

} catch (Exception $e) {
    $results["status"] = "ERROR";
    $results["error"] = $e->getMessage();
    $results["trace"] = $e->getTraceAsString();
}

echo json_encode($results, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);

// Helper function for PHP 5.x compatibility
if (!function_exists('array_every')) {
    function array_every(array $array, callable $callback) {
        foreach ($array as $value) {
            if (!call_user_func($callback, $value)) {
                return false;
            }
        }
        return true;
    }
}
?>
