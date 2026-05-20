import React, { useEffect, useState } from 'react';
import { getAdminWithdrawRequests, postAdminWithdrawAction } from '../lib/apiClient';

export default function WithdrawRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadRequests = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getAdminWithdrawRequests();
      setRequests(data.requests || []);
    } catch (err) {
      setError(err.body?.message || err.message || 'Could not load withdraw requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const handleAction = async (action, requestId) => {
    setProcessing(requestId);
    setError('');
    setSuccess('');
    try {
      const result = await postAdminWithdrawAction(action, requestId, action === 'reject' ? 'Rejected by admin' : '');
      setSuccess(result.message || 'Action completed successfully');
      loadRequests();
    } catch (err) {
      setError(err.body?.message || err.message || 'Action failed');
    } finally {
      setProcessing(null);
    }
  };

  return (
    <div className="bg-gray-100 px-6 py-6">
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Withdraw Requests</h1>
          <p className="text-sm text-slate-600">Admin dashboard for pending and completed seller payouts.</p>
        </div>
      </div>

      {error && <div className="mb-4 rounded-xl bg-red-50 p-4 text-red-700">{error}</div>}
      {success && <div className="mb-4 rounded-xl bg-emerald-50 p-4 text-emerald-700">{success}</div>}

      <div className="overflow-hidden rounded-3xl border bg-white shadow-sm">
        <div className="grid gap-0 border-b border-slate-200 bg-slate-50 px-4 py-4 text-sm font-semibold text-slate-700 sm:grid-cols-[1fr_150px_180px_120px_140px]">
          <div>Seller</div>
          <div>Amount</div>
          <div>Status</div>
          <div>KYC</div>
          <div className="text-right">Actions</div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-500">Loading withdraw requests...</div>
        ) : requests.length === 0 ? (
          <div className="p-8 text-center text-slate-500">No withdraw requests found.</div>
        ) : (
          requests.map((request) => (
            <div key={request.id} className="grid gap-0 border-b border-slate-200 px-4 py-4 text-sm sm:grid-cols-[1fr_150px_180px_120px_140px]">
              <div>
                <div className="font-semibold">{request.business_name || request.full_name || `Seller ${request.seller_id}`}</div>
                <div className="text-xs text-slate-500">{request.email || request.user_email || ''}</div>
              </div>
              <div className="font-semibold">₹{request.amount.toFixed(2)}</div>
              <div>
                <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${request.status === 'paid' ? 'bg-emerald-100 text-emerald-700' : request.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                  {request.status}
                </span>
                {request.payout_id && <div className="mt-1 text-xs text-slate-500">{request.payout_id}</div>}
              </div>
              <div className="text-sm text-slate-700">{request.kyc_status || 'unknown'}</div>
              <div className="flex justify-end gap-2">
                <button
                  disabled={request.status !== 'pending' || processing === request.id}
                  onClick={() => handleAction('approve', request.id)}
                  className="rounded-xl bg-emerald-600 px-3 py-2 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  Approve
                </button>
                <button
                  disabled={request.status !== 'pending' || processing === request.id}
                  onClick={() => handleAction('reject', request.id)}
                  className="rounded-xl bg-red-600 px-3 py-2 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  Reject
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
