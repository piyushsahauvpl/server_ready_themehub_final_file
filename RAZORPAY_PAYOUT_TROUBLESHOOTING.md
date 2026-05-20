# 🔧 Razorpay Payout Gateway - Troubleshooting Guide

## Problem: "Pay Now" button doesn't open Razorpay payment gateway

### Important Clarification ⚠️

The admin payout in SellerList.jsx **does NOT** use the Razorpay payment gateway (checkout). Instead, it uses **RazorpayX API** to send money directly to the seller's bank account.

**Flow:**
```
Admin clicks "Pay Now" 
    ↓
Backend calls Razorpay payout API (RazorpayX)
    ↓
Money transfers from your RazorpayX account → Seller's Bank
    ↓
Payment status appears in success/error message
```

---

## ✅ Solution: Enable Payout Debugging

### Step 1: Verify Razorpay Config
File: `backend/config/razorpay.php`

```php
<?php
define('RAZORPAY_KEY_ID',         'rzp_test_SUdNz685HnllDx');      // ✅ Verify this exists
define('RAZORPAY_KEY_SECRET',     'UWjbj2D5w0ruh9w0QC2Z303b');    // ✅ Verify this exists
define('RAZORPAY_ACCOUNT_NUMBER', '2323230038852797');             // ✅ Your RazorpayX account
?>
```

**Action:** Replace with your actual live credentials when going to production.

---

### Step 2: Check Browser Console for Errors

1. Open the seller list
2. Click "Pay Now" on any seller
3. Press **F12** to open Developer Tools
4. Switch to **Console** tab
5. Look for `[PAYOUT]` logs that show:
   - Request being sent
   - Response received
   - Success or error message

**Example Success Log:**
```
[PAYOUT] Initiating payout for seller 5: ₹800
[PAYOUT] Response: {success: true, message: "Payout initiated..."}
```

**Example Error Log:**
```
[PAYOUT ERROR] Payout failed: Seller bank details are incomplete or missing
```

---

### Step 3: Run Backend Diagnostic

Visit this URL to check your Razorpay setup:
```
http://localhost/Theme_hub_local_dipu/Frontend/backend/api/admin/test-payout.php
```

This will show:
- ✅ Database connection status
- ✅ Razorpay credentials status
- ✅ Sample seller data
- ✅ Razorpay API connectivity

---

## 🔍 Common Issues & Fixes

### Issue 1: "Seller bank details are incomplete or missing"

**Cause:** Seller hasn't added bank details

**Fix:** 
1. Go to Seller Dashboard
2. Click "Bank Details" 
3. Fill in: Account Holder, Account Number, IFSC, Bank Name
4. Save
5. Try payout again

---

### Issue 2: "Insufficient admin wallet balance"

**Cause:** Your RazorpayX account doesn't have enough funds

**Fix:**
1. Check your Razorpay dashboard
2. Top up your RazorpayX account
3. Ensure balance >= payout amount
4. Try again

---

### Issue 3: "Invalid Razorpay credentials"

**Cause:** API keys are invalid or missing

**Fix:**
1. Check `backend/config/razorpay.php`
2. Get correct keys from Razorpay dashboard
3. Update both KEY_ID and KEY_SECRET
4. Ensure ACCOUNT_NUMBER is your RazorpayX account

---

### Issue 4: Button shows loading but nothing happens

**Cause:** Possible API timeout or network issue

**Fix:**
1. Check browser console (F12 → Console)
2. Look for error messages
3. Verify Razorpay API is reachable: `https://api.razorpay.com/v1/`
4. Try opening the diagnostic page above

---

## 📋 Verification Checklist

- [ ] `backend/config/razorpay.php` has valid credentials
- [ ] Seller has complete bank details added
- [ ] RazorpayX account has sufficient balance
- [ ] Payment shows in seller list as "Pending"
- [ ] Click shows confirmation dialog
- [ ] Admin confirms the payout
- [ ] Success message appears OR error is visible in console

---

## 🎯 What Should Happen

1. Admin clicks **Pay Now** button
2. Modal with bank details appears
3. Admin confirms with bank account details visible
4. Click confirms: **"Process payout of ₹X to Seller Name?"**
5. One of two outcomes:
   - ✅ **Success:** Green message "✅ Payout of ₹X sent successfully!"
   - ❌ **Error:** Red message with reason (e.g., "Seller bank details incomplete")

---

## 🔗 Related Files

- Frontend UI: `src/admin/Sellers/SellerList.jsx`
- Backend Endpoint: `backend/api/admin/seller-payouts.php`
- Razorpay Config: `backend/config/razorpay.php`
- Payout Functions: `backend/api/payout/common.php`
- API Client: `src/lib/apiClient.js`

---

## 💡 Pro Tips

1. **Test with small amounts first** before processing large payouts
2. **Check settlement schedule** - Razorpay processes payouts within 24 hours typically
3. **Keep records** - Screenshot confirmations for audit trail
4. **Monitor rates** - Your commission is deducted from each payout
5. **Test in sandbox first** before going live with production keys

---

## 📞 Need Help?

If issues persist:
1. Clear browser cache (Ctrl+Shift+Delete)
2. Reload the page
3. Ensure you're logged in as admin
4. Check browser console for detailed error logs
5. Verify Razorpay account is in good standing

**Debug Info to Share:**
- Screenshot of the error message
- Console output (F12 → Console → Copy)
- Seller details (name, ID)
- Amount being paid
