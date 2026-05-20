# ⚡ Quick Start: Seller Payouts in 5 Minutes

## What You Need to Know

**Commission Split (Automatic):**
- 80% → Seller's `pending_earnings`
- 20% → Admin's profit

**Pending Money Stored In:** `sellers.pending_earnings` column

**How to Pay Seller:** Use new `/admin/seller-payouts.php` endpoint

## 🚀 Quick Test (Admin)

### 1. Check Pending Payouts
```
Open in browser (while logged in as admin):
http://localhost/Theme_hub_local_dipu/Frontend/backend/api/admin/seller-payouts.php
```

You'll see JSON with all sellers and pending amounts.

### 2. Process Payout
Open PowerShell/Terminal and run:

**PowerShell (Windows):**
```powershell
$url = "http://localhost/Theme_hub_local_dipu/Frontend/backend/api/admin/seller-payouts.php?action=process"
$body = @{
    seller_id = 1
    method = "manual"
    notes = "March 2026 payout"
} | ConvertTo-Json

$session = New-Object Microsoft.PowerShell.Commands.WebRequestSession
# Add your session cookie if needed
# $session.Cookies.Add((New-Object System.Net.Cookie -Property @{Name="PHPSESSID"; Value="YOUR_COOKIE"; Domain="localhost"}))

$response = Invoke-WebRequest -Uri $url -Method POST -Body $body `
  -ContentType "application/json" -UseBasicParsing -WebSession $session

$response.Content | ConvertFrom-Json | ConvertTo-Json
```

**cURL (Mac/Linux):**
```bash
curl -X POST "http://localhost/Theme_hub_local_dipu/Frontend/backend/api/admin/seller-payouts.php?action=process" \
  -H "Content-Type: application/json" \
  -d '{
    "seller_id": 1,
    "method": "manual",
    "notes": "March payout"
  }'
```

### 3. Verify It Worked
```
Open: http://localhost/Theme_hub_local_dipu/Frontend/backend/api/admin/seller-payouts.php
```
- Seller's pending amount should be 0 or reduced
- If 0: all earnings were paid

## 🎯 For Seller: View Your Money

```
Open (while logged in as seller):
http://localhost/Theme_hub_local_dipu/Frontend/backend/api/seller/view-payouts.php
```

You'll see:
- Total earned so far
- Pending (waiting to be paid)
- History of all payouts received

## 📋 Database Setup (Auto)

The system auto-creates the `seller_payouts` table on first payout. 

If you want to create it manually:

```sql
CREATE TABLE IF NOT EXISTS seller_payouts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    seller_id INT NOT NULL,
    admin_id INT NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    method VARCHAR(50) DEFAULT 'manual',
    status ENUM('pending', 'approved', 'transferred', 'failed', 'cancelled') DEFAULT 'pending',
    transaction_id VARCHAR(100) DEFAULT NULL,
    notes TEXT,
    earning_ids JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    transferred_at TIMESTAMP NULL,
    FOREIGN KEY (seller_id) REFERENCES sellers(id) ON DELETE CASCADE,
    FOREIGN KEY (admin_id) REFERENCES admins(id) ON DELETE RESTRICT,
    INDEX idx_seller (seller_id),
    INDEX idx_status (status),
    INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

## 🔍 Verify Database Has Required Columns

Run this SQL to check:

```sql
-- Check sellers table has earnings columns
SELECT 
    COLUMN_NAME, 
    COLUMN_TYPE, 
    IS_NULLABLE 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'sellers' 
AND COLUMN_NAME IN ('pending_earnings', 'total_earnings');

-- Should show:
-- pending_earnings | DECIMAL(12,2) | YES
-- total_earnings   | DECIMAL(12,2) | YES

-- Check seller_earnings table structure
DESCRIBE seller_earnings;

-- Should show:
-- id           | INT
-- seller_id    | INT
-- order_id     | INT  
-- amount       | DECIMAL
-- status       | ENUM
-- paid_at      | TIMESTAMP
-- created_at   | TIMESTAMP
```

## 💡 Common Scenarios

### Scenario 1: Customer Buys Template for ₹100
```
1. Customer pays ₹100 via Razorpay
2. System records:
   - sellers.pending_earnings += 80
   - seller_earnings status = 'pending'
3. Seller dashboard shows: Pending: ₹80
```

### Scenario 2: Admin Processes Payout
```
1. Admin runs: POST /admin/seller-payouts.php?action=process
   with seller_id: 1
2. System:
   - Marks all pending earnings as 'paid'
   - Updates sellers: pending_earnings = 0, total_earnings += 80
   - Creates payout record
3. Seller sees: pending now 0, payout in history
```

### Scenario 3: Seller Checks Earnings
```
1. Seller visits: GET /seller/view-payouts.php
2. Sees:
   - pending_earnings: 0 (if already paid)
   - total_earnings: 80 (now includes this sale)
   - New entry in payout_history
```

## ✅ Checklist

- [ ] Visit admin endpoint to see pending payouts
- [ ] Test payout process with seller_id: 1
- [ ] Check seller endpoint to see payout history
- [ ] Verify database shows earnings as 'paid'
- [ ] Confirm sellers table shows updated earnings

## 📞 Endpoints Reference

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/admin/seller-payouts.php` | GET | View all pending payouts |
| `/admin/seller-payouts.php?action=process` | POST | Process payout for seller |
| `/seller/view-payouts.php` | GET | Seller views earnings & payouts |

## 🐛 Troubleshooting

**"No pending payouts"**
- Needs actual sales first
- Check if seller has seller_id on products
- Verify order payment was verified

**"Payout failed"**
- Check seller_id exists
- Check pending_earnings > 0
- Check admin is authenticated
- See Apache error log for details

**"Seller can't see payouts"**
- Check they're logged in
- Verify user_id matches sellers.user_id
- Check session is active

## Next Steps

1. **Test the endpoints** (use Quick Test above)
2. **Set up Admin Panel UI** (optional but recommended)
3. **Create withdrawal request system** (optional)
4. **Schedule automatic payouts** (optional)

---

For comprehensive guide, see `SELLER_PAYOUT_GUIDE.md`
