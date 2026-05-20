// import { useState } from "react";
// import MainLayout from "../components/MainLayout";
// import { FiCheckCircle } from "react-icons/fi";

// const statusStyles = {
//   Paid: "bg-green-100 text-green-700",
//   Refunded: "bg-red-100 text-red-700",
//   Hold: "bg-yellow-100 text-yellow-700",
// };

// const initialPayments = [
//   {
//     id: "PAY-101",
//     orderId: 103,
//     customer: "David Johnson",
//     amount: "₹400.00",
//     method: "UPI",
//     status: "Paid",
//     date: "2025-03-10",
//   },
//   {
//     id: "PAY-102",
//     orderId: 102,
//     customer: "Sarah Smith",
//     amount: "₹99.99",
//     method: "Card",
//     status: "Refunded",
//     date: "2025-03-11",
//   },
//   {
//     id: "PAY-103",
//     orderId: 101,
//     customer: "John Doe",
//     amount: "₹250.00",
//     method: "Net Banking",
//     status: "Hold",
//     date: "2025-03-12",
//   },
// ];

// export default function PaymentStatus() {
//   const [payments, setPayments] = useState(initialPayments);
//   const [tempStatus, setTempStatus] = useState({});
//   const [search, setSearch] = useState("");
//   const [toast, setToast] = useState("");

//   const showToast = (msg) => {
//     setToast(msg);
//     setTimeout(() => setToast(""), 2000);
//   };

//   const handleSelectChange = (id, value) => {
//     setTempStatus((prev) => ({ ...prev, [id]: value }));
//   };

//   const saveStatus = (id) => {
//     const newStatus = tempStatus[id];
//     if (!newStatus) return;

//     setPayments((prev) =>
//       prev.map((p) => (p.id === id ? { ...p, status: newStatus } : p))
//     );

//     showToast("Status updated successfully!");
//   };

//   const filteredPayments = payments.filter(
//     (p) =>
//       p.customer.toLowerCase().includes(search.toLowerCase()) ||
//       p.id.toLowerCase().includes(search.toLowerCase())
//   );

//   return (
//     <MainLayout>
//       {/* TOAST NOTIFICATION */}
//       {toast && (
//         <div
//           className="
//             fixed top-5 right-5 bg-green-600 text-white
//             px-4 py-2 rounded-lg shadow-lg
//             animate-toast
//           "
//         >
//           {toast}
//         </div>
//       )}

//       {/* Breadcrumb */}
//       {/* <div className="text-gray-500 text-sm mb-3">
//         Home / Orders /{" "}
//         <span className="font-medium text-gray-800">Payment Status</span>
//       </div> */}

//       <h2 className="text-2xl font-bold text-gray-800 mb-6">
//         Payment Status
//       </h2>

//       {/* SEARCH */}
//       <div className="mb-4">
//         <input
//           type="text"
//           placeholder="Search Payment / Customer..."
//           className="border p-2 rounded-lg w-80 focus:ring-2 focus:ring-green-500"
//           value={search}
//           onChange={(e) => setSearch(e.target.value)}
//         />
//       </div>

//       {/* TABLE */}
//       <div className="bg-white shadow-md rounded-xl p-4 overflow-x-auto">
//         <table className="w-full text-left text-gray-700">
//           <thead className="bg-gray-100 text-gray-800">
//             <tr>
//               <th className="p-3">Payment ID</th>
//               <th className="p-3">Order ID</th>
//               <th className="p-3">Customer</th>
//               <th className="p-3">Amount</th>
//               <th className="p-3">Method</th>
//               <th className="p-3">Status</th>
//               <th className="p-3">Change</th>
//               <th className="p-3">Save</th>
//               <th className="p-3">Date</th>
//             </tr>
//           </thead>

//           <tbody>
//             {filteredPayments.map((p) => (
//               <tr key={p.id} className="border-b hover:bg-gray-50 transition">
//                 <td className="p-3 font-medium">{p.id}</td>
//                 <td className="p-3">{p.orderId}</td>
//                 <td className="p-3">{p.customer}</td>
//                 <td className="p-3 font-semibold">{p.amount}</td>
//                 <td className="p-3">{p.method}</td>

//                 <td className="p-3">
//                   <span
//                     className={`px-3 py-1 rounded-full text-sm font-medium ${statusStyles[p.status]}`}
//                   >
//                     {p.status}
//                   </span>
//                 </td>

//                 <td className="p-3">
//                   <select
//                     value={tempStatus[p.id] ?? p.status}
//                     onChange={(e) =>
//                       handleSelectChange(p.id, e.target.value)
//                     }
//                     className="border rounded-lg px-3 py-1 text-sm focus:ring-2 focus:ring-green-500"
//                   >
//                     <option value="Paid">Paid</option>
//                     <option value="Refunded">Refunded</option>
//                     <option value="Hold">Hold</option>
//                   </select>
//                 </td>

//                 {/* ANIMATED SAVE BUTTON */}
//                 <td className="p-3">
//                   <button
//                     onClick={() => saveStatus(p.id)}
//                     title="Save updated status"
//                     className="
//                       p-2 rounded-full bg-green-100 text-green-700
//                       hover:bg-green-600 hover:text-white
//                       transition-all duration-300
//                       shadow-sm hover:shadow-md
//                       cursor-pointer
//                     "
//                   >
//                     <FiCheckCircle
//                       size={18}
//                       className="transition-transform duration-300 hover:scale-125"
//                     />
//                   </button>
//                 </td>

//                 <td className="p-3">{p.date}</td>
//               </tr>
//             ))}
//           </tbody>
//         </table>
//       </div>

//       {/* ANIMATIONS */}
//       <style>{`
//         @keyframes toastSlide {
//           from { opacity: 0; transform: translateY(-10px); }
//           to   { opacity: 1; transform: translateY(0); }
//         }
//         .animate-toast {
//           animation: toastSlide 0.3s ease-out;
//         }
//       `}</style>
//     </MainLayout>
//   );
// }

import { useState } from "react";
import MainLayout from "../components/MainLayout";
import { FiCheckCircle } from "react-icons/fi";

const statusStyles = {
  Paid: "bg-green-100 text-green-700",
  Refunded: "bg-red-100 text-red-700",
  Hold: "bg-yellow-100 text-yellow-700",
};

const initialPayments = [
  {
    id: "PAY-101",
    orderId: 103,
    customer: "David Johnson",
    amount: "₹400.00",
    method: "UPI",
    status: "Paid",
    date: "2025-03-10",
  },
  {
    id: "PAY-102",
    orderId: 102,
    customer: "Sarah Smith",
    amount: "₹99.99",
    method: "Card",
    status: "Refunded",
    date: "2025-03-11",
  },
  {
    id: "PAY-103",
    orderId: 101,
    customer: "John Doe",
    amount: "₹250.00",
    method: "Net Banking",
    status: "Hold",
    date: "2025-03-12",
  },
];

export default function PaymentStatus() {
  const [payments, setPayments] = useState(initialPayments);
  const [tempStatus, setTempStatus] = useState({});
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState("");

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2000);
  };

  const handleSelectChange = (id, value) => {
    setTempStatus((prev) => ({ ...prev, [id]: value }));
  };

  const saveStatus = (id) => {
    const newStatus = tempStatus[id];
    if (!newStatus) return;

    setPayments((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status: newStatus } : p))
    );

    showToast("Status updated successfully!");
  };

  const filteredPayments = payments.filter(
    (p) =>
      p.customer.toLowerCase().includes(search.toLowerCase()) ||
      p.id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <MainLayout>
      {/* TOAST NOTIFICATION */}
      {toast && (
        <div
          className="
            fixed top-5 right-5 bg-green-600 text-white 
            px-4 py-2 rounded-lg shadow-lg 
            animate-toast
          "
        >
          {toast}
        </div>
      )}

      {/* Breadcrumb */}
    

      <h2 className="text-2xl font-bold text-gray-800 mb-6">
        Payment Status
      </h2>

      {/* SEARCH */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search Payment / Customer..."
          className="border p-2 rounded-lg w-80 focus:ring-2 focus:ring-green-500"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* TABLE */}
      <div className="bg-white shadow-md rounded-xl p-4 overflow-x-auto">
        <table className="w-full text-left text-gray-700">
          <thead className="bg-gray-100 text-gray-800">
            <tr>
              <th className="p-3">Payment ID</th>
              <th className="p-3">Order ID</th>
              <th className="p-3">Customer</th>
              <th className="p-3">Amount</th>
              <th className="p-3">Method</th>
              <th className="p-3">Status</th>
              <th className="p-3">Change</th>
              <th className="p-3">Save</th>
              <th className="p-3">Date</th>
            </tr>
          </thead>

          <tbody>
            {filteredPayments.map((p) => (
              <tr key={p.id} className="border-b hover:bg-gray-50 transition">
                <td className="p-3 font-medium">{p.id}</td>
                <td className="p-3">{p.orderId}</td>
                <td className="p-3">{p.customer}</td>
                <td className="p-3 font-semibold">{p.amount}</td>
                <td className="p-3">{p.method}</td>

                <td className="p-3">
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${statusStyles[p.status]}`}
                  >
                    {p.status}
                  </span>
                </td>

                <td className="p-3">
                  <select
                    value={tempStatus[p.id] ?? p.status}
                    onChange={(e) =>
                      handleSelectChange(p.id, e.target.value)
                    }
                    className="border rounded-lg px-3 py-1 text-sm focus:ring-2 focus:ring-green-500"
                  >
                    <option value="Paid">Paid</option>
                    <option value="Refunded">Refunded</option>
                    <option value="Hold">Hold</option>
                  </select>
                </td>

                {/* ANIMATED SAVE BUTTON */}
                <td className="p-3">
                  <button
                    onClick={() => saveStatus(p.id)}
                    title="Save updated status"
                    className="
                      p-2 rounded-full bg-green-100 text-green-700
                      hover:bg-green-600 hover:text-white 
                      transition-all duration-300
                      shadow-sm hover:shadow-md 
                      cursor-pointer
                    "
                  >
                    <FiCheckCircle
                      size={18}
                      className="transition-transform duration-300 hover:scale-125"
                    />
                  </button>
                </td>

                <td className="p-3">{p.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ANIMATIONS */}
      <style>{`
        @keyframes toastSlide {
          from { opacity: 0; transform: translateY(-10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .animate-toast {
          animation: toastSlide 0.3s ease-out;
        }
      `}</style>
    </MainLayout>
  );
}

