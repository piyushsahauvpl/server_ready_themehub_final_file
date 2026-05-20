import { FiCheckCircle, FiShield, FiCreditCard, FiLoader, FiX } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import useSellerStatus from "./useSellerStatus";

const API_URL =
  process.env.REACT_APP_API_URL || "https://uptulathemehub.com/backend/api";

export default function SellerPaymentPage() {
  const navigate = useNavigate();
  const { seller, loading: sellerLoading } = useSellerStatus();

  const [paying, setPaying] = useState(false);
  const [error, setError] = useState("");

  const API_URL =
    process.env.REACT_APP_API_URL || "https://uptulathemehub.com/backend/api";

  /* ================= GUARDS (VERY IMPORTANT) ================= */

  // 1️⃣ Wait for seller status
  if (sellerLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <FiLoader className="w-8 h-8 animate-spin text-green-600" />
      </div>
    );
  }

  // 2️⃣ Not approved → go back to profile
  if (!seller || seller.verification_status !== "approved") {
    navigate("/profile");
    return null;
  }

  // 3️⃣ Already paid → dashboard will auto-switch via Profile.jsx
  if (seller.payment_confirmed === 1) {
    navigate("/profile");
    return null;
  }

  /* ================= PAYMENT HANDLER ================= */

  const handlePayment = async () => {
    if (paying) return;

    setError("");
    setPaying(true);

    try {
      const createRes = await fetch(`${API_URL}/create-order.php`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: 99 })
      });

      const order = await createRes.json();
      if (!order.success || !order.id) {
        throw new Error(order.error || "Failed to create Razorpay order");
      }

      if (!window.Razorpay) {
        throw new Error("Razorpay SDK not loaded");
      }

      const options = {
        key: "rzp_test_SUdNz685HnllDx",
        amount: order.amount,
        currency: "INR",
        name: "Theme Hub",
        description: "Seller activation fee",
        order_id: order.id,
        prefill: {
          name: seller?.full_name || seller?.name || "",
          email: seller?.email || "",
          contact: seller?.phone || ""
        },
        theme: { color: "#04733c" },
        handler: async function (response) {
          try {
            const verifyRes = await fetch(`${API_URL}/verify-payment.php`, {
              method: "POST",
              credentials: "include",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                seller_activation: true,
                amount: 99
              })
            });

            const verifyData = await verifyRes.json();
            console.log("verify-payment response", verifyData);

            if (!verifyData.success) {
              setError(verifyData.message || "Payment verification failed");
              return;
            }

            navigate("/profile");
          } catch (err) {
            console.error("Verify payment error:", err);
            setError("Payment verification failed");
          } finally {
            setPaying(false);
          }
        }
      };

      const rzp = new window.Razorpay(options);

      rzp.on("payment.failed", function (response) {
        console.error("Razorpay payment failed:", response);
        setError("Payment failed. Please try again.");
        setPaying(false);
      });

      rzp.open();
    } catch (err) {
      console.error("Payment error:", err);
      setError(err.message || "Payment failed");
      setPaying(false);
    }
  };

  /* ================= UI ================= */

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100 p-6">
      <div className="max-w-xl w-full bg-white rounded-2xl shadow-xl overflow-hidden">

        {/* HEADER */}
        <div className="bg-green-600 p-6 text-white">
          <h2 className="text-2xl font-bold">Seller Account Approved 🎉</h2>
          <p className="text-green-100 mt-1">
            Complete payment to activate your seller dashboard
          </p>
        </div>

        {/* BODY */}
        <div className="p-6 space-y-6">

          {/* STATUS */}
          <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-lg p-4">
            <FiCheckCircle className="text-green-600 w-6 h-6" />
            <p className="text-green-700 font-medium">
              Your seller application has been approved by admin
            </p>
          </div>

          {/* PAYMENT CARD */}
          <div className="border rounded-xl p-5 bg-gray-50">
            <h3 className="font-semibold text-lg mb-3">
              Seller Activation Fee
            </h3>

            <div className="flex justify-between items-center mb-4">
              <span className="text-gray-600">One-time payment</span>
              <span className="text-3xl font-bold text-black">₹99</span>
            </div>

            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-center gap-2">
                <FiCheckCircle className="text-green-500" /> Lifetime seller access
              </li>
              <li className="flex items-center gap-2">
                <FiCheckCircle className="text-green-500" /> Upload unlimited products
              </li>
              <li className="flex items-center gap-2">
                <FiCheckCircle className="text-green-500" /> Earnings & analytics dashboard
              </li>
            </ul>
          </div>

          {/* SECURITY */}
          <div className="flex items-center gap-3 bg-gray-100 rounded-lg p-4">
            <FiShield className="text-gray-600 w-5 h-5" />
            <p className="text-sm text-gray-600">
              100% secure payment • Admin verified • No recurring charges
            </p>
          </div>

          {/* ERROR */}
          {error && (
            <div className="text-red-600 text-sm bg-red-50 border border-red-200 p-3 rounded">
              {error}
            </div>
          )}

          {/* PAY BUTTON */}
          <button
            onClick={handlePayment}
            disabled={paying}
            className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl text-lg font-semibold transition
              ${paying
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-green-600 hover:bg-green-700 text-white"}`}
          >
            <FiCreditCard />
            {paying ? "Processing..." : "Pay & Activate Seller Account"}
          </button>

          <p className="text-center text-xs text-gray-500">
            After successful payment, your seller dashboard will be activated automatically.
          </p>
        </div>
      </div>
    </div>
  );
}
