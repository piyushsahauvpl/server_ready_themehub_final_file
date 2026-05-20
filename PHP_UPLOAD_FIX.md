# PHP Upload Size Limit Fix

## Problem
The error shows: `POST Content-Length of 24186283 bytes exceeds the limit of 8388608 bytes`

This means:
- Your file is ~24MB
- PHP's `post_max_size` is set to 8MB
- PHP's `upload_max_filesize` might also be too small

## Solution Applied

1. **Created `.htaccess` file** in `backend/` directory with increased limits
2. **Updated `products.php`** to handle large file errors gracefully
3. **Updated frontend** to show better error messages

## Manual Fix (If .htaccess doesn't work)

If `.htaccess` doesn't work (some servers disable `php_value`), you need to edit `php.ini`:

1. **Find php.ini location:**
   - XAMPP Control Panel → Apache → Config → PHP (php.ini)
   - Or check: `php --ini` in command line

2. **Edit these values:**
   ```ini
   upload_max_filesize = 50M
   post_max_size = 50M
   max_execution_time = 300
   max_input_time = 300
   memory_limit = 256M
   ```

3. **Restart Apache** after making changes

## Verify Settings

Create a test file `backend/test-php-limits.php`:
```php
<?php
echo "upload_max_filesize: " . ini_get('upload_max_filesize') . "\n";
echo "post_max_size: " . ini_get('post_max_size') . "\n";
echo "max_execution_time: " . ini_get('max_execution_time') . "\n";
echo "memory_limit: " . ini_get('memory_limit') . "\n";
```

Access: http://localhost/Frontend/backend/test-php-limits.php

Should show:
- upload_max_filesize: 50M
- post_max_size: 50M

## After Fix

1. **Restart Apache** in XAMPP
2. **Clear browser cache**
3. **Try uploading product again**

The error should now show a proper JSON error message instead of HTML warnings.
