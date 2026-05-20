# Troubleshooting Login Connection Issues

## Issue: "Cannot connect to server"

If you're seeing this error, follow these steps:

### Step 1: Verify Apache is Running
1. Open XAMPP Control Panel
2. Check that Apache shows "Running" (green)
3. If not, click "Start" next to Apache

### Step 2: Test Server Connection
Open your browser and navigate to:
```
http://localhost/Frontend/backend/api/admin/test-connection.php
```

You should see:
```json
{"success":true,"message":"Server is accessible","timestamp":"...","method":"GET","php_version":"..."}
```

If you see a 404 error, check:
- The file path is correct
- Apache is running
- The URL matches your XAMPP setup

### Step 3: Test CORS
Open browser console (F12) and run:
```javascript
fetch('http://localhost/Frontend/backend/api/admin/test-connection.php', {
  credentials: 'include'
})
.then(r => r.text())
.then(console.log)
.catch(console.error);
```

Should return the JSON response.

### Step 4: Check Database Connection
1. Open phpMyAdmin: http://localhost/phpmyadmin
2. Verify `themehub_db` database exists
3. Check `admins` table has the default admin user

### Step 5: Verify API URL
In your React app, check the API URL:
- Default: `http://localhost/Frontend/backend/api/admin`
- If your XAMPP setup is different, update it in:
  - `.env` file: `REACT_APP_API_URL=your_url`
  - Or update in each component

### Step 6: Check Browser Console
1. Open Developer Tools (F12)
2. Go to Network tab
3. Try logging in
4. Look for the `login.php` request
5. Check:
   - Status code (should be 200)
   - Response headers (should have CORS headers)
   - Response body (should be valid JSON)

### Step 7: Common Issues

#### Issue: CORS Errors
**Solution:**
- Ensure `.htaccess` files are in place
- Check Apache mod_headers is enabled
- Verify CORS headers in response

#### Issue: 404 Not Found
**Solution:**
- Check file path: `backend/api/admin/login.php`
- Verify Apache document root
- Check URL matches file structure

#### Issue: 500 Internal Server Error
**Solution:**
- Check Apache error logs
- Verify database connection
- Check PHP error logs in XAMPP

#### Issue: Database Connection Failed
**Solution:**
- Verify MySQL is running in XAMPP
- Check database credentials in `backend/config/database.php`
- Ensure database `themehub_db` exists

#### Issue: Invalid JSON Response
**Solution:**
- Check for PHP warnings/errors before JSON output
- Verify no output before `json_encode()`
- Check response in Network tab

### Step 8: Manual Database Check
Run this SQL in phpMyAdmin:
```sql
SELECT * FROM admins WHERE email = 'admin@themehub.com';
```

Should return one row with the admin user.

### Step 9: Test Login Directly
Create a test file `test-login.php` in `backend/api/admin/`:
```php
<?php
require_once '../../config/database.php';
$conn = getDBConnection();
$stmt = $conn->prepare("SELECT * FROM admins WHERE email = ?");
$stmt->bind_param("s", "admin@themehub.com");
$stmt->execute();
$result = $stmt->get_result();
$admin = $result->fetch_assoc();
var_dump($admin);
```

Access: http://localhost/Frontend/backend/api/admin/test-login.php

### Step 10: Enable Debugging
In `src/admin/Auth/Login.jsx`, the console will now show:
- Response status
- Response text
- Any parsing errors

Check browser console for detailed error messages.

## Quick Fix Checklist

- [ ] Apache is running in XAMPP
- [ ] MySQL is running in XAMPP
- [ ] Database `themehub_db` exists
- [ ] Admin user exists in database
- [ ] API URL is correct
- [ ] CORS headers are present
- [ ] No PHP errors in response
- [ ] Browser console shows detailed errors

## Still Not Working?

1. Check Apache error logs: XAMPP → Apache → Logs → Error log
2. Check PHP error logs
3. Verify file permissions
4. Try accessing API directly in browser
5. Check firewall/antivirus isn't blocking localhost
