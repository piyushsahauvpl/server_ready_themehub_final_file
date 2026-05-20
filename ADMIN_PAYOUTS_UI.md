# 🖥️ Admin Panel Integration: Seller Payouts UI

Complete React component examples for your admin dashboard.

## Component: View Pending Payouts

```javascript
// components/admin/SellerPayouts.jsx

import React, { useState, useEffect } from 'react';
import './SellerPayouts.css';

export default function SellerPayouts() {
  const [payouts, setPayouts] = useState([]);
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processing, setProcessing] = useState({});

  // ✅ Fetch pending payouts on mount
  useEffect(() => {
    const fetchPayouts = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          'http://localhost/Theme_hub_local_dipu/Frontend/backend/api/admin/seller-payouts.php',
          {
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' }
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();

        if (data.success) {
          setSummary(data.summary);
          setPayouts(data.payouts);
          setError(null);
        } else {
          setError(data.message || 'Failed to fetch payouts');
        }
      } catch (err) {
        setError(err.message);
        console.error('❌ Error fetching payouts:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPayouts();
  }, []);

  // ✅ Process payout for seller
  const handleProcessPayout = async (sellerId, sellerName) => {
    if (!window.confirm(`Process payout for ${sellerName}?`)) {
      return;
    }

    try {
      setProcessing(prev => ({ ...prev, [sellerId]: true }));

      const response = await fetch(
        'http://localhost/Theme_hub_local_dipu/Frontend/backend/api/admin/seller-payouts.php?action=process',
        {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            seller_id: sellerId,
            method: 'manual',
            notes: `Admin payout on ${new Date().toLocaleDateString()}`
          })
        }
      );

      const result = await response.json();

      if (result.success) {
        alert(`✅ Payout successful! ₹${result.payout.amount} transferred.`);
        
        // Refresh the list
        const freshResponse = await fetch(
          'http://localhost/Theme_hub_local_dipu/Frontend/backend/api/admin/seller-payouts.php',
          { credentials: 'include' }
        );
        const freshData = await freshResponse.json();
        
        if (freshData.success) {
          setSummary(freshData.summary);
          setPayouts(freshData.payouts);
        }
      } else {
        alert(`❌ Failed: ${result.message}`);
      }
    } catch (err) {
      alert(`❌ Error: ${err.message}`);
      console.error('Error processing payout:', err);
    } finally {
      setProcessing(prev => ({ ...prev, [sellerId]: false }));
    }
  };

  // ✅ Refresh manually
  const handleRefresh = () => {
    setLoading(true);
    window.location.reload();
  };

  if (loading) return <div className="loading">Loading payouts...</div>;
  if (error) return <div className="error">❌ Error: {error}</div>;

  return (
    <div className="seller-payouts">
      <div className="header">
        <h1>💰 Seller Payouts Management</h1>
        <button onClick={handleRefresh} className="btn-refresh">
          🔄 Refresh
        </button>
      </div>

      {/* Summary Cards */}
      <div className="summary-cards">
        <div className="card">
          <h3>Total Pending</h3>
          <p className="amount">₹{summary.total_pending_amount?.toFixed(2) || '0.00'}</p>
          <p className="label">Across all sellers</p>
        </div>

        <div className="card">
          <h3>Sellers Waiting</h3>
          <p className="amount">{summary.total_sellers || 0}</p>
          <p className="label">Need payment</p>
        </div>

        <div className="card">
          <h3>Last Updated</h3>
          <p className="time">{summary.timestamp}</p>
        </div>
      </div>

      {/* Payouts Table */}
      <div className="payouts-table">
        <h2>Pending Payouts</h2>

        {payouts.length === 0 ? (
          <p className="no-data">✅ No pending payouts! All sellers have been paid.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Seller</th>
                <th>Email</th>
                <th>Pending Amount</th>
                <th>Orders</th>
                <th>Total Earned</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {payouts.map(payout => (
                <tr key={payout.seller_id}>
                  <td className="seller-name">
                    <strong>{payout.business_name}</strong>
                    <br />
                    <small>{payout.full_name}</small>
                  </td>
                  <td>{payout.email}</td>
                  <td className="amount">
                    ₹{payout.pending_amount.toFixed(2)}
                  </td>
                  <td>{payout.pending_orders_count}</td>
                  <td>₹{payout.total_earned.toFixed(2)}</td>
                  <td>
                    <button
                      onClick={() => handleProcessPayout(
                        payout.seller_id,
                        payout.business_name
                      )}
                      disabled={processing[payout.seller_id]}
                      className="btn-process"
                    >
                      {processing[payout.seller_id] ? (
                        '⏳ Processing...'
                      ) : (
                        '✅ Process Payout'
                      )}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Bulk Actions */}
      {payouts.length > 0 && (
        <div className="bulk-actions">
          <button 
            onClick={() => {
              if (window.confirm(`Process payouts for all ${payouts.length} sellers?`)) {
                payouts.forEach(p => handleProcessPayout(p.seller_id, p.business_name));
              }
            }}
            className="btn-bulk"
          >
            💳 Process All Payouts
          </button>
        </div>
      )}
    </div>
  );
}
```

## Styling: SellerPayouts.css

```css
/* components/admin/SellerPayouts.css */

.seller-payouts {
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 2px solid #e0e0e0;
}

.header h1 {
  margin: 0;
  color: #333;
  font-size: 28px;
}

.btn-refresh {
  padding: 10px 20px;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.3s;
}

.btn-refresh:hover {
  background: #0056b3;
}

/* Summary Cards */
.summary-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.card {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  border-left: 4px solid #28a745;
}

.card h3 {
  margin: 0 0 10px 0;
  color: #666;
  font-size: 14px;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.card .amount {
  margin: 0;
  font-size: 24px;
  font-weight: bold;
  color: #28a745;
}

.card .label {
  margin: 10px 0 0 0;
  color: #999;
  font-size: 12px;
}

.card .time {
  margin: 0;
  color: #666;
  font-size: 14px;
}

/* Payouts Table */
.payouts-table {
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
}

.payouts-table h2 {
  padding: 20px;
  margin: 0;
  background: #f8f9fa;
  border-bottom: 1px solid #e0e0e0;
}

.payouts-table table {
  width: 100%;
  border-collapse: collapse;
}

.payouts-table th {
  padding: 15px;
  text-align: left;
  background: #f8f9fa;
  border-bottom: 2px solid #dee2e6;
  font-weight: 600;
  color: #333;
}

.payouts-table td {
  padding: 15px;
  border-bottom: 1px solid #dee2e6;
}

.payouts-table tr:hover {
  background: #f8f9fa;
}

.seller-name {
  font-weight: 500;
}

.seller-name small {
  display: block;
  color: #999;
  font-weight: normal;
}

.amount {
  color: #28a745;
  font-weight: 600;
}

.btn-process {
  padding: 8px 16px;
  background: #28a745;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
  transition: background 0.3s;
}

.btn-process:hover:not(:disabled) {
  background: #218838;
}

.btn-process:disabled {
  background: #ccc;
  cursor: not-allowed;
}

/* Bulk Actions */
.bulk-actions {
  text-align: right;
}

.btn-bulk {
  padding: 12px 24px;
  background: #ffc107;
  color: #333;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  transition: background 0.3s;
}

.btn-bulk:hover {
  background: #e0a800;
}

/* Loading & Error */
.loading {
  text-align: center;
  padding: 40px;
  color: #666;
}

.error {
  background: #f8d7da;
  color: #721c24;
  padding: 15px;
  border-radius: 4px;
  border: 1px solid #f5c6cb;
  margin: 20px 0;
}

.no-data {
  text-align: center;
  padding: 40px 20px;
  color: #28a745;
  font-size: 16px;
}

/* Responsive */
@media (max-width: 768px) {
  .header {
    flex-direction: column;
    gap: 15px;
    align-items: flex-start;
  }

  .summary-cards {
    grid-template-columns: 1fr;
  }

  .payouts-table table {
    font-size: 12px;
  }

  .payouts-table th,
  .payouts-table td {
    padding: 10px;
  }

  .btn-process {
    padding: 6px 10px;
    font-size: 11px;
  }
}
```

## Add to Admin Routes

```javascript
// admin/AdminRoutes.jsx

import SellerPayouts from './components/SellerPayouts';

// In your route configuration:
const routes = [
  {
    path: '/admin/dashboard',
    element: <AdminDashboard />
  },
  {
    path: '/admin/payouts',  // ← NEW
    element: <SellerPayouts />  // ← NEW
  },
  // ... other routes
];
```

## Add Menu Item

```javascript
// admin/components/AdminMenu.jsx or AdminNav.jsx

<nav className="admin-nav">
  <Link to="/admin/dashboard">📊 Dashboard</Link>
  <Link to="/admin/products">📦 Products</Link>
  <Link to="/admin/payouts">💰 Seller Payouts</Link>  {/* ← ADD THIS */}
  <Link to="/admin/users">👥 Users</Link>
  <Link to="/admin/settings">⚙️ Settings</Link>
</nav>
```

## Alternative: Dashboard Widget (Smaller View)

```javascript
// admin/components/AdminDashboard.jsx - Add this widget

function PayoutsWidget() {
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    const fetchSummary = async () => {
      const response = await fetch(
        'http://localhost/Theme_hub_local_dipu/Frontend/backend/api/admin/seller-payouts.php',
        { credentials: 'include' }
      );
      const data = await response.json();
      if (data.success) setSummary(data.summary);
    };

    fetchSummary();
  }, []);

  if (!summary) return null;

  return (
    <div className="widget payouts-widget">
      <h3>💰 Pending Payouts</h3>
      <p className="big-number">₹{summary.total_pending_amount?.toFixed(2)}</p>
      <p className="subtitle">{summary.total_sellers} sellers waiting</p>
      <Link to="/admin/payouts" className="btn-view-all">
        View & Process →
      </Link>
    </div>
  );
}
```

## Features Implemented

- ✅ View all pending payouts
- ✅ See seller details & amounts
- ✅ Process individual payouts with 1 click
- ✅ Bulk process all payouts
- ✅ Real-time refresh
- ✅ Error handling
- ✅ Confirmation dialogs
- ✅ Loading states
- ✅ Responsive design
- ✅ Auto-updates table after payout

## How It Works

1. **Admin opens Payouts page**
2. **System fetches all pending payouts** via `/admin/seller-payouts.php`
3. **Shows table with amounts and sellers**
4. **Admin clicks "Process Payout"**
5. **POST request sent to process seller payment**
6. **Backend marks earnings as paid, updates totals**
7. **Table refreshs automatically**
8. **Seller gets email notification (if configured)**

---

For API details, see `SELLER_PAYOUT_GUIDE.md`
For quick setup, see `PAYOUT_QUICK_START.md`
