
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import MainLayout from './components/MainLayout';
import { getAdminWalletSummary } from '../lib/apiClient';

const WalletDashboard = () => {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    fetchSummary();
  }, []);

  const fetchSummary = async () => {
    try {
      setError('');
      setLoading(true);
      const response = await getAdminWalletSummary();
      if (response.success) {
        setSummary(response.summary);
        setLastUpdated(new Date());
      } else {
        setError(response.message || 'Failed to load wallet summary.');
      }
    } catch (err) {
      setError('Error loading wallet summary.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchSummary();
    setRefreshing(false);
  };

  const formatCurrency = (amount = 0) => {
    const value = Number(amount || 0);
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2
    }).format(value);
  };

  const formatNumber = (value = 0) => Number(value || 0).toLocaleString();

  return (
    <MainLayout>
      <div className="space-y-6 p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Wallet Management Dashboard</h1>
            <p className="text-sm text-gray-600 mt-1">
              Monitor platform wallet balance, seller wallets, withdrawal status, and payout activity in one unified view.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleRefresh}
              disabled={loading || refreshing}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition disabled:cursor-not-allowed disabled:opacity-60"
            >
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </button>
            {lastUpdated && (
              <span className="text-xs text-gray-500">Updated {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            )}
          </div>
        </div>

        {loading ? (
          <div className="rounded-3xl border border-dashed border-gray-200 bg-white p-10 text-center text-gray-600">Loading wallet data...</div>
        ) : error ? (
          <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-red-700">{error}</div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
              <SummaryCard title="Platform Balance" value={formatCurrency(summary.total_platform_balance)} subtitle="Total commission held" color="green" />
              <SummaryCard title="Seller Wallets" value={formatCurrency(summary.total_seller_wallet_balance)} subtitle="Total seller balances" color="blue" />
              <SummaryCard title="Total Withdrawn" value={formatCurrency(summary.total_withdrawn_amount)} subtitle="Paid out to sellers" color="orange" />
              <SummaryCard title="Pending Withdrawals" value={formatCurrency(summary.total_pending_withdrawals)} subtitle="Requests awaiting approval" color="yellow" />
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-gray-900">Seller & Commission Metrics</h2>
                <div className="mt-6 space-y-4">
                  <MetricRow label="Total Sellers" value={formatNumber(summary.total_sellers)} />
                  <MetricRow label="Active Sellers" value={formatNumber(summary.active_sellers)} />
                  <MetricRow label="Commission Earned" value={formatCurrency(summary.total_commission_earned)} />
                  <MetricRow label="Sellers with Pending Withdrawals" value={formatNumber(summary.sellers_with_pending_withdrawals)} />
                </div>
              </div>

              <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">Quick Wallet Actions</h2>
                </div>
                <div className="mt-6 grid gap-4">
                  <ActionLink to="/admin/seller-wallets" title="Seller Wallets" description="Manage seller balances" colorClasses="from-blue-500 to-blue-600" />
                  <ActionLink to="/admin/withdraw-requests" title="Withdraw Requests" description="Approve or reject payouts" colorClasses="from-orange-500 to-orange-600" />
                  <ActionLink to="/admin/wallet-transactions" title="Wallet Transactions" description="View all wallet activity" colorClasses="from-purple-500 to-purple-600" />
                  <ActionLink to="/admin/payout-history" title="Payout History" description="Track completed payouts" colorClasses="from-green-500 to-green-600" />
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </MainLayout>
  );
};

const SummaryCard = ({ title, value, subtitle, color }) => {
  const colors = {
    green: 'bg-green-50 text-green-700',
    blue: 'bg-blue-50 text-blue-700',
    orange: 'bg-orange-50 text-orange-700',
    yellow: 'bg-yellow-50 text-yellow-700'
  };

  return (
    <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
      <div className={`inline-flex rounded-2xl px-3 py-2 text-xs font-semibold ${colors[color]}`}>{title}</div>
      <div className="mt-5 text-3xl font-semibold text-gray-900">{value}</div>
      <p className="mt-2 text-sm text-gray-500">{subtitle}</p>
    </div>
  );
};

const MetricRow = ({ label, value }) => (
  <div className="flex items-center justify-between rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3">
    <span className="text-sm text-gray-600">{label}</span>
    <span className="text-sm font-semibold text-gray-900">{value}</span>
  </div>
);

const ActionLink = ({ to, title, description, colorClasses }) => (
  <Link
    to={to}
    className={`block rounded-3xl px-5 py-5 text-white shadow-sm transition hover:opacity-95 bg-gradient-to-r ${colorClasses}`}
  >
    <div className="text-base font-semibold">{title}</div>
    <div className="mt-2 text-sm opacity-90">{description}</div>
  </Link>
);

export default WalletDashboard;
