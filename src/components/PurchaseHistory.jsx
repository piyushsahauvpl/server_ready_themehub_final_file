import React from 'react';
import {
  FiDownload,
  FiFileText,
  FiStar,
} from 'react-icons/fi';

export default function PurchaseHistory() {
  const purchases = [
    {
      id: 1,
      category: 'Hardware',
      date: 'Feb 2, 2026',
      amount: 500,
      productId: '#11',
      status: 'completed',
    },
  ];

  return (
    <div className="bg-white rounded-xl border p-6">
      {/* <h2 className="text-xl font-semibold mb-6">
        Purchase History
      </h2> */}

      {purchases.map(p => (
        <div key={p.id} className="border rounded-lg p-5">
          <h3 className="font-semibold text-lg mb-3">
            {p.category}
          </h3>

          <div className="flex gap-4 text-sm text-gray-600 mb-4">
            <span>{p.date}</span>
            <span>₹ {p.amount}</span>
            <span>Product ID: {p.productId}</span>
            <span className="text-green-700 bg-green-100 px-2 py-1 rounded">
              {p.status}
            </span>
          </div>

          <div className="flex gap-3">
            <button className="border px-4 py-2 rounded">
              View Template
            </button>
            <button className="bg-green-600 text-white px-4 py-2 rounded flex gap-2">
              <FiDownload /> Download Template
            </button>
            <button className="bg-gray-700 text-white px-4 py-2 rounded flex gap-2">
              <FiFileText /> Invoice
            </button>
            <button className="bg-blue-600 text-white px-4 py-2 rounded flex gap-2">
              <FiStar /> Review
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
