import React from "react";

const License = () => (
    
  <div className="container mx-auto px-4 py-8 max-w-3xl">
    <h1 className="text-3xl font-bold mb-6">License Agreement</h1>
    <section className="mb-6">
      <h2 className="text-xl font-semibold mb-2">1. Usage</h2>
      <p>
        This license grants you a non-exclusive, non-transferable right to use the purchased digital products for personal or commercial projects, subject to the terms below.
      </p>
    </section>
    <section className="mb-6">
      <h2 className="text-xl font-semibold mb-2">2. Restrictions</h2>
      <ul className="list-disc list-inside ml-4">
        <li>Resale, redistribution, or sublicensing of the product is strictly prohibited.</li>
        <li>You may not claim the product as your own work.</li>
        <li>Use in illegal, offensive, or discriminatory projects is not allowed.</li>
      </ul>
    </section>
    <section className="mb-6">
      <h2 className="text-xl font-semibold mb-2">3. Ownership</h2>
      <p>
        All intellectual property rights remain with the original author. You are granted a license to use the product, not ownership of the product itself.
      </p>
    </section>
    <section className="mb-6">
      <h2 className="text-xl font-semibold mb-2">4. Contact Information</h2>
      <p>
        For questions about this license, please contact us at <a href="mailto:support@example.com" className="text-blue-600 underline">support@example.com</a>.
      </p>
    </section>
  </div>
);

export default License;
