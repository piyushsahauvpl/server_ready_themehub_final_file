import { useState, useEffect } from "react";
import { FiAlertTriangle, FiCheck, FiLoader } from "react-icons/fi";
 
export default function SellerRejectionAlert() {
  const [rejectionStatus, setRejectionStatus] = useState(null);
  const [loading, setLoading] = useState(true);
 
  const API_URL =
    process.env.REACT_APP_API_URL ||
    "https://uptulathemehub.com/backend/api";
  const SELLER_API_URL = `${API_URL}/seller`;
 
  useEffect(() => {
    fetchRejectionStatus();
  }, []);
 
  const fetchRejectionStatus = async () => {
    try {
      const res = await fetch(`${SELLER_API_URL}/rejection-status.php`, {
        credentials: "include",
      });
 
      if (!res.ok) {
        console.error("Failed to fetch rejection status");
        setLoading(false);
        return;
      }
 
      const data = await res.json();
      if (data.success && data.seller) {
        setRejectionStatus(data.seller);
      }
    } catch (err) {
      console.error("Error fetching rejection status:", err);
    } finally {
      setLoading(false);
    }
  };
 
  if (loading) {
    return null;
  }
 
  if (!rejectionStatus) {
    return null;
  }
 
  if (rejectionStatus.status === "rejected") {
    return (
      <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-600 rounded">
        <div className="flex items-start gap-3">
          <FiAlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-bold text-red-800 mb-1">Application Rejected</h3>
            <p className="text-red-700 text-sm mb-2">
              <strong>Reason:</strong> {rejectionStatus.rejection_reason}
            </p>
            <p className="text-red-600 text-xs">
              Rejected on{" "}
              {new Date(rejectionStatus.rejection_date).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>
    );
  }
 
  if (rejectionStatus.status === "verified") {
    return (
      <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-600 rounded">
        <div className="flex items-center gap-3">
          <FiCheck className="w-6 h-6 text-green-600" />
          <div>
            <h3 className="font-bold text-green-800">Seller Approved</h3>
            <p className="text-green-700 text-sm">
              Your seller application has been approved!
            </p>
          </div>
        </div>
      </div>
    );
  }
 
  if (rejectionStatus.status === "pending") {
    return (
      <div className="mb-6 p-4 bg-blue-50 border-l-4 border-blue-600 rounded">
        <div className="flex items-center gap-3">
          <FiLoader className="w-6 h-6 text-blue-600 animate-spin" />
          <div>
            <h3 className="font-bold text-blue-800">Application Pending</h3>
            <p className="text-blue-700 text-sm">
              Your seller application is being reviewed. Please check back soon.
            </p>
          </div>
        </div>
      </div>
    );
  }
 
  return null;
}
 
 