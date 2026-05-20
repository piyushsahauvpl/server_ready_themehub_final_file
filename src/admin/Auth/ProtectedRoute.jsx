import { Navigate } from "react-router-dom";
import { useState, useEffect } from "react";

export default function ProtectedRoute({ children }) {
  const [isAuth, setIsAuth] = useState(null); // null = checking, true/false = result
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const API_URL = process.env.REACT_APP_API_URL || "https://uptulathemehub.com/backend/api";
        const token = localStorage.getItem('auth_token');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        const res = await fetch(`${API_URL}/admin/check-auth.php`, {
          credentials: "include",
          headers,
        });
        
        const data = await res.json();
        
        if (data.authenticated) {
          setIsAuth(true);
          localStorage.setItem("admin_auth", "true");
          localStorage.setItem("admin_user", JSON.stringify(data.user));
        } else {
          localStorage.removeItem("admin_auth");
          localStorage.removeItem("admin_user");
          localStorage.removeItem("auth_token");
          setIsAuth(false);
        }
      } catch (err) {
        console.error("Auth check error:", err);
        localStorage.removeItem("admin_auth");
        localStorage.removeItem("admin_user");
        localStorage.removeItem("auth_token");
        setIsAuth(false);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  if (!isAuth) {
    return <Navigate to="/admin/login" replace />;
  }

  return children;
}
