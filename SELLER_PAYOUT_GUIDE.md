# 💰 Complete Seller Payout & Commission System Guide

## Overview: How Commissions Work

### Commission Structure (80/20 Split)
When a customer purchases a template:
- **80%** goes to the **Seller** (in `pending_earnings`)
- **20%** goes to the **Admin** (kept by system)

**Example:**
- Customer buys a template for **₹100**
- Seller earns: **₹80** (marked as "pending")
- Admin earns: **₹20** (automatically kept)

## Part 1: Understanding the System

### Database Tables

#### `sellers` Table - Tracks Seller Money
```
id                  - Seller ID (primary key)
user_id             - Links to users table
business_name       - Seller's business name
total_earnings      - ✅ Money ALREADY paid to seller
pending_earnings    - ⏳ Money waiting to be paid to seller
status              - active/suspended/inactive
```

#### `seller_earnings` Table - Tracks Every Sale
```
id                  - Earning record ID
seller_id           - Which seller
order_id            - Which order/purchase
amount              - How much seller earned (80% of order)
status              - 'pending' or 'paid'
created_at          - When the sale happened
paid_at             - When seller received the payment
```

#### `seller_payouts` Table - Tracks Transfers
```
id                  - Payout ID
seller_id           - Which seller received money
admin_id            - Which admin approved it
amount              - Total amount transferred
method              - 'manual', 'bank_transfer', 'razorpay', etc.
status              - 'pending', 'approved', 'transferred'
transferred_at      - When money was sent
earning_ids         - Which earnings were included (JSON array)
```

## Part 2: Current Status - Check Pending Earnings

### For Admin: View All Pending Payouts

**Endpoint:**
```
GET http://localhost/Theme_hub_local_dipu/Frontend/backend/api/admin/seller-payouts.php
```

**How to Use:**
1. **Login as admin**
2. **Open the URL above** (requires admin auth)
3. **You'll see:**
   - List of all sellers with pending earnings
   - Total pending amount across all sellers
   - How many orders per seller are pending
   - Email of each seller

**Response Example:**
```json
{
  "success": true,
  "summary": {
    "total_sellers": 2,
    "total_pending_amount": 160,
    "timestamp": "2026-03-31 10:30:00"
  },
  "payouts": [
    {
      "seller_id": 1,
      "business_name": "John's Templates",
      "full_name": "John Doe",
      "email": "john@example.com",
      "pending_amount": 80,
      "total_earned": 500,
      "pending_orders_count": 1
    },
    {
      "seller_id": 2,
      "business_name": "Sarah's Designs",
      "full_name": "Sarah Smith",
      "email": "sarah@example.com",
      "pending_amount": 80,
      "total_earned": 300,
      "pending_orders_count": 1
    }
  ]
}
```

### For Seller: Check Your Earnings

**Endpoint:**
```
GET http://localhost/Theme_hub_local_dipu/Frontend/backend/api/seller/view-payouts.php
```

**How to Use:**
1. **Login as seller**
2. **Open the URL above**
3. **You'll see:**
   - Your total earnings so far
   - Pending earnings waiting to be paid
   - All your past sales with status
   - History of payouts received

**Response Example:**
```json
{
  "success": true,
  "seller": {
    "business_name": "John's Templates",
    "total_earnings": 500,
    "pending_earnings": 80
  },
  "earnings_summary": {
    "pending": {
      "count": 1,
      "total": 80
    },
    "paid": {
      "count": 5,
      "total": 400
    }
  },
  "recent_earnings": [
    {
      "order_id": 123,
      "product_name": "Bootstrap Template",
      "buyer_name": "Jane Buyer",
      "amount": 80,
      "status": "pending",
      "earned_at": "2026-03-31 10:00:00"
    }
  ],
  "payout_history": [
    {
      "id": 1,
      "amount": 160,
      "method": "manual",
      "status": "approved",
      "transferred_at": "2026-03-30 15:00:00"
    }
  ]
}
```

## Part 3: Process Payouts - Transfer Money to Seller

### Step-by-Step: How to Pay a Seller

#### Step 1: Admin Views Pending Payouts
```
Open: http://localhost/Theme_hub_local_dipu/Frontend/backend/api/admin/seller-payouts.php
```
You'll see all sellers with pending earnings.

#### Step 2: Admin Transfers Money to Seller
**Send POST Request:**

**URL:**
```
POST http://localhost/Theme_hub_local_dipu/Frontend/backend/api/admin/seller-payouts.php?action=process
```

**Body (JSON):**
```json
{
  "seller_id": 1,
  "method": "manual",
  "notes": "Payout for March 2026 sales"
}
```

**Using cURL:**
```bash
curl -X POST "http://localhost/Theme_hub_local_dipu/Frontend/backend/api/admin/seller-payouts.php?action=process" \
  -H "Content-Type: application/json" \
  -b "session_cookie_here" \
  -d '{
    "seller_id": 1,
    "method": "manual",
    "notes": "Payout for March 2026"
  }'
```

**Using JavaScript (from React/Admin Panel):**
```javascript
const processPayout = async (sellerId) => {
  const response = await fetch(
    'http://localhost/Theme_hub_local_dipu/Frontend/backend/api/admin/seller-payouts.php?action=process',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        seller_id: sellerId,
        method: 'manual',
        notes: 'Approved payout'
      })
    }
  );
  
  const result = await response.json();
  console.log(result);
  
  if (result.success) {
    alert(`✅ Payout of ₹${result.payout.amount} transferred!`);
  }
};
```

**Using PowerShell (Windows):**
```powershell
$url = "http://localhost/Theme_hub_local_dipu/Frontend/backend/api/admin/seller-payouts.php?action=process"
$body = @{
    seller_id = 1
    method = "manual"
    notes = "Payout for March 2026"
} | ConvertTo-Json

$response = Invoke-WebRequest -Uri $url -Method POST -Body $body -ContentType "application/json" -UseBasicParsing
$response.Content | ConvertFrom-Json | ConvertTo-Json
```

#### Step 3: Verify the Payout Was Processed

**Admin can check:**
```
Open: http://localhost/Theme_hub_local_dipu/Frontend/backend/api/admin/seller-payouts.php
```
The seller's `pending_earnings` should now be **0** or reduced.

**Seller can check:**
```
Open: http://localhost/Theme_hub_local_dipu/Frontend/backend/api/seller/view-payouts.php
```
The seller should see:
- `pending_earnings: 0` (or reduced)
- New entry in `payout_history`
- Earnings marked as "paid"

## Part 4: What Happens When You Process Payout

When admin processes a payout, the system automatically:

1. ✅ **Finds all pending earnings** for that seller from `seller_earnings`
2. ✅ **Creates payout record** in `seller_payouts`
3. ✅ **Marks earnings as "paid"** - Changes status from 'pending' to 'paid'
4. ✅ **Updates seller totals:**
   - `total_earnings` += pending amount
   - `pending_earnings` -= pending amount
5. ✅ **Logs the transaction** for audit trail

### Database Changes After Payout:

**Before Payout:**
```
sellers table:
- pending_earnings: 80
- total_earnings: 400

seller_earnings table:
- status: 'pending'
- paid_at: NULL
```

**After Payout:**
```
sellers table:
- pending_earnings: 0
- total_earnings: 480

seller_earnings table:
- status: 'paid'
- paid_at: 2026-03-31 10:30:00
```

## Part 5: Different Payout Methods

The system supports different payout methods. Use the `method` parameter:

### Methods Available

| Method | Description | Use Case |
|---|---|---|
| `manual` | Admin manually records payment (default) | For bank transfers, checks, etc. |
| `bank_transfer` | Direct bank transfer | Automatic bank API integration (future) |
| `razorpay` | Via Razorpay payout API | Automated Razorpay payouts |
| `paypal` | Via PayPal API | For PayPal integrations |
| `upi` | UPI transfer | For Indian UPI payments |
| `cheque` | Check payment | For check-based payments |

**Example - Bank Transfer Method:**
```json
{
  "seller_id": 1,
  "method": "bank_transfer",
  "notes": "Bank transfer to account ending in 1234"
}
```

## Part 6: Workflow Examples

### Example 1: Simple Manual Payout

```
Timeline:
--------
2026-03-31 10:00 - Customer buys template for ₹100
                 → Seller earns ₹80 (pending)
                 → Admin earns ₹20 (kept)

2026-03-31 11:00 - Another customer buys for ₹100
                 → Seller earns ₹80 (pending)
                 → Total pending for seller: ₹160

2026-03-31 15:00 - Admin processes payout
                 → API call with seller_id: 1
                 → System finds 2 pending earnings (₹160 total)
                 → Marks both as "paid"
                 → Updates seller: total ₹160, pending ₹0
                 → Creates payout record

2026-03-31 16:00 - Seller checks dashboard
                 → Sees pending_earnings: 0
                 → Sees new payout in history
                 → Total earned increased by ₹160
```

### Example 2: Multiple Sellers

```
Admin Panel Shows:
------------------
Seller 1 (John):   ₹160 pending → Admin processes → ✅ Paid
Seller 2 (Sarah):  ₹240 pending → Admin processes → ✅ Paid
Seller 3 (Mike):   ₹80  pending → Admin processes → ✅ Paid
Total:             ₹480 pending  → All transferred

Platform Summary:
- Total transferred: ₹1,920 (80% of ₹2,400 sales)
- Admin keeps: ₹480 (20% of ₹2,400 sales)
```

## Part 7: FAQ

### Q: How often should I process payouts?
**A:** Up to you! Options:
- Weekly payouts
- Monthly payouts
- On-demand (when seller requests)
- Automatic (set up scheduler)

### Q: What if seller has no bank account info?
**A:** 
1. Store bank details in sellers table (add columns if needed)
2. Require bank info before processing payout
3. Use alternative payment method

### Q: Can sellers request manual withdrawal?
**A:** 
1. Yes - Create a withdrawal request flow
2. Seller submits request with amount
3. Admin approves and processes payout

### Q: What if payout fails?
**A:** 
1. Keep status as 'pending' in seller_payouts
2. Admin retries the payout
3. Add notes about failure reason

### Q: Can seller see their pending earnings?
**A:** 
1. Yes - They can visit: `view-payouts.php`
2. Shows pending_earnings, earned history, payout history
3. Can also appear in seller dashboard

## Part 8: Setup Checklist

- [ ] Create `seller_payouts` table (auto-created on first payout)
- [ ] Test endpoint: `/admin/seller-payouts.php` (GET)
- [ ] Test payout process: `/admin/seller-payouts.php?action=process` (POST)
- [ ] Seller can view: `/seller/view-payouts.php` (GET)
- [ ] Admin panel shows pending payouts
- [ ] Seller dashboard shows pending earnings
- [ ] Set up regular payout schedule (weekly/monthly)
- [ ] Store seller bank details (optional but recommended)
- [ ] Add seller withdrawal request feature (optional)

## Part 9: Integration with Admin Panel

### Admin Panel Component Structure

```javascript
// AdminPayouts.jsx component

const [sellers, setSellers] = useState([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
  // Get all pending payouts
  fetch('/backend/api/admin/seller-payouts.php', {
    credentials: 'include'
  })
    .then(r => r.json())
    .then(data => {
      setSellers(data.payouts);
      setLoading(false);
    });
}, []);

const handleProcessPayout = (sellerId) => {
  // Process payout for selected seller
  fetch('/backend/api/admin/seller-payouts.php?action=process', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({
      seller_id: sellerId,
      method: 'manual',
      notes: 'Admin approved payout'
    })
  })
    .then(r => r.json())
    .then(result => {
      if (result.success) {
        alert(`✅ Payout processed: ₹${result.payout.amount}`);
        // Refresh list
        // ... refresh code
      }
    });
};

// Render list with Process Payout button
return (
  <div>
    {sellers.map(seller => (
      <div key={seller.seller_id}>
        <p>{seller.business_name}</p>
        <p>Pending: ₹{seller.pending_amount}</p>
        <button onClick={() => handleProcessPayout(seller.seller_id)}>
          Process Payout
        </button>
      </div>
    ))}
  </div>
);
```

## Summary

| Action | Who | How |
|---|---|---|
| **Purchase Template** | Customer | Pays via Razorpay |
| **Split Commission** | System | Auto: 80% seller (pending), 20% admin |
| **View Pending** | Admin | GET `/admin/seller-payouts.php` |
| **View Pending** | Seller | GET `/seller/view-payouts.php` |
| **Process Payout** | Admin | POST `/admin/seller-payouts.php?action=process` |
| **Mark as Paid** | System | Auto: Updates status, totals |
| **See Payment** | Seller | Checks payout history |

---

**Questions?** Check the diagnostic logs in browser console (F12) or Apache error log.
