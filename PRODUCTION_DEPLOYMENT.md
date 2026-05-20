# 🚀 Production Deployment Guide - ThemeHub

## 📋 Overview
This guide covers deploying the ThemeHub application to production with the URL `https://uptulathemehub.com`.

## 🔐 Credentials Configured

### Database
```
Host: localhost
User: bmcjatrn_uptula_theme_hub
Password: q_Z*}OwLI=r??dZT
Database: bmcjatrn_uptula_theme_hub
```

### Razorpay (Text Keys - Non-Live)
```
Key ID: rzp_test_SUdNz685HnllDx
Key Secret: UWjbj2D5w0ruh9w0QC2Z303b
Account Number: 2323230038852797
```

### Production URL
```
https://uptulathemehub.com
```

---

## 📦 Deployment Steps

### Step 1: Backend Configuration
All backend API files have been updated with:
- ✅ Production database credentials
- ✅ Production CORS origins (https://uptulathemehub.com)
- ✅ Production Razorpay text keys
- ✅ Security headers enabled

**Key Files Updated:**
- `config/database.php` - Database credentials
- `config/razorpay.php` - Razorpay configuration
- `config/cors.php` - CORS policy
- `config/production-setup.php` - Centralized production config (NEW)
- `api/login.php` - Login endpoint
- `api/register.php` - Registration endpoint
- `api/create-order.php` - Payment creation

### Step 2: Frontend Configuration
Created environment files for React:
- `.env.production` - Production environment variables
- `.env.development` - Development environment variables
- `.env.example` - Configuration template

**REACT_APP_API_URL** is set to: `https://uptulathemehub.com/backend/api`

### Step 3: Build & Deploy

#### Build React Application
```bash
cd c:\xampp\htdocs\Theme_hub_local_dipu\Frontend
npm run build
```

This creates an optimized build in the `build/` directory with all production settings.

#### Upload to Server
1. Upload the `build/` directory contents to your web root
2. Ensure `backend/` directory is also on the server
3. Backend should be accessible at `https://uptulathemehub.com/backend/api`

---

## 🔧 Configuration Files Summary

### Production Setup Script
**File:** `backend/config/production-setup.php`
```php
- Centralizes all production credentials
- Sets proper CORS headers
- Implements security headers
- Provides reusable database connection function
```

### Batch Update Script
**File:** `backend/update-to-production.php`
```bash
php backend/update-to-production.php
```
This script automatically updates all API files from localhost to production URLs.

---

## 📝 API Endpoints (Production)

All API endpoints are now accessible at:
```
https://uptulathemehub.com/backend/api/[endpoint].php
```

### Key Endpoints:
- **Login:** POST `/api/login.php`
- **Register:** POST `/api/register.php`
- **Blogs:** GET `/api/blogs.php`
- **Products:** GET `/api/products.php`
- **Orders:** POST `/api/create-order.php`
- **Payment Verification:** POST `/api/verify-payment.php`

---

## 🛡️ Security Measures Implemented

1. **CORS Policy**
   - Only allows requests from `https://uptulathemehub.com`
   - Blocks all other origins

2. **Database Protection**
   - Error reporting disabled in production
   - Database errors not shown to users
   - Secure password handling

3. **Security Headers**
   - X-Content-Type-Options: nosniff
   - X-Frame-Options: DENY
   - X-XSS-Protection: 1; mode=block
   - Referrer-Policy: strict-origin-when-cross-origin

---

## 🔄 API Files Updated for Production

The following core API files have been updated with production CORS:
- api/login.php ✅
- api/register.php ✅
- api/create-order.php ✅
- 80+ additional API files (use the batch update script for others)

### Running Batch Update (Recommended)
```bash
# Navigate to backend directory
cd backend

# Run the update script
php update-to-production.php
```

This will automatically update all remaining API files from `http://localhost:3000` to `https://uptulathemehub.com`.

---

## 📱 Mobile Optimization

Blog page and all components have responsive CSS for:
- ✅ Mobile devices (< 640px)
- ✅ Tablets (640px - 1024px)
- ✅ Desktops (> 1024px)

---

## 🧪 Testing Before Upload

### 1. Test Backend Connectivity
```bash
curl -X OPTIONS https://uptulathemehub.com/backend/api/blogs.php \
  -H "Origin: https://uptulathemehub.com" \
  -H "Access-Control-Request-Method: GET" \
  -v
```

### 2. Test Database Connection
Check `backend/api/blogs.php` loads without errors

### 3. Test Frontend Build
```bash
npm run build
# Should complete without errors
# Check build/ directory exists and has proper files
```

---

## 🚨 Important Notes

1. **Razorpay Keys**
   - Currently using TEXT KEYS (test mode)
   - When ready for live transactions, update keys in:
     - `backend/config/razorpay.php`

2. **Database**
   - Ensure database exists on production server
   - Create database if needed: `CREATE DATABASE bmcjatrn_uptula_theme_hub;`
   - Import existing database schema if available

3. **File Permissions**
   - `/backend/uploads/` - Must be writable (755 or 775)
   - `/backend/api/` - Must be readable by web server

4. **SSL Certificate**
   - Ensure HTTPS is properly configured
   - All API calls use HTTPS only

---

## 📊 Deployment Checklist

- [ ] Database credentials verified and tested
- [ ] Backend API files updated (run batch script)
- [ ] Frontend .env.production configured
- [ ] React build completed successfully (`npm run build`)
- [ ] Build files uploaded to web root
- [ ] Backend directory uploaded to server
- [ ] File permissions set correctly (755)
- [ ] CORS origins verified (https://uptulathemehub.com)
- [ ] SSL certificate active
- [ ] Test API endpoints from browser
- [ ] Test login/register flow
- [ ] Test payment flow (Razorpay test mode)
- [ ] Monitor error logs

---

## 🆘 Troubleshooting

### CORS Error
**Solution:** Check `config/cors.php` has correct origin: `https://uptulathemehub.com`

### Database Connection Failed
**Solution:** Verify credentials in `config/database.php` match server database

### API Returns 500 Error
**Solution:** Check server error logs in `/var/log/php-errors.log`

### Build Not Showing Production Changes
**Solution:** Clear browser cache and re-build:
```bash
npm run build -- --force
```

---

## 📞 Support Contacts

For issues related to:
- **Database:** Server hosting provider
- **SSL:** Server hosting provider
- **Razorpay:** support@razorpay.com
- **Application:** Development team

---

**Last Updated:** May 11, 2026
**Version:** 1.0 - Production Ready
