import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch(
        "https://uptulathemehub.com/backend/api/cs/login.php",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({ email, password }),
        }
      );

      const data = await res.json();

      if (data.success) {
        // ✅ FIX: Save the JWT token and user data returned by login.php
        localStorage.setItem("auth", "true");
        localStorage.setItem("cs_token", data.token);         // JWT token for API calls
        localStorage.setItem("cs_user", JSON.stringify(data.user)); // user id, name, role

        navigate("/cs", { replace: true });
      } else {
        alert(data.message || "Login failed");
      }
    } catch (err) {
      alert("Server error. Try again.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 flex justify-center items-center px-4">
      <div className="bg-white p-10 rounded-2xl shadow-xl w-full max-w-md border border-gray-200">

        {/* Heading */}
        <h1 className="text-3xl font-extrabold text-center text-gray-800 mb-2">
          Welcome Back 👋
        </h1>
        <p className="text-center text-gray-500 mb-8">
          Login to access your customer support dashboard
        </p>

        <form onSubmit={handleLogin}>
          {/* Email Input */}
          <label className="text-gray-700 text-sm font-semibold">Email</label>
          <input
            type="email"
            className="w-full border p-3 rounded-lg my-2 focus:ring-2 focus:ring-orange-400 outline-none transition"
            placeholder="Enter Cs email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          {/* Password Input */}
          <label className="text-gray-700 text-sm font-semibold">Password</label>
          <input
            type="password"
            className="w-full border p-3 rounded-lg my-2 focus:ring-2 focus:ring-orange-400 outline-none transition"
            placeholder="Enter Cs password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {/* Forgot Password */}
          <div className="flex justify-end mt-1 mb-4">
            <button
              type="button"
              onClick={() => navigate("/reset-password")}
              className="text-sm text-orange-500 hover:text-orange-600 transition font-medium"
            >
              Forgot Password?
            </button>
          </div>

          {/* Login Button */}
          <button
            type="submit"
            className="w-full bg-green-500 text-white py-3 rounded-lg mt-2 hover:bg-orange-600 shadow-lg hover:shadow-xl transition font-semibold text-lg"
          >
            Sign In
          </button>
        </form>
      </div>
    </div>
  );
}