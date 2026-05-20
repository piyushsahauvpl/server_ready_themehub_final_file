import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    // Check if already logged in via localStorage (admin-specific key) and token presence
    const auth = localStorage.getItem("admin_auth");
    const token = localStorage.getItem("auth_token");
    if (auth === "true" && token) {
      navigate("/admin", { replace: true });
    }
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const API_URL = process.env.REACT_APP_API_URL || "https://uptulathemehub.com/backend/api";
      
      console.log('Attempting admin login with:', { email, API_URL: `${API_URL}/admin/login.php` });

      const res = await fetch(`${API_URL}/admin/login.php`, {
        method: "POST",
        mode: "cors",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });
      
      console.log('Fetch completed, status:', res.status, 'statusText:', res.statusText);

      // Get response text first to debug
      const responseText = await res.text();
      console.log('Response status:', res.status);
      console.log('Response text:', responseText);

      // Try to parse JSON
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        console.error('Response text:', responseText);
        setError("Server returned invalid response. Check console for details.");
        return;
      }

      // Check if response is ok
      if (!res.ok) {
        const errorMsg = data.message || data.debug || `Server error: ${res.status}`;
        console.error('Login failed:', errorMsg);
        setError(errorMsg);
        return;
      }

      if (data.success) {
        // On success, mark admin session in localStorage using admin-specific keys
        const user = data.user || data.data || data;
        const token = data.token || data.auth_token || null;

        localStorage.removeItem('user'); // ensure we don't confuse frontend with admin details
        localStorage.setItem('admin_auth', 'true');
        if (user) localStorage.setItem('admin_user', JSON.stringify(user));
        if (token) localStorage.setItem('auth_token', token);

        // Navigate to admin dashboard
        navigate("/admin", { replace: true });
      } else {
        setError(data.message || "Login failed, please try again.");
      }
    } catch (err) {
      console.error('Login error', err);
      if (err.message.includes('Failed to fetch') || err.message.includes('CORS')) {
        setError("Cannot connect to server. Please check if Apache is running and the API URL is correct.");
      } else {
        setError("Login failed: " + err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 flex justify-center items-center px-4">
      <div className="bg-white p-10 rounded-2xl shadow-xl w-full max-w-md border border-gray-200">

        {/* Heading */}
        <h1 className="text-3xl font-extrabold text-center text-gray-800 mb-2">
          Welcome Back 
        </h1>
        <p className="text-center text-gray-500 mb-8">
          Login to access your admin dashboard
        </p>

        <form onSubmit={handleLogin}>
          {/* Email Input */}
          <label className="text-gray-700 text-sm font-semibold">Email</label>
          <input
            type="email"
            className="w-full border p-3 rounded-lg my-2 focus:ring-2 focus:ring-orange-400 outline-none transition"
            placeholder="Enter admin email"
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
            placeholder="Enter admin password"
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

          {error && (
            <p className="text-red-500 text-sm mb-2">{error}</p>
          )}

          {/* Login Button */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 rounded-lg mt-2 font-semibold text-lg text-white ${
              loading
                ? "bg-gray-400 cursor-not-allowed opacity-75"
                : "bg-green-500 hover:bg-orange-600 shadow-lg hover:shadow-xl transition"
            }`}
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}
