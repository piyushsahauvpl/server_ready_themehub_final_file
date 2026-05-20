# CORS Fix for Admin Login

## Changes Made

1. **Updated `backend/config/cors.php`**
   - OPTIONS requests are now handled FIRST before any other processing
   - Added `Access-Control-Max-Age` header
   - Added `Accept` to allowed headers

2. **Updated `backend/api/admin/login.php`**
   - Added explicit OPTIONS request handling at the top of the file
   - Ensures CORS headers are set before session_start()

3. **Updated `.htaccess` files**
   - Added `.htaccess` in `backend/api/admin/` directory
   - Updated main `.htaccess` with `Header always set` instead of `Header set`

4. **Improved error handling in Login.jsx**
   - Better error messages for CORS and connection issues

## Testing Steps

1. **Verify Apache modules are enabled:**
   - Open XAMPP Control Panel
   - Click "Config" next to Apache
   - Select "httpd.conf"
   - Ensure these lines are uncommented:
     ```
     LoadModule headers_module modules/mod_headers.so
     LoadModule rewrite_module modules/mod_rewrite.so
     ```
   - Restart Apache if you made changes

2. **Test CORS endpoint:**
   - Open browser console
   - Run: `fetch('http://localhost/Frontend/backend/api/admin/test-cors.php', {credentials: 'include'})`
   - Should return: `{success: true, message: "CORS is working correctly"}`

3. **Test login:**
   - Go to: http://localhost:3000/admin/login
   - Try logging in with: admin@themehub.com / Admin@1437
   - Check browser console for any errors

## If CORS Still Fails

1. **Check Apache error logs:**
   - XAMPP Control Panel → Apache → Logs → Error log
   - Look for any .htaccess or mod_headers errors

2. **Verify file paths:**
   - Ensure `.htaccess` files are in:
     - `backend/.htaccess`
     - `backend/api/admin/.htaccess`

3. **Alternative: Disable .htaccess and use PHP only:**
   - If mod_headers is not available, the PHP CORS handling should still work
   - The OPTIONS handling in login.php will handle CORS

4. **Check API URL:**
   - Verify the URL in browser: http://localhost/Frontend/backend/api/admin/login.php
   - Should show JSON response (not 404)

## Manual CORS Test

Open browser console and run:
```javascript
fetch('http://localhost/Frontend/backend/api/admin/test-cors.php', {
  method: 'GET',
  credentials: 'include'
})
.then(r => r.json())
.then(console.log)
.catch(console.error);
```

If this works, CORS is configured correctly.
