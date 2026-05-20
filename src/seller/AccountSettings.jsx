import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiArrowLeft,
  FiUser,
  FiLoader,
  FiAlertCircle,
  FiCheckCircle,
  FiLock,
  FiEye,
  FiEyeOff
} from 'react-icons/fi';

const API_URL = process.env.REACT_APP_API_URL || "https://uptulathemehub.com/backend/api";

export default function AccountSettings() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editingSection, setEditingSection] = useState(null); // 'personal', 'seller', or null

  const [formData, setFormData] = useState({
    business_name: '',
    bio: '',
    email: '',
    full_name: '',
    phone: '',
    current_password: '',
    new_password: '',
    confirm_password: ''
  });

  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false
  });

  const timerRefs = useRef({});

  /* =======================
     LOAD USER PROFILE
  ======================= */
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        // Fetch user profile
        const res = await fetch(`${API_URL}/profile.php`, {
          credentials: 'include'
        });

        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }

        const data = await res.json();

        if (!data.success || !data.user) {
          setError('Failed to load profile. Please try again.');
          setLoading(false);
          return;
        }

        setFormData(prev => ({
          ...prev,
          email: data.user.email || '',
          full_name: data.user.full_name || '',
          phone: data.user.phone || ''
        }));

        // Fetch seller info (all logged-in users can have seller profiles)
        try {
          const sellerRes = await fetch(`${API_URL}/seller/profile.php`, {
            credentials: 'include'
          });
          if (sellerRes.ok) {
            const sellerData = await sellerRes.json();
            if (sellerData.success && sellerData.seller) {
              setFormData(prev => ({
                ...prev,
                business_name: sellerData.seller.business_name || '',
                bio: sellerData.seller.bio || ''
              }));
            }
          }
        } catch (err) {
          console.warn('Could not load seller info:', err);
        }

        setError('');
        setLoading(false);
      } catch (err) {
        console.error('Error loading profile:', err);
        setError('Unable to load profile. Please try again.');
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  /* =======================
     PASSWORD VISIBILITY
  ======================= */
  const handleShowPassword = (field) => {
    setShowPassword(prev => ({ ...prev, [field]: !prev[field] }));

    if (!showPassword[field]) {
      timerRefs.current[field] = setTimeout(() => {
        setShowPassword(prev => ({ ...prev, [field]: false }));
      }, 2000);
    }
  };

  /* =======================
     SUBMIT
  ======================= */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);

    try {
      if (editingSection === 'personal') {
        // Validate phone is exactly 10 digits
        const digitsOnly = (formData.phone || "").replace(/\D/g, "");
        if (!digitsOnly || digitsOnly.length !== 10) {
          setError("Phone number must be exactly 10 digits");
          setSaving(false);
          return;
        }

        // Update profile with full_name and phone number using FormData
        const formDataObj = new FormData();
        formDataObj.append('full_name', formData.full_name);
        formDataObj.append('phone', digitsOnly);

        const profileRes = await fetch(`${API_URL}/profile.php`, {
          method: 'POST',
          credentials: 'include',
          body: formDataObj
        });

        const profileData = await profileRes.json();

        if (!profileData.success) {
          setError(profileData.message || 'Failed to update profile');
          setSaving(false);
          return;
        }

        setSuccess('Phone number saved successfully!');
        setEditingSection(null);
        setTimeout(() => setSuccess(''), 3000);

      } else if (editingSection === 'seller') {
        // Save seller info to seller profile endpoint
        const sellerRes = await fetch(`${API_URL}/seller/profile.php`, {
          method: 'PUT',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            business_name: formData.business_name,
            bio: formData.bio
          })
        });

        const sellerData = await sellerRes.json();

        if (!sellerData.success) {
          setError(sellerData.message || 'Failed to update seller information');
          setSaving(false);
          return;
        }

        setSuccess('Seller information saved successfully!');
        setEditingSection(null);
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      console.error('Error saving profile:', err);
      setError('Unable to save changes. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  /* =======================
     LOADING
  ======================= */
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <FiLoader className="w-10 h-10 animate-spin text-green-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-green-600 hover:text-green-700 mb-4 font-medium transition"
          >
            <FiArrowLeft className="w-5 h-5" />
            Back
          </button>
          <h1 className="text-4xl font-bold text-gray-900">Your Details</h1>
          <p className="text-gray-600 mt-2">Manage your personal and seller information</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 animate-pulse">
            <FiAlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-red-800 font-medium">{error}</p>
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-start gap-3 animate-pulse">
            <FiCheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <p className="text-green-800 font-medium">{success}</p>
          </div>
        )}

        {/* Content */}
        <div className="space-y-6">

          {/* ===== PERSONAL INFORMATION SECTION ===== */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            
            {/* Display Mode */}
            {editingSection !== 'personal' ? (
              <div className="p-6 md:p-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-semibold text-gray-900 flex items-center gap-3">
                    <FiUser className="w-6 h-6 text-green-600" />
                    Personal Information
                  </h2>
                  <button
                    onClick={() => setEditingSection('personal')}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition"
                  >
                    Edit
                  </button>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  {/* Full Name Card */}
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Full Name</p>
                    <p className="text-xl font-semibold text-gray-900">{formData.full_name || 'Not provided'}</p>
                  </div>

                  {/* Email Card */}
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Email</p>
                    <p className="text-xl font-semibold text-gray-900">{formData.email || 'Not provided'}</p>
                  </div>

                  {/* Phone Card */}
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Phone Number</p>
                    <p className="text-xl font-semibold text-gray-900">{formData.phone || 'Not provided'}</p>
                  </div>
                </div>
              </div>
            ) : (
              /* Edit Mode */
              <form onSubmit={handleSubmit} className="p-6 md:p-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-semibold text-gray-900">Edit Personal Information</h2>
                  <button
                    type="button"
                    onClick={() => setEditingSection(null)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-4 mb-6">
                  {/* Full Name - Read Only */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                    <input
                      type="text"
                      disabled
                      value={formData.full_name}
                      className="w-full px-4 py-3 bg-gray-100 border border-gray-300 rounded-lg text-gray-700 cursor-not-allowed"
                    />
                    <p className="text-xs text-gray-500 mt-1">Read-only field</p>
                  </div>

                  {/* Email - Read Only */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                    <input
                      type="email"
                      disabled
                      value={formData.email}
                      className="w-full px-4 py-3 bg-gray-100 border border-gray-300 rounded-lg text-gray-700 cursor-not-allowed"
                    />
                    <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                  </div>

                  {/* Phone - Editable */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="Enter your 10-digit phone number"
                      value={formData.phone}
                      onChange={(e) => {
                        // Only allow digits, max 10
                        const digitsOnly = e.target.value.replace(/\D/g, '').slice(0, 10);
                        setFormData({ ...formData, phone: digitsOnly });
                      }}
                      maxLength="10"
                      className={`w-full px-4 py-3 border-2 rounded-lg text-gray-900 placeholder-gray-400 focus:ring-2 focus:border-transparent outline-none transition ${
                        formData.phone.length === 10
                          ? 'border-green-500 focus:ring-green-500'
                          : formData.phone.length > 0
                          ? 'border-red-500 focus:ring-red-500'
                          : 'border-gray-300 focus:ring-green-500'
                      }`}
                    />
                    <div className="mt-2 flex items-center gap-2">
                      {formData.phone.length === 0 && (
                        <p className="text-xs text-gray-500">Enter 10 digits</p>
                      )}
                      {formData.phone.length > 0 && formData.phone.length < 10 && (
                        <p className="text-xs text-red-600 font-medium">
                          ✗ Invalid number ({formData.phone.length}/10 digits)
                        </p>
                      )}
                      {formData.phone.length === 10 && (
                        <p className="text-xs text-green-600 font-medium">
                          ✓ Valid phone number
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={saving || (editingSection === 'personal' && formData.phone.length !== 10)}
                    className="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
                  >
                    {saving ? (
                      <>
                        <FiLoader className="w-4 h-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      'Save Changes'
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingSection(null)}
                    className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* ===== SELLER INFORMATION SECTION ===== */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            
            {/* Display Mode */}
            {editingSection !== 'seller' ? (
              <div className="p-6 md:p-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-semibold text-gray-900 flex items-center gap-3">
                    <i className="fas fa-store text-green-600 text-xl"></i>
                    Seller Information
                  </h2>
                  <button
                    onClick={() => setEditingSection('seller')}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition"
                  >
                    Edit
                  </button>
                </div>

                <div className="space-y-4">
                  {/* Business Name Card */}
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Business Name</p>
                    <p className="text-xl font-semibold text-gray-900">{formData.business_name || 'Not provided'}</p>
                  </div>

                  {/* Bio Card */}
                  {formData.bio && (
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Business Bio</p>
                      <p className="text-gray-700 leading-relaxed">{formData.bio}</p>
                    </div>
                  )}
                  {!formData.bio && (
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 text-center">
                      <p className="text-gray-500">No business bio added yet</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* Edit Mode */
              <form onSubmit={handleSubmit} className="p-6 md:p-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-semibold text-gray-900">Edit Seller Information</h2>
                  <button
                    type="button"
                    onClick={() => setEditingSection(null)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-4 mb-6">
                  {/* Business Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Business Name</label>
                    <input
                      type="text"
                      placeholder="Enter your business name"
                      value={formData.business_name}
                      onChange={e => setFormData({ ...formData, business_name: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition"
                    />
                  </div>

                  {/* Bio */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Business Bio</label>
                    <textarea
                      placeholder="Tell customers about your business..."
                      value={formData.bio}
                      onChange={e => setFormData({ ...formData, bio: e.target.value })}
                      rows="5"
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition resize-none"
                    />
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
                  >
                    {saving ? (
                      <>
                        <FiLoader className="w-4 h-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      'Save Changes'
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingSection(null)}
                    className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
