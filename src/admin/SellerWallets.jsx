import React, { useState, useEffect } from 'react';
import { getAdminSellerWallets, getAdminSellerKycDetails, postAdminSellerKycAction } from '../lib/apiClient';

const SellerWallets = () => {
  const [sellers, setSellers] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [selectedSeller, setSelectedSeller] = useState(null);
  const [selectedSellerKyc, setSelectedSellerKyc] = useState(null);
  const [kycModalOpen, setKycModalOpen] = useState(false);
  const [kycLoading, setKycLoading] = useState(false);
  const [kycProcessing, setKycProcessing] = useState(false);
  const [kycActionError, setKycActionError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetchSellers();
  }, [search, status, currentPage]);

  const fetchSellers = async () => {
    try {
      setLoading(true);
      const response = await getAdminSellerWallets(search, status, currentPage, 20);
      if (response.success) {
        setSellers(response.sellers);
        setPagination(response.pagination);
      } else {
        setError(response.message || 'Failed to load sellers');
      }
    } catch (err) {
      setError('Error loading sellers');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchSellers();
  };

  const handleStatusChange = (newStatus) => {
    setStatus(newStatus);
    setCurrentPage(1);
  };

  const openKycModal = async (seller) => {
    setSelectedSeller(seller);
    setKycModalOpen(true);
    setSelectedSellerKyc(null);
    setKycActionError('');
    setKycLoading(true);

    try {
      const data = await getAdminSellerKycDetails(seller.id);
      if (data.success) {
        setSelectedSellerKyc(data.seller);
      } else {
        setKycActionError(data.message || 'Unable to load KYC details');
      }
    } catch (err) {
      setKycActionError(err.body?.message || err.message || 'Unable to load KYC details');
    } finally {
      setKycLoading(false);
    }
  };

  const closeKycModal = () => {
    setKycModalOpen(false);
    setSelectedSeller(null);
    setSelectedSellerKyc(null);
    setKycActionError('');
  };

  const handleKycAction = async (action) => {
    if (!selectedSeller) return;
    setKycProcessing(true);
    setKycActionError('');

    try {
      const result = await postAdminSellerKycAction(action, selectedSeller.id, action === 'reject' ? 'Rejected by admin' : '');
      if (result.success) {
        closeKycModal();
        fetchSellers();
      } else {
        setKycActionError(result.message || 'Failed to perform action');
      }
    } catch (err) {
      setKycActionError(err.body?.message || err.message || 'Failed to perform action');
    } finally {
      setKycProcessing(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const getStatusBadge = (sellerStatus) => {
    const statusClasses = {
      active: 'bg-green-100 text-green-800',
      suspended: 'bg-red-100 text-red-800',
      inactive: 'bg-gray-100 text-gray-800'
    };
    return statusClasses[sellerStatus] || 'bg-gray-100 text-gray-800';
  };

  const getKycBadge = (kycStatus) => {
    const statusClasses = {
      verified: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      rejected: 'bg-red-100 text-red-800',
      not_submitted: 'bg-gray-100 text-gray-800'
    };
    return statusClasses[kycStatus] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center">Loading seller wallets...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Seller Wallets</h1>
        <p className="text-gray-600">Manage and monitor seller wallet balances and activities</p>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <form onSubmit={handleSearch} className="flex-1">
            <div className="relative">
              <input
                type="text"
                placeholder="Search by name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          </form>

          <div className="flex gap-2">
            <button
              onClick={() => handleStatusChange('')}
              className={`px-4 py-2 rounded-lg ${status === '' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
            >
              All
            </button>
            <button
              onClick={() => handleStatusChange('active')}
              className={`px-4 py-2 rounded-lg ${status === 'active' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
            >
              Active
            </button>
            <button
              onClick={() => handleStatusChange('inactive')}
              className={`px-4 py-2 rounded-lg ${status === 'inactive' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
            >
              Inactive
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Seller
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Wallet Balance
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Earnings
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Withdrawn
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pending Withdrawal
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  KYC Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sellers.map((seller) => (
                <tr key={seller.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {seller.business_name || seller.full_name}
                      </div>
                      <div className="text-sm text-gray-500">{seller.email}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(seller.seller_status)}`}>
                      {seller.seller_status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrency(seller.wallet_balance)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrency(seller.total_earnings)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrency(seller.total_withdrawn)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrency(seller.pending_withdrawal_amount)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getKycBadge(seller.kyc_status)}`}>
                      {seller.kyc_status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <button
                      onClick={() => openKycModal(seller)}
                      className="inline-flex items-center rounded-xl bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-700"
                    >
                      Review KYC
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {sellers.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500">No sellers found</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {kycModalOpen && selectedSeller && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <div>
                <h2 className="text-xl font-semibold">Seller KYC Review</h2>
                <p className="text-sm text-slate-500">{selectedSeller.business_name || selectedSeller.full_name}</p>
              </div>
              <button onClick={closeKycModal} className="rounded-full bg-slate-100 px-3 py-2 text-sm text-slate-700 hover:bg-slate-200">
                Close
              </button>
            </div>
            <div className="space-y-4 px-6 py-5">
              {kycLoading ? (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-center text-slate-500">Loading KYC details...</div>
              ) : selectedSellerKyc ? (
                <>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <p className="text-sm text-slate-500">KYC Status</p>
                      <p className="text-base font-semibold capitalize">{selectedSellerKyc.kyc_status.replace('_', ' ')}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">Wallet Balance</p>
                      <p className="text-base font-semibold">{formatCurrency(selectedSellerKyc.wallet_balance)}</p>
                    </div>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <h3 className="text-sm font-semibold text-slate-700">Bank Details</h3>
                    {selectedSellerKyc.details ? (
                      <div className="mt-3 space-y-2 text-sm text-slate-700">
                        <div><span className="font-semibold">Account holder:</span> {selectedSellerKyc.details.account_holder_name || '—'}</div>
                        <div><span className="font-semibold">Account number:</span> {selectedSellerKyc.details.account_number || '—'}</div>
                        <div><span className="font-semibold">IFSC:</span> {selectedSellerKyc.details.ifsc || '—'}</div>
                        <div><span className="font-semibold">Bank name:</span> {selectedSellerKyc.details.bank_name || '—'}</div>
                        <div><span className="font-semibold">PAN:</span> {selectedSellerKyc.details.pan || '—'}</div>
                        <div><span className="font-semibold">Phone:</span> {selectedSellerKyc.details.phone || '—'}</div>
                      </div>
                    ) : (
                      <p className="text-sm text-slate-500">No KYC details available.</p>
                    )}
                  </div>
                  {kycActionError && <div className="rounded-xl bg-rose-50 p-4 text-sm text-rose-700">{kycActionError}</div>}
                  <div className="flex flex-wrap gap-3">
                    <button
                      disabled={kycProcessing || selectedSellerKyc.kyc_status === 'verified'}
                      onClick={() => handleKycAction('approve')}
                      className="rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300"
                    >
                      {kycProcessing ? 'Processing...' : 'Approve KYC'}
                    </button>
                    <button
                      disabled={kycProcessing || selectedSellerKyc.kyc_status === 'rejected'}
                      onClick={() => handleKycAction('reject')}
                      className="rounded-2xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:cursor-not-allowed disabled:bg-rose-300"
                    >
                      {kycProcessing ? 'Processing...' : 'Reject KYC'}
                    </button>
                  </div>
                </>
              ) : (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-center text-slate-500">Seller KYC details are unavailable.</div>
              )}
            </div>
          </div>
        </div>
      )}

      {pagination.total_pages > 1 && (
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6 mt-4 rounded-lg shadow">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage(Math.min(pagination.total_pages, currentPage + 1))}
              disabled={currentPage === pagination.total_pages}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing <span className="font-medium">{((currentPage - 1) * pagination.limit) + 1}</span> to{' '}
                <span className="font-medium">{Math.min(currentPage * pagination.limit, pagination.total)}</span> of{' '}
                <span className="font-medium">{pagination.total}</span> results
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                >
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </button>
                <button
                  onClick={() => setCurrentPage(Math.min(pagination.total_pages, currentPage + 1))}
                  disabled={currentPage === pagination.total_pages}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                >
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SellerWallets;