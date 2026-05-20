# Refund System Implementation Guide

## ✅ What's Implemented

### 1. **Database Schema**
- Enhanced `refunds` table with support for:
  - Proof file uploads
  - Seller support requirements tracking
  - Seller earnings deductions
  - Admin approval system
  - Razorpay refund integration

- New tables created:
  - `seller_earnings_transactions` - Track all earnings deductions
  - `refund_approvals_audit` - Track admin actions on refunds

### 2. **Backend API Endpoints**

#### `/refund-request.php` (POST)
**Submit a refund request with validation:**
- 30-day eligibility check
- Mandatory seller support verification
- Invalid reason prevention (change of mind)
- File upload support (PDF, JPG, PNG, ZIP - max 10MB)
- Returns refund request details

```bash
curl -X POST http://localhost/Theme_hub_local_dipu/Frontend/backend/api/refund-request.php \
  -F "order_id=123" \
  -F "reason=Product is defective" \
  -F "detailed_reason=The template files are corrupted..." \
  -F "proof_file=@proof.pdf"
```

#### `/refund-request.php` (GET)
**Check refund status:**
```bash
curl http://localhost/Theme_hub_local_dipu/Frontend/backend/api/refund-request.php?order_id=123
```

#### `/refund-admin.php` (GET)
**Get pending refunds (ADMIN ONLY):**
```bash
curl http://localhost/Theme_hub_local_dipu/Frontend/backend/api/refund-admin.php?status=requested
```

Parameters:
- `status`: requested, approved, rejected, refunded
- `limit`: Results per page (default: 50)
- `offset`: Pagination offset

#### `/refund-admin.php` (POST)
**Approve or reject refund:**
```bash
# Approve
curl -X POST http://localhost/Theme_hub_local_dipu/Frontend/backend/api/refund-admin.php \
  -d "refund_id=1" \
  -d "action=approve" \
  -d "admin_notes=Verified with seller"

# Reject
curl -X POST http://localhost/Theme_hub_local_dipu/Frontend/backend/api/refund-admin.php \
  -d "refund_id=1" \
  -d "action=reject" \
  -d "rejection_reason=Customer requested change of mind"
```

#### `/seller-earnings.php` (GET)
**Get seller earnings and transactions:**
```bash
curl http://localhost/Theme_hub_local_dipu/Frontend/backend/api/seller-earnings.php?month=2026-04
```

### 3. **Frontend Components**

#### Enhanced DynamicPurchaseHistory.jsx
- Improved refund modal with:
  - Dropdown for structured reasons
  - Detailed reason textarea
  - File upload for proof
  - Seller support requirement enforcement
  - Invalid reason prevention

#### AdminRefundDashboard.jsx
- Admin panel for refund approvals
- Status filtering (requested, approved, rejected, refunded)
- Expandable refund details
- Proof file download
- Approval/rejection with notes

#### SellerEarningsDashboard.jsx
- Monthly earnings summary
- Refund deductions breakdown
- Transaction history with CSV export
- Impact visualization

### 4. **Razorpay Integration**

#### Automatic Refund Processing
When admin approves a refund:
1. Backend calls Razorpay API to initiate refund
2. Razorpay refund ID is stored
3. Seller earnings are automatically deducted
4. Transaction logged for audit trail

#### Webhook Handler: `/webhook/razorpay-refund.php`
Automatically updates refund status on:
- `refund.created` - Refund initiated
- `refund.processed` - Refund successfully processed
- `refund.failed` - Refund failed (reverses deductions)

## 🔧 Setup Instructions

### Step 1: Update Database
```bash
cd c:\xampp\htdocs\Theme_hub_local_dipu\Frontend\backend\database
mysql -u root -p < create_refund_tables.sql
```

### Step 2: Configure Razorpay
Ensure `backend/config/razorpay.php` contains:
```php
define('RAZORPAY_KEY_ID', 'your_key_id');
define('RAZORPAY_KEY_SECRET', 'your_key_secret');
define('RAZORPAY_WEBHOOK_SECRET', 'your_webhook_secret');
```

### Step 3: Set Webhook URL
In Razorpay Dashboard:
- Settings → Webhooks
- Add webhook: `https://yourdomain.com/backend/webhook/razorpay-refund.php`
- Subscribe to: `refund.created`, `refund.processed`, `refund.failed`

### Step 4: Create Upload Directory
```bash
mkdir -p backend/uploads/refund_proofs
chmod 755 backend/uploads/refund_proofs
```

### Step 5: Rebuild Frontend
```bash
npm run build
```

## 📋 Refund Flow

### User Refund Request
```
1. User clicks "Request Refund"
2. System checks:
   ✓ Order is within 30 days
   ✓ User contacted seller first
   ✓ Reason is valid (no change of mind)
   ✓ No pending refund exists
3. User uploads proof (optional)
4. Refund request submitted
5. Admin receives notification
```

### Admin Approval
```
1. Admin views refund in dashboard
2. Admin reviews details and proof
3. Admin approves or rejects with reason
4. IF APPROVED:
   → Razorpay refund initiated
   → Seller earnings deducted
   → Notification sent to user
   → Audit logged
```

### Completion
```
1. Razorpay processes refund
2. Webhook updates status to "refunded"
3. User receives confirmation email
4. Transaction logged in seller earnings
```

## 🚫 Invalid Refund Reasons

The system prevents refunds for:
- "change of mind"
- "changed my mind"
- "no longer want"
- "just browsing"

## 💰 Seller Earnings Impact

### When Refund is Approved:
1. Amount deducted from seller's wallet
2. `seller_earnings_transactions` records entry
3. Monthly earnings report shows deduction
4. CSV export includes transaction

### If Refund Fails:
1. Deduction automatically reversed
2. Adjustment transaction logged
3. Seller wallet balance restored

## 📊 Admin Dashboard

Access at: `/admin/AdminRefundDashboard`

Features:
- Filter refunds by status
- Expandable details view
- Proof file preview/download
- Approval/rejection interface
- Admin notes field
- Audit trail visible

## 👤 Seller Dashboard

Access at: `/seller/SellerEarningsDashboard`

Shows:
- Monthly earnings breakdown
- Refund deductions
- Net earnings calculation
- Transaction history
- CSV export option

## 🔐 Security Features

1. **Authentication**
   - Only logged-in users can request refunds
   - Only admins can approve/reject
   - Seller can only view own earnings

2. **Validation**
   - 30-day window enforcement
   - Reason validation
   - File upload validation (type, size)

3. **Verification**
   - Razorpay webhook signature verification
   - Order ownership validation
   - Seller earnings integrity checks

4. **Audit Trail**
   - All approvals logged
   - Admin who processed tracked
   - Timestamps recorded

## 🧪 Testing Checklist

- [ ] Submit refund without seller contact (should fail)
- [ ] Submit refund with "change of mind" (should fail)
- [ ] Submit valid refund request
- [ ] Upload proof file
- [ ] Admin approves refund
- [ ] Check Razorpay refund created
- [ ] Verify seller earnings deducted
- [ ] Check webhook processes refund status
- [ ] Verify transaction appears in seller dashboard
- [ ] Test rejection flow
- [ ] Test failed refund reversal
- [ ] Verify email notifications sent

## 🚀 Production Checklist

- [ ] Razorpay production keys configured
- [ ] Webhook URL pointing to production domain
- [ ] HTTPS enabled (required for webhooks)
- [ ] Database backups configured
- [ ] Admin user created with full permissions
- [ ] Email notifications configured
- [ ] Error logging enabled
- [ ] Rate limiting implemented
- [ ] Refund file upload directory secured
- [ ] Seller wallet balance constraints checked

## 📞 Support

For issues or questions:
1. Check error logs: `php-error.txt`, `error_log`
2. Review database integrity
3. Verify Razorpay credentials
4. Check webhook signature validation
5. Test with Razorpay sandbox first

## 🔗 Related Files

- Database: `backend/database/create_refund_tables.sql`
- APIs: `backend/api/refund-request.php`, `refund-admin.php`, `seller-earnings.php`
- Webhook: `backend/webhook/razorpay-refund.php`
- Frontend: `src/components/DynamicPurchaseHistory.jsx`, `src/admin/AdminRefundDashboard.jsx`, `src/seller/SellerEarningsDashboard.jsx`
