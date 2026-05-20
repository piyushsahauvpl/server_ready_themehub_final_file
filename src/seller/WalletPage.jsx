import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BiRupee } from 'react-icons/bi';
import { getSellerWallet, postWithdrawRequest, postSellerKyc } from '../lib/apiClient';
import Notifications from './Notifications';

export default function WalletPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [wallet, setWallet] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [withdrawRequests, setWithdrawRequests] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [kyc, setKyc] = useState(null);
  const [kycForm, setKycForm] = useState({ account_holder_name: '', account_number: '', ifsc: '', bank_name: '', pan: '', phone: '' });
  const [savingKyc, setSavingKyc] = useState(false);

  const canWithdraw = useMemo(() => wallet && wallet.available_balance > 0 && kyc?.status === 'verified', [wallet, kyc]);

  const loadData = async () => {
    setLoading(true);
    setError('');

    try {
      const data = await getSellerWallet();
      setWallet(data.wallet);
      setTransactions(data.transactions || []);
      setWithdrawRequests(data.withdraw_requests || []);
      setNotifications(data.notifications || []);
      setKyc(data.kyc || null);

      if (data.kyc?.details) {
        setKycForm({
          account_holder_name: data.kyc.details.account_holder_name || data.kyc.details.name || '',
          account_number: data.kyc.details.account_number || '',
          ifsc: data.kyc.details.ifsc || '',
          bank_name: data.kyc.details.bank_name || '',
          pan: data.kyc.details.pan || '',
          phone: data.kyc.details.phone || ''
        });
      }
    } catch (e) {
      setError(e.message || 'Failed to load wallet data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleWithdraw = async () => {
    setError('');
    setMessage('');

    if (!amount || Number(amount) <= 0) {
      setError('Enter a positive withdrawal amount');
      return;
    }

    try {
      const result = await postWithdrawRequest(Number(amount), 'Seller requested withdrawal');
      setMessage(result.message || 'Withdrawal requested successfully');
      setAmount('');
      loadData();
    } catch (err) {
      setError(err.body?.message || err.message || 'Withdrawal request failed');
    }
  };

  const handleKycSave = async (evt) => {
    evt.preventDefault();
    setError('');
    setMessage('');
    setSavingKyc(true);

    try {
      await postSellerKyc(kycForm);
      setMessage('KYC details submitted. Await admin verification.');
      loadData();
    } catch (err) {
      setError(err.body?.message || err.message || 'Failed to save KYC details');
    } finally {
      setSavingKyc(false);
    }
  };

  return (
    <div className="bg-gray-100 px-6 py-4 space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Seller Wallet</h1>
          <p className="text-sm text-gray-600">Manage your earnings, withdrawals, and payout notifications.</p>
        </div>
        <button
          onClick={() => navigate('/seller/dashboard')}
          className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
        >
          Back to dashboard
        </button>
      </div>

      {loading ? (
        <div className="rounded-xl bg-white p-8 text-center text-gray-500">Loading wallet data...</div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border bg-white p-5">
              <p className="text-sm text-gray-500">Wallet Balance</p>
              <p className="mt-3 text-3xl font-semibold text-emerald-700">₹{wallet?.balance?.toFixed(2) ?? '0.00'}</p>
            </div>
            <div className="rounded-2xl border bg-white p-5">
              <p className="text-sm text-gray-500">Total Earnings</p>
              <p className="mt-3 text-xl font-semibold">₹{wallet?.total_earnings?.toFixed(2) ?? '0.00'}</p>
            </div>
            <div className="rounded-2xl border bg-white p-5">
              <p className="text-sm text-gray-500">Pending Earnings</p>
              <p className="mt-3 text-xl font-semibold">₹{wallet?.pending_earnings?.toFixed(2) ?? '0.00'}</p>
            </div>
          </div>

          <div className="grid gap-4 xl:grid-cols-3">
            <div className="col-span-2 space-y-4">
              <div className="rounded-3xl border bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-semibold">Withdraw Funds</h2>
                    <p className="text-sm text-gray-500">Available balance: ₹{wallet?.available_balance?.toFixed(2) ?? '0.00'}</p>
                  </div>
                  <div className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-600">
                    {wallet?.available_balance >= 0 ? 'Available' : 'Unavailable'}
                  </div>
                </div>
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="text-sm font-medium text-slate-700">Withdrawal Amount</label>
                    <div className="mt-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                      <div className="flex items-center gap-2 text-slate-900">
                        <BiRupee className="h-5 w-5" />
                        <input
                          type="number"
                          value={amount}
                          onChange={(event) => setAmount(event.target.value)}
                          className="w-full bg-transparent text-lg font-semibold outline-none"
                          placeholder="Enter amount"
                          min="0"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="flex items-end">
                    <button
                      disabled={!canWithdraw || loading}
                      onClick={handleWithdraw}
                      className="w-full rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                    >
                      Request Withdrawal
                    </button>
                  </div>
                </div>
                <p className="mt-3 text-sm text-gray-500">Withdrawal requests require verified KYC and sufficient available balance.</p>
                {kyc?.status !== 'verified' && (
                  <div className="mt-3 rounded-xl bg-yellow-50 p-3 text-sm text-yellow-700">Your KYC must be approved by admin before withdrawals can be submitted.</div>
                )}
                {message && <div className="mt-4 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700">{message}</div>}
                {error && <div className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</div>}
              </div>

              <div className="rounded-3xl border bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold">Withdrawal History</h2>
                    <p className="text-sm text-gray-500">Recent withdrawal requests and payout status.</p>
                  </div>
                </div>
                <div className="mt-5 space-y-3">
                  {withdrawRequests.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">No withdrawal requests yet.</div>
                  ) : (
                    withdrawRequests.map((item) => (
                      <div key={item.id} className="rounded-2xl border border-slate-200 p-4">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <p className="font-semibold">₹{item.amount.toFixed(2)}</p>
                            <p className="text-sm text-slate-500">Requested on {new Date(item.requested_at).toLocaleDateString()}</p>
                          </div>
                          <div className="rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white" style={{ backgroundColor: item.status === 'paid' ? '#16a34a' : item.status === 'pending' ? '#eab308' : '#ef4444' }}>
                            {item.status}
                          </div>
                        </div>
                        {item.failure_reason && <p className="mt-3 text-sm text-red-600">Failure: {item.failure_reason}</p>}
                        {item.reason && <p className="mt-1 text-sm text-slate-600">Admin note: {item.reason}</p>}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-3xl border bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold">KYC Status</h2>
                    <p className="text-sm text-gray-500">Your bank details and verification status.</p>
                  </div>
                  <span className="text-xs uppercase tracking-wide text-slate-500">{kyc?.status || 'Not submitted'}</span>
                </div>
                <div className="mt-5 space-y-3">
                  <div className="grid gap-3">
                    <label className="block text-sm font-medium text-slate-700">Account holder name</label>
                    <input
                      value={kycForm.account_holder_name}
                      onChange={(e) => setKycForm((prev) => ({ ...prev, account_holder_name: e.target.value }))}
                      className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 w-full"
                      placeholder="Account holder name"
                    />
                  </div>
                  <div className="grid gap-3">
                    <label className="block text-sm font-medium text-slate-700">Account number</label>
                    <input
                      value={kycForm.account_number}
                      onChange={(e) => setKycForm((prev) => ({ ...prev, account_number: e.target.value }))}
                      className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 w-full"
                      placeholder="Account number"
                    />
                  </div>
                  <div className="grid gap-3">
                    <label className="block text-sm font-medium text-slate-700">IFSC</label>
                    <input
                      value={kycForm.ifsc}
                      onChange={(e) => setKycForm((prev) => ({ ...prev, ifsc: e.target.value }))}
                      className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 w-full"
                      placeholder="IFSC code"
                    />
                  </div>
                  <div className="grid gap-3">
                    <label className="block text-sm font-medium text-slate-700">Bank name</label>
                    <input
                      value={kycForm.bank_name}
                      onChange={(e) => setKycForm((prev) => ({ ...prev, bank_name: e.target.value }))}
                      className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 w-full"
                      placeholder="Bank name"
                    />
                  </div>
                  <div className="grid gap-3">
                    <label className="block text-sm font-medium text-slate-700">PAN</label>
                    <input
                      value={kycForm.pan}
                      onChange={(e) => setKycForm((prev) => ({ ...prev, pan: e.target.value }))}
                      className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 w-full"
                      placeholder="PAN (optional)"
                    />
                  </div>
                  <div className="grid gap-3">
                    <label className="block text-sm font-medium text-slate-700">Phone</label>
                    <input
                      value={kycForm.phone}
                      onChange={(e) => setKycForm((prev) => ({ ...prev, phone: e.target.value }))}
                      className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 w-full"
                      placeholder="Phone number"
                    />
                  </div>
                  <button
                    onClick={handleKycSave}
                    disabled={savingKyc}
                    className="mt-3 w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
                  >
                    {savingKyc ? 'Saving...' : 'Save KYC Details'}
                  </button>
                </div>
              </div>

              <Notifications notifications={notifications} />
            </div>
          </div>

          <div className="rounded-3xl border bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold mb-4">Transaction History</h2>
            <div className="space-y-3">
              {transactions.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">No wallet activity yet.</div>
              ) : (
                transactions.map((item) => (
                  <div key={item.id} className="grid gap-3 rounded-2xl border border-slate-200 p-4 sm:grid-cols-[1fr_120px]">
                    <div>
                      <p className="font-semibold capitalize">{item.type} • {item.reference_type.replace('_', ' ')}</p>
                      <p className="text-sm text-slate-500">{item.note}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">₹{item.amount.toFixed(2)}</p>
                      <p className="text-xs text-slate-500">Balance ₹{item.balance_after.toFixed(2)}</p>
                    </div>
                    <div className="text-xs text-slate-400 sm:col-span-2">{new Date(item.created_at).toLocaleString()}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
