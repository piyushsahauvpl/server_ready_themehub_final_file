import MainLayout from "../components/MainLayout";
import { useState, memo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FiUserPlus, FiUser, FiMail, FiShield, FiLock, FiLoader, FiX, FiCheck } from "react-icons/fi";
 
/* =======================

   REUSABLE INPUT FIELD

   (MOVED OUTSIDE)

======================= */

const InputField = memo(function InputField({

  label,

  name,

  type = "text",

  value,

  placeholder,

  onChange,

}) {

  return (
<div className="group w-full">
<label className="block text-sm font-semibold text-gray-600 mb-1.5 group-focus-within:text-green-700 transition-colors">

        {label}
</label>
 
      <input

        type={type}

        name={name}

        value={value}

        onChange={onChange}

        placeholder={placeholder}

        className="w-full px-4 py-2.5 rounded-lg bg-gray-50 border border-gray-300

        text-gray-700 placeholder-gray-400 focus:outline-none focus:bg-white

        focus:ring-2 focus:ring-green-500 focus:border-transparent

        transition-all duration-200 ease-in-out"

      />
</div>

  );

});
 
/* =======================

        MAIN PAGE

======================= */

export default function AddUser() {

  const [user, setUser] = useState({
    username: "",
    email: "",
    role: "",
    department: "",
    password: "",
    confirmPassword: "",
  });
 
  const navigate = useNavigate();

  // Check if user is authenticated
  useEffect(() => {
    // Check admin-specific auth token
    const auth = localStorage.getItem("admin_auth") === "true";
    if (!auth) {
      navigate("/admin/login", { replace: true });
    }
  }, [navigate]);
 
  const API_URL =
    process.env.REACT_APP_API_URL ||
    "https://uptulathemehub.com/backend/api";
  const ADMIN_API_URL = `${API_URL}/admin`;
 
  /* 🔧 FIXED STATE UPDATE */

  const handleChange = (e) => {

    const { name, value } = e.target;

    setUser((prev) => ({

      ...prev,

      [name]: value,

    }));

  };
 
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage('');
    setSuccessMessage('');

    if (user.password !== user.confirmPassword) {
      setErrorMessage("Passwords do not match");
      setIsSubmitting(false);
      return;
    }

    if (!user.username || !user.email || !user.password) {
      setErrorMessage("Username, email, and password are required");
      setIsSubmitting(false);
      return;
    }

    if (!user.role) {
      setErrorMessage("Please select a role");
      setIsSubmitting(false);
      return;
    }

    const payload = {
      full_name: user.username,
      email: user.email,
      password: user.password,
      role: user.role,
      department: user.department || null,
    };

    try {
      const res = await fetch(`${ADMIN_API_URL}/users.php`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data?.message || "Failed to create user");
        setIsSubmitting(false);
        return;
      }

      setSuccessMessage("User created successfully!");
      setTimeout(() => {
        navigate("/admin/user-list");
      }, 1500);
    } catch (err) {
      console.error(err);
      setErrorMessage("Server error while creating user");
      setIsSubmitting(false);
    }
  };
 
  return (
<MainLayout>
<div className="w-full px-4 py-4">
 
        {/* Header */}
<div className="mb-4">

 
          <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">

            Create New User
</h2>
</div>
 
        {/* Card */}
<div className="w-full bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
<div className="h-2 bg-gradient-to-r from-green-400 via-green-600 to-green-800" />
 
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
 
            {/* Success Message */}
            {successMessage && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-800 font-semibold">{successMessage}</p>
              </div>
            )}

            {/* Error Message */}
            {errorMessage && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800 font-semibold">{errorMessage}</p>
              </div>
            )}
 
            {/* Section 1 */}
            <section className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-6 border border-gray-200">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg">
                  <FiUser className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Personal Information</h3>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
<InputField

                  label="Username"

                  name="username"

                  value={user.username}

                  placeholder="e.g. jdoe123"

                  onChange={handleChange}

                />
<InputField

                  label="Email Address"

                  name="email"

                  type="email"

                  value={user.email}

                  placeholder="john@example.com"

                  onChange={handleChange}

                />
</div>
</section>
 
            {/* Section 2 */}
            <section className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-6 border border-gray-200">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-lg">
                  <FiShield className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Role & Department</h3>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
<div className="group w-full">
<label className="block text-sm font-semibold text-gray-600 mb-1.5">

                    Assign Role
</label>
<select

                    name="role"

                    value={user.role}

                    onChange={handleChange}

                    className="w-full px-4 py-2.5 rounded-lg bg-gray-50 border border-gray-300

                    text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500"
>
<option value="">Select a Role...</option>
<option value="admin">Admin</option>
<option value="manager">Manager</option>
<option value="support">Support</option>
<option value="customer">Customer</option>
</select>
</div>
 
                <InputField

                  label="Department"

                  name="department"

                  value={user.department}

                  placeholder="e.g. Marketing"

                  onChange={handleChange}

                />
</div>
</section>
 
            {/* Section 3 */}
            <section className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-6 border border-gray-200">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-gradient-to-br from-red-500 to-red-600 rounded-lg">
                  <FiLock className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Security</h3>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
<InputField

                  label="Password"

                  name="password"

                  type="password"

                  value={user.password}

                  placeholder="••••••••"

                  onChange={handleChange}

                />
<InputField

                  label="Confirm Password"

                  name="confirmPassword"

                  type="password"

                  value={user.confirmPassword}

                  placeholder="••••••••"

                  onChange={handleChange}

                />
</div>
</section>
 
            {/* Actions */}
            <div className="flex flex-col sm:flex-row justify-end gap-4 pt-6 border-t border-gray-200">
              <button
                type="button"
                className="px-8 py-3 rounded-xl font-semibold text-gray-700 bg-white border-2 border-gray-300 hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 flex items-center justify-center gap-2"
                onClick={() => navigate(-1)}
              >
                <FiX className="w-5 h-5" />
                Cancel
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="px-8 py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 shadow-lg shadow-purple-500/30 transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <FiLoader className="w-5 h-5 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <FiCheck className="w-5 h-5" />
                    Create User
                  </>
                )}
              </button>
            </div>
 
          </form>
</div>
</div>
</MainLayout>

  );

}

 
