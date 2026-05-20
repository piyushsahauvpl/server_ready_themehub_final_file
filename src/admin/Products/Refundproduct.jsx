import React, { useState, useEffect } from 'react';
import {
  FiCheckCircle,
  FiXCircle,
  FiClock,
  FiLoader,
  FiDownload,
  FiAlertCircle,
  FiChevronDown,
  FiChevronUp,
} from 'react-icons/fi';
import MainLayout from "../components/MainLayout";

export default function AdminRefundDashboard() {
  const [refunds, setRefunds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedRefund, setExpandedRefund] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [statusFilter, setStatusFilter] = useState('requested');
  const [approvalNotes, setApprovalNotes] = useState({});
  const [rejectionReason, setRejectionReason] = useState({});

  const API_URL = process.env.REACT_APP_API_URL || "https://uptulathemehub.com/backend/api";

  // Fetch refunds
  useEffect(() => {
    fetchRefunds();
  }, [statusFilter]);

  const fetchRefunds = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `${API_URL}/refund-admin.php?status=${statusFilter}`,
        {
          credentials: 'include'
        }
      );

      const data = await response.json();

      if (data.success) {
        setRefunds(data.refunds);
      } else {
        alert('Failed to fetch refunds');
      }
    } catch (error) {
      console.error('Fetch error:', error);
      alert('Failed to fetch refunds');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (refundId) => {
    if (!window.confirm('Are you sure you want to approve this refund? This will trigger Razorpay refund and deduct seller earnings.')) {
      return;
    }

    setActionLoading(refundId);
    try {
      const formData = new FormData();
      formData.append('refund_id', refundId);
      formData.append('action', 'approve');
      formData.append('admin_notes', approvalNotes[refundId] || '');

      const response = await fetch(`${API_URL}/refund-admin.php`, {
        method: 'POST',
        credentials: 'include',
        body: formData
      });

      const data = await response.json();

      if (data.success) {
        alert('Refund approved successfully! Razorpay refund ID: ' + (data.razorpay_refund_id || 'Pending'));
        fetchRefunds();
        setApprovalNotes({});
      } else {
        alert('Error: ' + (data.message || 'Failed to approve refund'));
      }
    } catch (error) {
      console.error('Approval error:', error);
      alert('Failed to approve refund');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (refundId) => {
    const reason = rejectionReason[refundId];
    
    if (!reason || !reason.trim()) {
      alert('Please provide a rejection reason');
      return;
    }

    if (!window.confirm('Are you sure you want to reject this refund?')) {
      return;
    }

    setActionLoading(refundId);
    try {
      const formData = new FormData();
      formData.append('refund_id', refundId);
      formData.append('action', 'reject');
      formData.append('rejection_reason', reason);

      const response = await fetch(`${API_URL}/refund-admin.php`, {
        method: 'POST',
        credentials: 'include',
        body: formData
      });

      const data = await response.json();

      if (data.success) {
        alert('Refund rejected successfully');
        fetchRefunds();
        setRejectionReason({});
      } else {
        alert('Error: ' + (data.message || 'Failed to reject refund'));
      }
    } catch (error) {
      console.error('Rejection error:', error);
      alert('Failed to reject refund');
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      requested: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: FiClock },
      approved: { bg: 'bg-blue-100', text: 'text-blue-800', icon: FiCheckCircle },
      rejected: { bg: 'bg-red-100', text: 'text-red-800', icon: FiXCircle },
      refunded: { bg: 'bg-green-100', text: 'text-green-800', icon: FiCheckCircle }
    };

    const badge = badges[status] || badges.requested;
    const Icon = badge.icon;

    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${badge.bg} ${badge.text}`}>
        <Icon className="w-4 h-4" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  if (loading && refunds.length === 0) {
    return (
      <div className="text-center py-12">
        <FiLoader className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
        <p className="text-gray-600">Loading refunds...</p>
      </div>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Refund Approvals</h1>
        <button
          onClick={fetchRefunds}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          Refresh
        </button>
      </div>

      {/* Status Filter */}
      <div className="flex gap-2">
        {['requested', 'approved', 'rejected', 'refunded'].map(status => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              statusFilter === status
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      {/* Refunds List */}
      <div className="space-y-4">
        {refunds.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <p className="text-gray-600">No refunds found for this status</p>
          </div>
        ) : (
          refunds.map(refund => (
            <div key={refund.id} className="border border-gray-300 rounded-lg overflow-hidden bg-white">
              {/* Summary */}
              <div
                onClick={() => setExpandedRefund(expandedRefund === refund.id ? null : refund.id)}
                className="p-4 cursor-pointer hover:bg-gray-50 flex items-center justify-between"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-semibold text-gray-900">
                      Order #{refund.order_id} - {refund.product_name}
                    </span>
                    {getStatusBadge(refund.status)}
                  </div>
                  <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                    <span>Buyer: {refund.buyer_name} ({refund.buyer_email})</span>
                    <span>Amount: ₹{parseFloat(refund.amount).toFixed(2)}</span>
                    <span>Seller: {refund.seller_name}</span>
                  </div>
                </div>

                <div className="ml-4">
                  {expandedRefund === refund.id ? (
                    <FiChevronUp className="w-5 h-5 text-gray-400" />
                  ) : (
                    <FiChevronDown className="w-5 h-5 text-gray-400" />
                  )}
                </div>
              </div>

              {/* Expanded Details */}
              {expandedRefund === refund.id && (
                <div className="border-t border-gray-200 p-4 bg-gray-50 space-y-4">
                  {/* Refund Details */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Request Details</h4>
                      <div className="space-y-1 text-sm text-gray-700">
                        <p><strong>Reason:</strong> {refund.reason}</p>
                        <p><strong>Date:</strong> {new Date(refund.created_at).toLocaleString()}</p>
                        {refund.detailed_reason && (
                          <p><strong>Details:</strong> {refund.detailed_reason}</p>
                        )}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Seller Info</h4>
                      <div className="space-y-1 text-sm text-gray-700">
                        <p><strong>Name:</strong> {refund.seller_name}</p>
                        <p><strong>Email:</strong> {refund.seller_email}</p>
                      </div>
                    </div>
                  </div>

                  {/* Proof File */}
                  {refund.proof_file_path && (
                    <div className="p-3 bg-white rounded border border-gray-200">
                      <a
                        href={refund.proof_file_path}
                        download
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
                      >
                        <FiDownload className="w-4 h-4" />
                        Download Proof: {refund.proof_file_original_name}
                      </a>
                    </div>
                  )}

                  {/* Rejection Reason (if rejected) */}
                  {refund.status === 'rejected' && refund.rejection_reason && (
                    <div className="p-3 bg-red-50 rounded border border-red-200">
                      <p className="text-sm"><strong>Rejection Reason:</strong></p>
                      <p className="text-sm text-red-800">{refund.rejection_reason}</p>
                    </div>
                  )}

                  {/* Action Buttons */}
                  {refund.status === 'requested' && (
                    <div className="space-y-4 border-t border-gray-200 pt-4">
                      {/* Approval Notes */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Admin Notes (Optional)
                        </label>
                        <textarea
                          value={approvalNotes[refund.id] || ''}
                          onChange={(e) => setApprovalNotes({ ...approvalNotes, [refund.id]: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                          rows="2"
                          placeholder="Add any notes for your records..."
                        />
                      </div>

                      {/* Rejection Reason */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Rejection Reason (if rejecting)
                        </label>
                        <textarea
                          value={rejectionReason[refund.id] || ''}
                          onChange={(e) => setRejectionReason({ ...rejectionReason, [refund.id]: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                          rows="2"
                          placeholder="Provide reason if rejecting..."
                        />
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-3">
                        <button
                          onClick={() => handleApprove(refund.id)}
                          disabled={actionLoading === refund.id}
                          className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2 font-medium"
                        >
                          {actionLoading === refund.id ? (
                            <FiLoader className="w-4 h-4 animate-spin" />
                          ) : (
                            <FiCheckCircle className="w-4 h-4" />
                          )}
                          Approve & Process
                        </button>

                        <button
                          onClick={() => handleReject(refund.id)}
                          disabled={actionLoading === refund.id || !rejectionReason[refund.id]?.trim()}
                          className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2 font-medium"
                        >
                          {actionLoading === refund.id ? (
                            <FiLoader className="w-4 h-4 animate-spin" />
                          ) : (
                            <FiXCircle className="w-4 h-4" />
                          )}
                          Reject
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
      </div>
    </MainLayout>
  );
}