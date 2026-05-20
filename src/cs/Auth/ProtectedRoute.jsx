import { useState, useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";

const API_URL = process.env.REACT_APP_API_URL || "https://uptulathemehub.com/backend/api";

export default function ProtectedRoute({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("cs_token");
      if (!token) {
        setIsAuthenticated(false);
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`${API_URL}/cs/check-auth.php`, {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          credentials: "include",
        });
        
        if (!res.ok) {
          // If 401 or 403, clear token and redirect
          if (res.status === 401 || res.status === 403) {
            localStorage.removeItem("cs_token");
            localStorage.removeItem("cs_user");
            setIsAuthenticated(false);
            setLoading(false);
            return;
          }
        }
        
        const data = await res.json();
        setIsAuthenticated(data.success && (data.authenticated === true || data.success === true));
      } catch (err) {
        console.error("Auth check error:", err);
        // On network error, check if we have a token - if yes, allow access (token might be valid)
        // Otherwise, redirect to login
        const token = localStorage.getItem("cs_token");
        if (!token) {
          setIsAuthenticated(false);
        } else {
          // If we have a token but network failed, allow access (might be network issue)
          setIsAuthenticated(true);
        }
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
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-green-600 mb-4" style={{ borderTopColor: "#04733c" }}></div>
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect to login with return URL
    return <Navigate to="/cs/login" state={{ from: location }} replace />;
  }

  return children;
}
