import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { CartContext } from '../components/CartContext';
import { useCurrency } from '../contexts/CurrencyContext';
import { getINRPrice } from '../lib/currency';
import {
  FiLock,
  FiCheck,
  FiArrowLeft,
  FiLoader,
  FiAlertCircle,
  FiMapPin
} from 'react-icons/fi';

export default function Payment() {
  const navigate = useNavigate();
  const { cart, clearCart } = useContext(CartContext);
  const { formatPrice, convertPrice, currency } = useCurrency();

  const [user, setUser] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Billing
  const [billingAddress, setBillingAddress] = useState('');
  const [billingCity, setBillingCity] = useState('');
  const [billingZip, setBillingZip] = useState('');
  const [billingCountry, setBillingCountry] = useState('');

  const API_URL =
    process.env.REACT_APP_API_URL ||
    "https://uptulathemehub.com/backend/api";

  useEffect(() => {
    const currentUser = JSON.parse(localStorage.getItem('user') || 'null');

    if (!currentUser) {
      navigate('/login');
      return;
    }

    setUser(currentUser);

    if (!cart || cart.length === 0) {
      navigate('/cart');
    }
  }, [navigate, cart]);

  // ✅ Correct calculation - use price_inr if available
  const subtotalINR = cart.reduce(
    (sum, item) => sum + getINRPrice(item) * (item.qty || 1),
    0
  );

  const taxINR = subtotalINR * 0.1;
  const totalINR = subtotalINR + taxINR;
  
  // Convert all amounts to user's currency
  const subtotal = convertPrice(subtotalINR);
  const tax = convertPrice(taxINR);
  const total = convertPrice(totalINR);

  const handlePayment = async () => {
    setError(null);

    if (!billingAddress || !billingCity || !billingZip) {
      setError("Please fill billing details");
      return;
    }

    setProcessing(true);

    try {
      console.log("TOTAL:", total);

      // ✅ STEP 1: CREATE ORDER
      const res = await fetch(`${API_URL}/create-order.php`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        credentials: "include",
        body: JSON.stringify({
          amount: Number(totalINR.toFixed(2))  // Send INR amount to backend for payment
        })
      });

      const order = await res.json();

      if (!order || !order.id) {
        throw new Error("Order creation failed");
      }

      // ✅ STEP 2: RAZORPAY OPTIONS
      const options = {
        key: "rzp_test_SUdNz685HnllDx",
        amount: order.amount,
        currency: "INR",
        name: "UptulaThemeHub",
        description: "Template Purchase",
        order_id: order.id,

        prefill: {
          name: user?.full_name || "",
          email: user?.email || "",
          contact: user?.phone || "9999999999"
        },

        theme: {
          color: "#04733c"
        },

        handler: async function (response) {
          try {
            // ✅ STEP 3: VERIFY PAYMENT
            const verifyRes = await fetch(`${API_URL}/verify-payment.php`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json"
              },
              credentials: "include",
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,

                // User ID fallback when session cookies are not sent from cross-origin requests
                user_id: user?.id,

                // ✅ FULL CART
                items: cart.map(item => ({
                  id: item.id,
                  qty: item.qty || 1
                })),

                // ✅ BILLING
                billing_address: `${billingAddress}, ${billingCity}, ${billingZip}, ${billingCountry}`
              })
            });

            const verifyData = await verifyRes.json();

            console.log("VERIFY RESPONSE:", verifyData);

            if (!verifyData.success) {
              setError(verifyData.message || "Payment verification failed");
              return;
            }

            // ✅ SUCCESS FLOW
            setSuccess("Payment Successful ✅");
            clearCart();

            setTimeout(() => {
              navigate('/profile');
            }, 1500);

          } catch (err) {
            console.error(err);
            setError("Payment verification failed");
          }
        }
      };

      // ✅ SAFE CHECK
      if (!window.Razorpay) {
        setError("Razorpay SDK not loaded");
        return;
      }

      const rzp = new window.Razorpay(options);

      // ❌ PAYMENT FAILURE HANDLER
      rzp.on('payment.failed', function (response) {
        console.error("Payment Failed:", response);
        setError("Payment failed. Try again.");
      });

      rzp.open();

    } catch (err) {
      console.error(err);
      setError("Payment failed");
    } finally {
      setProcessing(false);
    }
  };

  if (!user || !cart || cart.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <FiLoader className="w-8 h-8 animate-spin text-green-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-6xl">

        <button
          onClick={() => navigate('/cart')}
          className="flex items-center gap-2 mb-4 text-gray-600"
        >
          <FiArrowLeft /> Back
        </button>

        <h1 className="text-3xl font-bold mb-6">Checkout</h1>

        {success && (
          <div className="p-3 bg-green-100 text-green-700 mb-4 flex gap-2">
            <FiCheck /> {success}
          </div>
        )}

        {error && (
          <div className="p-3 bg-red-100 text-red-700 mb-4 flex gap-2">
            <FiAlertCircle /> {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Billing */}
          <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow">

            <h2 className="text-xl font-bold mb-4 flex gap-2">
              <FiMapPin /> Billing Address
            </h2>

            <input
              placeholder="Address"
              className="w-full mb-3 p-3 border rounded"
              onChange={(e) => setBillingAddress(e.target.value)}
            />

            <div className="grid grid-cols-2 gap-3">
              <input
                placeholder="City"
                className="p-3 border rounded"
                onChange={(e) => setBillingCity(e.target.value)}
              />
              <input
                placeholder="ZIP"
                className="p-3 border rounded"
                onChange={(e) => setBillingZip(e.target.value)}
              />
            </div>

            <input
              placeholder="Country"
              className="w-full mt-3 p-3 border rounded"
              onChange={(e) => setBillingCountry(e.target.value)}
            />

          </div>

          {/* Summary */}
          <div className="bg-white p-6 rounded-xl shadow">

            <h2 className="text-xl font-bold mb-4">Order Summary</h2>

            {cart.map(item => (
              <div key={item.id} className="flex justify-between mb-2">
                <span>{item.title} x{item.qty || 1}</span>
                <span>{formatPrice(convertPrice(getINRPrice(item)))}</span>
              </div>
            ))}

            <hr className="my-3" />

            <div className="flex justify-between mb-2">
              <span>Subtotal</span>
              <span>{formatPrice(subtotal)}</span>
            </div>

            <div className="flex justify-between mb-3">
              <span>Tax (10%)</span>
              <span>{formatPrice(tax)}</span>
            </div>

            <div className="flex justify-between">
              <span className="font-bold">Total ({currency})</span>
              <span className="font-bold text-lg">{formatPrice(total)}</span>
            </div>

            <button
              onClick={handlePayment}
              disabled={processing}
              className="w-full mt-4 bg-green-600 text-white py-3 rounded flex justify-center items-center gap-2"
            >
              {processing ? (
                <FiLoader className="animate-spin" />
              ) : (
                <>
                  <FiLock /> Pay Now
                </>
              )}
            </button>

          </div>
        </div>
      </div>
    </div>
  );
}
