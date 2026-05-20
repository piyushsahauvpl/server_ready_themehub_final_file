# Quick Fix for "Method not allowed" Error

## The Problem
The server is receiving a request but not recognizing it as POST method.

## Immediate Solution

### Option 1: Test the Debug Endpoint
Open this in browser to see what method is being received:
```
http://localhost/Frontend/backend/api/admin/login-debug.php
```

### Option 2: Check Browser Network Tab
1. Open Developer Tools (F12)
2. Go to Network tab
3. Try to login
4. Click on the `login.php` request
5. Check:
   - **Request Method:** Should be `POST`
   - **Request Headers:** Should have `Content-Type: application/json`
   - **Request Payload:** Should have email and password

### Option 3: Test with Direct Fetch
Open browser console and run:
```javascript
fetch('http://localhost/Frontend/backend/api/admin/login.php', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  credentials: 'include',
  body: JSON.stringify({ 
    email: 'admin@themehub.com', 
    password: 'Admin@1437' 
  })
})
.then(r => r.text())
.then(text => {
  console.log('Response:', text);
  try {
    const data = JSON.parse(text);
    console.log('Parsed:', data);
    if (data.received_method) {
      console.error('Wrong method received:', data.received_method);
    }
  } catch(e) {
    console.error('Parse error:', e);
  }
})
.catch(err => console.error('Error:', err));
```

## Common Causes

1. **Browser sending GET instead of POST**
   - Check Network tab to verify method
   - Clear browser cache and try again

2. **.htaccess rewrite rules interfering**
   - The rewrite rules might be changing the method
   - Try accessing the API directly without .htaccess

3. **CORS preflight failing**
   - OPTIONS request might not be handled correctly
   - Check if OPTIONS request succeeds first

4. **Proxy or middleware changing method**
   - Some server configurations modify request methods
   - Check Apache configuration

## Verification Steps

1. **Check if API is accessible:**
   ```
   http://localhost/Frontend/backend/api/admin/test-connection.php
   ```
   Should return: `{"success":true,...}`

2. **Check database:**
   ```
   http://localhost/Frontend/backend/api/admin/verify-db.php
   ```
   Should show database status and admin user

3. **Check debug endpoint:**
   ```
   http://localhost/Frontend/backend/api/admin/login-debug.php
   ```
   Should show request method details

## If Still Not Working

1. **Check Apache error logs:**
   - XAMPP → Apache → Logs → Error log
   - Look for any errors related to login.php

2. **Try accessing login.php directly:**
   - Open: http://localhost/Frontend/backend/api/admin/login.php
   - Should show: `{"success":false,"message":"Method not allowed",...}`
   - This confirms the file is accessible

3. **Check file permissions:**
   - Ensure login.php is readable
   - Check .htaccess files are in place

4. **Temporary workaround:**
   - Comment out the method check temporarily to see what's happening
   - Add logging to see actual request details
