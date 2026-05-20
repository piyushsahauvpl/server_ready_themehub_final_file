import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  FiLoader, 
  FiAlertCircle, 
  FiCheckCircle,
  FiArrowLeft,
  FiUpload,
  FiX,
  FiImage,
  FiFile,
  FiLink
} from 'react-icons/fi';

export default function AddProduct() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category_id: '',
    framework_id: '',
    price: '',
    offer_price: '',
    image: null,
    imagePreview: '',
    zipFile: null,
    preview_url: '',
    last_update: '',
    high_resolution: false,
    compatible_browsers: '',
    compatible_with: '',
    themehub_files_included: '',
    documentation: '',
    layout: '',
    tags: ''
  });

  const [categories, setCategories] = useState([]);
  const [frameworks, setFrameworks] = useState([]);

  const API_URL = process.env.REACT_APP_API_URL || "https://uptulathemehub.com/backend/api";

  useEffect(() => {
    fetchCategoriesAndFrameworks();
    if (isEdit) {
      fetchProduct();
    }
  }, [id]);
  // Removed seller/check-auth.php check, now relies only on user session

  const fetchCategoriesAndFrameworks = async () => {
    try {
      const [catRes, frameRes] = await Promise.all([
        fetch(`${API_URL}/categories.php`),
        fetch(`${API_URL}/frameworks.php`)
      ]);
      
      const catData = await catRes.json();
      const frameData = await frameRes.json();
      
      if (catData.success) setCategories(catData.categories || []);
      if (frameData.success) setFrameworks(frameData.frameworks || []);
    } catch (err) {
      console.error('Fetch error:', err);
    }
  };

  const fetchProduct = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/seller/products.php?id=${id}`, {
        credentials: 'include'
      });
      const data = await res.json();
      
      if (data.success && data.product) {
        const p = data.product;
        setFormData({
          name: p.name || '',
          description: p.description || '',
          category_id: p.category_id || '',
          framework_id: p.framework_id || '',
          price: p.price || '',
          offer_price: p.offer_price || '',
          imagePreview: p.image_url ? (() => {
            if (p.image_url.startsWith('http')) return p.image_url;
            let cleanPath = p.image_url.startsWith('/') ? p.image_url : `/${p.image_url}`;
            // If path doesn't start with /backend/, add it
            if (!cleanPath.startsWith('/backend/')) {
              cleanPath = `/backend${cleanPath}`;
            }
            return `https://uptulathemehub.com${cleanPath}`;
          })() : '',
          preview_url: p.preview_url || '',
          last_update: p.last_update || '',
          high_resolution: p.high_resolution === 1 || p.high_resolution === true || false,
          compatible_browsers: p.compatible_browsers || '',
          compatible_with: p.compatible_with || '',
          themehub_files_included: p.themehub_files_included || '',
          documentation: p.documentation || '',
          layout: p.layout || '',
          tags: p.tags || ''
        });
      }
    } catch (err) {
      setError('Failed to load product');
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size must be less than 5MB');
        return;
      }
      setFormData({
        ...formData,
        image: file,
        imagePreview: URL.createObjectURL(file)
      });
    }
  };

  const handleZipChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 50 * 1024 * 1024) {
        setError('File size must be less than 50MB');
        return;
      }
      setFormData({
        ...formData,
        zipFile: file
      });
      
      // Auto-generate preview URL based on ZIP filename or product name
      const zipBaseName = file.name.replace(/\.[^/.]+$/, ''); // Remove extension
      const slug = generateSlug(zipBaseName || formData.name || 'template');
      const baseUrl = process.env.REACT_APP_PREVIEW_BASE_URL || 'https://uptulathemehub.com/backend/uploads/products';
      setFormData(prev => ({
        ...prev,
        zipFile: file,
        preview_url: `${baseUrl}/${slug}/index.html`
      }));
    }
  };

  const generateSlug = (name) => {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  };

  const generatePreviewUrl = (name) => {
    const slug = generateSlug(name);
    return `https://uptulathemehub.com/preview/${slug}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (!formData.name || !formData.price) {
      setError('Name and price are required');
      setLoading(false);
      return;
    }

    try {
      const submitData = new FormData();
      submitData.append('name', formData.name);
      submitData.append('description', formData.description);
      submitData.append('category_id', formData.category_id);
      submitData.append('framework_id', formData.framework_id);
      submitData.append('price', formData.price);
      if (formData.offer_price) submitData.append('offer_price', formData.offer_price);
      if (formData.preview_url) submitData.append('preview_url', formData.preview_url);
      if (formData.image) submitData.append('image', formData.image);
      if (formData.zipFile) submitData.append('zip_file', formData.zipFile);
      if (formData.last_update) submitData.append('last_update', formData.last_update);
      if (formData.high_resolution) submitData.append('high_resolution', formData.high_resolution ? 1 : 0);
      if (formData.compatible_browsers) submitData.append('compatible_browsers', formData.compatible_browsers);
      if (formData.compatible_with) submitData.append('compatible_with', formData.compatible_with);
      if (formData.themehub_files_included) submitData.append('themehub_files_included', formData.themehub_files_included);
      if (formData.documentation) submitData.append('documentation', formData.documentation);
      if (formData.layout) submitData.append('layout', formData.layout);
      if (formData.tags) submitData.append('tags', formData.tags);

      const url = isEdit 
        ? `${API_URL}/seller/products.php?id=${id}`
        : `${API_URL}/seller/products.php`;
      
      const res = await fetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        credentials: 'include',
        body: submitData
      });

      const rawResponse = await res.text();
      let data = { success: false, message: 'No response payload' };

      if (rawResponse) {
        try {
          data = JSON.parse(rawResponse);
        } catch (parseError) {
          console.error('JSON parse error rawResponse:', rawResponse);
          setError('Server returned invalid JSON. Check server logs.');
          return;
        }
      } else {
        console.error('Empty response from API', res.status, res.statusText);
        setError('Server returned empty response. Check backend logs.');
        return;
      }

      if (!res.ok) {
        const statusMessage = res.status === 401 ? 'Unauthorized. Please login as seller.'
            : res.status === 403 ? 'Forbidden. Seller account not active.'
            : `Request failed with status ${res.status}`;
        setError(data.message || statusMessage);
        return;
      }

      if (data.success) {
        setSuccess(isEdit ? 'Product updated successfully!' : 'Product submitted for review!');
        setTimeout(() => {
          navigate('/seller/products');
        }, 2000);
      } else {
        setError(data.message || 'Failed to save product');
      }
    } catch (err) {
      console.error('Submit error:', err);
      setError('Error saving product. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Top Bar */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 h-16">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 font-medium"
              style={{ 
                backgroundColor: '#f0fdf4',
                color: '#04733c',
                border: '1px solid #04733c'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#04733c';
                e.currentTarget.style.color = 'white';
                e.currentTarget.style.transform = 'translateX(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#f0fdf4';
                e.currentTarget.style.color = '#04733c';
                e.currentTarget.style.transform = 'translateX(0)';
              }}
            >
              <FiArrowLeft className="w-4 h-4" />
              Go Back
            </button>
            <h1 className="text-2xl font-bold text-gray-900">
              {isEdit ? 'Edit Product' : 'Add New Product'}
            </h1>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
            <FiAlertCircle className="w-5 h-5 text-red-600" />
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
            <FiCheckCircle className="w-5 h-5 text-green-600" />
            <p className="text-green-800">{success}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
          {/* Product Name */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Product Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => {
                setFormData({
                  ...formData,
                  name: e.target.value,
                  preview_url: formData.preview_url || generatePreviewUrl(e.target.value)
                });
              }}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="Enter product name"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Description
            </label>
            <textarea
              rows={4}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
              placeholder="Describe your product..."
            />
          </div>

          {/* Category and Framework */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={formData.category_id}
                onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="">Select category</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Framework <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={formData.framework_id}
                onChange={(e) => setFormData({ ...formData, framework_id: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="">Select framework</option>
                {frameworks.map(fw => (
                  <option key={fw.id} value={fw.id}>{fw.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Price */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Price (₹) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="0.00"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Offer Price (₹) <span className="text-gray-400 text-xs">(Optional)</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.offer_price}
                onChange={(e) => setFormData({ ...formData, offer_price: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="0.00"
              />
            </div>
          </div>

          {/* Last Update */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Last Update <span className="text-gray-400 text-xs">(Optional)</span>
            </label>
            <input
              type="date"
              value={formData.last_update}
              onChange={(e) => setFormData({ ...formData, last_update: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

          {/* High Resolution */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="high_resolution"
              checked={formData.high_resolution}
              onChange={(e) => setFormData({ ...formData, high_resolution: e.target.checked })}
              className="w-5 h-5 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 cursor-pointer"
            />
            <label htmlFor="high_resolution" className="text-sm font-semibold text-gray-700 cursor-pointer">
              High Resolution <span className="text-gray-400 text-xs">(Includes high resolution assets)</span>
            </label>
          </div>

          {/* Compatible Browsers */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Compatible Browsers <span className="text-gray-400 text-xs">(Optional)</span>
            </label>
            <input
              type="text"
              value={formData.compatible_browsers}
              onChange={(e) => setFormData({ ...formData, compatible_browsers: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="Ex: Firefox, Safari, Chrome, Edge"
            />
          </div>

          {/* Compatible With */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Compatible With <span className="text-gray-400 text-xs">(Optional)</span>
            </label>
            <input
              type="text"
              value={formData.compatible_with}
              onChange={(e) => setFormData({ ...formData, compatible_with: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="Ex: Contact Form 7, Elementor, WPML"
            />
          </div>

          {/* Themehub Files Included */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Themehub Files Included <span className="text-gray-400 text-xs">(Optional)</span>
            </label>
            <input
              type="text"
              value={formData.themehub_files_included}
              onChange={(e) => setFormData({ ...formData, themehub_files_included: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="Ex: PHP Files, CSS Files, JS Files"
            />
          </div>

          {/* Documentation */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Documentation <span className="text-gray-400 text-xs">(Optional)</span>
            </label>
            <select
              value={formData.documentation}
              onChange={(e) => setFormData({ ...formData, documentation: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="">Select documentation level</option>
              <option value="Well Documented">Well Documented</option>
              <option value="Partially Documented">Partially Documented</option>
              <option value="Not Documented">Not Documented</option>
            </select>
          </div>

          {/* Layout */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Layout <span className="text-gray-400 text-xs">(Optional)</span>
            </label>
            <select
              value={formData.layout}
              onChange={(e) => setFormData({ ...formData, layout: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="">Select layout type</option>
              <option value="Responsive">Responsive</option>
              <option value="Fixed">Fixed</option>
              <option value="Fluid">Fluid</option>
              <option value="Adaptive">Adaptive</option>
            </select>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Tags <span className="text-gray-400 text-xs">(Optional)</span>
            </label>
            <textarea
              rows={2}
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
              placeholder="Comma-separated tags (Ex: business, event, conference)"
            />
            <p className="text-xs text-gray-500 mt-2">Separate tags with commas.</p>
          </div>

          {/* Preview URL */}
          <div className="group">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Live Preview URL
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiLink className="w-5 h-5 text-gray-400" />
              </div>
              <input
                type="url"
                placeholder="https://your-template-preview-link.com"
                className="w-full pl-11 pr-4 py-3 rounded-lg bg-white border border-gray-300 text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                value={formData.preview_url}
                onChange={(e) => setFormData({ ...formData, preview_url: e.target.value })}
              />
            </div>
            {formData.name && !formData.preview_url && (
              <p className="mt-2 text-xs text-blue-600 flex items-center gap-1">
                Preview URL will be auto-generated when you upload a file
              </p>
            )}
          </div>

          {/* Product Image */}
          <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-6 border border-gray-200">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-md">
                <FiImage className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Product Image</h3>
                <p className="text-sm text-gray-500">Upload thumbnail for your product</p>
              </div>
            </div>
            <div className="bg-white rounded-xl p-6 border-2 border-dashed border-gray-300 hover:border-green-400 transition-all duration-200">
              <label className="block text-sm font-semibold text-gray-700 mb-4">
                Thumbnail Image <span className="text-red-500">*</span>
              </label>
              <div className="flex flex-col lg:flex-row items-start gap-6">
                {/* Image Preview Area */}
                <div className="shrink-0">
                  {formData.imagePreview ? (
                    <div className="relative group">
                      <img
                        src={formData.imagePreview.startsWith('http') || formData.imagePreview.startsWith('blob:') ? formData.imagePreview : `https://uptulathemehub.com/backend${formData.imagePreview.startsWith('/') ? formData.imagePreview : '/' + formData.imagePreview}`}
                        alt="Preview"
                        className="w-32 h-32 rounded-xl border-2 border-gray-200 shadow-lg object-cover"
                        onError={(e) => (e.target.src = 'https://via.placeholder.com/128x128?text=No+Image')}
                      />
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, image: null, imagePreview: '' })}
                        className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <FiX className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-32 h-32 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center border-2 border-dashed border-gray-300">
                      <FiImage className="w-12 h-12 text-gray-400" />
                    </div>
                  )}
                </div>
                {/* Upload Button */}
                <div className="flex-1">
                  <label
                    htmlFor="upload"
                    className="cursor-pointer inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg font-semibold text-sm shadow-lg hover:from-green-600 hover:to-green-700 transform hover:-translate-y-0.5 transition-all duration-200"
                  >
                    <FiUpload className="w-5 h-5" />
                    Choose Image
                  </label>
                  <input
                    type="file"
                    id="upload"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageChange}
                  />
                  <p className="text-xs text-gray-500 mt-3 flex items-center gap-1">
                    <FiAlertCircle className="w-3 h-3" />
                    JPG, PNG or GIF (Max 5MB)
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ZIP File */}
          <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-6 border border-gray-200">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-md">
                <FiFile className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Product File</h3>
                <p className="text-sm text-gray-500">Upload ZIP file for your product</p>
              </div>
            </div>
            <div className="bg-white rounded-xl p-6 border-2 border-dashed border-gray-300 hover:border-purple-400 transition-all duration-200">
              {formData.zipFile ? (
                <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-500 rounded-lg">
                      <FiFile className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{formData.zipFile.name}</p>
                      <p className="text-xs text-gray-500">
                        {(formData.zipFile.size / (1024 * 1024)).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, zipFile: null })}
                    className="p-2 hover:bg-red-100 rounded-lg transition text-red-600"
                  >
                    <FiX className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <label className="cursor-pointer flex flex-col items-center justify-center py-8">
                  <div className="p-4 bg-purple-100 rounded-full mb-4">
                    <FiUpload className="w-8 h-8 text-purple-600" />
                  </div>
                  <span className="text-sm font-semibold text-gray-700 mb-1">
                    Click to upload or drag and drop
                  </span>
                  <span className="text-xs text-gray-500">
                    ZIP, RAR, 7Z (Max 50MB)
                  </span>
                  <input
                    type="file"
                    accept=".zip,.rar,.7z"
                    onChange={handleZipChange}
                    className="hidden"
                    required={!isEdit}
                  />
                </label>
              )}
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> All products require admin approval before they appear on the website. 
              Your product will be reviewed and you'll be notified once it's approved.
            </p>
          </div>

          {/* Submit Button */}
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => navigate('/seller/products')}
              className="flex-1 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-semibold text-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: '#04733c' }}
              onMouseEnter={(e) => !loading && (e.target.style.backgroundColor = '#035a2f')}
              onMouseLeave={(e) => !loading && (e.target.style.backgroundColor = '#04733c')}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <FiLoader className="w-5 h-5 animate-spin" />
                  {isEdit ? 'Updating...' : 'Submitting...'}
                </span>
              ) : (
                isEdit ? 'Update Product' : 'Submit for Review'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
