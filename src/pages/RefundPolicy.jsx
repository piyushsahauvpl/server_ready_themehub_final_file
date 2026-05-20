import React from "react";

const RefundPolicy = () => (
  <div className="container mx-auto px-4 py-8 max-w-3xl">
    <h1 className="text-3xl font-bold mb-6">Refund Policy</h1>
    <section className="mb-6">
      <h2 className="text-xl font-semibold mb-2">1. Refund Conditions</h2>
      <ul className="list-disc list-inside ml-4">
        <li>Refunds are only issued for defective or non-delivered products.</li>
        <li>Requests must be made within 7 days of purchase.</li>
        <li>Refunds are not available for change of mind or incorrect purchase.</li>
      </ul>
    </section>
    <section className="mb-6">
      <h2 className="text-xl font-semibold mb-2">2. Process</h2>
      <p>
        To request a refund, contact our support team with your order details and a description of the issue. We will review your request and respond within 3 business days.
      </p>
    </section>
    <section className="mb-6">
      <h2 className="text-xl font-semibold mb-2">3. Contact Information</h2>
      <p>
        For refund requests or questions, email us at <a href="mailto:support@example.com" className="text-blue-600 underline">support@example.com</a>.
      </p>
    </section>
  </div>
);

export default RefundPolicy;
