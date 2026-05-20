# Seller Login System - Implementation Guide

## ✅ COMPLETED

### Backend APIs
1. **Seller Login** - `backend/api/seller/login.php`
   - POST endpoint for seller authentication
   - Checks if user is a registered seller
   - Verifies seller account is active
   - Rate limiting (5 attempts, 15-minute lockout)
   - Session management
   - Remember me functionality

2. **Seller Application** - `backend/api/seller/apply.php`
   - POST endpoint for users to apply as sellers
   - Requires user to be logged in first
   - Creates seller record with 'pending' verification status
   - Initializes seller reputation

3. **Seller Auth Check** - `backend/api/seller/check-auth.php`
   - GET endpoint to check seller authentication status
   - Returns seller info if authenticated

4. **Seller Logout** - `backend/api/seller/logout.php`
   - POST endpoint to logout seller
   - Clears session and cookies

### Frontend Components
1. **Seller Login Page** - `src/seller/Auth/Login.jsx`
   - Beautiful login form matching design system
   - Uses hexcode #04733c
   - Error handling
   - Remember me option
   - Link to apply as seller

## 🚀 HOW TO USE

### For Users Who Want to Become Sellers:

1. **Step 1: Register as User**
   - User must first register/login as a regular user
   - Use existing `/register` or `/login` routes

2. **Step 2: Apply to Become Seller**
   - After logging in, user can apply to become a seller
   - Call API: `POST /api/seller/apply.php`
   - Required fields:
     - `business_name` (required)
     - `bio` (optional)
   - Seller account created with status: `pending` verification

3. **Step 3: Wait for Admin Approval**
   - Admin reviews application in `/admin/sellers`
   - Admin can approve/verify the seller
   - Once verified, seller can login

4. **Step 4: Login as Seller**
   - Navigate to `/seller/login`
   - Use same email/password as user account
   - System checks if user is a verified seller
   - Redirects to seller dashboard

### For Existing Sellers:

1. Navigate to `/seller/login`
2. Enter email and password
3. System verifies:
   - User exists
   - User is a seller
   - Seller account is active
   - Seller is verified (optional check)
4. On success, redirects to seller dashboard

## 📝 API ENDPOINTS

### POST `/api/seller/login.php`
**Request:**
```json
{
  "email": "seller@example.com",
  "password": "password123",
  "remember_me": true
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Login successful",
  "seller": {
    "id": 1,
    "user_id": 5,
    "full_name": "John Doe",
    "email": "seller@example.com",
    "business_name": "John's Templates",
    "verification_status": "verified",
    "commission_rate": "70.00",
    "total_earnings": "1500.00",
    "pending_earnings": "300.00"
  }
}
```

**Response (Error):**
```json
{
  "success": false,
  "message": "You are not registered as a seller. Please apply to become a seller first."
}
```

### POST `/api/seller/apply.php`
**Request:**
```json
{
  "business_name": "My Template Shop",
  "bio": "I create amazing templates"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Seller application submitted successfully. Please wait for admin approval.",
  "seller_id": 1
}
```

### GET `/api/seller/check-auth.php`
**Response (Authenticated):**
```json
{
  "success": true,
  "authenticated": true,
  "seller": {
    "id": 1,
    "user_id": 5,
    "email": "seller@example.com",
    "name": "John Doe",
    "business_name": "John's Templates",
    "verification_status": "verified"
  }
}
```

### POST `/api/seller/logout.php`
**Response:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

## 🔐 SESSION MANAGEMENT

Seller login creates separate session variables:
- `$_SESSION['seller_id']` - Seller ID
- `$_SESSION['seller_user_id']` - User ID
- `$_SESSION['seller_email']` - Email
- `$_SESSION['seller_name']` - Full name
- `$_SESSION['seller_business_name']` - Business name
- `$_SESSION['seller_verification_status']` - Verification status
- `$_SESSION['seller_logged_in']` - Boolean flag

## 🎨 FRONTEND ROUTES

- `/seller/login` - Seller login page
- `/seller/dashboard` - Seller dashboard (to be created)
- `/seller/apply` - Seller application page (to be created)

## 📋 TODO

1. **Create Seller Application Page** (`src/seller/Auth/Apply.jsx`)
   - Form for users to apply as sellers
   - Business name and bio fields
   - Submit application

2. **Create Seller Dashboard** (`src/seller/Dashboard/Dashboard.jsx`)
   - Overview of earnings, products, sales
   - Monthly sales chart
   - Product performance
   - Recent orders

3. **Create Seller Routes** (`src/seller/SellerRoutes.jsx`)
   - Protected routes for seller panel
   - Similar to AdminRoutes

4. **Add Seller Navigation**
   - Sidebar for seller panel
   - Links to products, earnings, analytics

## 🔄 WORKFLOW

```
User Registration → User Login → Apply as Seller → Admin Approval → Seller Login → Seller Dashboard
```

## ⚠️ IMPORTANT NOTES

1. **Users must be logged in** to apply as sellers
2. **Sellers use the same email/password** as their user account
3. **Admin must approve** seller applications before they can login
4. **Seller account can be suspended** by admin (prevents login)
5. **Rate limiting** applies to prevent brute force attacks

## 🧪 TESTING

1. Register a new user
2. Login as that user
3. Apply to become a seller (via API or future UI)
4. As admin, approve the seller
5. Logout from user account
6. Login as seller at `/seller/login`
7. Should redirect to seller dashboard

---

**Status**: Backend complete, Frontend login page complete, Dashboard pending
