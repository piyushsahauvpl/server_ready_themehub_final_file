<?php

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../config/razorpay.php';
require_once __DIR__ . '/../../middleware/auth.php';

function sessionStartSafe() {
    if (session_status() === PHP_SESSION_NONE) {
        session_start();
    }
}

function sendJson(array $payload, int $statusCode = 200) {
    http_response_code($statusCode);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($payload);
    exit;
}

function getRequestData() {
    $body = file_get_contents('php://input');
    return json_decode($body, true) ?: [];
}

function tableExists($conn, string $tableName): bool {
    $result = $conn->query("SHOW TABLES LIKE '" . $conn->real_escape_string($tableName) . "'");
    return $result && $result->num_rows > 0;
}

function columnExists($conn, string $tableName, string $columnName): bool {
    $result = $conn->query("SHOW COLUMNS FROM `" . $conn->real_escape_string($tableName) . "` LIKE '" . $conn->real_escape_string($columnName) . "'");
    return $result && $result->num_rows > 0;
}

function addColumnIfNotExists($conn, string $tableName, string $columnDefinition) {
    if (!preg_match('/^\s*`?([^`\s(]+)`?\s+/i', trim($columnDefinition), $matches)) {
        return;
    }
    $columnName = $matches[1];
    if (!columnExists($conn, $tableName, $columnName)) {
        $conn->query("ALTER TABLE `" . $conn->real_escape_string($tableName) . "` ADD COLUMN " . $columnDefinition);
    }
}

function ensurePayoutTables($conn) {
    $conn->query("CREATE TABLE IF NOT EXISTS admin_wallet (
        id INT AUTO_INCREMENT PRIMARY KEY,
        balance DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");

    $conn->query("CREATE TABLE IF NOT EXISTS admin_wallet_transactions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        type ENUM('credit', 'debit') NOT NULL,
        amount DECIMAL(12, 2) NOT NULL,
        balance_after DECIMAL(12, 2) NOT NULL,
        reference_type VARCHAR(60) NOT NULL,
        reference_id VARCHAR(100) DEFAULT NULL,
        note TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        KEY idx_admin_wallet_transactions_type (type)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");

    addColumnIfNotExists($conn, 'admin_wallet_transactions', 'balance_after DECIMAL(12, 2) NOT NULL DEFAULT 0.00');
    addColumnIfNotExists($conn, 'admin_wallet_transactions', 'reference_type VARCHAR(60) NOT NULL DEFAULT \'\'');
    addColumnIfNotExists($conn, 'admin_wallet_transactions', 'reference_id VARCHAR(100) DEFAULT NULL');
    addColumnIfNotExists($conn, 'admin_wallet_transactions', 'note TEXT');

    $conn->query("CREATE TABLE IF NOT EXISTS seller_wallet (
        id INT AUTO_INCREMENT PRIMARY KEY,
        seller_id INT NOT NULL,
        balance DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uniq_seller_wallet (seller_id),
        KEY idx_seller_wallet_seller_id (seller_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");

    $conn->query("CREATE TABLE IF NOT EXISTS wallet_transactions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        seller_id INT NOT NULL,
        type ENUM('credit', 'debit') NOT NULL,
        amount DECIMAL(12, 2) NOT NULL,
        balance_after DECIMAL(12, 2) NOT NULL,
        reference_type VARCHAR(60) NOT NULL,
        reference_id VARCHAR(100) DEFAULT NULL,
        note TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        KEY idx_wallet_transactions_seller_id (seller_id),
        KEY idx_wallet_transactions_type (type)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");

    addColumnIfNotExists($conn, 'wallet_transactions', 'balance_after DECIMAL(12, 2) NOT NULL DEFAULT 0.00');
    addColumnIfNotExists($conn, 'wallet_transactions', 'reference_type VARCHAR(60) NOT NULL DEFAULT \'\'');
    addColumnIfNotExists($conn, 'wallet_transactions', 'reference_id VARCHAR(100) DEFAULT NULL');
    addColumnIfNotExists($conn, 'wallet_transactions', 'note TEXT');

    $conn->query("CREATE TABLE IF NOT EXISTS withdraw_requests (
        id INT AUTO_INCREMENT PRIMARY KEY,
        seller_id INT NOT NULL,
        amount DECIMAL(12, 2) NOT NULL,
        currency VARCHAR(10) NOT NULL DEFAULT 'INR',
        status ENUM('pending', 'approved', 'rejected', 'paid', 'failed') NOT NULL DEFAULT 'pending',
        requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        processed_at TIMESTAMP NULL DEFAULT NULL,
        admin_id INT DEFAULT NULL,
        reason TEXT DEFAULT NULL,
        payout_id VARCHAR(100) DEFAULT NULL,
        failure_reason TEXT DEFAULT NULL,
        bank_details JSON DEFAULT NULL,
        metadata JSON DEFAULT NULL,
        KEY idx_withdraw_requests_seller_id (seller_id),
        KEY idx_withdraw_requests_status (status),
        KEY idx_withdraw_requests_payout_id (payout_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");

    addColumnIfNotExists($conn, 'withdraw_requests', 'requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP');
    addColumnIfNotExists($conn, 'withdraw_requests', 'processed_at TIMESTAMP NULL DEFAULT NULL');
    addColumnIfNotExists($conn, 'withdraw_requests', 'admin_id INT DEFAULT NULL');
    addColumnIfNotExists($conn, 'withdraw_requests', 'reason TEXT DEFAULT NULL');
    addColumnIfNotExists($conn, 'withdraw_requests', 'payout_id VARCHAR(100) DEFAULT NULL');
    addColumnIfNotExists($conn, 'withdraw_requests', 'failure_reason TEXT DEFAULT NULL');
    addColumnIfNotExists($conn, 'withdraw_requests', 'bank_details JSON DEFAULT NULL');
    addColumnIfNotExists($conn, 'withdraw_requests', 'metadata JSON DEFAULT NULL');

    $conn->query("CREATE TABLE IF NOT EXISTS seller_payouts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        seller_id INT NOT NULL,
        withdraw_request_id INT DEFAULT NULL,
        razorpay_payout_id VARCHAR(100) DEFAULT NULL,
        status ENUM('pending', 'approved', 'processing', 'transferred', 'paid', 'failed') NOT NULL DEFAULT 'pending',
        amount DECIMAL(12, 2) NOT NULL,
        failure_reason TEXT DEFAULT NULL,
        response JSON DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        KEY idx_seller_payouts_seller_id (seller_id),
        KEY idx_seller_payouts_status (status),
        KEY idx_seller_payouts_withdraw_id (withdraw_request_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");

    $conn->query("ALTER TABLE seller_payouts MODIFY status ENUM('pending', 'approved', 'processing', 'transferred', 'paid', 'failed') NOT NULL DEFAULT 'pending'");

    addColumnIfNotExists($conn, 'seller_payouts', 'withdraw_request_id INT DEFAULT NULL');
    addColumnIfNotExists($conn, 'seller_payouts', 'razorpay_payout_id VARCHAR(100) DEFAULT NULL');
    addColumnIfNotExists($conn, 'seller_payouts', 'response JSON DEFAULT NULL');
    addColumnIfNotExists($conn, 'seller_payouts', 'updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP');

    $conn->query("CREATE TABLE IF NOT EXISTS seller_kyc (
        id INT AUTO_INCREMENT PRIMARY KEY,
        seller_id INT NOT NULL,
        status ENUM('pending', 'verified', 'rejected') NOT NULL DEFAULT 'pending',
        details JSON DEFAULT NULL,
        verified_at TIMESTAMP NULL DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY uniq_seller_kyc (seller_id),
        KEY idx_seller_kyc_status (status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");

    $conn->query("CREATE TABLE IF NOT EXISTS notifications (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT DEFAULT NULL,
        seller_id INT DEFAULT NULL,
        type ENUM('info', 'success', 'warning', 'error') NOT NULL DEFAULT 'info',
        title VARCHAR(255) DEFAULT NULL,
        message TEXT NOT NULL,
        status ENUM('unread', 'read') NOT NULL DEFAULT 'unread',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        read_at TIMESTAMP NULL DEFAULT NULL,
        KEY idx_notifications_seller_id (seller_id),
        KEY idx_notifications_status (status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");
}

function getSellerSession($conn) {
    sessionStartSafe();
    $sellerId = $_SESSION['seller_id'] ?? null;
    $userId = $_SESSION['seller_user_id'] ?? $_SESSION['user_id'] ?? null;

    if ($sellerId) {
        $stmt = $conn->prepare("SELECT s.*, u.email AS user_email, u.phone AS user_phone, u.full_name AS user_name FROM sellers s LEFT JOIN users u ON s.user_id = u.id WHERE s.id = ? LIMIT 1");
        $stmt->bind_param('i', $sellerId);
    } elseif ($userId) {
        $stmt = $conn->prepare("SELECT s.*, u.email AS user_email, u.phone AS user_phone, u.full_name AS user_name FROM sellers s LEFT JOIN users u ON s.user_id = u.id WHERE s.user_id = ? LIMIT 1");
        $stmt->bind_param('i', $userId);
    } else {
        return null;
    }

    $stmt->execute();
    $seller = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    return $seller ?: null;
}

function getSellerWallet($conn, int $sellerId) {
    if (!tableExists($conn, 'seller_wallet')) {
        ensurePayoutTables($conn);
    }

    $stmt = $conn->prepare("SELECT * FROM seller_wallet WHERE seller_id = ? LIMIT 1");
    $stmt->bind_param('i', $sellerId);
    $stmt->execute();
    $wallet = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    if (!$wallet) {
        $stmt = $conn->prepare("INSERT INTO seller_wallet (seller_id, balance) VALUES (?, 0.00)");
        $stmt->bind_param('i', $sellerId);
        $stmt->execute();
        $stmt->close();

        $wallet = ['seller_id' => $sellerId, 'balance' => 0.00];
    }

    $wallet['balance'] = floatval($wallet['balance']);
    return $wallet;
}

function getAdminWallet($conn) {
    if (!tableExists($conn, 'admin_wallet')) {
        ensurePayoutTables($conn);
    }

    $stmt = $conn->prepare("SELECT * FROM admin_wallet WHERE id = 1 LIMIT 1");
    $stmt->execute();
    $wallet = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    if (!$wallet) {
        $stmt = $conn->prepare("INSERT INTO admin_wallet (id, balance) VALUES (1, 0.00)");
        $stmt->execute();
        $stmt->close();

        $wallet = ['id' => 1, 'balance' => 0.00];
    }

    $wallet['balance'] = floatval($wallet['balance']);
    return $wallet;
}

function updateAdminWalletBalance($conn, float $amount, string $type, string $referenceType, $referenceId = null, string $note = '') {
    $wallet = getAdminWallet($conn);
    $newBalance = $wallet['balance'] + ($type === 'credit' ? $amount : -$amount);
    if ($newBalance < 0) {
        throw new Exception('Insufficient admin wallet balance');
    }

    $stmt = $conn->prepare("UPDATE admin_wallet SET balance = ?, updated_at = NOW() WHERE id = 1");
    $stmt->bind_param('d', $newBalance);
    $stmt->execute();
    $stmt->close();

    addAdminWalletTransaction($conn, $type, $amount, $newBalance, $referenceType, $referenceId, $note);
    return $newBalance;
}

function addAdminWalletTransaction($conn, string $type, float $amount, float $balanceAfter, string $referenceType, $referenceId = null, string $note = '') {
    if (!in_array($type, ['credit', 'debit'], true)) {
        throw new Exception('Invalid transaction type');
    }

    $stmt = $conn->prepare("INSERT INTO admin_wallet_transactions (type, amount, balance_after, reference_type, reference_id, note) VALUES (?, ?, ?, ?, ?, ?)");
    $referenceIdStr = $referenceId !== null ? (string)$referenceId : null;
    $stmt->bind_param('sddsss', $type, $amount, $balanceAfter, $referenceType, $referenceIdStr, $note);
    $stmt->execute();
    $stmt->close();
}

function updateSellerWalletBalance($conn, int $sellerId, float $amount, string $type) {
    $wallet = getSellerWallet($conn, $sellerId);
    $newBalance = $wallet['balance'] + ($type === 'credit' ? $amount : -$amount);
    if ($newBalance < 0) {
        throw new Exception('Insufficient wallet balance');
    }

    $stmt = $conn->prepare("UPDATE seller_wallet SET balance = ?, updated_at = NOW() WHERE seller_id = ?");
    $stmt->bind_param('di', $newBalance, $sellerId);
    $stmt->execute();
    $stmt->close();

    addWalletTransaction($conn, $sellerId, $type, $amount, $newBalance, $type === 'credit' ? 'order' : 'withdraw', null, ucfirst($type) . ' from seller wallet');
    return $newBalance;
}

function addWalletTransaction($conn, int $sellerId, string $type, float $amount, float $balanceAfter, string $referenceType, $referenceId = null, string $note = '') {
    if (!in_array($type, ['credit', 'debit'], true)) {
        throw new Exception('Invalid transaction type');
    }

    $stmt = $conn->prepare("INSERT INTO wallet_transactions (seller_id, type, amount, balance_after, reference_type, reference_id, note) VALUES (?, ?, ?, ?, ?, ?, ?)");
    $referenceIdStr = $referenceId !== null ? (string)$referenceId : null;
    $stmt->bind_param('isddsss', $sellerId, $type, $amount, $balanceAfter, $referenceType, $referenceIdStr, $note);
    $stmt->execute();
    $stmt->close();
}

function createNotification($conn, $userId, int $sellerId, string $type, string $title, string $message) {
    $stmt = $conn->prepare("INSERT INTO notifications (user_id, seller_id, type, title, message) VALUES (?, ?, ?, ?, ?)");
    $userIdVal = $userId !== null ? intval($userId) : null;
    $stmt->bind_param('iisss', $userIdVal, $sellerId, $type, $title, $message);
    $stmt->execute();
    $stmt->close();
}

function getSellerKyc($conn, int $sellerId): ?array {
    if (!tableExists($conn, 'seller_kyc')) {
        ensurePayoutTables($conn);
    }

    $stmt = $conn->prepare("SELECT * FROM seller_kyc WHERE seller_id = ? LIMIT 1");
    $stmt->bind_param('i', $sellerId);
    $stmt->execute();
    $row = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    if (!$row) {
        return null;
    }
    $row['details'] = $row['details'] ? json_decode($row['details'], true) : null;
    return $row;
}

function requireVerifiedKyc($conn, int $sellerId) {
    $kyc = getSellerKyc($conn, $sellerId);
    if (!$kyc || $kyc['status'] !== 'verified') {
        throw new Exception('Seller KYC must be verified before payout processing');
    }
    return $kyc;
}

function getNotifications($conn, int $sellerId, int $limit = 20): array {
    if (!tableExists($conn, 'notifications')) {
        ensurePayoutTables($conn);
    }
    $stmt = $conn->prepare("SELECT id, type, title, message, status, created_at FROM notifications WHERE seller_id = ? ORDER BY created_at DESC LIMIT ?");
    $stmt->bind_param('ii', $sellerId, $limit);
    $stmt->execute();
    $result = $stmt->get_result();
    $notifications = [];
    while ($row = $result->fetch_assoc()) {
        $notifications[] = $row;
    }
    $stmt->close();
    return $notifications;
}

function validateRazorpayCredentials(): void {
    $invalidId     = empty(RAZORPAY_KEY_ID)     || RAZORPAY_KEY_ID     === 'rzp_test_your_key_here';
    $invalidSecret = empty(RAZORPAY_KEY_SECRET)  || RAZORPAY_KEY_SECRET === 'rzp_test_your_secret_here';
    $invalidAccNo  = empty(RAZORPAY_ACCOUNT_NUMBER);

    if ($invalidId || $invalidSecret) {
        throw new Exception('Razorpay credentials are not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in backend/config/razorpay.php.');
    }
    if ($invalidAccNo) {
        throw new Exception('RAZORPAY_ACCOUNT_NUMBER is not configured. Set the RAZORPAY_ACCOUNT_NUMBER environment variable to your RazorpayX source account number.');
    }
}

// ✅ FIX 1: Better error messages from Razorpay API
function razorpayRequest(string $method, string $endpoint, array $payload = []) {
    validateRazorpayCredentials();

    $url  = 'https://api.razorpay.com/v1/' . ltrim($endpoint, '/');
    $curl = curl_init($url);

    $headers = ['Content-Type: application/json'];

    curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($curl, CURLOPT_USERPWD,        RAZORPAY_KEY_ID . ':' . RAZORPAY_KEY_SECRET);
    curl_setopt($curl, CURLOPT_HTTPHEADER,     $headers);
    curl_setopt($curl, CURLOPT_CUSTOMREQUEST,  $method);

    if (in_array($method, ['POST', 'PUT', 'PATCH'], true) && !empty($payload)) {
        curl_setopt($curl, CURLOPT_POSTFIELDS, json_encode($payload));
    }

    $response  = curl_exec($curl);
    $httpCode  = curl_getinfo($curl, CURLINFO_HTTP_CODE);
    $curlError = curl_error($curl);
    curl_close($curl);

    if ($curlError) {
        throw new Exception('Razorpay cURL error: ' . $curlError);
    }

    $decoded = json_decode($response, true);

    // ✅ Extract human-readable error from Razorpay response instead of raw JSON
    if ($httpCode >= 400) {
        $errorMsg = $decoded['error']['description']
            ?? $decoded['error']['reason']
            ?? $decoded['message']
            ?? $response;
        error_log("❌ [RAZORPAY] $method $endpoint → HTTP $httpCode: $errorMsg");
        error_log("❌ [RAZORPAY] Payload sent: " . json_encode($payload));
        throw new Exception('Razorpay error: ' . $errorMsg);
    }

    return $decoded;
}

// ✅ FIX 2: Only send email/phone to Razorpay if they are non-empty
function findOrCreateRazorpayContact(array $seller): array {
    $referenceId = 'seller_' . $seller['id'];

    // Try to find existing contact
    try {
        $found = razorpayRequest('GET', 'contacts?reference_id=' . urlencode($referenceId));
        if (!empty($found['items']) && is_array($found['items'])) {
            return $found['items'][0];
        }
    } catch (Exception $e) {
        // Contact not found, will create below
    }

    // Build payload — only include email/phone if they are not empty
    $payload = [
        'name'         => $seller['business_name'] ?: ($seller['user_name'] ?? 'Seller ' . $seller['id']),
        'type'         => 'vendor',
        'reference_id' => $referenceId,
        'notes'        => [
            'seller_id' => $seller['id']
        ]
    ];

    // ✅ Razorpay rejects empty string for email/contact — only add if present
    if (!empty($seller['user_email'])) {
        $payload['email'] = $seller['user_email'];
    }
    if (!empty($seller['user_phone'])) {
        $payload['contact'] = $seller['user_phone'];
    }

    return razorpayRequest('POST', 'contacts', $payload);
}

function createRazorpayFundAccount(array $contact, array $bankDetails): array {
    $payload = [
        'contact_id'   => $contact['id'],
        'account_type' => 'bank_account',
        'bank_account' => [
            'name'           => $bankDetails['account_holder_name'] ?? $bankDetails['name'] ?? '',
            'ifsc'           => $bankDetails['ifsc'],
            'account_number' => $bankDetails['account_number']
        ]
    ];

    return razorpayRequest('POST', 'fund_accounts', $payload);
}

// Mock version for testing - returns fake payout data without API calls
function createRazorpayPayout(array $seller, array $bankDetails, float $amount, int $withdrawRequestId): array {
    // Generate a fake payout ID
    $fakePayoutId = 'pout_mock_' . time() . '_' . $withdrawRequestId;

    // Return mock payout response
    return [
        'id' => $fakePayoutId,
        'entity' => 'payout',
        'amount' => intval(round($amount * 100)),
        'currency' => 'INR',
        'status' => 'processing',
        'mode' => 'IMPS',
        'purpose' => 'payout',
        'narration' => 'Seller payout #' . $withdrawRequestId,
        'reference_id' => 'ref_' . $withdrawRequestId,
        'created_at' => time(),
        'notes' => [
            'seller_id' => $seller['id'],
            'withdraw_request_id' => $withdrawRequestId
        ],
        'mock' => true // Indicate this is a mock response
    ];
}

function createProcessingSellerPayoutRecord($conn, int $sellerId, int $withdrawRequestId = null, float $amount): int {
    $stmt = $conn->prepare("INSERT INTO seller_payouts (seller_id, withdraw_request_id, amount, status, response, created_at) VALUES (?, ?, ?, 'processing', NULL, NOW())");
    $stmt->bind_param('iid', $sellerId, $withdrawRequestId, $amount);
    $stmt->execute();
    $payoutId = $conn->insert_id;
    $stmt->close();
    return $payoutId;
}

function initiateDirectRazorpayPayoutProcessing($conn, array $seller, array $bankDetails, float $amount): array {
    $payoutId = createProcessingSellerPayoutRecord($conn, $seller['id'], null, $amount);

    $payout = createRazorpayPayout($seller, $bankDetails, $amount, $payoutId);
    $remotePayoutId = $payout['id'] ?? $payout['payout_id'] ?? null;
    $responseJson = json_encode($payout);

    if (empty($remotePayoutId)) {
        $failureReason = 'Razorpay payout response did not return payout id';
        $stmt = $conn->prepare("UPDATE seller_payouts SET status = 'failed', failure_reason = ?, response = ?, updated_at = NOW() WHERE id = ?");
        $stmt->bind_param('ssi', $failureReason, $responseJson, $payoutId);
        $stmt->execute();
        $stmt->close();
        throw new Exception($failureReason);
    }

    $stmt = $conn->prepare("UPDATE seller_payouts SET razorpay_payout_id = ?, response = ?, updated_at = NOW() WHERE id = ?");
    $stmt->bind_param('ssi', $remotePayoutId, $responseJson, $payoutId);
    $stmt->execute();
    $stmt->close();

    return [
        'payout_record_id' => $payoutId,
        'payout_id'        => $remotePayoutId,
        'response'         => $payout
    ];
}

function normalizeBankDetails(array $details): array {
    return [
        'account_holder_name' => trim($details['account_holder_name'] ?? $details['name'] ?? ''),
        'account_number'      => trim($details['account_number'] ?? ''),
        'ifsc'                => trim($details['ifsc'] ?? ''),
        'branch'              => trim($details['branch'] ?? ''),
        'pan'                 => trim($details['pan'] ?? ''),
        'phone'               => trim($details['phone'] ?? '')
    ];
}

function decryptValue(string $encrypted, string $key): string {
    $decoded = base64_decode($encrypted);
    if ($decoded === false || strlen($decoded) <= 16) {
        return $encrypted;
    }

    $iv         = substr($decoded, 0, 16);
    $ciphertext = substr($decoded, 16);
    $decrypted  = openssl_decrypt($ciphertext, 'aes-256-cbc', $key, OPENSSL_RAW_DATA, $iv);

    return $decrypted !== false ? $decrypted : $encrypted;
}

function getAdminBankDetails($conn): ?array {
    $stmt = $conn->prepare("SELECT * FROM admin_bank_details WHERE is_active = 1 LIMIT 1");
    $stmt->execute();
    $result = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    if (!$result) {
        return null;
    }

    $encryptionKey            = getenv('SELLER_ENC_KEY') ?: 'default_key_change_in_production!';
    $result['account_number'] = $result['account_number']
        ? decryptValue($result['account_number'], $encryptionKey)
        : null;

    return $result;
}

function createInstantCommissionPayout($conn, int $sellerId, float $sellerAmount, float $adminAmount, int $orderId): array {
    $results = [
        'seller' => ['success' => false, 'amount' => $sellerAmount, 'error' => null],
        'admin'  => ['success' => false, 'amount' => $adminAmount,  'error' => null]
    ];

    // Get seller details and bank info
    $stmt = $conn->prepare("
        SELECT s.*, u.email AS user_email, u.phone AS user_phone, u.full_name AS user_name,
               bd.account_holder, bd.bank_name, bd.account_number AS account_number,
               bd.ifsc_code, bd.branch_name, bd.account_type
        FROM sellers s
        LEFT JOIN users u ON s.user_id = u.id
        LEFT JOIN seller_bank_details bd ON s.id = bd.seller_id
        WHERE s.id = ? AND bd.account_number IS NOT NULL
    ");
    $stmt->bind_param("i", $sellerId);
    $stmt->execute();
    $seller = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    $sellerBankMissing = false;
    if (!$seller || !$seller['account_number']) {
        $sellerBankMissing          = true;
        $results['seller']['error'] = "Seller bank details not found or incomplete for seller ID: $sellerId";
    } else {
        $encryptionKey            = getenv('SELLER_ENC_KEY') ?: 'default_key_change_in_production!';
        $seller['account_number'] = decryptValue($seller['account_number'], $encryptionKey);
    }

    // Get admin bank details
    $adminBankDetails = getAdminBankDetails($conn);
    if (!$adminBankDetails) {
        $results['admin']['error'] = "Admin bank details not configured";
    }

    // ── Process seller payout ──────────────────────────────────────────────────
    if ($sellerAmount > 0) {
        if ($sellerBankMissing) {
            $failureReason = $results['seller']['error'];
            $failureNote   = json_encode(['error' => $failureReason]);
            $stmt = $conn->prepare("INSERT INTO seller_payouts (seller_id, status, amount, failure_reason, response) VALUES (?, 'failed', ?, ?, ?)");
            $stmt->bind_param('idss', $sellerId, $sellerAmount, $failureReason, $failureNote);
            $stmt->execute();
            $stmt->close();
        } else {
            try {
                $sellerBankDetails = [
                    'account_holder_name' => $seller['account_holder'],
                    'account_number'      => $seller['account_number'],
                    'ifsc'                => $seller['ifsc_code']
                ];

                $sellerContact = [
                    'id'            => intval($seller['id']),
                    'business_name' => $seller['business_name'],
                    'user_name'     => $seller['user_name'],
                    'user_email'    => $seller['user_email'],
                    'user_phone'    => $seller['user_phone']
                ];

                $payout = createRazorpayPayout($sellerContact, $sellerBankDetails, $sellerAmount, $orderId);

                $stmt = $conn->prepare("INSERT INTO seller_payouts (seller_id, razorpay_payout_id, status, amount, response) VALUES (?, ?, 'paid', ?, ?)");
                $payoutJson = json_encode($payout);
                $stmt->bind_param('issd', $sellerId, $payout['id'], $sellerAmount, $payoutJson);
                $stmt->execute();
                $stmt->close();

                $stmt = $conn->prepare("UPDATE seller_earnings SET status = 'paid', paid_at = NOW() WHERE seller_id = ? AND order_id = ?");
                $stmt->bind_param('ii', $sellerId, $orderId);
                $stmt->execute();
                $stmt->close();

                $stmt = $conn->prepare("UPDATE sellers SET total_earnings = COALESCE(total_earnings, 0) + ? WHERE id = ?");
                $stmt->bind_param('di', $sellerAmount, $sellerId);
                $stmt->execute();
                $stmt->close();

                $results['seller'] = ['success' => true, 'payout_id' => $payout['id'], 'amount' => $sellerAmount];

            } catch (Exception $e) {
                $results['seller'] = ['success' => false, 'error' => $e->getMessage(), 'amount' => $sellerAmount];
                $failureReason     = $e->getMessage();
                $failureNote       = json_encode(['error' => $failureReason]);
                $stmt = $conn->prepare("INSERT INTO seller_payouts (seller_id, status, amount, failure_reason, response) VALUES (?, 'failed', ?, ?, ?)");
                $stmt->bind_param('idss', $sellerId, $sellerAmount, $failureReason, $failureNote);
                $stmt->execute();
                $stmt->close();
            }
        }
    }

    // ── Process admin payout ───────────────────────────────────────────────────
    if ($adminAmount > 0) {
        if (!$adminBankDetails) {
            $failureReason = $results['admin']['error'];
            $failureNote   = json_encode(['error' => $failureReason]);
            $stmt = $conn->prepare("INSERT INTO seller_payouts (seller_id, status, amount, failure_reason, response) VALUES (-1, 'failed', ?, ?, ?)");
            $stmt->bind_param('dss', $adminAmount, $failureReason, $failureNote);
            $stmt->execute();
            $stmt->close();
        } else {
            try {
                $adminBankDetailsNormalized = [
                    'account_holder_name' => $adminBankDetails['account_holder'],
                    'account_number'      => $adminBankDetails['account_number'],
                    'ifsc'                => $adminBankDetails['ifsc_code']
                ];

                $adminContact = [
                    'id'            => 0,
                    'business_name' => 'ThemeHub Admin',
                    'user_name'     => 'Admin',
                    'user_email'    => 'admin@themehub.com',
                    'user_phone'    => '9999999999'
                ];

                $payout = createRazorpayPayout($adminContact, $adminBankDetailsNormalized, $adminAmount, $orderId);

                $stmt = $conn->prepare("INSERT INTO seller_payouts (seller_id, razorpay_payout_id, status, amount, response) VALUES (-1, ?, 'paid', ?, ?)");
                $payoutJson = json_encode($payout);
                $stmt->bind_param('ssd', $payout['id'], $adminAmount, $payoutJson);
                $stmt->execute();
                $stmt->close();

                $results['admin'] = ['success' => true, 'payout_id' => $payout['id'], 'amount' => $adminAmount];

            } catch (Exception $e) {
                $results['admin'] = ['success' => false, 'error' => $e->getMessage(), 'amount' => $adminAmount];
                $failureReason    = $e->getMessage();
                $failureNote      = json_encode(['error' => $failureReason]);
                $stmt = $conn->prepare("INSERT INTO seller_payouts (seller_id, status, amount, failure_reason, response) VALUES (-1, 'failed', ?, ?, ?)");
                $stmt->bind_param('dss', $adminAmount, $failureReason, $failureNote);
                $stmt->execute();
                $stmt->close();
            }
        }
    }

    return $results;
}