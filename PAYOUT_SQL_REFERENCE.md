# 📊 SQL Queries: Manual Payout Management

Use these queries in phpMyAdmin or MySQL console to check and manage payouts directly.

## 🔍 CHECK: View All Sellers with Pending Earnings

```sql
SELECT 
    s.id,
    s.business_name,
    s.user_id,
    u.full_name,
    u.email,
    s.pending_earnings,
    s.total_earnings,
    (SELECT COUNT(*) FROM seller_earnings WHERE seller_id = s.id AND status = 'pending') as pending_order_count,
    (SELECT SUM(amount) FROM seller_earnings WHERE seller_id = s.id AND status = 'pending') as pending_total
FROM sellers s
LEFT JOIN users u ON s.user_id = u.id
WHERE s.pending_earnings > 0
ORDER BY s.pending_earnings DESC;
```

**Output Shows:**
- Seller name & email
- Pending earnings amount
- Number of pending orders
- Total earned so far

---

## 🔍 CHECK: Earnings for Specific Seller

```sql
SELECT 
    se.id,
    se.order_id,
    se.amount,
    se.status,
    se.created_at,
    se.paid_at,
    p.name as product_name,
    u.full_name as buyer_name,
    o.amount as order_amount
FROM seller_earnings se
LEFT JOIN orders o ON se.order_id = o.id
LEFT JOIN products p ON o.product_id = p.id
LEFT JOIN users u ON o.user_id = u.id
WHERE se.seller_id = 1  -- Change to seller_id needed
ORDER BY se.created_at DESC;
```

**Output Shows:**
- Each earning record
- Product purchased
- Buyer name  
- Whether paid or pending
- When payment was received

---

## 💳 CHECK: Payout History

```sql
SELECT 
    sp.id,
    sp.seller_id,
    s.business_name,
    sp.amount,
    sp.method,
    sp.status,
    sp.created_at,
    sp.transferred_at,
    sp.notes,
    a.name as admin_name
FROM seller_payouts sp
LEFT JOIN sellers s ON sp.seller_id = s.id
LEFT JOIN admins a ON sp.admin_id = a.id
ORDER BY sp.created_at DESC;
```

**Output Shows:**
- Payout history
- Who approved it
- Method used
- Status & dates
- Notes about payout

---

## ✅ PROCESS: Mark Earnings as Paid (For Specific Seller)

**IMPORTANT:** Use the API endpoint instead if possible. Use this only if endpoint is not working.

```sql
-- Step 1: Get pending earnings for seller
SELECT id FROM seller_earnings 
WHERE seller_id = 1 AND status = 'pending'
LIMIT 10;

-- Step 2: Mark them as paid
UPDATE seller_earnings 
SET status = 'paid', paid_at = NOW()
WHERE seller_id = 1 AND status = 'pending';

-- Step 3: Get total amount being paid
SELECT SUM(amount) as total_paid FROM seller_earnings 
WHERE seller_id = 1 AND status = 'paid' 
AND paid_at >= NOW() - INTERVAL 1 HOUR;

-- Step 4: Update seller totals
UPDATE sellers 
SET 
    total_earnings = (SELECT COALESCE(SUM(amount), 0) FROM seller_earnings WHERE seller_id = 1 AND status = 'paid'),
    pending_earnings = (SELECT COALESCE(SUM(amount), 0) FROM seller_earnings WHERE seller_id = 1 AND status = 'pending')
WHERE id = 1;
```

---

## 📝 CREATE: New Payout Record (Manual)

```sql
INSERT INTO seller_payouts 
(seller_id, admin_id, amount, method, status, notes, earning_ids, transferred_at)
VALUES (
    1,                              -- seller_id
    1,                              -- admin_id (your admin ID)
    80,                             -- amount
    'manual',                       -- method
    'transferred',                  -- status
    'Manual payout processed',      -- notes
    '[1, 2, 3]',                    -- earning_ids (JSON array)
    NOW()                           -- transferred_at
);
```

---

## 🔄 UPDATE: Change Payout Status

```sql
-- Mark payout as transferred
UPDATE seller_payouts 
SET status = 'transferred', transferred_at = NOW()
WHERE id = 1;  -- Change to payout_id

-- Mark payout as failed
UPDATE seller_payouts 
SET status = 'failed', notes = 'Bank account not found'
WHERE id = 1;

-- Cancel a payout
UPDATE seller_payouts 
SET status = 'cancelled', notes = 'Seller requested cancellation'
WHERE id = 1;
```

---

## 🧮 CALCULATE: Total Commissions Due

```sql
-- Total pending across all sellers
SELECT 
    COUNT(DISTINCT seller_id) as total_sellers,
    SUM(pending_earnings) as total_pending,
    SUM(total_earnings) as total_paid_out
FROM sellers
WHERE pending_earnings > 0;

-- Admin's total profit (20% of all sales)
SELECT 
    SUM(o.amount) * 0.20 as admin_profit,
    SUM(o.amount) as total_sales,
    COUNT(o.id) as total_orders
FROM orders o
WHERE o.status = 'completed';
```

---

## 🎯 BATCH: Pay All Pending Sellers

**WARNING:** Be careful! This pays ALL sellers at once.

```sql
-- Step 1: Show what will be paid
SELECT 
    seller_id,
    business_name,
    pending_earnings
FROM sellers s
WHERE s.pending_earnings > 0;

-- Step 2: Create payout records for all sellers
INSERT INTO seller_payouts (seller_id, admin_id, amount, method, status, notes, transferred_at)
SELECT 
    s.id,
    1,                                          -- admin_id
    s.pending_earnings,
    'manual',
    'transferred',
    CONCAT('Batch payout ', DATE_FORMAT(NOW(), '%Y-%m-%d %H:%i')),
    NOW()
FROM sellers s
WHERE s.pending_earnings > 0;

-- Step 3: Mark all pending earnings as paid
UPDATE seller_earnings 
SET status = 'paid', paid_at = NOW()
WHERE status = 'pending';

-- Step 4: Update all seller totals
UPDATE sellers s
SET 
    total_earnings = (SELECT COALESCE(SUM(amount), 0) FROM seller_earnings WHERE seller_id = s.id AND status = 'paid'),
    pending_earnings = (SELECT COALESCE(SUM(amount), 0) FROM seller_earnings WHERE seller_id = s.id AND status = 'pending')
WHERE pending_earnings > 0;
```

---

## 🔐 AUDIT: Verify Payout Integrity

```sql
-- Check: seller_earnings total matches sellers.total_earnings
SELECT 
    s.id,
    s.business_name,
    s.total_earnings as shown_total,
    (SELECT SUM(amount) FROM seller_earnings WHERE seller_id = s.id AND status = 'paid') as actual_paid,
    s.pending_earnings as shown_pending,
    (SELECT SUM(amount) FROM seller_earnings WHERE seller_id = s.id AND status = 'pending') as actual_pending
FROM sellers s
WHERE s.total_earnings > 0 OR s.pending_earnings > 0;
```

**If numbers don't match:**
1. Run Step 4 from BATCH section to recalculate
2. Check for cancelled earnings

---

## 🗑️ CLEANUP: Remove Duplicate Earnings (if they exist)

```sql
-- Find duplicates (same order_id paid twice)
SELECT order_id, COUNT(*) as count 
FROM seller_earnings 
WHERE status = 'paid'
GROUP BY order_id 
HAVING count > 1;

-- Remove duplicates (keep newest)
DELETE se1 FROM seller_earnings se1
JOIN (
    SELECT order_id, MAX(id) as max_id
    FROM seller_earnings 
    WHERE status = 'paid'
    GROUP BY order_id
    HAVING COUNT(*) > 1
) se2 ON se1.order_id = se2.order_id AND se1.id < se2.max_id;
```

---

## 📊 REPORTING: Payout Statistics

```sql
-- Monthly payout summary
SELECT 
    DATE_FORMAT(sp.transferred_at, '%Y-%m') as month,
    COUNT(DISTINCT sp.seller_id) as sellers_paid,
    SUM(sp.amount) as total_amount,
    sp.method,
    COUNT(sp.id) as payout_count
FROM seller_payouts sp
WHERE sp.status = 'transferred'
GROUP BY DATE_FORMAT(sp.transferred_at, '%Y-%m'), sp.method
ORDER BY month DESC;

-- Top earners
SELECT 
    s.id,
    s.business_name,
    COUNT(DISTINCT se.order_id) as total_sales,
    SUM(se.amount) as total_earned,
    COUNT(IF(se.status = 'paid', 1, NULL)) as paid_earnings,
    COUNT(IF(se.status = 'pending', 1, NULL)) as pending_earnings
FROM sellers s
LEFT JOIN seller_earnings se ON s.id = se.seller_id
GROUP BY s.id
ORDER BY total_earned DESC
LIMIT 10;
```

---

## 🆘 TROUBLESHOOT: Fix Common Issues

### Issue: Seller has pending_earnings but no seller_earnings records

```sql
-- Find this issue
SELECT s.id, s.business_name, s.pending_earnings,
       (SELECT SUM(amount) FROM seller_earnings WHERE seller_id = s.id AND status = 'pending') as actual
FROM sellers s
WHERE s.pending_earnings != (SELECT COALESCE(SUM(amount), 0) FROM seller_earnings WHERE seller_id = s.id AND status = 'pending');

-- Fix: Reset to actual
UPDATE sellers s
SET pending_earnings = COALESCE((SELECT SUM(amount) FROM seller_earnings WHERE seller_id = s.id AND status = 'pending'), 0)
WHERE id = 1;  -- seller_id
```

### Issue: Order paid but no seller_earnings record

```sql
-- Find unpaid orders where seller should have earned
SELECT o.id, o.product_id, o.user_id, p.seller_id, o.amount * 0.8 as seller_should_earn
FROM orders o
JOIN products p ON o.product_id = p.id
WHERE o.status = 'completed'
AND NOT EXISTS (SELECT 1 FROM seller_earnings WHERE order_id = o.id);

-- Fix: Create missing earnings
INSERT INTO seller_earnings (seller_id, order_id, amount, status, created_at)
SELECT 
    p.seller_id,
    o.id,
    o.amount * 0.8,
    'pending',
    o.created_at
FROM orders o
JOIN products p ON o.product_id = p.id
WHERE o.status = 'completed'
AND NOT EXISTS (SELECT 1 FROM seller_earnings WHERE order_id = o.id);
```

---

## 💡 Tips

1. **Always backup database before batch operations**
2. **Test queries with LIMIT 1 first before UPDATE ALL**
3. **Use `WHERE clause` to be specific about what you're changing**
4. **Check numbers match between tables before finalizing**
5. **Log significant changes for audit trail**

---

**Use API endpoints when possible** - They handle validation and logging automatically.
Use SQL only when necessary for troubleshooting or batch operations.
