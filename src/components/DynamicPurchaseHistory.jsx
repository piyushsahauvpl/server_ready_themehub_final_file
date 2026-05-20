import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiDownload,
  FiFileText,
  FiStar,
  FiLoader,
  FiCalendar,
  FiPackage,
  FiRefreshCw,
  FiMessageCircle,
  FiAlertCircle,
  FiCheckCircle,
  FiXCircle,
  FiClock,
} from 'react-icons/fi';
import { getTemplateUrl } from '../lib/slug';
import ReviewModal from './ReviewModal';

/**
 * DynamicPurchaseHistory Component
 * Reusable component for both user profile and seller dashboard
 * 
 * Props:
 * - purchases: Array of purchase objects
 * - loading: Boolean indicating if data is loading
 * - onRefresh: Callback function to refresh data
 * - variant: 'compact' (dashboard) or 'full' (full page)
 */
export default function DynamicPurchaseHistory({ 
  purchases = [], 
  loading = false, 
  onRefresh = null,
  variant = 'compact' 
}) {
  const navigate = useNavigate();
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [userReviews, setUserReviews] = useState({});
  const [refundModalOpen, setRefundModalOpen] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState(null);
  /*
  const [messageModalOpen, setMessageModalOpen] = useState(false);
  const [refundReason, setRefundReason] = useState('');
  const [messageText, setMessageText] = useState('');
  const [refundLoading, setRefundLoading] = useState(false);
  const [messageLoading, setMessageLoading] = useState(false);
  const [messages, setMessages] = useState([]);
  const [proofFile, setProofFile] = useState(null);
  */

  const handleDownload = async (purchase) => {
    try {
      if (!purchase.product_id) {
        alert('Product ID not found. Cannot download.');
        return;
      }

      const API_URL = 
        process.env.REACT_APP_API_URL || 
        "https://uptulathemehub.com/backend/api";

      // Call backend API with product_id as query parameter
      const downloadUrl = `${API_URL}/download.php?product_id=${purchase.product_id}`;

      console.log('Download initiated for product:', purchase.product_id);
      console.log('Download URL:', downloadUrl);

      // Fetch the file first to check if it's successful
      const response = await fetch(downloadUrl, {
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        alert(errorData.message || `Download failed with status ${response.status}`);
        return;
      }

      // Get the blob and filename from Content-Disposition header
      const blob = await response.blob();
      const contentDisposition = response.headers.get('content-disposition') || '';
      const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
      const filename = filenameMatch ? filenameMatch[1] : purchase.product_name || `template-${purchase.product_id}`;

      // Create blob URL and trigger download
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      link.style.display = 'none';
      document.body.appendChild(link);
      
      link.click();
      
      // Clean up
      setTimeout(() => {
        window.URL.revokeObjectURL(blobUrl);
        document.body.removeChild(link);
      }, 100);

    } catch (err) {
      console.error('Download error:', err);
      alert('Failed to download file. Please try again.');
    }
  };

  const handleInvoiceDownload = (purchase) => {
    try {
      if (!purchase.id || !purchase.product_name) {
        alert('Cannot download invoice. Missing order information.');
        return;
      }

      const invoiceNumber = purchase.invoice_number || `INV-${new Date(purchase.created_at || Date.now()).getFullYear()}-${String(purchase.id || Math.floor(Math.random() * 999999)).padStart(6, "0")}`;
      const statusLabel = purchase.status === "completed" ? "Paid" : purchase.status === "refunded" ? "Refunded" : purchase.status || "Pending";
      const paymentOrderId = purchase.razorpay_order_id || purchase.order_id || purchase.payment_order_id || "N/A";
      const paymentId = purchase.razorpay_payment_id || purchase.payment_id || purchase.transaction_id || "N/A";
      const subtotal = purchase.subtotal != null ? parseFloat(purchase.subtotal) : null;
      const taxRate = purchase.tax_rate != null ? parseFloat(purchase.tax_rate) : 18;
      const totalAmount = parseFloat(purchase.amount || 0);
      const taxAmount = purchase.tax_amount != null
        ? parseFloat(purchase.tax_amount)
        : subtotal != null
          ? parseFloat((subtotal * (taxRate / 100)).toFixed(2))
          : parseFloat(((totalAmount * taxRate) / (100 + taxRate)).toFixed(2));
      const calculatedSubtotal = subtotal != null
        ? subtotal
        : parseFloat((totalAmount - taxAmount).toFixed(2));
      const sellerName = purchase.seller_name || "Theme Hub Marketplace";
      const sellerEmail = purchase.seller_email || "support@themehub.local";
      const sellerPhone = purchase.seller_phone || "+91 98765 43210";
      const sellerAddress = purchase.seller_address || "12 Business Park, Lower Parel, Mumbai, India";
      const invoiceTitle = purchase.product_name || "Template";

      // Create enhanced invoice HTML
      const invoiceHTML = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>Invoice - ${invoiceTitle}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; max-width: 900px; margin: 0 auto; color: #333; background: #f8f9fb; }
            .container { background: #fff; padding: 32px; border-radius: 12px; box-shadow: rgba(15, 23, 42, 0.08) 0px 4px 24px; }
            .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 4px solid #04733c; padding-bottom: 16px; margin-bottom: 24px; }
            .header h1 { margin: 0; font-size: 28px; color: #04733c; letter-spacing: 1px; }
            .header .company { text-align: right; font-size: 14px; line-height: 1.6; color: #555; }
            .section { display: flex; gap: 24px; flex-wrap: wrap; margin-bottom: 28px; }
            .card { flex: 1; min-width: 250px; background: #f4f7fb; padding: 18px; border-radius: 10px; }
            .card h3 { margin-top: 0; margin-bottom: 10px; font-size: 16px; color: #1f2937; }
            .card p { margin: 6px 0; font-size: 14px; color: #4b5563; }
            .card p strong { color: #111827; }
            .status-pill { display: inline-flex; align-items: center; padding: 6px 12px; border-radius: 9999px; font-weight: 600; font-size: 13px; }
            .status-paid { background: #dcfce7; color: #166534; }
            .status-refunded { background: #fee2e2; color: #991b1b; }
            .status-pending { background: #fef3c7; color: #92400e; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            th, td { padding: 14px 16px; border-bottom: 1px solid #e5e7eb; text-align: left; }
            th { background: #04733c; color: #fff; font-weight: 600; }
            .summary-row td { border-top: 2px solid #e5e7eb; }
            .summary-row strong { color: #111827; }
            .footer { margin-top: 34px; padding-top: 22px; border-top: 1px solid #e5e7eb; display: grid; gap: 16px; font-size: 13px; color: #525252; }
            .footer strong { color: #111827; }
            .footer .policy { background: #f8fafc; padding: 16px; border-radius: 10px; border: 1px solid #e5e7eb; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div>
                <h1>INVOICE</h1>
                <p style="margin: 8px 0 0; font-size: 14px; color: #4b5563;">Invoice #: ${invoiceNumber}</p>
                <p style="margin: 4px 0 0; font-size: 14px; color: #4b5563;">Date: ${new Date(purchase.created_at || Date.now()).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>
              </div>
              <div class="company">
                <p><strong>Theme Hub Pvt. Ltd.</strong></p>
                <p>GSTIN: 27AAAAA0000A1Z5</p>
                <p>12 Business Park</p>
                <p>Lower Parel, Mumbai, India</p>
                <p>support@themehub.local</p>
              </div>
            </div>

            <div class="section">
              <div class="card">
                <h3>Buyer Details</h3>
                <p><strong>Name:</strong> Customer</p>
                <p><strong>Email:</strong> Registered Email</p>
              </div>
              <div class="card">
                <h3>Seller Details</h3>
                <p><strong>${sellerName}</strong></p>
                <p>${sellerAddress}</p>
                <p><strong>Email:</strong> ${sellerEmail}</p>
                <p><strong>Phone:</strong> ${sellerPhone}</p>
              </div>
              <div class="card">
                <h3>Payment Details</h3>
                <p><strong>Status:</strong> <span class="status-pill ${statusLabel === "Paid" ? "status-paid" : statusLabel === "Refunded" ? "status-refunded" : "status-pending"}">${statusLabel}</span></p>
                <p><strong>Payment ID:</strong> ${paymentId}</p>
                <p><strong>Order ID:</strong> ${paymentOrderId}</p>
                ${purchase.payment_method ? `<p><strong>Method:</strong> ${purchase.payment_method}</p>` : ""}
              </div>
            </div>

            <table>
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Product ID</th>
                  <th>Price</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>${invoiceTitle}</td>
                  <td>#${purchase.product_id || "N/A"}</td>
                  <td>₹${totalAmount.toFixed(2)}</td>
                </tr>
              </tbody>
              <tfoot>
                <tr>
                  <td></td>
                  <td><strong>Subtotal</strong></td>
                  <td><strong>₹${calculatedSubtotal.toFixed(2)}</strong></td>
                </tr>
                <tr>
                  <td></td>
                  <td><strong>GST (${taxRate.toFixed(0)}%)</strong></td>
                  <td><strong>₹${taxAmount.toFixed(2)}</strong></td>
                </tr>
                <tr class="summary-row">
                  <td></td>
                  <td><strong>Total</strong></td>
                  <td><strong>₹${totalAmount.toFixed(2)}</strong></td>
                </tr>
              </tfoot>
            </table>

            <div class="footer">
              <div>
                <p><strong>Refund Policy</strong></p>
                <div class="policy">
                  <p>Refunds are available only for defective or undelivered products and must be requested within 7 business days from delivery. Change-of-mind requests are not eligible.</p>
                  <p>To request a refund, contact our support team with your order details. Refunds are processed after verification and may take 5-7 business days.</p>
                </div>
              </div>
              <div>
                <p><strong>Company Details</strong></p>
                <p>Theme Hub Pvt. Ltd.</p>
                <p>12 Business Park, Lower Parel, Mumbai, India</p>
                <p>GSTIN: 27AAAAA0000A1Z5</p>
                <p>support@themehub.local | +91 98765 43210</p>
              </div>
              <div>
                <p><strong>Notes</strong></p>
                <p>This invoice is generated electronically and does not require a physical signature. Keep a copy for your records.</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `;

      // Convert HTML to blob and download
      const blob = new Blob([invoiceHTML], { type: 'text/html' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice-${invoiceNumber}-${invoiceTitle.replace(/\s+/g, "-").toLowerCase()}.html`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Invoice download error:', err);
      alert('Failed to download invoice. Please try again.');
    }
  };;

  const handleReview = (product) => {
    if (!product.product_id) {
      alert('Cannot review this product. Product ID is missing.');
      return;
    }
    setSelectedProduct(product);
    setReviewModalOpen(true);
  };

  const handleReviewSubmitted = () => {
    setReviewModalOpen(false);
    setSelectedProduct(null);
    if (onRefresh) {
      onRefresh();
    }
  };

  /*
  const handleRefundRequest = async (purchase) => {
    if (!refundReason.trim()) {
      alert('Please provide a reason for the refund request.');
      return;
    }

    // Check for invalid reasons
    const invalidReasons = ['change of mind', 'changed my mind', 'no longer want', 'just browsing'];
    const reasonLower = refundReason.toLowerCase();
    
    for (let invalid of invalidReasons) {
      if (reasonLower.includes(invalid)) {
        alert('Refunds are not allowed for "change of mind". Please contact seller support if you have concerns.');
        return;
      }
    }

    setRefundLoading(true);
    try {
      const API_URL = process.env.REACT_APP_API_URL || "https://uptulathemehub.com/backend/api";

      const formData = new FormData();
      formData.append('order_id', purchase.id);
      formData.append('reason', refundReason);
      formData.append('detailed_reason', refundReason);
      
      if (proofFile) {
        formData.append('proof_file', proofFile);
      }

      const response = await fetch(`${API_URL}/refund-request.php`, {
        method: 'POST',
        credentials: 'include',
        body: formData
      });

      const data = await response.json();

      if (response.status === 400 && data.requires_seller_contact) {
        alert(data.message);
        setRefundModalOpen(false);
        setRefundReason('');
        setProofFile(null);
        setSelectedPurchase(null);
        // Open message modal instead
        setTimeout(() => {
          openMessageModal(purchase);
        }, 500);
      } else if (data.success) {
        alert(data.message);
        setRefundModalOpen(false);
        setRefundReason('');
        setProofFile(null);
        setSelectedPurchase(null);
        if (onRefresh) {
          onRefresh();
        }
      } else {
        alert(data.message || 'Failed to submit refund request.');
      }
    } catch (error) {
      console.error('Refund request error:', error);
      alert('Failed to submit refund request. Please try again.');
    } finally {
      setRefundLoading(false);
    }
  };

  const handleSendMessage = async (purchase) => {
    if (!messageText.trim()) {
      alert('Please enter a message.');
      return;
    }

    setMessageLoading(true);
    try {
      const API_URL = process.env.REACT_APP_API_URL || "https://uptulathemehub.com/backend/api";

      const formData = new FormData();
      formData.append('order_id', purchase.id);
      formData.append('message', messageText);

      const response = await fetch(`${API_URL}/buyer-messages.php`, {
        method: 'POST',
        credentials: 'include',
        body: formData
      });

      const data = await response.json();

      if (data.success) {
        alert('Message sent successfully!');
        setMessageText('');
        // Refresh messages
        loadMessages(purchase.id);
      } else {
        alert(data.message || 'Failed to send message.');
      }
    } catch (error) {
      console.error('Send message error:', error);
      alert('Failed to send message. Please try again.');
    } finally {
      setMessageLoading(false);
    }
  };

  const loadMessages = async (orderId) => {
    try {
      const API_URL = process.env.REACT_APP_API_URL || "https://uptulathemehub.com/backend/api";

      const response = await fetch(`${API_URL}/buyer-messages.php?order_id=${orderId}`, {
        credentials: 'include'
      });

      const data = await response.json();

      if (data.success) {
        setMessages(data.messages || []);
      }
    } catch (error) {
      console.error('Load messages error:', error);
    }
  };
  */

  const openRefundModal = (purchase) => {
    setSelectedPurchase(purchase);
    setRefundModalOpen(true);
  };

  /*
  const openMessageModal = (purchase) => {
    setSelectedPurchase(purchase);
    setMessageModalOpen(true);
    loadMessages(purchase.id);
  };
  */

  const getStatusDisplay = (purchase) => {
    const status = purchase.status;
    const refundStatus = purchase.refund_status;

    if (refundStatus === 'refunded') {
      return { text: 'Refunded', color: 'bg-red-100 text-red-700', icon: FiXCircle };
    } else if (refundStatus === 'requested') {
      return { text: 'Refund Requested', color: 'bg-yellow-100 text-yellow-700', icon: FiClock };
    } else if (refundStatus === 'approved') {
      return { text: 'Refund Approved', color: 'bg-blue-100 text-blue-700', icon: FiCheckCircle };
    } else if (refundStatus === 'rejected') {
      return { text: 'Refund Rejected', color: 'bg-red-100 text-red-700', icon: FiXCircle };
    } else if (status === 'completed') {
      return { text: 'Paid', color: 'bg-green-100 text-green-700', icon: FiCheckCircle };
    } else if (status === 'failed') {
      return { text: 'Failed', color: 'bg-red-100 text-red-700', icon: FiXCircle };
    } else {
      return { text: status || 'Pending', color: 'bg-yellow-100 text-yellow-700', icon: FiClock };
    }
  };

  const canDownload = (purchase) => {
    return purchase.status === 'completed' && purchase.refund_status !== 'refunded';
  };

  if (loading) {
    return (
      <div className={variant === 'full' ? 'text-center py-12' : 'text-center py-8'}>
        <FiLoader className={`w-8 h-8 animate-spin text-green-600 mx-auto mb-4 ${variant === 'compact' ? 'w-6 h-6' : ''}`} />
        <p className="text-gray-600">Loading purchases...</p>
      </div>
    );
  }

  if (purchases.length === 0) {
    return (
      <div className={variant === 'full' ? 'text-center py-12' : 'text-center py-8'}>
        <FiPackage className={`w-16 h-16 text-gray-300 mx-auto mb-4 ${variant === 'compact' ? 'w-12 h-12' : ''}`} />
        <p className="text-gray-600 font-medium">
          No purchases yet
        </p>
        <p className="text-gray-500 text-sm mt-2">
          Start shopping to see your purchase history here
        </p>
        {variant === 'full' && (
          <button
            onClick={() => navigate('/templates')}
            className="mt-4 px-6 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors"
          >
            Browse Templates
          </button>
        )}
      </div>
    );
  }

  const containerClass = variant === 'full' 
    ? 'space-y-4' 
    : 'space-y-3 max-h-[220px] overflow-y-auto pr-1';

  return (
    <>
      <div className={containerClass}>
        {purchases.map((purchase) => (
          <div
            key={purchase.id}
            className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 mb-1">
                  {purchase.product_name || 'Template'}
                </h4>
                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mt-2">
                  <span className="flex items-center gap-1">
                    <FiCalendar className="w-4 h-4" />
                    {new Date(purchase.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="text-gray-500">₹</span>
                    {parseFloat(purchase.amount || 0).toFixed(2)}
                  </span>
                  {purchase.product_id && (
                    <span className="flex items-center gap-1 text-gray-500">
                      <span>Product ID:</span>
                      <span className="font-semibold text-gray-700">
                        #{purchase.product_id}
                      </span>
                    </span>
                  )}
                  {(() => {
                    const statusInfo = getStatusDisplay(purchase);
                    const StatusIcon = statusInfo.icon;
                    return (
                      <span className={`px-2 py-1 rounded text-xs font-medium flex items-center gap-1 ${statusInfo.color}`}>
                        <StatusIcon className="w-3 h-3" />
                        {statusInfo.text}
                      </span>
                    );
                  })()}
                </div>
                {purchase.product_id && (
                  <div className={`mt-3 flex flex-wrap gap-2 ${variant === 'compact' ? 'hidden' : ''}`}>
                    <button
                      onClick={() =>
                        navigate(
                          getTemplateUrl({
                            id: purchase.product_id,
                            name:
                              purchase.product_name ||
                              purchase.product_title,
                          }),
                        )
                      }
                      className="px-3 py-1.5 text-sm text-green-600 hover:bg-green-50 rounded-lg font-medium transition-colors border border-green-200"
                    >
                      View Template
                    </button>
                    {canDownload(purchase) && purchase.product_id && (
                      <button
                        onClick={() => handleDownload(purchase)}
                        className="bg-green-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors flex items-center gap-2"
                      >
                        <FiDownload className="w-4 h-4" />
                        Download
                      </button>
                    )}
                    {purchase.status === 'completed' && purchase.refund_status !== 'refunded' && (
                      <button
                        onClick={() => handleInvoiceDownload(purchase)}
                        className="bg-gray-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors flex items-center gap-2"
                      >
                        <FiFileText className="w-4 h-4" />
                        Invoice
                      </button>
                    )}
                    {purchase.status === 'completed' && purchase.refund_status !== 'refunded' && (
                      <button
                        onClick={() => handleReview(purchase)}
                        className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
                      >
                        <FiStar className="w-4 h-4" />
                        Review
                      </button>
                    )}
                    {/*
                    Temporary disabled for future implementation:
                    {purchase.status === 'completed' && !purchase.refund_status && (
                      <button
                        onClick={() => openRefundModal(purchase)}
                        className="bg-orange-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-orange-700 transition-colors flex items-center gap-2"
                      >
                        <FiRefreshCw className="w-4 h-4" />
                        Request Refund
                      </button>
                    )}
                    <button
                      onClick={() => openMessageModal(purchase)}
                      className="bg-purple-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors flex items-center gap-2"
                    >
                      <FiMessageCircle className="w-4 h-4" />
                      Contact Seller
                    </button>
                    */}
                  </div>
                )}
                {purchase.status === 'completed' && purchase.refund_status !== 'refunded' && (
                  <div className={`mt-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 ${variant === 'compact' ? 'hidden' : ''}`}>
                    <p className="text-sm text-amber-900 flex flex-wrap items-center gap-2">
                      <FiAlertCircle className="w-4 h-4 shrink-0" />
                      <span>If any issue is found,</span>
                      <button
                        type="button"
                        onClick={() => openRefundModal(purchase)}
                        className="inline-flex items-center gap-1 font-semibold underline underline-offset-2 hover:text-amber-700"
                      >
                        <FiMessageCircle className="w-4 h-4" />
                        contact us
                      </button>
                      <span>to review the refund terms and next steps.</span>
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Review Modal */}
      {reviewModalOpen && selectedProduct && (
        <ReviewModal
          isOpen={reviewModalOpen}
          productId={selectedProduct.product_id}
          productName={selectedProduct.product_name || selectedProduct.product_title || 'Product'}
          onClose={() => {
            setReviewModalOpen(false);
            setSelectedProduct(null);
          }}
          onReviewSubmitted={handleReviewSubmitted}
        />
      )}

      {/* Refund Modal */}
      {refundModalOpen && selectedPurchase && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1100]">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-2xl p-6 max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="border-b border-gray-200 pb-4 mb-5">
              <div className="flex items-start gap-3">
                <div className="mt-1 flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 text-amber-700">
                  <FiRefreshCw className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">Refund Terms & Conditions</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    For <strong>{selectedPurchase.product_name}</strong> priced at ₹{parseFloat(selectedPurchase.amount || 0).toFixed(2)}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 mb-5">
              <p className="text-sm text-green-900">
                This temporary popup is replacing the old refund request form for now. If any issue is found, please contact us and we will guide you from there.
              </p>
            </div>

            <div className="space-y-4">
              <section className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                <h4 className="text-lg font-semibold text-gray-900 mb-2">1. Eligible refund cases</h4>
                <p className="text-sm leading-6 text-gray-700">
                  Refunds are considered for defective, corrupted, incomplete, or undelivered products after the issue is reviewed by our team.
                </p>
              </section>

              <section className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                <h4 className="text-lg font-semibold text-gray-900 mb-2">2. Time limit</h4>
                <p className="text-sm leading-6 text-gray-700">
                  Refund-related issues should be reported within 30 days of purchase for faster verification and support handling.
                </p>
              </section>

              <section className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                <h4 className="text-lg font-semibold text-gray-900 mb-2">3. Non-eligible cases</h4>
                <p className="text-sm leading-6 text-gray-700">
                  Change-of-mind, no-longer-needed, or preference-based requests are not eligible for refunds.
                </p>
              </section>

              <section className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                <h4 className="text-lg font-semibold text-gray-900 mb-2">4. Contact us first</h4>
                <p className="text-sm leading-6 text-gray-700">
                  Share your order details, the product name, and a short explanation of the issue through our contact page so the support team can review the case.
                </p>
              </section>

              <section className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                <h4 className="text-lg font-semibold text-gray-900 mb-2">5. Full terms</h4>
                <p className="text-sm leading-6 text-gray-700">
                  You can also review the general Terms & Conditions page for broader platform rules and policies.
                </p>
              </section>
            </div>

            {/*
            Original refund request form kept for future implementation:
            <p className="text-sm text-gray-500 mb-4">Important: You must contact the seller first through "Contact Seller" button</p>
            <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
              <p className="text-sm text-orange-800">
                <strong>⚠️ Note:</strong> Refunds are available for defective/undelivered products within 30 days. Change-of-mind requests are not eligible.
              </p>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Requesting refund for: <strong>{selectedPurchase.product_name}</strong> (₹{parseFloat(selectedPurchase.amount).toFixed(2)})
            </p>
            <div className="space-y-4">
              ...
            </div>
            */}

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setRefundModalOpen(false);
                  setSelectedPurchase(null);
                }}
                className="flex-1 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setRefundModalOpen(false);
                  setSelectedPurchase(null);
                  navigate('/terms');
                }}
                className="flex-1 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 flex items-center justify-center gap-2"
              >
                View Terms Page
              </button>
              <button
                onClick={() => {
                  setRefundModalOpen(false);
                  setSelectedPurchase(null);
                  navigate('/contact');
                }}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center gap-2"
              >
                Contact Us
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Message modal rendering is temporarily disabled and kept out of the live UI for future implementation. */}
    </>
  );
}
