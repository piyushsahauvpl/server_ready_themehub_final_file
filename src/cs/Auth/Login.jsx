import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
 
export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Redirect if already logged in
  useEffect(() => {
    const token = localStorage.getItem("cs_token");
    if (token) {
      navigate("/cs", { replace: true });
    }
  }, [navigate]);
 
 
 
 
 
  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const API_URL = process.env.REACT_APP_API_URL || "https://uptulathemehub.com/backend/api";
      const res = await fetch(`${API_URL}/cs/login.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Login failed");
      }
      localStorage.setItem("cs_token", data.token);
      localStorage.setItem("cs_user", JSON.stringify(data.user));
      navigate("/cs", { replace: true });
    } catch (err) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
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
          <label className="text-gray-700 text-sm font-semibold">
            Password
          </label>
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
 
          {error && <div className="text-red-600 text-sm mb-3">{error}</div>}

          {/* Login Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full text-white py-3 rounded-lg mt-2 shadow-lg hover:shadow-xl transition font-semibold text-lg disabled:opacity-60"
            style={{ backgroundColor: "#04733c" }}
            onMouseEnter={(e) => {
              if (!loading) e.currentTarget.style.backgroundColor = "#035a2f";
            }}
            onMouseLeave={(e) => {
              if (!loading) e.currentTarget.style.backgroundColor = "#04733c";
            }}
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}
