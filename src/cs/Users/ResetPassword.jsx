import React, { useState } from "react";
import { motion } from "framer-motion";
import { FiLock, FiUser, FiMail, FiAlertCircle, FiCheckCircle, FiEye, FiEyeOff } from "react-icons/fi";
import MainLayout from "../components/MainLayout";

const API_URL = process.env.REACT_APP_API_URL || "https://uptulathemehub.com/backend/api";

export default function ResetPassword() {
  const [userId, setUserId] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [userInfo, setUserInfo] = useState(null);

  const handleSearchUser = async (e) => {
    e.preventDefault();
    if (!userId.trim()) {
      setError("Please enter a user ID");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");
    setUserInfo(null);

    try {
      const token = localStorage.getItem("cs_token");
      const headers = {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };

      // Search for user by ID or email
      const isEmail = userId.includes("@");
      const searchUrl = isEmail 
        ? `${API_URL}/cs/users.php?email=${encodeURIComponent(userId)}`
        : `${API_URL}/cs/users.php?id=${userId}`;
      
      const searchRes = await fetch(searchUrl, {
        headers,
        credentials: "include",
      });

      const searchData = await searchRes.json();
      
      if (searchData.success && searchData.user) {
        setUserInfo(searchData.user);
      } else {
        setError("User not found. Please check the user ID or email.");
      }
    } catch (err) {
      setError("Failed to search for user. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Validation
    if (!newPassword || !confirmPassword) {
      setError("Please fill in all password fields");
      return;
    }

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters long");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (!userInfo || !userInfo.id) {
      setError("Please search for a user first");
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem("cs_token");
      const headers = {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };

      const res = await fetch(`${API_URL}/cs/reset-password.php`, {
        method: "POST",
        headers,
        credentials: "include",
        body: JSON.stringify({
          user_id: userInfo.id,
          new_password: newPassword,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setSuccess(`Password reset successfully for ${data.user.full_name || data.user.email}`);
        setNewPassword("");
        setConfirmPassword("");
        setUserInfo(null);
        setUserId("");
      } else {
        setError(data.message || "Failed to reset password");
      }
    } catch (err) {
      setError("Failed to reset password. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="p-8 bg-gradient-to-br from-slate-50 to-gray-100 min-h-screen"
      >
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-800 mb-2">Reset User Password</h1>
            <p className="text-gray-600">
              Search for a user and reset their password. This feature is available for customer support agents.
            </p>
          </div>

          {/* Search User Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-xl border border-white/20 p-6 mb-6"
          >
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <FiUser className="text-green-600" />
              Search User
            </h2>
            <form onSubmit={handleSearchUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  User ID or Email
                </label>
                <div className="relative">
                  <FiUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    value={userId}
                    onChange={(e) => setUserId(e.target.value)}
                    placeholder="Enter user ID or email"
                    className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-600 focus:outline-none transition-colors"
                    disabled={loading}
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full px-6 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: "#04733c" }}
                onMouseEnter={(e) => {
                  if (!loading) e.currentTarget.style.backgroundColor = "#035a2f";
                }}
                onMouseLeave={(e) => {
                  if (!loading) e.currentTarget.style.backgroundColor = "#04733c";
                }}
              >
                {loading ? "Searching..." : "Search User"}
              </button>
            </form>
          </motion.div>

          {/* User Info Display */}
          {userInfo && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 mb-6"
            >
              <div className="flex items-center gap-3">
                {userInfo.photo_url ? (
                  <img
                    src={userInfo.photo_url}
                    alt={userInfo.full_name}
                    className="w-12 h-12 rounded-full"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                    <FiUser className="w-6 h-6 text-gray-500" />
                  </div>
                )}
                <div>
                  <div className="font-semibold text-gray-800">{userInfo.full_name || "Unknown"}</div>
                  <div className="text-sm text-gray-600">{userInfo.email}</div>
                  <div className="text-xs text-gray-500">ID: {userInfo.id}</div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Reset Password Section */}
          {userInfo && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-xl border border-white/20 p-6"
            >
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <FiLock className="text-green-600" />
                Reset Password
              </h2>
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    New Password
                  </label>
                  <div className="relative">
                    <FiLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password (min 8 characters)"
                      className="w-full pl-10 pr-12 py-3 border-2 border-gray-200 rounded-xl focus:border-green-600 focus:outline-none transition-colors"
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <FiLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new password"
                      className="w-full pl-10 pr-12 py-3 border-2 border-gray-200 rounded-xl focus:border-green-600 focus:outline-none transition-colors"
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showConfirmPassword ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 flex items-center gap-2 text-red-800">
                    <FiAlertCircle className="w-5 h-5" />
                    <span>{error}</span>
                  </div>
                )}

                {success && (
                  <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4 flex items-center gap-2 text-green-800">
                    <FiCheckCircle className="w-5 h-5" />
                    <span>{success}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full px-6 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ backgroundColor: "#04733c" }}
                  onMouseEnter={(e) => {
                    if (!loading) e.currentTarget.style.backgroundColor = "#035a2f";
                  }}
                  onMouseLeave={(e) => {
                    if (!loading) e.currentTarget.style.backgroundColor = "#04733c";
                  }}
                >
                  {loading ? "Resetting Password..." : "Reset Password"}
                </button>
              </form>
            </motion.div>
          )}
        </div>
      </motion.div>
    </MainLayout>
  );
}
