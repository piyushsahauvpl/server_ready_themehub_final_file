// import MainLayout from "../components/MainLayout";
// import { FiEye } from "react-icons/fi";
// import { useState } from "react";

// const statusClasses = {
//   Delivered: "text-green-700 bg-green-100",
//   Shipped: "text-blue-700 bg-blue-100",
//   Processing: "text-yellow-700 bg-yellow-100",
// };

// const initialOrders = [
//   {
//     id: 103,
//     customer: "David Johnson",
//     template: "React Portfolio Template",
//     total: 400.0,
//     date: "2025-03-10",
//     status: "Delivered"
//   },
//   {
//     id: 102,
//     customer: "Sarah Smith",
//     template: "Shopify Ecommerce Theme",
//     total: 99.99,
//     date: "2025-03-11",
//     status: "Shipped"
//   },
//   {
//     id: 101,
//     customer: "John Doe",
//     template: "Next.js Landing Page",
//     total: 250.0,
//     date: "2025-03-12",
//     status: "Processing"
//   },
// ];

// export default function Orders() {
//   const [orders, setOrders] = useState(initialOrders);
//   const [search, setSearch] = useState("");

//   const filteredOrders = orders.filter((o) =>
//     o.customer.toLowerCase().includes(search.toLowerCase())
//   );

//   const updateStatus = (id, newStatus) => {
//     setOrders((prev) =>
//       prev.map((o) => (o.id === id ? { ...o, status: newStatus } : o))
//     );
//   };

//   return (
//     <MainLayout>
//       {/* Breadcrumb */}
//       {/* <div className="text-gray-500 text-sm mb-3">
//         Home / <span className="text-gray-800 font-medium">Orders</span>
//       </div> */}

//       <h2 className="text-2xl font-bold text-gray-800 mb-6">Order List</h2>

//       {/* Search */}
//       <div className="mb-4">
//         <input
//           type="text"
//           placeholder="Search Order..."
//           className="border p-2 rounded-lg w-64 focus:ring-2 focus:ring-green-500"
//           onChange={(e) => setSearch(e.target.value)}
//         />
//       </div>

//       {/* Order Table */}
//       <div className="bg-white shadow-md rounded-xl p-4 overflow-x-auto">
//         <table className="table-auto w-full text-left text-gray-700">
//           <thead className="font-semibold bg-gray-100 text-gray-800">
//             <tr>
//               <th className="p-3">↕ Order ID</th>
//               <th className="p-3">↕ Customer</th>
//               <th className="p-3">↕ Purchased Template</th>
//               <th className="p-3">↕ Total</th>
//               <th className="p-3">↕ Status</th>
//               <th className="p-3">↕ Date</th>
//               <th className="p-3">↕ Change Status</th>
//               <th className="p-3 text-center">Actions</th>
//             </tr>
//           </thead>

//           <tbody>
//             {filteredOrders.map((o) => (
//               <tr key={o.id} className="border-b hover:bg-gray-50">
//                 <td className="p-3">{o.id}</td>
//                 <td className="p-3">{o.customer}</td>

//                 {/* NEW PURCHASED TEMPLATE COLUMN */}
//                 <td className="p-3 font-medium text-gray-800">{o.template}</td>

//                 <td className="p-3 font-semibold">₹{o.total.toFixed(2)}</td>

//                 <td className="p-3">
//                   <span className={`px-3 py-1 text-sm rounded-lg ${statusClasses[o.status]}`}>
//                     {o.status}
//                   </span>
//                 </td>

//                 <td className="p-3">{o.date}</td>

//                 <td className="p-3">
//                   <select
//                     className="border rounded-lg p-1 focus:ring-2 focus:ring-green-400"
//                     value={o.status}
//                     onChange={(e) => updateStatus(o.id, e.target.value)}
//                   >
//                     <option>Delivered</option>
//                     <option>Shipped</option>
//                     <option>Processing</option>
//                   </select>
//                 </td>

//                 <td className="p-3 text-center">
//                   <button className="border rounded-full p-2 hover:bg-gray-200 transition">
//                     <FiEye className="text-blue-600" size={18} />
//                   </button>
//                 </td>
//               </tr>
//             ))}
//           </tbody>
//         </table>
//       </div>

//       {/* Total Count */}
//       <p className="text-sm text-gray-600 mt-3">Total Records: {filteredOrders.length}</p>

//       {/* Pagination UI */}
//       <div className="flex justify-end mt-3 gap-2">
//         <button className="px-3 py-1 border rounded hover:bg-gray-200">{"<"}</button>
//         <span className="px-4 py-1 bg-green-500 text-white rounded">1</span>
//         <button className="px-3 py-1 border rounded hover:bg-gray-200">{">"}</button>
//       </div>
//     </MainLayout>
//   );
// }



import MainLayout from "../components/MainLayout";
import { FiEye } from "react-icons/fi";
import { useState, useEffect } from "react";

const statusClasses = {
  Delivered: "text-green-700 bg-green-100",
  Shipped: "text-blue-700 bg-blue-100",
  Processing: "text-yellow-700 bg-yellow-100",
};

// NOTE: The component will fetch orders from the backend. The default endpoint is `/api/orders`.
// If your backend exposes admin-specific routes, adjust `API_URL` or the path accordingly.
export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const API_URL = `${process.env.REACT_APP_API_URL || "https://uptulathemehub.com/backend/api"}/cs`;

  useEffect(() => {
    let mounted = true;
    const token = localStorage.getItem("token");

    const fetchOrders = async () => {
      setLoading(true);
      setError("");
      try {
        // call admin API directly (send session cookie)
        let res = await fetch(`${API_URL}/orders.php`, {
          credentials: 'include',
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });

        if (!res.ok) {
          let text = await res.text();
          try {
            const json = JSON.parse(text);
            text = json.message || JSON.stringify(json);
          } catch (e) {
            // leave text as-is
          }
          throw new Error(text || "Failed to fetch orders");
        }

        const data = await res.json();
        const list = Array.isArray(data) ? data : data.orders || data.data || [];

        const normalized = list.map((o) => ({
          id: o.id || o._id || o.orderId || o.order_id,
          customer:
            (o.customer && (o.customer.name || `${o.customer.firstName || ""} ${o.customer.lastName || ""}`.trim())) ||
            (o.user && (o.user.name || `${o.user.firstName || ""} ${o.user.lastName || ""}`.trim())) ||
            (o.billing && o.billing.name) ||
            o.customerName ||
            "Unknown",
          template:
            (o.items && o.items.length && (o.items[0].template?.title || o.items[0].name || o.items[0].templateName)) ||
            o.templateName ||
            "-",
          total: o.total || o.amount || o.subtotal || 0,
          date: new Date(o.createdAt || o.created_at || o.date || Date.now()).toLocaleDateString(),
          status: o.status || o.order_status || "Processing",
        }));

        if (mounted) setOrders(normalized);
      } catch (err) {
        console.error(err);
        const msg = err.message || "Error loading orders";
        if (mounted) setError(msg.toLowerCase().includes('unauthorized') ? 'You are not logged in to admin — please login at /admin/login.' : msg);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchOrders();
    return () => {
      mounted = false;
    };
  }, [API_URL]);

  const filteredOrders = orders.filter((o) =>
    (o.customer || "").toLowerCase().includes(search.toLowerCase())
  );

  const updateStatus = async (id, newStatus) => {
    // optimistic update
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status: newStatus } : o)));

    const token = localStorage.getItem("token");
    try {
      // send PATCH to admin orders endpoint (use PATH_INFO-style URL)
      let res = await fetch(`${API_URL}/orders.php/${id}`, {
        credentials: 'include',
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) {
        let text = await res.text();
        try {
          const json = JSON.parse(text);
          text = json.message || JSON.stringify(json);
        } catch (e) {
          // leave text as-is
        }
        throw new Error(text || "Failed to update status");
      }

      // optionally you could re-fetch the single order here for accuracy
    } catch (err) {
      console.error(err);
      const msg = err.message || "Failed to update status";
      setError(msg.toLowerCase().includes('unauthorized') ? 'You are not logged in to admin — please login at /admin/login.' : msg);
    }
  };

  return (
    <MainLayout>
      {/* Breadcrumb */}
      

      <h2 className="text-2xl font-bold text-gray-800 mb-6">Order List</h2>

      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search Order..."
          className="border p-2 rounded-lg w-64 focus:ring-2 focus:ring-green-500"
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {error && <p className="text-red-500 mb-3">{error}</p>}

      {/* Order Table */}
      <div className="bg-white shadow-md rounded-xl p-4 overflow-x-auto">
        {loading ? (
          <div className="text-center py-8 text-gray-600">Loading orders...</div>
        ) : (
          <table className="table-auto w-full text-left text-gray-700">
            <thead className="font-semibold bg-gray-100 text-gray-800">
              <tr>
                <th className="p-3">↕ Order ID</th>
                <th className="p-3">↕ Customer</th>
                <th className="p-3">↕ Purchased Template</th>
                <th className="p-3">↕ Total</th>
                <th className="p-3">↕ Status</th>
                <th className="p-3">↕ Date</th>
                <th className="p-3">↕ Change Status</th>
                <th className="p-3 text-center">Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredOrders.map((o) => (
                <tr key={o.id} className="border-b hover:bg-gray-50">
                  <td className="p-3">{o.id}</td>
                  <td className="p-3">{o.customer}</td>

                  {/* NEW PURCHASED TEMPLATE COLUMN */}
                  <td className="p-3 font-medium text-gray-800">{o.template}</td>

                  <td className="p-3 font-semibold">₹{(o.total || 0).toFixed(2)}</td>

                  <td className="p-3">
                    <span className={`px-3 py-1 text-sm rounded-lg ${statusClasses[o.status]}`}>
                      {o.status}
                    </span>
                  </td>

                  <td className="p-3">{o.date}</td>

                  <td className="p-3">
                    <select
                      className="border rounded-lg p-1 focus:ring-2 focus:ring-green-400"
                      value={o.status}
                      onChange={(e) => updateStatus(o.id, e.target.value)}
                    >
                      <option>Delivered</option>
                      <option>Shipped</option>
                      <option>Processing</option>
                    </select>
                  </td>

                  <td className="p-3 text-center">
                    <button className="border rounded-full p-2 hover:bg-gray-200 transition">
                      <FiEye className="text-blue-600" size={18} />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredOrders.length === 0 && !loading && (
                <tr>
                  <td colSpan={8} className="p-6 text-center text-gray-500">No orders found.</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Total Count */}
      <p className="text-sm text-gray-600 mt-3">Total Records: {filteredOrders.length}</p>

      {/* Pagination UI */}
      <div className="flex justify-end mt-3 gap-2">
        <button className="px-3 py-1 border rounded hover:bg-gray-200">{"<"}</button>
        <span className="px-4 py-1 bg-green-500 text-white rounded">1</span>
        <button className="px-3 py-1 border rounded hover:bg-gray-200">{">"}</button>
      </div>
    </MainLayout>
  );
}

