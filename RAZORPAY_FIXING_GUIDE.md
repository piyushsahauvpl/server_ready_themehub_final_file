# Razorpay Payment Integration - Fixing Guide

## Problem Identified
**Error:** `cURL error 6: Could not resolve host: api.razorpay.com`

This means your PHP backend cannot connect to Razorpay's servers to create orders.

---

## Quick Solutions

### Solution 1: Check PHP OpenSSL & cURL (Most Common)

1. **Open XAMPP Control Panel**
2. **Click "Config" next to Apache**
3. **Select "php.ini"**
4. **Find and uncomment these lines:**
   ```
   extension=openssl
   extension=curl
   ```
5. **Remove the `;` at the beginning**
6. **Save and restart Apache**

### Solution 2: Verify Internet Connectivity

From your XAMPP terminal, run:
```bash
ping google.com
ping api.razorpay.com
```

If both fail = **No internet connection**
- Check your network/WiFi connection
- Restart XAMPP

### Solution 3: Update PHP DNS Settings

Edit `php.ini` and add:
```ini
; Google DNS servers (fallback)
[openssl]
default_socket_timeout=1000
```

Also ensure these extensions are enabled:
```ini
extension=openssl      ; Remove semicolon
extension=curl         ; Remove semicolon
extension=json         ; Remove semicolon
```

### Solution 4: Test cURL Directly

Add this test file at `backend/api/test-razorpay.php`:

```php
<?php
// Test if PHP can reach Razorpay API

echo "Testing cURL and DNS...\n\n";

// Test 1: Can we resolve the domain?
$ip = gethostbyname('api.razorpay.com');
echo "DNS Test: " . ($ip === 'api.razorpay.com' ? "FAILED" : "PASSED") . "\n";
echo "IP: $ip\n\n";

// Test 2: Can we curl?
$curl = curl_init();
curl_setopt_array($curl, array(
  CURLOPT_URL => 'https://api.razorpay.com/v1/health',
  CURLOPT_RETURNTRANSFER => true,
  CURLOPT_TIMEOUT => 10,
  CURLOPT_SSL_VERIFYPEER => false,  // For local testing only
));

$response = curl_exec($curl);
$error = curl_error($curl);
curl_close($curl);

echo "cURL Test: " . ($error ? "FAILED: $error" : "PASSED") . "\n";
echo "Response: $response\n";
?>
```

Then visit: `http://localhost/Theme_hub_local_dipu/Frontend/backend/api/test-razorpay.php`

---

## Network/Firewall Troubleshooting

If DNS test fails:

1. **Windows Firewall:**
   - Open Windows Defender Firewall
   - Click "Allow an app through firewall"
   - Find Apache and ensure it's checked

2. **Proxy Issues:**
   - If behind corporate proxy/VPN, you may need to configure PHP for proxy
   - Add to php.ini:
     ```ini
     [curl]
     curl.cainfo = "C:/xampp/php/extras/ssl/cacert.pem"
     ```

3. **Restart Everything:**
   ```bash
   - Restart XAMPP
   - Restart your computer
   - Test again
   ```

---

## Backend Code Fix (Temporary Debug)

Add error logging to see real errors. Update `create-order.php`:

```php
<?php
// ... existing code ...

error_log("=" . str_repeat("=", 50));
error_log("CREATE-ORDER DEBUG - " . date('Y-m-d H:i:s'));
error_log("PHP Extensions: OpenSSL=" . (extension_loaded('openssl') ? 'YES' : 'NO') . 
          ", cURL=" . (extension_loaded('curl') ? 'YES' : 'NO'));

// ... rest of code ...

catch (Exception $e) {
    $errorMsg = $e->getMessage();
    $errorCode = $e->getCode();
    
    error_log("ERROR CODE: $errorCode");
    error_log("ERROR MSG: $errorMsg");
    error_log("ERROR TYPE: " . get_class($e));
    
    // Log the full trace for debugging
    error_log("TRACE: " . $e->getTraceAsString());
    
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "error" => "Order creation failed",
        "message" => $errorMsg,
        "debug" => [
            "openssl" => extension_loaded('openssl'),
            "curl" => extension_loaded('curl')
        ]
    ]);
}
?>
```

---

## Testing After Fix

1. **Clear browser cache** (Ctrl+Shift+Delete)
2. **Restart Apache** in XAMPP Control Panel
3. **Try payment again** at checkout
4. **Check Apache logs** for new errors

---

## If Still Not Working

Check these files in order:
1. `backend/api/create-order.php` - Line with `$api = new Api(...)`
2. `vendor/autoload.php` - Verify Razorpay autoloading
3. `php.ini` - Verify all extensions loaded
4. Windows Firewall/Antivirus blocking connection

---

## Razorpay Test Credentials (Verify These Are Correct)
- Key ID: `rzp_test_SUdNz685HnllDx`  
- Key Secret: `UWjbj2D5w0ruh9w0QC2Z303b`

These should match what's in:
- `backend/api/create-order.php`
- `backend/api/verify-payment.php`
- `src/pages/Payment.jsx`
