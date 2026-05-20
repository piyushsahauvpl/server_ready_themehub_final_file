<?php
/**
 * COMPREHENSIVE DIAGNOSTIC TOOL
 * Checks why approved products count shows as 0
 */

error_reporting(E_ALL);
ini_set('display_errors', 0);

header('Access-Control-Allow-Origin: https://uptulathemehub.com');
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once '../../config/database.php';
session_start();

// Check if user is authenticated
if (!isset($_SESSION['user_id'])) {
    echo json_encode([
        'success' => false,
        'message' => 'NOT_LOGGED_IN',
        'session_user_id' => $_SESSION['user_id'] ?? null
    ]);
    exit;
}

try {
    $conn = getDBConnection();
    $user_id = $_SESSION['user_id'];

    $diagnostics = [];

    // ✅ STEP 1: Check current user
    error_log("🔍 [DIAGNOSE] Checking user_id: $user_id");
    
    $userStmt = $conn->prepare("SELECT id, full_name, email, user_type FROM users WHERE id = ?");
    $userStmt->bind_param("i", $user_id);
    $userStmt->execute();
    $user = $userStmt->get_result()->fetch_assoc();
    $userStmt->close();

    $diagnostics['current_user'] = $user ? [
        'user_id' => $user['id'],
        'name' => $user['full_name'],
        'email' => $user['email'],
        'user_type' => $user['user_type'] ?? 'unknown'
    ] : null;

    if (!$user) {
        throw new Exception("User not found in database");
    }

    // ✅ STEP 2: Check seller record
    error_log("🔍 [DIAGNOSE] Checking seller record for user_id: $user_id");
    
    $sellerStmt = $conn->prepare("
        SELECT id, business_name, payment_confirmed, created_at
        FROM sellers 
        WHERE user_id = ?
    ");
    $sellerStmt->bind_param("i", $user_id);
    $sellerStmt->execute();
    $seller = $sellerStmt->get_result()->fetch_assoc();
    $sellerStmt->close();

    if (!$seller) {
        $diagnostics['seller_record'] = 'NOT_FOUND';
        $diagnostics['error'] = 'User is not registered as a seller';
    } else {
        $seller_id = $seller['id'];
        
        $diagnostics['seller_record'] = [
            'seller_id' => $seller_id,
            'business_name' => $seller['business_name'],
            'payment_confirmed' => $seller['payment_confirmed'],
            'created_at' => $seller['created_at']
        ];

        // ✅ STEP 3: Check products table structure
        error_log("🔍 [DIAGNOSE] Checking products table structure");
        
        $structureResult = $conn->query("DESCRIBE products");
        $columns = [];
        while ($col = $structureResult->fetch_assoc()) {
            $columns[$col['Field']] = $col['Type'];
        }

        $diagnostics['products_table_structure'] = [
            'has_status_column' => isset($columns['status']),
            'has_seller_id_column' => isset($columns['seller_id']),
            'total_columns' => count($columns),
            'key_columns' => [
                'id' => $columns['id'] ?? 'NOT_FOUND',
                'name' => $columns['name'] ?? 'NOT_FOUND',
                'seller_id' => $columns['seller_id'] ?? 'NOT_FOUND',
                'status' => $columns['status'] ?? 'NOT_FOUND'
            ]
        ];

        // ✅ STEP 4: Count all products for this seller
        error_log("🔍 [DIAGNOSE] Counting products for seller_id: $seller_id");
        
        $allProductsStmt = $conn->prepare("
            SELECT 
                COUNT(*) as total,
                COUNT(IF(status = 'approved', 1, NULL)) as approved,
                COUNT(IF(status = 'pending_review', 1, NULL)) as pending,
                COUNT(IF(status IS NULL, 1, NULL)) as null_status,
                COUNT(IF(status = '', 1, NULL)) as empty_status,
                COUNT(IF(status = 'draft', 1, NULL)) as draft,
                COUNT(IF(status = 'rejected', 1, NULL)) as rejected,
                COUNT(IF(status = 'needs_changes', 1, NULL)) as needs_changes
            FROM products 
            WHERE seller_id = ?
        ");
        $allProductsStmt->bind_param("i", $seller_id);
        $allProductsStmt->execute();
        $counts = $allProductsStmt->get_result()->fetch_assoc();
        $allProductsStmt->close();

        $diagnostics['product_status_count'] = [
            'total_products' => $counts['total'],
            'approved' => $counts['approved'],
            'pending_review' => $counts['pending'],
            'suspended_draft' => $counts['draft'],
            'needs_changes' => $counts['needs_changes'],
            'rejected' => $counts['rejected'],
            'null_status' => $counts['null_status'],
            'empty_status' => $counts['empty_status']
        ];

        // ✅ STEP 5: List all products with full details
        error_log("🔍 [DIAGNOSE] Fetching all products for seller_id: $seller_id");
        
        $productsStmt = $conn->prepare("
            SELECT 
                id, name, status, created_at, updated_at, admin_feedback
            FROM products 
            WHERE seller_id = ?
            ORDER BY created_at DESC
        ");
        $productsStmt->bind_param("i", $seller_id);
        $productsStmt->execute();
        $products = [];
        $result = $productsStmt->get_result();
        while ($row = $result->fetch_assoc()) {
            $products[] = $row;
        }
        $productsStmt->close();

        $diagnostics['products_list'] = $products;

        // ✅ STEP 6: Check for data issues
        error_log("🔍 [DIAGNOSE] Checking for data issues");
        
        $issues = [];
        
        if ($counts['total'] == 0) {
            $issues[] = 'NO_PRODUCTS_FOUND - Seller has no products';
        }
        
        if ($counts['null_status'] > 0 || $counts['empty_status'] > 0) {
            $issues[] = "STATUS_NOT_SET - {$counts['null_status']} products have NULL status, {$counts['empty_status']} have empty status";
        }
        
        if ($counts['approved'] == 0 && $counts['total'] > 0) {
            $issues[] = 'NO_APPROVED_PRODUCTS - Products exist but none are approved. Check if admin approval was saved.';
        }

        $diagnostics['potential_issues'] = $issues;

        // ✅ STEP 7: Test the approved-products.php query
        error_log("🔍 [DIAGNOSE] Testing approved-products.php logic");
        
        $testStmt = $conn->prepare("
            SELECT COUNT(*) as approved_count 
            FROM products 
            WHERE seller_id = ? AND status = 'approved'
        ");
        $testStmt->bind_param("i", $seller_id);
        $testStmt->execute();
        $testResult = $testStmt->get_result()->fetch_assoc();
        $testStmt->close();

        $diagnostics['approved_products_query_result'] = $testResult['approved_count'];
        
        // ✅ STEP 8: Session check
        $diagnostics['session_info'] = [
            'user_id_in_session' => $_SESSION['user_id'],
            'request_method' => $_SERVER['REQUEST_METHOD'],
            'timestamp' => date('Y-m-d H:i:s')
        ];
    }

    error_log("📤 [DIAGNOSE] Complete diagnostics: " . json_encode($diagnostics));

    echo json_encode([
        'success' => true,
        'diagnostics' => $diagnostics,
        'recommendations' => generateRecommendations($diagnostics)
    ]);

    $conn->close();

} catch (Exception $e) {
    error_log('❌ [DIAGNOSE] Error: ' . $e->getMessage());
    
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage(),
        'error_type' => 'EXCEPTION'
    ]);
}

function generateRecommendations($diagnostics) {
    $recommendations = [];

    if (!$diagnostics['seller_record']) {
        $recommendations[] = '❌ User is NOT a seller. Register as seller first.';
        return $recommendations;
    }

    $products = $diagnostics['products_list'] ?? [];
    $issues = $diagnostics['potential_issues'] ?? [];

    if ($diagnostics['product_status_count']['total_products'] == 0) {
        $recommendations[] = '❌ No products found. Upload products first.';
    } else if ($diagnostics['product_status_count']['approved'] == 0) {
        $recommendations[] = '⚠️ No approved products. Admin needs to approve them. Check products_list to see current statuses.';
        $recommendations[] = '💡 Ask admin to visit admin panel and approve these products:';
        foreach ($products as $p) {
            $recommendations[] = "   - {$p['name']} (ID: {$p['id']}, Current Status: {$p['status']})";
        }
    } else {
        $count = $diagnostics['product_status_count']['approved'];
        $recommendations[] = "✅ SUCCESS: Found {$count} approved product(s). Dashboard should show this count.";
        if ($diagnostics['approved_products_query_result'] == 0) {
            $recommendations[] = '⚠️ But query returned 0. There might be a data sync issue.';
        }
    }

    return $recommendations;
}
?>
