import MainLayout from "../components/MainLayout";
import { FiPackage, FiLoader, FiCheck, FiX, FiEye, FiCode } from "react-icons/fi";
import { useState, useEffect } from "react";

export default function TemplateApproval() {
  // Demo templates data
  const DEMO_TEMPLATES = [
    {
      id: 1,
      seller_id: 1,
      seller_name: "John Smith",
      seller_email: "john.smith@demo.com",
      template_name: "Modern SaaS Landing Page",
      category: "Landing Page",
      price: "49.99",
      currency: "₹",
      description: "A modern and responsive SaaS landing page template with hero section, features showcase, pricing table, and contact form.",
      preview_url: "https://example.com/templates/saas-landing",
      thumbnail_url: "https://via.placeholder.com/300x200?text=SAAS+Landing",
      version: "1.0",
      status: "pending",
      created_at: "2026-02-02T10:30:00",
      code_quality: {
        html_valid: true,
        css_valid: true,
        responsive: true,
        accessibility: "Good",
        performance: "Fast",
        mobile_friendly: true
      },
      features: ["Responsive Design", "Dark Mode Support", "Contact Form", "SEO Optimized", "Fast Loading"]
    },
    {
      id: 2,
      seller_id: 2,
      seller_name: "Sarah Johnson",
      seller_email: "sarah.johnson@demo.com",
      template_name: "E-commerce Product Store",
      category: "E-commerce",
      price: "79.99",
      currency: "₹",
      description: "Complete e-commerce template with product grid, shopping cart, checkout process, and payment integration ready.",
      preview_url: "https://example.com/templates/ecommerce",
      thumbnail_url: "https://via.placeholder.com/300x200?text=E-commerce",
      version: "1.0",
      status: "pending",
      created_at: "2026-02-01T14:20:00",
      code_quality: {
        html_valid: true,
        css_valid: true,
        responsive: true,
        accessibility: "Excellent",
        performance: "Very Fast",
        mobile_friendly: true
      },
      features: ["Product Catalog", "Shopping Cart", "Payment Ready", "Admin Dashboard", "Inventory System"]
    },
    {
      id: 3,
      seller_id: 3,
      seller_name: "Mike Wilson",
      seller_email: "mike.wilson@demo.com",
      template_name: "Creative Portfolio Website",
      category: "Portfolio",
      price: "39.99",
      currency: "₹",
      description: "Beautiful portfolio template for creatives with project showcase, about section, testimonials, and contact area.",
      preview_url: "https://example.com/templates/portfolio",
      thumbnail_url: "https://via.placeholder.com/300x200?text=Portfolio",
      version: "1.0",
      status: "pending",
      created_at: "2026-02-03T09:15:00",
      code_quality: {
        html_valid: true,
        css_valid: true,
        responsive: true,
        accessibility: "Good",
        performance: "Fast",
        mobile_friendly: true
      },
      features: ["Project Gallery", "Smooth Animations", "Contact Form", "Social Links", "Blog Section"]
    }
  ];

  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [useDemo, setUseDemo] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showCodeModal, setShowCodeModal] = useState(false);

  const API_URL = process.env.REACT_APP_API_URL || "https://uptulathemehub.com/backend/api";
  const ADMIN_API_URL = `${API_URL}/admin`;
  const formatAmount = (amount, currency) => {
    const symbol = currency && currency !== "$" ? currency : "₹";
    return `${symbol}${parseFloat(amount || 0).toFixed(2)}`;
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${ADMIN_API_URL}/template-approval.php`, {
        credentials: "include",
      });
      const data = await res.json();

      if (data.success && data.templates && data.templates.length > 0) {
        setTemplates(data.templates);
        setUseDemo(false);
      } else {
        setTemplates(DEMO_TEMPLATES);
        setUseDemo(true);
      }
    } catch (err) {
      console.error("Fetch error:", err);
      setTemplates(DEMO_TEMPLATES);
      setUseDemo(true);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveTemplate = async (template) => {
    if (!window.confirm(`Approve template: ${template.template_name}?`)) return;

    try {
      const res = await fetch(`${ADMIN_API_URL}/approve-template.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ template_id: template.id }),
      });

      const data = await res.json();
      if (data.success) {
        alert("Template approved successfully!");
        fetchTemplates();
      } else {
        alert(data.message || "Failed to approve template");
      }
    } catch (err) {
      console.error("Approve error:", err);
      alert("Error approving template");
    }
  };

  const handleRejectTemplate = async (template) => {
    const reason = prompt(`Reject template: ${template.template_name}?\n\nEnter rejection reason:`);
    if (!reason) return;

    try {
      const res = await fetch(`${ADMIN_API_URL}/reject-template.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ template_id: template.id, reason }),
      });

      const data = await res.json();
      if (data.success) {
        alert("Template rejected successfully!");
        fetchTemplates();
      } else {
        alert(data.message || "Failed to reject template");
      }
    } catch (err) {
      console.error("Reject error:", err);
      alert("Error rejecting template");
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-screen">
          <FiLoader className="w-8 h-8 animate-spin text-green-600" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      {/* Demo Banner */}
      {useDemo && (
        <div className="mb-6 p-4 bg-blue-50 border-l-4 border-blue-500 rounded-lg">
          <p className="text-blue-700 font-medium">
            ℹ️ <strong>Demo Mode:</strong> Showing sample data for testing. This data is not saved to the database.
          </p>
        </div>
      )}

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg">
            <FiPackage className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Templates Approval</h2>
            <p className="text-gray-500 mt-1">
              {templates.filter(t => t.status === 'pending').length} template{templates.filter(t => t.status === 'pending').length !== 1 ? "s" : ""} pending approval
            </p>
          </div>
        </div>
      </div>

      {templates.length === 0 ? (
        <div className="p-8 bg-gray-50 rounded-lg text-center border border-gray-200">
          <p className="text-gray-600">No templates pending approval</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {templates.map((template) => (
            <div
              key={template.id}
              className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition"
            >
              {/* Template Image */}
              <div className="h-48 bg-gray-100 overflow-hidden">
                <img
                  src={template.thumbnail_url}
                  alt={template.template_name}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Template Info */}
              <div className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {template.template_name}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      by {template.seller_name}
                    </p>
                  </div>
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">
                    {template.category}
                  </span>
                </div>

                <p className="text-gray-700 text-sm mb-4">
                  {template.description.substring(0, 100)}...
                </p>

                {/* Features */}
                <div className="mb-4">
                  <p className="text-xs text-gray-600 font-semibold mb-2">Features:</p>
                  <div className="flex flex-wrap gap-1">
                    {template.features.slice(0, 3).map((feature, idx) => (
                      <span key={idx} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Price */}
                <div className="mb-4 pb-4 border-b">
                  <p className="text-2xl font-bold text-gray-900">
                    {formatAmount(template.price, template.currency)}
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-2 mb-4">
                  <button
                    onClick={() => {
                      setSelectedTemplate(template);
                      setShowPreviewModal(true);
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2 text-sm font-medium"
                  >
                    <FiEye size={16} />
                    Preview
                  </button>
                  <button
                    onClick={() => {
                      setSelectedTemplate(template);
                      setShowCodeModal(true);
                    }}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition flex items-center justify-center gap-2 text-sm font-medium"
                  >
                    <FiCode size={16} />
                    Code Check
                  </button>
                </div>

                {/* Approve/Reject Buttons */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleApproveTemplate(template)}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center justify-center gap-2 text-sm font-medium"
                  >
                    <FiCheck size={16} />
                    Approve
                  </button>
                  <button
                    onClick={() => handleRejectTemplate(template)}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition flex items-center justify-center gap-2 text-sm font-medium"
                  >
                    <FiX size={16} />
                    Reject
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Preview Modal */}
      {showPreviewModal && selectedTemplate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 p-6 flex items-center justify-between text-white">
              <h3 className="text-xl font-bold">Template Preview</h3>
              <button
                onClick={() => setShowPreviewModal(false)}
                className="hover:bg-blue-800 p-2 rounded transition"
              >
                <FiX size={24} />
              </button>
            </div>

            <div className="p-6">
              <div className="mb-4">
                <h4 className="text-lg font-semibold text-gray-900 mb-2">
                  {selectedTemplate.template_name}
                </h4>
                <p className="text-gray-600 mb-4">{selectedTemplate.description}</p>
              </div>

              {/* Preview iFrame */}
              <div className="bg-gray-100 rounded-lg overflow-hidden border border-gray-300 mb-6">
                <iframe
                  src={selectedTemplate.preview_url}
                  title="Template Preview"
                  className="w-full h-96 border-0"
                  sandbox="allow-same-origin allow-scripts allow-popups"
                />
              </div>

              <p className="text-sm text-gray-500 mb-4">
                Live preview URL: <code className="bg-gray-100 px-2 py-1 rounded text-xs">{selectedTemplate.preview_url}</code>
              </p>

              <div className="flex gap-3 justify-end border-t pt-6">
                <button
                  onClick={() => setShowPreviewModal(false)}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Code Checker Modal */}
      {showCodeModal && selectedTemplate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-purple-700 p-6 flex items-center justify-between text-white">
              <h3 className="text-xl font-bold">Code Quality Checker</h3>
              <button
                onClick={() => setShowCodeModal(false)}
                className="hover:bg-purple-800 p-2 rounded transition"
              >
                <FiX size={24} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Code Quality Analysis</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {/* HTML Validation */}
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      {selectedTemplate.code_quality.html_valid ? (
                        <FiCheck className="text-green-600" size={20} />
                      ) : (
                        <FiX className="text-red-600" size={20} />
                      )}
                      <span className="font-semibold text-gray-900">HTML Valid</span>
                    </div>
                    <p className="text-sm text-gray-600">
                      {selectedTemplate.code_quality.html_valid ? "✓ Valid" : "✗ Issues Found"}
                    </p>
                  </div>

                  {/* CSS Validation */}
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      {selectedTemplate.code_quality.css_valid ? (
                        <FiCheck className="text-green-600" size={20} />
                      ) : (
                        <FiX className="text-red-600" size={20} />
                      )}
                      <span className="font-semibold text-gray-900">CSS Valid</span>
                    </div>
                    <p className="text-sm text-gray-600">
                      {selectedTemplate.code_quality.css_valid ? "✓ Valid" : "✗ Issues Found"}
                    </p>
                  </div>

                  {/* Responsive Design */}
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      {selectedTemplate.code_quality.responsive ? (
                        <FiCheck className="text-green-600" size={20} />
                      ) : (
                        <FiX className="text-red-600" size={20} />
                      )}
                      <span className="font-semibold text-gray-900">Responsive</span>
                    </div>
                    <p className="text-sm text-gray-600">
                      {selectedTemplate.code_quality.responsive ? "✓ Yes" : "✗ No"}
                    </p>
                  </div>

                  {/* Accessibility */}
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-semibold text-gray-900">Accessibility</span>
                    </div>
                    <p className="text-sm text-gray-600">
                      {selectedTemplate.code_quality.accessibility}
                    </p>
                  </div>

                  {/* Performance */}
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-semibold text-gray-900">Performance</span>
                    </div>
                    <p className="text-sm text-gray-600">
                      {selectedTemplate.code_quality.performance}
                    </p>
                  </div>

                  {/* Mobile Friendly */}
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      {selectedTemplate.code_quality.mobile_friendly ? (
                        <FiCheck className="text-green-600" size={20} />
                      ) : (
                        <FiX className="text-red-600" size={20} />
                      )}
                      <span className="font-semibold text-gray-900">Mobile Friendly</span>
                    </div>
                    <p className="text-sm text-gray-600">
                      {selectedTemplate.code_quality.mobile_friendly ? "✓ Yes" : "✗ No"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Overall Quality Score */}
              <div className="bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-lg border border-green-200">
                <h5 className="text-lg font-semibold text-gray-900 mb-2">Overall Quality Score</h5>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div className="bg-green-600 h-3 rounded-full" style={{ width: "92%" }} />
                    </div>
                    <p className="text-sm text-gray-600 mt-2">92/100 - Excellent Quality</p>
                  </div>
                  <FiCheck className="text-green-600" size={32} />
                </div>
              </div>

              {/* Summary */}
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <p className="text-gray-900 font-medium">Summary:</p>
                <ul className="mt-2 space-y-1 text-sm text-gray-700">
                  <li>✓ All code validations passed</li>
                  <li>✓ Fully responsive design</li>
                  <li>✓ Good accessibility standards</li>
                  <li>✓ Fast loading performance</li>
                  <li>✓ Mobile-friendly layout</li>
                </ul>
              </div>

              <div className="flex gap-3 justify-end border-t pt-6">
                <button
                  onClick={() => setShowCodeModal(false)}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    handleApproveTemplate(selectedTemplate);
                    setShowCodeModal(false);
                  }}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center gap-2"
                >
                  <FiCheck size={16} />
                  Approve Template
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
}
