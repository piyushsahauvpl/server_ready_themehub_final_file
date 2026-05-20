import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiEye, FiEyeOff, FiLock } from "react-icons/fi";

export default function ResetPassword() {
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [showPass1, setShowPass1] = useState(false);
  const [showPass2, setShowPass2] = useState(false);
  const [success, setSuccess] = useState("");

  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();

    if (newPass.length < 6) {
      alert("Password must be at least 6 characters!");
      return;
    }

    if (newPass !== confirmPass) {
      alert("Passwords do not match!");
      return;
    }

    setSuccess("Your password has been reset successfully!");
    setNewPass("");
    setConfirmPass("");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black/95 px-4">
      <div className="bg-gray-900 p-10 rounded-2xl shadow-2xl w-full max-w-md border border-gray-700">

        {/* Logo */}
        <div className="flex justify-center mb-4">
          <h1 className="text-3xl font-extrabold text-green-400">Uptula</h1>
        </div>

        {/* Heading */}
        <h2 className="text-2xl font-bold text-center text-white mb-1">
          Reset Password <FiLock className="inline-block text-green-400" />
        </h2>

        <p className="text-center text-gray-400 mb-6">
          Create a new password for your account
        </p>

        {/* Success Message */}
        {success && (
          <p className="mb-4 text-green-400 font-semibold text-center">
            {success}
          </p>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit}>

          {/* New Password Field */}
          <label className="text-gray-300 text-sm font-medium">New Password</label>
          <div className="relative">
            <input
              type={showPass1 ? "text" : "password"}
              value={newPass}
              onChange={(e) => setNewPass(e.target.value)}
              className="w-full border border-gray-700 bg-gray-800 text-white p-3 pr-10 rounded-lg mt-1 
                         focus:ring-2 focus:ring-green-400 outline-none transition"
              placeholder="Enter new password"
              required
            />
            <span
              className="absolute right-3 top-4 cursor-pointer text-gray-400"
              onClick={() => setShowPass1(!showPass1)}
            >
              {showPass1 ? <FiEyeOff /> : <FiEye />}
            </span>
          </div>

          {/* Confirm Password Field */}
          <label className="text-gray-300 text-sm font-medium mt-4 block">
            Confirm Password
          </label>
          <div className="relative">
            <input
              type={showPass2 ? "text" : "password"}
              value={confirmPass}
              onChange={(e) => setConfirmPass(e.target.value)}
              className="w-full border border-gray-700 bg-gray-800 text-white p-3 pr-10 rounded-lg mt-1 
                         focus:ring-2 focus:ring-green-400 outline-none transition"
              placeholder="Confirm password"
              required
            />
            <span
              className="absolute right-3 top-4 cursor-pointer text-gray-400"
              onClick={() => setShowPass2(!showPass2)}
            >
              {showPass2 ? <FiEyeOff /> : <FiEye />}
            </span>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full bg-green-500 hover:bg-green-600 text-black font-semibold py-3 rounded-lg mt-6 
                       shadow-lg hover:shadow-green-500/30 transition"
          >
            Set New Password
          </button>
        </form>

        {/* Back to login */}
        <div
          onClick={() => navigate("/login")}
          className="text-center text-green-400 mt-4 cursor-pointer hover:underline"
        >
          ← Back to Login
        </div>
      </div>
    </div>
  );
}
