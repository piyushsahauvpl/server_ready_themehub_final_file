<?php
/**
 * Seller Application API
 * POST /api/seller/apply.php
 */

error_reporting(E_ALL);
ini_set('display_errors', 0);

// CORS
header('Access-Control-Allow-Origin: https://uptulathemehub.com');
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once '../../config/database.php';

session_start();

// ── Auth check ────────────────────────────────────────────────
if (
    !isset($_SESSION['logged_in']) ||
    $_SESSION['logged_in'] !== true ||
    !isset($_SESSION['user_id'])
) {
    http_response_code(401);
    echo json_encode([
        'success' => false,
        'message' => 'Please login first to apply as a seller'
    ]);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

// ── Read input ────────────────────────────────────────────────
$input = json_decode(file_get_contents('php://input'), true);
if (json_last_error() !== JSON_ERROR_NONE) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Invalid JSON input']);
    exit;
}

$userId = (int) $_SESSION['user_id'];

// ── Personal details ──────────────────────────────────────────
$fullName     = trim($input['full_name'] ?? '');
$email        = trim($input['email'] ?? '');
$businessName = trim($input['business_name'] ?? '');
$businessType = trim($input['business_type'] ?? '');
$bio          = trim($input['bio']           ?? '');
$mobile       = preg_replace('/\D/', '', trim($input['mobile'] ?? ''));
$category     = trim($input['category']      ?? '');

// KYC details
$panNumber    = trim($input['pan_number'] ?? '');
$aadhaarNumber = trim($input['aadhaar_number'] ?? '');
$streetAddress = trim($input['street_address'] ?? '');
$city         = trim($input['city'] ?? '');
$state        = trim($input['state'] ?? '');
$pincode      = trim($input['pincode'] ?? '');
$country      = trim($input['country'] ?? '');

// ── Bank details ──────────────────────────────────────────────
$accountHolder = trim($input['account_holder'] ?? '');
$bankName      = trim($input['bank_name']      ?? '');
$accountNumber = preg_replace('/\D/', '', trim($input['account_number'] ?? ''));
$ifscCode      = strtoupper(trim($input['ifsc_code']   ?? ''));
$branchName    = trim($input['branch_name']    ?? '');
$accountType   = in_array($input['account_type'] ?? '', ['savings', 'current'])
                    ? $input['account_type']
                    : 'savings';
$upiId         = trim($input['upi_id'] ?? '');

// ── Server-side validation ────────────────────────────────────
$errors = [];

// Personal
if ($fullName === '')           $errors[] = 'Full name is required';
if ($email === '')              $errors[] = 'Email is required';
if ($businessName === '')        $errors[] = 'Business name is required';
if ($bio === '')                 $errors[] = 'Bio is required';
if (strlen($mobile) !== 10)      $errors[] = 'Mobile must be 10 digits';
if ($category === '')            $errors[] = 'Category is required';

// Bank
if ($accountHolder === '')        $errors[] = 'Account holder name is required';
if ($bankName === '')             $errors[] = 'Bank name is required';
if (strlen($accountNumber) < 9)   $errors[] = 'Account number is too short';
if (!preg_match('/^[A-Z]{4}0[A-Z0-9]{6}$/', $ifscCode))
                                  $errors[] = 'Invalid IFSC code (e.g. SBIN0001234)';
if ($branchName === '')           $errors[] = 'Branch name is required';

if (!empty($errors)) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => implode('. ', $errors)
    ]);
    exit;
}

// ── Encrypt account number (AES-256-CBC) ──────────────────────
// Set SELLER_ENC_KEY as a server environment variable (must be 32 characters).
// Apache:  SetEnv SELLER_ENC_KEY "your_32_char_secret_key_here!!!!"
// cPanel / hosting: add in Environment Variables section
$encKey = getenv('SELLER_ENC_KEY') ?: 'default_key_change_in_production!'; // 32 bytes

function encryptValue(string $plain, string $key): string {
    $iv         = random_bytes(16);
    $ciphertext = openssl_encrypt($plain, 'aes-256-cbc', $key, OPENSSL_RAW_DATA, $iv);
    return base64_encode($iv . $ciphertext); // IV prepended so we can decrypt later
}

$encryptedAccount = encryptValue($accountNumber, $encKey);

// ── DB work ───────────────────────────────────────────────────
try {
    $conn = getDBConnection();

    // ── Get user full name ─────────────────────────────────────
    $userStmt = $conn->prepare("SELECT full_name FROM users WHERE id = ? LIMIT 1");
    $userStmt->bind_param("i", $userId);
    $userStmt->execute();
    $userResult = $userStmt->get_result();
    $userData = $userResult->fetch_assoc();
    $userStmt->close();
    if (!$userData) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'User not found']);
        exit;
    }
    $userName = $fullName !== '' ? $fullName : $userData['full_name'];

    $conn->begin_transaction();

    // Check if seller row already exists
    $check = $conn->prepare("SELECT id FROM sellers WHERE user_id = ? LIMIT 1");
    $check->bind_param("i", $userId);
    $check->execute();
    $check->store_result();
    $sellerExists = $check->num_rows > 0;

    if ($sellerExists) {
        $check->bind_result($existingSellerId);
        $check->fetch();
    }
    $check->close();

    if ($sellerExists) {
        // ── UPDATE existing seller (re-application) ───────────
        $stmt = $conn->prepare("
            UPDATE sellers
            SET user_name         = ?,
                email             = ?,
                business_name     = ?,
                business_type     = ?,
                bio               = ?,
                mobile            = ?,
                category          = ?,
                status            = 'inactive',
                verified_by_admin = NULL,
                rejection_reason  = NULL,
                payment_confirmed = 0,
                updated_at        = NOW()
            WHERE user_id = ?
        ");
        $stmt->bind_param("ssssssi",
            $userName,
            $email,
            $businessName,
            $businessType,
            $bio,
            $mobile,
            $category,
            $userId
        );
        if (!$stmt->execute()) throw new Exception($stmt->error);
        $stmt->close();

        $sellerId = $existingSellerId;

    } else {
        // ── INSERT new seller ─────────────────────────────────
        $stmt = $conn->prepare("
            INSERT INTO sellers (
                user_id, user_name, email, business_name, business_type,
                bio, mobile, category, status, payment_confirmed, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'inactive', 0, NOW())
        ");
        $stmt->bind_param("isssssss",
            $userId,
            $userName,
            $email,
            $businessName,
            $businessType,
            $bio,
            $mobile,
            $category
        );
        if (!$stmt->execute()) throw new Exception($stmt->error);
        $sellerId = $stmt->insert_id;
        $stmt->close();

        // Init seller reputation (matches your original code)
        $rep = $conn->prepare("INSERT INTO seller_reputation (seller_id) VALUES (?)");
        $rep->bind_param("i", $sellerId);
        $rep->execute();
        $rep->close();
    }

    // ── Upsert bank details ───────────────────────────────────
    // First apply  → INSERT
    // Re-apply     → UPDATE (UNIQUE KEY on seller_id handles the collision)
    $bank = $conn->prepare("
        INSERT INTO seller_bank_details (
            seller_id, account_holder, bank_name, account_number,
            ifsc_code, branch_name, account_type, upi_id,
            created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
        ON DUPLICATE KEY UPDATE
            account_holder = VALUES(account_holder),
            bank_name      = VALUES(bank_name),
            account_number = VALUES(account_number),
            ifsc_code      = VALUES(ifsc_code),
            branch_name    = VALUES(branch_name),
            account_type   = VALUES(account_type),
            upi_id         = VALUES(upi_id),
            updated_at     = NOW()
    ");
    $bank->bind_param("isssssss",
        $sellerId,
        $accountHolder,
        $bankName,
        $encryptedAccount,
        $ifscCode,
        $branchName,
        $accountType,
        $upiId
    );
    if (!$bank->execute()) throw new Exception($bank->error);
    $bank->close();

    // ── Insert or update seller KYC ───────────────────────────
    $kycCheck = $conn->prepare("SELECT id FROM seller_kyc WHERE seller_id = ? LIMIT 1");
    $kycCheck->bind_param("i", $sellerId);
    $kycCheck->execute();
    $kycCheck->store_result();
    $kycExists = $kycCheck->num_rows > 0;
    $kycCheck->bind_result($existingKycId);
    if ($kycExists) {
        $kycCheck->fetch();
    }
    $kycCheck->close();

    if ($kycExists) {
        $kyc = $conn->prepare("
            UPDATE seller_kyc
            SET pan_card       = ?,
                aadhaar        = ?,
                status         = 'pending',
                street_address = ?,
                city           = ?,
                state          = ?,
                pincode        = ?,
                country        = ?
            WHERE seller_id  = ?
        ");
        $kyc->bind_param("sssssssi",
            $panNumber,
            $aadhaarNumber,
            $streetAddress,
            $city,
            $state,
            $pincode,
            $country,
            $sellerId
        );
    } else {
        $kyc = $conn->prepare("
            INSERT INTO seller_kyc (
                seller_id, pan_card, aadhaar, status,
                street_address, city, state, pincode, country
            ) VALUES (?, ?, ?, 'pending', ?, ?, ?, ?, ?)
        ");
        $kyc->bind_param("isssssss",
            $sellerId,
            $panNumber,
            $aadhaarNumber,
            $streetAddress,
            $city,
            $state,
            $pincode,
            $country
        );
    }
    if (!$kyc->execute()) throw new Exception($kyc->error);
    $kyc->close();

    $conn->commit();

    // ── Return seller row (same as your original response) ────
    $sel = $conn->prepare("SELECT * FROM sellers WHERE id = ? LIMIT 1");
    $sel->bind_param("i", $sellerId);
    $sel->execute();
    $seller = $sel->get_result()->fetch_assoc();
    $sel->close();

    closeDBConnection($conn);

    echo json_encode([
        'success' => true,
        'message' => $sellerExists
            ? 'Seller application updated successfully'
            : 'Seller application submitted successfully',
        'seller'  => $seller
    ]);
    exit;

} catch (Throwable $e) {
    if (isset($conn)) {
        $conn->rollback();
        closeDBConnection($conn);
    }
    error_log('apply.php error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Server error. Please try again.'
    ]);
    exit;
}