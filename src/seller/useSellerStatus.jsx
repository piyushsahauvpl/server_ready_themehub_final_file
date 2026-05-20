import { useEffect, useState, useCallback } from "react";

const API_URL =
  process.env.REACT_APP_API_URL ||
  "https://uptulathemehub.com/backend/api";

export default function useSellerStatus() {
  const [seller, setSeller] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchSellerStatus = useCallback(async () => {
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/seller/check.php`, {
        credentials: "include",
        cache: "no-cache",
      });

      const contentType = res.headers.get("content-type") || "";
      if (!contentType.includes("application/json")) {
        console.error("Seller check did not return JSON");
        setSeller(null);
        return;
      }

      const data = await res.json();

      if (data?.success) {
        setSeller(data.seller || null);
      } else {
        setSeller(null);
      }
    } catch (err) {
      console.error("Seller status error:", err);
      setSeller(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSellerStatus();
  }, [fetchSellerStatus]);

  return {
    seller,
    loading,
    refetchSeller: fetchSellerStatus,
  };
}
