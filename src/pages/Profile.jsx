// 🔽 SAME IMPORTS – NO CHANGE
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { getTemplateUrl } from "../lib/slug";
import {
  FiUser,
  FiMail,
  FiPhone,
  FiCamera,
  FiSave,
  FiEdit2,
  FiShoppingBag,
  FiCalendar,
  FiPackage,
  FiCheck,
  FiX,
  FiLoader,
  FiMessageCircle,
  FiDownload,
  FiFileText,
  FiStar,
} from "react-icons/fi";
import UserTickets from "../components/UserTickets";
import ReviewModal from "../components/ReviewModal";
import useSellerStatus from "../seller/useSellerStatus";
import SellerDashboard from "../seller/SellerDashboard";

export default function Profile() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const API_URL =
    process.env.REACT_APP_API_URL ||
    "https://uptulathemehub.com/backend/api";

  // 🔹 seller hook
  const { seller, loading: sellerLoading } = useSellerStatus();

  // 🔹 profile/loading states
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [photoPreview, setPhotoPreview] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  const [purchases, setPurchases] = useState([]);
  const [purchasesLoading, setPurchasesLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("purchases");

  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [userReviews, setUserReviews] = useState({});

  /* ================= AUTH + PROFILE LOAD (FIXED) ================= */
  useEffect(() => {
    const init = async () => {
      try {
        const res = await fetch(`${API_URL}/check-auth.php`, {
          credentials: "include",
          cache: "no-cache",
        });

        const data = await res.json();
        if (!data.authenticated || !data.user) {
          navigate("/login");
          return;
        }

        setUser(data.user);
        await loadUserProfile(data.user.id);
        await loadPurchaseHistory();

        // ✅ FIXED
      } catch {
        navigate("/login");
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [navigate]);

  

  const loadUserProfile = async (userId) => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/profile.php?user_id=${userId}`, {
        credentials: "include",
      });
      const data = await res.json();

      if (data.success && data.user) {
        setUser(data.user);
        setFullName(data.user.full_name || "");
        setEmail(data.user.email || "");
        setPhone(data.user.phone || "");
        setPhotoPreview(data.user.photo_url || null);
      } else {
        setError("Failed to load profile");
      }
    } catch (err) {
      console.error("Load profile error:", err);
      setError("Error loading profile");
    } finally {
      setLoading(false);
    }
  };

  const loadPurchaseHistory = async (userId) => {
    try {
      setPurchasesLoading(true);
      // Use user-specific purchases endpoint to avoid showing seller-only orders
      const res = await fetch(`${API_URL}/purchases.php`, {
        credentials: "include",
      });
      const data = await res.json();

      // API may return `purchases` or `orders` depending on backend; prefer purchases
      const userPurchases = (data && data.purchases) ? data.purchases : (data && data.orders ? data.orders : []);
      if (userPurchases && Array.isArray(userPurchases)) {
        setPurchases(userPurchases);
        // Check for existing reviews for each purchased product
        await loadUserReviews(userPurchases);
      } else {
        setPurchases([]);
      }
    } catch (err) {
      console.error("Load purchases error:", err);
    } finally {
      setPurchasesLoading(false);
    }
  };

  const loadUserReviews = async (orders) => {
    try {
      const reviewsMap = {};
      const currentUserRes = await fetch(`${API_URL}/check-auth.php`, {
        credentials: "include",
      });
      const currentUserData = await currentUserRes.json();

      if (!currentUserData.authenticated || !currentUserData.user) return;

      // Check reviews for each completed order
      for (const order of orders) {
        if (order.status === "completed" && order.product_id) {
          try {
            const reviewRes = await fetch(
              `${API_URL}/reviews.php?product_id=${order.product_id}`,
              {
                credentials: "include",
              },
            );
            const reviewData = await reviewRes.json();

            if (reviewData.success && reviewData.reviews) {
              const userReview = reviewData.reviews.find(
                (r) => r.user_id === currentUserData.user.id,
              );
              if (userReview) {
                reviewsMap[order.product_id] = userReview;
              }
            }
          } catch (err) {
            console.error(
              `Error loading review for product ${order.product_id}:`,
              err,
            );
          }
        }
      }

      setUserReviews(reviewsMap);
    } catch (err) {
      console.error("Load user reviews error:", err);
    }
  };

  const handleOpenReview = (purchase) => {
    setSelectedProduct({
      id: purchase.product_id,
      name: purchase.product_name || "Template",
    });
    setReviewModalOpen(true);
  };

  const handleReviewSubmitted = () => {
    // Reload reviews after submission
    if (user) {
      loadPurchaseHistory(user.id);
    }
  };

  const downloadInvoice = (purchase) => {
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
              <p><strong>Name:</strong> ${fullName || "N/A"}</p>
              <p><strong>Email:</strong> ${email || "N/A"}</p>
              ${phone ? `<p><strong>Phone:</strong> ${phone}</p>` : ""}
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

    const blob = new Blob([invoiceHTML], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `invoice-${invoiceNumber}-${invoiceTitle.replace(/\s+/g, "-").toLowerCase()}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError("Image size must be less than 5MB");
        return;
      }
      if (!file.type.startsWith("image/")) {
        setError("Please select an image file");
        return;
      }
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
      setError(null);
    }
  };

  const handleSave = async () => {
    if (!fullName.trim()) {
      setError("Full name is required");
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      // Client-side phone sanitization/validation
      const digitsOnly = (phone || "").replace(/\D/g, "");
      if (digitsOnly && digitsOnly.length !== 10) {
        setError("Phone number must be exactly 10 digits");
        setSaving(false);
        return;
      }

      const formData = new FormData();
      formData.append("full_name", fullName);
      formData.append("phone", digitsOnly);
      if (photoFile) {
        formData.append("photo", photoFile);
      }

      // Backend expects PUT for updates (profile.php accepts GET and PUT only)
      const res = await fetch(`${API_URL}/profile.php`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      const data = await res.json();

      if (data.success) {
        setSuccess("Profile updated successfully");
        setIsEditing(false);
        setPhotoFile(null);
        // Reload profile
        if (user) {
          await loadUserProfile(user.id);
        }
        // Update localStorage
        const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
        localStorage.setItem(
          "user",
          JSON.stringify({
            ...currentUser,
            full_name: fullName,
            phone: digitsOnly || phone,
            photo_url: data.user?.photo_url || photoPreview,
          }),
        );
        window.dispatchEvent(
          new CustomEvent("authChange", {
            detail: {
              user: {
                ...currentUser,
                full_name: fullName,
                phone: digitsOnly || phone,
                photo_url: data.user?.photo_url || photoPreview,
              },
            },
          }),
        );
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(data.message || "Failed to update profile");
      }
    } catch (err) {
      console.error("Save profile error:", err);
      setError("Error updating profile");
    } finally {
      setSaving(false);
    }
  };
const isApproved = seller?.verification_status === "approved";
const isPaid = seller?.payment_confirmed === 1;
const isActive = isApproved && isPaid;
  // const showSellerDashboard = seller?.is_active === true;

const showPaymentBox = isApproved && !isPaid;


  if (sellerLoading || loading) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <FiLoader className="animate-spin w-8 h-8 text-green-600" />
    </div>
  );
}

if (isActive) {
  return <SellerDashboard />;
}


 

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
    <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
  <div>
    <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
    <p className="text-gray-600 mt-2">
      Manage your account information and view your purchase history
    </p>
  </div>

  {/* 🔘 ACTION BUTTON */}
  <button
    onClick={() => {
      if (isActive) {
        navigate("/seller/dashboard");
      } else if (isApproved && !isPaid) {
        navigate("/seller/payment");
      } else {
        navigate("/become-seller");
      }
    }}
    className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
  >
    {isActive
      ? "Your Seller Dashboard"
      : isApproved && !isPaid
      ? "Complete Seller Payment"
      : "Become a Seller"}
  </button>
</div>

{/* 🟡 APPROVED BUT PAYMENT PENDING */}
{/* 🟡 SELLER APPROVED BUT PAYMENT PENDING */}
{showPaymentBox && (
  <div className="mb-6 p-4 bg-yellow-50 border border-yellow-300 rounded-lg">
    <p className="font-semibold mb-2">
      🎉 Seller approved! Complete payment to activate your seller dashboard.
    </p>
    <button
      onClick={() => navigate("/seller/payment")}
      className="bg-green-600 text-white px-4 py-2 rounded"
    >
      Pay & Activate Seller Account
    </button>
  </div>
)}


        {/* Success/Error Messages */}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
            <FiCheck className="w-5 h-5 text-green-600" />
            <p className="text-green-800">{success}</p>
          </div>
        )}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
            <FiX className="w-5 h-5 text-red-600" />
            <p className="text-red-800">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Profile Info */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-200">
              {/* Profile Photo Section */}
              <div className="bg-gradient-to-br from-green-500 to-green-600 p-8 text-center">
                <div className="relative inline-block">
                  <div className="w-32 h-32 rounded-full bg-white p-1 mx-auto shadow-xl">
                    {photoPreview ? (
                      <img
                        src={photoPreview}
                        alt="Profile"
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full rounded-full bg-gray-200 flex items-center justify-center">
                        <FiUser className="w-16 h-16 text-gray-400" />
                      </div>
                    )}
                  </div>
                  {isEditing && (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute bottom-0 right-0 bg-white p-3 rounded-full shadow-lg hover:bg-gray-50 transition-colors"
                    >
                      <FiCamera className="w-5 h-5 text-green-600" />
                    </button>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    className="hidden"
                  />
                </div>
                <h2 className="text-2xl font-bold text-white mt-4">
                  {fullName || "User"}
                </h2>
                <p className="text-green-100 mt-1">{email}</p>
              </div>

              {/* Profile Details */}
              <div className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-gray-700">
                    <FiMail className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">Email</p>
                      <p className="font-medium">{email}</p>
                    </div>
                  </div>

                  {phone && (
                    <div className="flex items-center gap-3 text-gray-700">
                      <FiPhone className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500">Phone</p>
                        <p className="font-medium">{phone}</p>
                      </div>
                    </div>
                  )}

                  {user?.created_at && (
                    <div className="flex items-center gap-3 text-gray-700">
                      <FiCalendar className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500">Member Since</p>
                        <p className="font-medium">
                          {new Date(user.created_at).toLocaleDateString(
                            "en-US",
                            {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            },
                          )}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {!isEditing && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="w-full mt-6 px-4 py-2.5 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <FiEdit2 className="w-5 h-5" />
                    Edit Profile
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Edit Form & Purchase History */}
          <div className="lg:col-span-2 space-y-6">
            {/* Edit Form */}
            {isEditing && (
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-6">
                  Edit Profile Information
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="Enter your full name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      value={email}
                      disabled
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Email cannot be changed
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0,10))}
                      maxLength={10}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="Enter your phone number"
                    />
                    {phone && phone.length !== 10 && (
                      <p className="text-xs text-red-600 mt-1">Phone number must be exactly 10 digits</p>
                    )}
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="flex-1 px-4 py-2.5 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {saving ? (
                        <>
                          <FiLoader className="w-5 h-5 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <FiSave className="w-5 h-5" />
                          Save Changes
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => {
                        setIsEditing(false);
                        setError(null);
                        setSuccess(null);
                        // Reset form
                        if (user) {
                          setFullName(user.full_name || "");
                          setPhone(user.phone || "");
                          setPhotoPreview(user.photo_url || null);
                          setPhotoFile(null);
                        }
                      }}
                      className="px-4 py-2.5 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors flex items-center justify-center gap-2"
                    >
                      <FiX className="w-5 h-5" />
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Tabs */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
              {/* Tab Headers */}
              <div className="flex border-b border-gray-200">
                <button
                  onClick={() => setActiveTab("purchases")}
                  className={`flex-1 px-6 py-4 font-semibold transition-colors ${
                    activeTab === "purchases"
                      ? "bg-green-50 text-green-700 border-b-2 border-green-600"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                  style={
                    activeTab === "purchases"
                      ? { borderBottomColor: "#04733c", color: "#04733c" }
                      : {}
                  }
                >
                  <div className="flex items-center justify-center gap-2">
                    <FiShoppingBag className="w-5 h-5" />
                    Purchase History
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab("tickets")}
                  className={`flex-1 px-6 py-4 font-semibold transition-colors ${
                    activeTab === "tickets"
                      ? "bg-green-50 text-green-700 border-b-2 border-green-600"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                  style={
                    activeTab === "tickets"
                      ? { borderBottomColor: "#04733c", color: "#04733c" }
                      : {}
                  }
                >
                  <div className="flex items-center justify-center gap-2">
                    <FiMessageCircle className="w-5 h-5" />
                    Support Tickets
                  </div>
                </button>
              </div>

              {/* Tab Content */}
              <div className="p-6">
                {activeTab === "purchases" ? (
                  <>
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        <FiShoppingBag className="w-6 h-6 text-green-600" />
                        Purchase History
                      </h3>
                    </div>

                    {purchasesLoading ? (
                      <div className="text-center py-12">
                        <FiLoader className="w-8 h-8 animate-spin text-green-600 mx-auto mb-4" />
                        <p className="text-gray-600">Loading purchases...</p>
                      </div>
                    ) : purchases.length === 0 ? (
                      <div className="text-center py-12">
                        <FiPackage className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-600 font-medium">
                          No purchases yet
                        </p>
                        <p className="text-gray-500 text-sm mt-2">
                          Start shopping to see your purchase history here
                        </p>
                        <button
                          onClick={() => navigate("/templates")}
                          className="mt-4 px-6 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors"
                        >
                          Browse Templates
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {purchases.map((purchase) => (
                          <div
                            key={purchase.id}
                            className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h4 className="font-semibold text-gray-900 mb-1">
                                  {purchase.product_name || "Template"}
                                </h4>
                                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mt-2">
                                  <span className="flex items-center gap-1">
                                    <FiCalendar className="w-4 h-4" />
                                    {new Date(
                                      purchase.created_at,
                                    ).toLocaleDateString("en-US", {
                                      year: "numeric",
                                      month: "short",
                                      day: "numeric",
                                    })}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <span className="text-gray-500">₹</span>
                                    {parseFloat(purchase.amount || 0).toFixed(
                                      2,
                                    )}
                                  </span>
                                  {purchase.product_id && (
                                    <span className="flex items-center gap-1 text-gray-500">
                                      <span>Product ID:</span>
                                      <span className="font-semibold text-gray-700">
                                        #{purchase.product_id}
                                      </span>
                                    </span>
                                  )}
                                  <span
                                    className={`px-2 py-1 rounded text-xs font-medium ${
                                      purchase.status === "completed"
                                        ? "bg-green-100 text-green-700"
                                        : purchase.status === "pending"
                                          ? "bg-yellow-100 text-yellow-700"
                                          : "bg-red-100 text-red-700"
                                    }`}
                                  >
                                    {purchase.status || "pending"}
                                  </span>
                                </div>
                                {purchase.product_id && (
                                  <div className="mt-3 flex flex-wrap gap-2">
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
                                    {purchase.status === "completed" && (
                                      <>
                                        {purchase.product_file_url && (
                                          <>
                                            <a
                                              href={(() => {
                                                const apiBase = process.env.REACT_APP_API_URL ||
                                                  "https://uptulathemehub.com/backend/api";

                                                return `${apiBase}/download.php?product_id=${purchase.product_id}`;
                                              })()}
                                              className="px-3 py-1.5 text-sm bg-green-600 text-white hover:bg-green-700 rounded-lg font-medium transition-colors flex items-center gap-1.5"
                                            >
                                              <FiDownload className="w-4 h-4" />
                                              Download Template
                                            </a>
                                            <button
                                              onClick={() =>
                                                downloadInvoice(purchase)
                                              }
                                              className="px-3 py-1.5 text-sm bg-gray-600 text-white hover:bg-gray-700 rounded-lg font-medium transition-colors flex items-center gap-1.5"
                                            >
                                              <FiFileText className="w-4 h-4" />
                                              Download Invoice
                                            </button>
                                          </>
                                        )}
                                        <button
                                          onClick={() =>
                                            handleOpenReview(purchase)
                                          }
                                          className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors flex items-center gap-1.5 ${
                                            userReviews[purchase.product_id]
                                              ? "bg-yellow-500 text-white hover:bg-yellow-600"
                                              : "bg-blue-600 text-white hover:bg-blue-700"
                                          }`}
                                        >
                                          <FiStar className="w-4 h-4" />
                                          {userReviews[purchase.product_id]
                                            ? "Edit Review"
                                            : "Write Review"}
                                        </button>
                                      </>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <UserTickets />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Review Modal */}
      <ReviewModal
        isOpen={reviewModalOpen}
        onClose={() => {
          setReviewModalOpen(false);
          setSelectedProduct(null);
        }}
        productId={selectedProduct?.id}
        productName={selectedProduct?.name}
        onReviewSubmitted={handleReviewSubmitted}
      />
    </div>
  );
}
