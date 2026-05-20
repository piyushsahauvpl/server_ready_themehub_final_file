import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function BecomeSeller() {
  const navigate = useNavigate();

  const API_BASE =
    "https://uptulathemehub.com/backend/api/seller";

  /* ================= STATES ================= */
  const [step, setStep] = useState(1); // 1 = Personal, 2 = KYC & Address, 3 = Bank, 4 = Review
  const [form, setForm] = useState({
    // Personal details
    full_name: "",
    email: "",
    business_name: "",
    business_type: "",
    bio: "",
    mobile: "",
    country: "India",
    category: "",
    // KYC
    pan_number: "",
    aadhaar_number: "",
    // Address
    street_address: "",
    city: "",
    state: "",
    pincode: "",
    // Bank details
    account_holder: "",
    bank_name: "",
    account_number: "",
    confirm_account_number: "",
    ifsc_code: "",
    branch_name: "",
    account_type: "savings",
    upi_id: "",
    // Agreements
    confirmDetails: false,
    agreeOriginal: false,
    agreeCopyright: false,
    agreePolicy: false,
    agreeTerms: false,
  });

  const [sellerInfo, setSellerInfo] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  /* ================= DERIVED FLAGS ================= */
  const isApproved = sellerInfo?.verification_status === "approved";
  const isPaid = sellerInfo?.payment_confirmed === 1;

  const STEPS = [
    "Personal Details",
    "KYC & Address",
    "Bank Details",
    "Review & Submit",
  ];

  /* ================= CHECK SELLER STATUS ================= */
  useEffect(() => {
    let mounted = true;

    const checkSeller = async () => {
      try {
        const res = await fetch(`${API_BASE}/check.php`, {
          credentials: "include",
        });
        const data = await res.json();

        if (!mounted) return;

        if (data.success && data.seller) {
          setSellerInfo(data.seller);
          if (
            data.seller.verification_status === "approved" &&
            data.seller.payment_confirmed === 1
          ) {
            navigate("/seller/dashboard");
          }
        }
      } catch (err) {
        console.error("Check seller error:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    checkSeller();
    const interval = setInterval(() => {
      if (mounted) checkSeller();
    }, 5000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [navigate]);

  // Prefill form when user re-applies
  useEffect(() => {
    if (showForm && sellerInfo) {
      setForm((prev) => ({
        ...prev,
        full_name: sellerInfo.full_name || "",
        email: sellerInfo.email || "",
        business_name: sellerInfo.business_name || "",
        business_type: sellerInfo.business_type || "",
        bio: sellerInfo.business_description || sellerInfo.bio || "",
        mobile: sellerInfo.mobile || "",
        category: sellerInfo.category || "",
        pan_number: sellerInfo.pan_number || "",
        aadhaar_number: sellerInfo.aadhaar_number || "",
        street_address: sellerInfo.street_address || "",
        city: sellerInfo.city || "",
        state: sellerInfo.state || "",
        pincode: sellerInfo.pincode || "",
      }));
    }
  }, [showForm, sellerInfo]);

  /* ================= HANDLERS ================= */
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name === "mobile") {
      if (!/^\d*$/.test(value) || value.length > 10) return;
    }
    if (name === "account_number" || name === "confirm_account_number") {
      if (!/^\d*$/.test(value) || value.length > 18) return;
    }
    if (name === "aadhaar_number") {
      if (!/^\d*$/.test(value) || value.length > 12) return;
      setForm((prev) => ({ ...prev, aadhaar_number: value }));
      return;
    }
    if (name === "pincode") {
      if (!/^\d*$/.test(value) || value.length > 6) return;
    }
    if (name === "ifsc_code") {
      const upper = value.toUpperCase();
      setForm((prev) => ({ ...prev, ifsc_code: upper }));
      return;
    }
    if (name === "pan_number") {
      const upper = value.toUpperCase();
      if (upper.length > 10) return;
      setForm((prev) => ({ ...prev, pan_number: upper }));
      return;
    }

    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  /* ---- Step validations ---- */
  const validateStep1 = () => {
    if (!form.full_name.trim()) return "Full name is required";
    if (!form.email.trim()) return "Email address is required";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      return "Enter a valid email address";
    if (!form.business_name.trim()) return "Business name is required";
    if (!form.business_type) return "Please select a business type";
    if (!form.bio.trim()) return "Bio is required";
    if (form.mobile.length !== 10) return "Mobile number must be 10 digits";
    if (!form.category) return "Please select a category";
    if (!form.agreeOriginal || !form.agreeCopyright || !form.agreePolicy)
      return "You must accept all content confirmations";
    return "";
  };

  const validateStep2 = () => {
    if (!form.pan_number.trim()) return "PAN number is required";
    if (!/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(form.pan_number))
      return "Enter a valid PAN number (e.g. ABCDE1234F)";
    if (form.aadhaar_number && form.aadhaar_number.length !== 12)
      return "Aadhaar number must be 12 digits";
    if (!form.street_address.trim()) return "Street address is required";
    if (!form.city.trim()) return "City is required";
    if (!form.state.trim()) return "State is required";
    if (form.pincode.length !== 6) return "Pincode must be 6 digits";
    return "";
  };

  const validateStep3 = () => {
    if (!form.account_holder.trim()) return "Account holder name is required";
    if (!form.bank_name.trim()) return "Bank name is required";
    if (form.account_number.length < 9) return "Enter a valid account number";
    if (form.account_number !== form.confirm_account_number)
      return "Account numbers do not match";
    if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(form.ifsc_code))
      return "Enter a valid IFSC code (e.g. SBIN0001234)";
    if (!form.branch_name.trim()) return "Branch name is required";
    return "";
  };

  const validateStep4 = () => {
    if (!form.confirmDetails) return "Please confirm your details are correct";
    if (!form.agreeTerms) return "Please accept the Terms & Conditions";
    return "";
  };

  const handleNext = () => {
    setError("");
    let err = "";
    if (step === 1) err = validateStep1();
    else if (step === 2) err = validateStep2();
    else if (step === 3) err = validateStep3();
    if (err) return setError(err);
    setStep((s) => s + 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleBack = () => {
    setError("");
    setStep((s) => s - 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  /* ---- Final submit ---- */
  const handleSubmit = async (e) => {
    e.preventDefault();
    const err = validateStep4();
    if (err) return setError(err);

    setSubmitting(true);
    setError("");

    try {
      const res = await fetch(`${API_BASE}/apply.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          full_name: form.full_name,
          email: form.email,
          business_name: form.business_name,
          business_type: form.business_type,
          bio: form.bio,
          mobile: form.mobile,
          category: form.category,
          // KYC
          pan_number: form.pan_number,
          aadhaar_number: form.aadhaar_number,
          // Address
          street_address: form.street_address,
          city: form.city,
          state: form.state,
          pincode: form.pincode,
          country: form.country,
          // Bank details
          account_holder: form.account_holder,
          bank_name: form.bank_name,
          account_number: form.account_number,
          ifsc_code: form.ifsc_code,
          branch_name: form.branch_name,
          account_type: form.account_type,
          upi_id: form.upi_id,
        }),
      });

      const data = await res.json();

      if (data.success) {
        const checkRes = await fetch(`${API_BASE}/check.php`, {
          credentials: "include",
        });
        const checkData = await checkRes.json();
        if (checkData.success) {
          setSellerInfo(checkData.seller);
          setShowForm(false);
          setStep(1);
        }
      } else {
        setError(data.message || "Submission failed");
      }
    } catch (err) {
      console.error(err);
      setError("Server error. Try again later.");
    } finally {
      setSubmitting(false);
    }
  };

  /* ================= LOADING ================= */
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-500 text-sm">Checking your seller status…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 px-4 py-10 flex items-center">
      <div className="w-full max-w-2xl mx-auto">

        {/* ── APPROVED BUT NOT PAID ── */}
        {sellerInfo && isApproved && !isPaid && (
          <StatusCard
            icon="🎉"
            iconBg="bg-green-100"
            title="Seller Account Approved!"
            titleColor="text-green-700"
            description="Complete your one-time payment to activate your seller dashboard."
          >
            <ActionButton
              onClick={() => navigate("/seller/payment")}
              variant="primary"
            >
              Pay & Activate Seller Account
            </ActionButton>
          </StatusCard>
        )}

        {/* ── REJECTED ── */}
        {sellerInfo &&
          sellerInfo.verification_status === "rejected" &&
          !showForm && (
            <StatusCard
              icon="❌"
              iconBg="bg-red-100"
              title="Application Rejected"
              titleColor="text-red-600"
            >
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-5 text-left w-full">
                <p className="text-red-700 font-semibold text-sm mb-1">Reason:</p>
                <p className="text-red-600 text-sm">
                  {sellerInfo.rejection_reason || "No reason provided"}
                </p>
              </div>
              <p className="text-gray-500 text-sm mb-6">
                Contact our support team for more information or apply again.
              </p>
              <div className="flex gap-3 flex-wrap justify-center">
                <ActionButton onClick={() => navigate("/contact")} variant="secondary">
                  Contact Support
                </ActionButton>
                <ActionButton
                  onClick={() => { setShowForm(true); setStep(1); }}
                  variant="primary"
                >
                  Apply Again
                </ActionButton>
              </div>
            </StatusCard>
          )}

        {/* ── PENDING ── */}
        {sellerInfo &&
          sellerInfo.verification_status === "pending" &&
          !showForm && (
            <StatusCard
              icon="⏳"
              iconBg="bg-yellow-100"
              title="Application Under Review"
              titleColor="text-yellow-700"
              description="Your seller application is being reviewed by our admin team. Usually takes 1–2 business days."
            >
              <div className="flex items-center gap-2 bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-2 text-yellow-700 text-sm">
                <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
                Auto-refreshing status every 5 seconds…
              </div>
            </StatusCard>
          )}

        {/* ── MULTI-STEP FORM ── */}
        {(showForm || !sellerInfo) && (
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">

            {/* Progress Header */}
            <div className="bg-gradient-to-r from-green-600 to-emerald-500 px-6 pt-6 pb-8">
              <h1 className="text-white text-xl font-bold mb-1">
                Become a Seller
              </h1>
              <p className="text-green-100 text-sm mb-6">
                Complete all steps — admin approval required
              </p>

              {/* Step indicator */}
              <div className="flex items-center gap-0">
                {STEPS.map((label, idx) => {
                  const num = idx + 1;
                  const done = step > num;
                  const active = step === num;
                  return (
                    <React.Fragment key={num}>
                      <div className="flex flex-col items-center">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all
                            ${done
                              ? "bg-white text-green-600"
                              : active
                              ? "bg-white text-green-600 ring-4 ring-white/30"
                              : "bg-white/20 text-white"
                            }`}
                        >
                          {done ? "✓" : num}
                        </div>
                        <span
                          className={`text-xs mt-1 font-medium whitespace-nowrap ${
                            active ? "text-white" : "text-green-200"
                          }`}
                        >
                          {label}
                        </span>
                      </div>
                      {idx < STEPS.length - 1 && (
                        <div
                          className={`flex-1 h-0.5 mb-5 mx-1 transition-all ${
                            step > num ? "bg-white" : "bg-white/25"
                          }`}
                        />
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>

            {/* Form Body */}
            <div className="px-6 py-6">

              {/* ── STEP 1: PERSONAL DETAILS ── */}
              {step === 1 && (
                <div className="space-y-4">
                  <SectionTitle>Personal & Business Info</SectionTitle>

                  <div className="grid grid-cols-2 gap-3">
                    <FormInput
                      label="Full Name"
                      name="full_name"
                      value={form.full_name}
                      onChange={handleChange}
                      placeholder="Your legal full name"
                    />
                    <FormInput
                      label="Email"
                      name="email"
                      value={form.email}
                      onChange={handleChange}
                      placeholder="you@example.com"
                      type="email"
                    />
                  </div>

                  <FormInput
                    label="Business Name"
                    name="business_name"
                    value={form.business_name}
                    onChange={handleChange}
                    placeholder="Your brand or business name"
                  />

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Business Type <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="business_type"
                      value={form.business_type}
                      onChange={handleChange}
                      className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                    >
                      <option value="">Select business type</option>
                      <option value="individual">Individual</option>
                      <option value="company">Company</option>
                    </select>
                  </div>

                  <FormTextarea
                    label="Bio"
                    name="bio"
                    value={form.bio}
                    onChange={handleChange}
                    placeholder="Brief description of your business and the templates you'll offer"
                  />

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Mobile Number <span className="text-red-500">*</span>
                    </label>
                    <div className="flex">
                      <span className="px-3 flex items-center border border-r-0 rounded-l-lg bg-gray-100 text-gray-600 text-sm font-medium">
                        +91
                      </span>
                      <input
                        type="text"
                        name="mobile"
                        value={form.mobile}
                        onChange={handleChange}
                        className="w-full border rounded-r-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                        placeholder="10-digit number"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Category Preference <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="category"
                      value={form.category}
                      onChange={handleChange}
                      className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                    >
                      <option value="">Select a category</option>
                      <option value="canva">Canva</option>
                      <option value="html">HTML</option>
                      <option value="react">React</option>
                      <option value="wordpress">WordPress</option>
                    </select>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-4 border space-y-3">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                      Content Confirmations
                    </p>
                    <FormCheckbox
                      name="agreeOriginal"
                      checked={form.agreeOriginal}
                      onChange={handleChange}
                      label="All templates I upload are my original work"
                    />
                    <FormCheckbox
                      name="agreeCopyright"
                      checked={form.agreeCopyright}
                      onChange={handleChange}
                      label="Templates contain no copyrighted third-party assets"
                    />
                    <FormCheckbox
                      name="agreePolicy"
                      checked={form.agreePolicy}
                      onChange={handleChange}
                      label="I agree to ThemeHub's revenue sharing policy"
                    />
                  </div>

                  {error && <ErrorMessage>{error}</ErrorMessage>}

                  <button
                    onClick={handleNext}
                    className="w-full bg-green-600 hover:bg-green-700 active:scale-[0.99] text-white py-3 rounded-xl font-bold text-sm transition-all"
                  >
                    Continue to KYC & Address →
                  </button>
                </div>
              )}

              {/* ── STEP 2: KYC & ADDRESS ── */}
              {step === 2 && (
                <div className="space-y-4">
                  <SectionTitle>KYC Verification</SectionTitle>
                  <p className="text-xs text-gray-400 -mt-2">
                    Required for compliance. Your data is encrypted and secure.
                  </p>

                  <FormInput
                    label="PAN Number"
                    name="pan_number"
                    value={form.pan_number}
                    onChange={handleChange}
                    placeholder="e.g. ABCDE1234F"
                  />

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Aadhaar Number{" "}
                      <span className="text-gray-400 font-normal">(Optional but recommended)</span>
                    </label>
                    <input
                      type="text"
                      name="aadhaar_number"
                      value={form.aadhaar_number}
                      onChange={handleChange}
                      className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 transition"
                      placeholder="12-digit Aadhaar number"
                    />
                  </div>

                  <div className="pt-2">
                    <SectionTitle>Address</SectionTitle>
                  </div>

                  <FormInput
                    label="Street Address"
                    name="street_address"
                    value={form.street_address}
                    onChange={handleChange}
                    placeholder="House / flat no., street, locality"
                  />

                  <div className="grid grid-cols-2 gap-3">
                    <FormInput
                      label="City"
                      name="city"
                      value={form.city}
                      onChange={handleChange}
                      placeholder="City"
                    />
                    <FormInput
                      label="State"
                      name="state"
                      value={form.state}
                      onChange={handleChange}
                      placeholder="State"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">
                        Pincode <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="pincode"
                        value={form.pincode}
                        onChange={handleChange}
                        className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 transition"
                        placeholder="6-digit pincode"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">
                        Country
                      </label>
                      <input
                        type="text"
                        value="India"
                        disabled
                        className="w-full border rounded-lg px-3 py-2.5 text-sm bg-gray-50 text-gray-500 cursor-not-allowed"
                      />
                    </div>
                  </div>

                  {error && <ErrorMessage>{error}</ErrorMessage>}

                  <div className="flex gap-3 pt-1">
                    <button
                      onClick={handleBack}
                      className="flex-1 border border-gray-300 text-gray-600 py-3 rounded-xl font-bold text-sm hover:bg-gray-50 transition-all"
                    >
                      ← Back
                    </button>
                    <button
                      onClick={handleNext}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-bold text-sm transition-all"
                    >
                      Continue to Bank Details →
                    </button>
                  </div>
                </div>
              )}

              {/* ── STEP 3: BANK DETAILS ── */}
              {step === 3 && (
                <div className="space-y-4">
                  <SectionTitle>Bank Account Details</SectionTitle>
                  <p className="text-xs text-gray-400 -mt-2">
                    Your earnings will be transferred to this account. Details are encrypted and secure.
                  </p>

                  <FormInput
                    label="Account Holder Name"
                    name="account_holder"
                    value={form.account_holder}
                    onChange={handleChange}
                    placeholder="Name as per bank records"
                  />
                  <FormInput
                    label="Bank Name"
                    name="bank_name"
                    value={form.bank_name}
                    onChange={handleChange}
                    placeholder="e.g. State Bank of India"
                  />

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Account Type <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="account_type"
                      value={form.account_type}
                      onChange={handleChange}
                      className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                    >
                      <option value="savings">Savings</option>
                      <option value="current">Current</option>
                    </select>
                  </div>

                  <FormInput
                    label="Account Number"
                    name="account_number"
                    value={form.account_number}
                    onChange={handleChange}
                    placeholder="Enter account number"
                    type="password"
                  />
                  <FormInput
                    label="Confirm Account Number"
                    name="confirm_account_number"
                    value={form.confirm_account_number}
                    onChange={handleChange}
                    placeholder="Re-enter account number"
                  />

                  <div className="grid grid-cols-2 gap-3">
                    <FormInput
                      label="IFSC Code"
                      name="ifsc_code"
                      value={form.ifsc_code}
                      onChange={handleChange}
                      placeholder="e.g. SBIN0001234"
                    />
                    <FormInput
                      label="Branch Name"
                      name="branch_name"
                      value={form.branch_name}
                      onChange={handleChange}
                      placeholder="Branch city / name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      UPI ID{" "}
                      <span className="text-gray-400 font-normal">(Optional)</span>
                    </label>
                    <input
                      name="upi_id"
                      value={form.upi_id}
                      onChange={handleChange}
                      className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                      placeholder="yourname@upi"
                    />
                  </div>

                  {error && <ErrorMessage>{error}</ErrorMessage>}

                  <div className="flex gap-3 pt-1">
                    <button
                      onClick={handleBack}
                      className="flex-1 border border-gray-300 text-gray-600 py-3 rounded-xl font-bold text-sm hover:bg-gray-50 transition-all"
                    >
                      ← Back
                    </button>
                    <button
                      onClick={handleNext}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-bold text-sm transition-all"
                    >
                      Review Application →
                    </button>
                  </div>
                </div>
              )}

              {/* ── STEP 4: REVIEW & SUBMIT ── */}
              {step === 4 && (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <SectionTitle>Review Your Application</SectionTitle>

                  {/* Personal Summary */}
                  <ReviewCard title="Personal & Business Details" onEdit={() => setStep(1)}>
                    <ReviewRow label="Full Name" value={form.full_name} />
                    <ReviewRow label="Email" value={form.email} />
                    <ReviewRow label="Business Name" value={form.business_name} />
                    <ReviewRow label="Business Type" value={form.business_type} />
                    <ReviewRow label="Bio" value={form.bio} />
                    <ReviewRow label="Mobile" value={`+91 ${form.mobile}`} />
                    <ReviewRow label="Category" value={form.category} />
                  </ReviewCard>

                  {/* KYC & Address Summary */}
                  <ReviewCard title="KYC & Address" onEdit={() => setStep(2)}>
                    <ReviewRow label="PAN Number" value={form.pan_number} />
                    <ReviewRow
                      label="Aadhaar"
                      value={
                        form.aadhaar_number
                          ? "•".repeat(8) + form.aadhaar_number.slice(-4)
                          : "Not provided"
                      }
                    />
                    <ReviewRow label="Street" value={form.street_address} />
                    <ReviewRow label="City" value={form.city} />
                    <ReviewRow label="State" value={form.state} />
                    <ReviewRow label="Pincode" value={form.pincode} />
                    <ReviewRow label="Country" value={form.country} />
                  </ReviewCard>

                  {/* Bank Summary */}
                  <ReviewCard title="Bank Details" onEdit={() => setStep(3)}>
                    <ReviewRow label="Account Holder" value={form.account_holder} />
                    <ReviewRow label="Bank" value={form.bank_name} />
                    <ReviewRow label="Account Type" value={form.account_type} />
                    <ReviewRow
                      label="Account Number"
                      value={"•".repeat(form.account_number.length - 4) + form.account_number.slice(-4)}
                    />
                    <ReviewRow label="IFSC" value={form.ifsc_code} />
                    <ReviewRow label="Branch" value={form.branch_name} />
                    {form.upi_id && <ReviewRow label="UPI ID" value={form.upi_id} />}
                  </ReviewCard>

                  {/* Final agreements */}
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-3">
                    <p className="text-xs font-bold text-amber-700 uppercase tracking-wide">
                      Final Confirmations
                    </p>
                    <FormCheckbox
                      name="confirmDetails"
                      checked={form.confirmDetails}
                      onChange={handleChange}
                      label="I confirm that all the above details are correct and accurate"
                    />
                    <FormCheckbox
                      name="agreeTerms"
                      checked={form.agreeTerms}
                      onChange={handleChange}
                      label={
                        <span>
                          I accept the{" "}
                          <a
                            href="/terms"
                            target="_blank"
                            rel="noreferrer"
                            className="text-green-600 underline font-medium"
                            onClick={(e) => e.stopPropagation()}
                          >
                            Terms & Conditions
                          </a>{" "}
                          and{" "}
                          <a
                            href="/privacy"
                            target="_blank"
                            rel="noreferrer"
                            className="text-green-600 underline font-medium"
                            onClick={(e) => e.stopPropagation()}
                          >
                            Privacy Policy
                          </a>
                        </span>
                      }
                    />
                  </div>

                  {error && <ErrorMessage>{error}</ErrorMessage>}

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={handleBack}
                      disabled={submitting}
                      className="flex-1 border border-gray-300 text-gray-600 py-3 rounded-xl font-bold text-sm hover:bg-gray-50 transition-all disabled:opacity-50"
                    >
                      ← Back
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-bold text-sm transition-all disabled:opacity-60 flex items-center justify-center gap-2"
                    >
                      {submitting ? (
                        <>
                          <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Submitting…
                        </>
                      ) : (
                        "Submit Application ✓"
                      )}
                    </button>
                  </div>

                  <p className="text-center text-xs text-gray-400">
                    Your application will be reviewed by our admin team within 1–2 business days.
                  </p>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ============================================================
   SMALL REUSABLE COMPONENTS
   ============================================================ */

function SectionTitle({ children }) {
  return (
    <h2 className="text-base font-bold text-gray-800 pb-1 border-b border-gray-100">
      {children}
    </h2>
  );
}

function FormInput({ label, name, value, onChange, placeholder, type = "text" }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-1">
        {label} <span className="text-red-500">*</span>
      </label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 transition"
        placeholder={placeholder}
      />
    </div>
  );
}

function FormTextarea({ label, name, value, onChange, placeholder }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-1">
        {label} <span className="text-red-500">*</span>
      </label>
      <textarea
        name={name}
        value={value}
        onChange={onChange}
        rows={3}
        className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 transition resize-none"
        placeholder={placeholder}
      />
    </div>
  );
}

function FormCheckbox({ name, checked, onChange, label }) {
  return (
    <label className="flex gap-2.5 items-start cursor-pointer group">
      <input
        type="checkbox"
        name={name}
        checked={checked}
        onChange={onChange}
        className="mt-0.5 accent-green-600 w-4 h-4 flex-shrink-0"
      />
      <span className="text-sm text-gray-700 group-hover:text-gray-900 transition-colors leading-snug">
        {label}
      </span>
    </label>
  );
}

function ReviewCard({ title, children, onEdit }) {
  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between bg-gray-50 px-4 py-2.5 border-b border-gray-200">
        <span className="text-xs font-bold text-gray-600 uppercase tracking-wide">
          {title}
        </span>
        <button
          type="button"
          onClick={onEdit}
          className="text-xs text-green-600 font-semibold hover:underline"
        >
          Edit
        </button>
      </div>
      <div className="px-4 py-3 space-y-2">{children}</div>
    </div>
  );
}

function ReviewRow({ label, value }) {
  return (
    <div className="flex gap-2 text-sm">
      <span className="text-gray-400 w-36 flex-shrink-0">{label}</span>
      <span className="text-gray-800 font-medium break-all">{value || "—"}</span>
    </div>
  );
}

function ErrorMessage({ children }) {
  return (
    <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5">
      <span className="text-red-500 text-base leading-none mt-0.5">⚠</span>
      <p className="text-sm text-red-600 font-medium">{children}</p>
    </div>
  );
}

function StatusCard({ icon, iconBg, title, titleColor, description, children }) {
  return (
    <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
      <div
        className={`w-16 h-16 ${iconBg} rounded-full flex items-center justify-center text-3xl mx-auto mb-4`}
      >
        {icon}
      </div>
      <h1 className={`text-2xl font-bold mb-2 ${titleColor}`}>{title}</h1>
      {description && (
        <p className="text-gray-500 text-sm mb-6 max-w-sm mx-auto">{description}</p>
      )}
      {children}
    </div>
  );
}

function ActionButton({ onClick, variant, children }) {
  return (
    <button
      onClick={onClick}
      className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${
        variant === "primary"
          ? "bg-green-600 hover:bg-green-700 text-white"
          : "border border-gray-300 text-gray-700 hover:bg-gray-50"
      }`}
    >
      {children}
    </button>
  );
}