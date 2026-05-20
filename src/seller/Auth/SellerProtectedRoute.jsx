import { useState, useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";

const API_URL = process.env.REACT_APP_API_URL || "https://uptulathemehub.com/backend/api";

export default function SellerProtectedRoute({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Check seller authentication status
        const res = await fetch(`${API_URL}/seller/check-auth.php`, {
          method: "GET",
          credentials: "include",
        });

        if (!res.ok) {
          // If 401 or 403, not authenticated
          if (res.status === 401 || res.status === 403) {
            setIsAuthenticated(false);
            setLoading(false);
            return;
          }
        }

        const data = await res.json();
        // User is authenticated if seller check returns success with seller data
        setIsAuthenticated(data.success && data.seller);
      } catch (err) {
        console.error("Seller auth check error:", err);
        setIsAuthenticated(false);
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
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}
