import MainLayout from "../components/MainLayout";
import { useState, useEffect } from "react";
import { 
  FiUpload, 
  FiImage, 
  FiFile, 
  FiLink, 
  FiFileText,
  FiTag,
  FiCode,
  FiLoader,
  FiCheck,
  FiX,
  FiAlertCircle,
  FiStar
} from "react-icons/fi";
import { FaRupeeSign } from "react-icons/fa";

export default function AddProduct() {
  const [imagePreview, setImagePreview] = useState(null);
  const [categories, setCategories] = useState([]);
  const [frameworks, setFrameworks] = useState([]); // New Framework State
  const [selectedCat, setSelectedCat] = useState("");
  const [selectedFramework, setSelectedFramework] = useState(""); // New Framework Selection

  // Form fields
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [offerPrice, setOfferPrice] = useState("");
  const [livePreviewUrl, setLivePreviewUrl] = useState("");
  const [description, setDescription] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [zipFile, setZipFile] = useState(null);
  const [folderFiles, setFolderFiles] = useState(null);
  const [uploadType, setUploadType] = useState('zip'); // 'zip' or 'folder'
  const [folderName, setFolderName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fileError, setFileError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [zipFileName, setZipFileName] = useState('');
  const [isLatest, setIsLatest] = useState(false);
  const [isFeatured, setIsFeatured] = useState(false);
  // Additional metadata fields (from provided image)
  const [lastUpdate, setLastUpdate] = useState('');
  const [highResolution, setHighResolution] = useState(false);
  const [compatibleBrowsers, setCompatibleBrowsers] = useState('');
  const [compatibleWith, setCompatibleWith] = useState('');
  const [themehubFilesIncluded, setThemehubFilesIncluded] = useState('');
  const [documentation, setDocumentation] = useState('Well Documented');
  const [layout, setLayout] = useState('Responsive');
  const [tags, setTags] = useState('');

  // Limits (server post_max_size is 50MB after update)
  const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5MB
  const MAX_ZIP_BYTES = 45 * 1024 * 1024; // 45MB (leave room for other form data)
  const MAX_ZIP_MB = Math.round(MAX_ZIP_BYTES / (1024 * 1024));
  
  const API_URL = process.env.REACT_APP_API_URL || "https://uptulathemehub.com/backend/api";

  // Load categories and frameworks
 useEffect(() => {
  const ADMIN_API_URL = `${API_URL}/admin`;
  
  // Load Categories
  fetch(`${ADMIN_API_URL}/categories.php?type=category`, { credentials: "include" })
    .then(res => res.json())
    .then(data => {
      if (data.success && data.categories) {
        setCategories(data.categories);
      }
    })
    .catch(err => console.error('Categories fetch error', err));

  // Load Frameworks
  fetch(`${ADMIN_API_URL}/categories.php?type=framework`, { credentials: "include" })
    .then(res => res.json())
    .then(data => {
      if (data.success && data.frameworks) {
        setFrameworks(data.frameworks);
      }
    })
    .catch(err => console.error('Frameworks fetch error', err));
}, [API_URL]);

// Load existing product if editing
useEffect(() => {
  const params = new URLSearchParams(window.location.search);
  const productId = params.get('id');
  
  if (productId) {
    const ADMIN_API_URL = `${API_URL}/admin`;
    fetch(`${ADMIN_API_URL}/products.php?id=${productId}`, { credentials: "include" })
      .then(res => res.json())
      .then(data => {
        if (data.success && data.products && data.products.length > 0) {
          const product = data.products[0];
          // Populate form fields
          setName(product.name || '');
          setPrice(product.price || '');
          setOfferPrice(product.offer_price || '');
          setLivePreviewUrl(product.preview_url || '');
          setDescription(product.description || '');
          setSelectedCat(product.category_id || '');
          setSelectedFramework(product.framework_id || '');
          setLastUpdate(product.last_update || '');
          setHighResolution(product.high_resolution === 1);
          setCompatibleBrowsers(product.compatible_browsers || '');
          setCompatibleWith(product.compatible_with || '');
          setThemehubFilesIncluded(product.themehub_files_included || '');
          setDocumentation(product.documentation || 'Well Documented');
          setLayout(product.layout || 'Responsive');
          setTags(product.tags || '');
          setIsLatest(product.is_latest === 1);
          setIsFeatured(product.is_featured === 1);
          // Set image preview if exists
          if (product.image_url) {
            setImagePreview(`https://uptulathemehub.com${product.image_url}`);
          }
          // Normalize high_resolution to boolean
          setHighResolution(Number(product.high_resolution) === 1);
        } else {
          console.error('Product not found');
        }
      })
      .catch(err => console.error('Error loading product:', err));
  }
}, [API_URL]);


  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate image file size (MAX_IMAGE_BYTES = 5MB)
      if (file.size > MAX_IMAGE_BYTES) {
        const mb = (file.size / (1024 * 1024)).toFixed(2);
        const maxMb = (MAX_IMAGE_BYTES / (1024 * 1024)).toFixed(0);
        const msg = `Selected image is too large (${mb} MB). Maximum allowed is ${maxMb} MB.`;
        // Show inline file error and a popup alert
        setFileError(msg);
        try { e.target.value = ''; } catch (_) {}
        // Popup to inform the user explicitly
        if (typeof window !== 'undefined' && window.alert) {
          window.alert(msg);
        }
        return;
      }

      setImagePreview(URL.createObjectURL(file));
      setImageFile(file);
    }
  };

  // Function to generate slug from product name
  const generateSlug = (text) => {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '') // Remove special characters
      .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
      .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
  };

  // Function to generate preview URL from product name
  const generatePreviewUrl = (productName) => {
    if (!productName || !productName.trim()) return '';
    const slug = generateSlug(productName);
    // You can customize this base URL pattern as needed
    const baseUrl = process.env.REACT_APP_PREVIEW_BASE_URL || 'https://uptulathemehub.com/preview';
    return `${baseUrl}/${slug}`;
  };

  const handleZipChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > MAX_ZIP_BYTES) {
      const mb = (file.size / (1024 * 1024)).toFixed(1);
      setFileError(`File too large (${mb} MB). Max is ${MAX_ZIP_MB} MB.`);
      setZipFile(null);
      setZipFileName('');
      return;
    }
    setFileError('');
    setZipFile(file);
    setZipFileName(file.name);
    setFolderFiles(null);
    setFolderName('');
    
    // Auto-generate preview URL based on ZIP filename or product name
    const zipBaseName = file.name.replace(/\.[^/.]+$/, ''); // Remove extension
    const slug = generateSlug(zipBaseName || name || 'template');
    const baseUrl = process.env.REACT_APP_PREVIEW_BASE_URL || 'https://uptulathemehub.com/backend/uploads/products';
    setLivePreviewUrl(`${baseUrl}/${slug}/index.html`);
  };

  const handleFolderChange = (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) {
      setFolderFiles(null);
      setFolderName('');
      return;
    }
    
    // Calculate total size
    let totalSize = 0;
    const fileArray = Array.from(files);
    for (let i = 0; i < fileArray.length; i++) {
      totalSize += fileArray[i].size;
    }
    
    if (totalSize > MAX_ZIP_BYTES) {
      const mb = (totalSize / (1024 * 1024)).toFixed(1);
      setFileError(`Folder too large (${mb} MB). Max is ${MAX_ZIP_MB} MB.`);
      setFolderFiles(null);
      setFolderName('');
      e.target.value = ''; // Reset input
      return;
    }
    
    // Extract folder name from the first file's webkitRelativePath
    let detectedFolderName = '';
    if (fileArray.length > 0 && fileArray[0].webkitRelativePath) {
      const firstPath = fileArray[0].webkitRelativePath;
      detectedFolderName = firstPath.split('/')[0];
    }
    
    // Validate that index.html exists in the folder
    let hasIndexHtml = false;
    let indexHtmlPath = '';
    
    for (let i = 0; i < fileArray.length; i++) {
      const file = fileArray[i];
      const relativePath = file.webkitRelativePath || file.name;
      
      // Check if this is index.html at the root of the folder
      // Remove folder name prefix if present
      let pathInFolder = relativePath;
      if (detectedFolderName && relativePath.startsWith(detectedFolderName + '/')) {
        pathInFolder = relativePath.substring(detectedFolderName.length + 1);
      }
      
      // Check if it's index.html at root level (not in subdirectories)
      if (pathInFolder.toLowerCase() === 'index.html' || pathInFolder.toLowerCase() === '/index.html') {
        hasIndexHtml = true;
        indexHtmlPath = pathInFolder;
        break;
      }
    }
    
    if (!hasIndexHtml) {
      setFileError('Error: index.html file is required in the root of the uploaded folder. Please ensure your folder contains an index.html file.');
      setFolderFiles(null);
      setFolderName('');
      e.target.value = ''; // Reset input
      return;
    }
    
    // Validation passed
    setFileError('');
    setFolderFiles(fileArray);
    setFolderName(detectedFolderName || generateSlug(name) || 'template');
    
    // Auto-generate preview URL using folder name
    const slug = generateSlug(detectedFolderName || name || 'template');
    const baseUrl = process.env.REACT_APP_PREVIEW_BASE_URL || 'https://uptulathemehub.com/backend/uploads/products';
    setLivePreviewUrl(`${baseUrl}/${slug}/index.html`);
    
    setZipFile(null);
    setZipFileName('');
  };

  const inputClasses = "w-full px-4 py-2.5 rounded-lg bg-gray-50 border border-gray-300 text-gray-700 placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 ease-in-out";
  const labelClasses = "block text-sm font-semibold text-gray-600 mb-1.5 group-focus-within:text-green-700 transition-colors";

  return (
    <MainLayout>
      <div className="w-full px-4 py-6">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
            <span>Home</span>
            <span>/</span>
            <span>Products</span>
            <span>/</span>
            <span className="font-semibold text-green-600">Add Product</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg">
              <FiUpload className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-gray-900">
                Add New Product
              </h2>
              <p className="text-gray-500 mt-1">Create and publish a new theme template</p>
            </div>
          </div>
        </div>

        {/* Success/Error Messages */}
        {successMessage && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
            <FiCheck className="w-5 h-5 text-green-600" />
            <p className="text-green-800">{successMessage}</p>
          </div>
        )}
        {errorMessage && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
            <FiAlertCircle className="w-5 h-5 text-red-600" />
            <p className="text-red-800">{errorMessage}</p>
          </div>
        )}
        {fileError && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center gap-3">
            <FiAlertCircle className="w-5 h-5 text-yellow-600" />
            <p className="text-yellow-800">{fileError}</p>
          </div>
        )}

        {/* Main Form Card */}
        <div className="w-full bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200">
          {/* Decorative Top Bar */}
          <div className="h-1 bg-gradient-to-r from-green-400 via-green-500 to-green-600"></div>

          <form className="p-8 space-y-8" onSubmit={async (e) => {
              e.preventDefault();
              if (isSubmitting) return;
              setIsSubmitting(true);
              try {
                const ADMIN_API_URL = `${API_URL}/admin`;
                
                setErrorMessage('');
                setSuccessMessage('');
                
                // Validate required fields first
                if (!name || !name.trim()) {
                  setErrorMessage('Product name is required.');
                  setIsSubmitting(false);
                  return;
                }
                
                if (!selectedCat || selectedCat === '') {
                  setErrorMessage('Please select a category.');
                  setIsSubmitting(false);
                  return;
                }
                
                if (!selectedFramework || selectedFramework === '') {
                  setErrorMessage('Please select a framework.');
                  setIsSubmitting(false);
                  return;
                }
                
                // Get category and framework objects
                const categoryObj = categories.find(c => c.name === selectedCat);
                const frameworkObj = frameworks.find(f => f.name === selectedFramework);
                
                console.log('Selected category:', selectedCat, 'Found:', categoryObj);
                console.log('Selected framework:', selectedFramework, 'Found:', frameworkObj);
                console.log('Available categories:', categories);
                console.log('Available frameworks:', frameworks);
                
                if (!categoryObj) {
                  setErrorMessage(`Category "${selectedCat}" not found. Please select a valid category.`);
                  setIsSubmitting(false);
                  return;
                }
                
                if (!frameworkObj) {
                  setErrorMessage(`Framework "${selectedFramework}" not found. Please select a valid framework.`);
                  setIsSubmitting(false);
                  return;
                }
                
                if (!categoryObj.id || categoryObj.id <= 0) {
                  setErrorMessage('Invalid category ID. Please select a valid category.');
                  setIsSubmitting(false);
                  return;
                }
                
                if (!frameworkObj.id || frameworkObj.id <= 0) {
                  setErrorMessage('Invalid framework ID. Please select a valid framework.');
                  setIsSubmitting(false);
                  return;
                }
                
                if (!imageFile) {
                  setErrorMessage('Please upload a product thumbnail image.');
                  setIsSubmitting(false);
                  return;
                }
                
                // Validate file upload based on type
                if (uploadType === 'zip' && !zipFile) {
                  setErrorMessage('Please upload the product file (ZIP).');
                  setIsSubmitting(false);
                  return;
                }
                
                if (uploadType === 'folder' && (!folderFiles || folderFiles.length === 0)) {
                  setErrorMessage('Please upload a folder containing your template files.');
                  setIsSubmitting(false);
                  return;
                }
                
                // Double-check index.html exists for folder uploads (already validated in handleFolderChange, but check again for safety)
                if (uploadType === 'folder' && folderFiles) {
                  let hasIndexHtml = false;
                  for (let i = 0; i < folderFiles.length; i++) {
                    const file = folderFiles[i];
                    const relativePath = file.webkitRelativePath || file.name;

                    // Normalize path and allow index.html either at root or inside a single top-level folder
                    const normalized = relativePath.toLowerCase().replace(/^\/+/, '');
                    const parts = normalized.split('/');
                    const base = parts[parts.length - 1];
                    if (base === 'index.html' && parts.length <= 2) {
                      hasIndexHtml = true;
                      break;
                    }
                  }
                  if (!hasIndexHtml) {
                    setErrorMessage('Error: index.html file is required in the root of the uploaded folder.');
                    setIsSubmitting(false);
                    return;
                  }
                }
                
                // Note: For ZIP files, index.html validation happens on the backend after extraction
                
                const formData = new FormData();
                formData.append('name', name.trim());
                formData.append('description', description.trim());
                formData.append('category_id', String(categoryObj.id)); // Ensure it's a string
                formData.append('framework_id', String(frameworkObj.id)); // Ensure it's a string
                formData.append('price', String(price || 0)); // Ensure it's a string
                if (offerPrice) formData.append('offer_price', offerPrice);
                if (livePreviewUrl) formData.append('preview_url', livePreviewUrl);
                if (imageFile) formData.append('image', imageFile);
                
                // Handle upload type
                if (uploadType === 'zip' && zipFile) {
                  formData.append('zip_file', zipFile);
                  formData.append('upload_type', 'zip');
                } else if (uploadType === 'folder' && folderFiles && folderFiles.length > 0) {
                  // Append all folder files with their relative paths
                  // Use folder_files[] format so PHP receives it as an array
                  for (let i = 0; i < folderFiles.length; i++) {
                    const file = folderFiles[i];
                    // Use webkitRelativePath if available, otherwise use filename
                    let relativePath = file.webkitRelativePath || file.name;
                    // Remove folder name prefix if present
                    if (folderName && relativePath.startsWith(folderName + '/')) {
                      relativePath = relativePath.substring(folderName.length + 1);
                    }
                    // Append file - PHP will receive it as $_FILES['folder_files']['name'][i]
                    // The third parameter sets the filename that PHP sees
                    formData.append('folder_files[]', file, relativePath);
                  }
                  formData.append('upload_type', 'folder');
                  formData.append('folder_name', folderName || generateSlug(name));
                }

                // Append additional metadata fields
                if (lastUpdate) formData.append('last_update', lastUpdate);
                formData.append('high_resolution', highResolution ? '1' : '0');
                if (compatibleBrowsers) formData.append('compatible_browsers', compatibleBrowsers);
                if (compatibleWith) formData.append('compatible_with', compatibleWith);
                if (themehubFilesIncluded) formData.append('themehub_files_included', themehubFilesIncluded);
                if (documentation) formData.append('documentation', documentation);
                if (layout) formData.append('layout', layout);
                if (tags) formData.append('tags', tags);

                formData.append('is_latest', isLatest ? '1' : '0');
                formData.append('is_featured', isFeatured ? '1' : '0');
                
                console.log('Submitting product:', {
                  name,
                  category_id: categoryObj.id,
                  framework_id: frameworkObj.id,
                  price,
                  hasImage: !!imageFile,
                  hasZip: !!zipFile
                });
                
                // Don't set Content-Type header - browser will set it automatically for FormData
                const res = await fetch(`${ADMIN_API_URL}/products.php`, {
                  method: 'POST',
                  credentials: 'include',
                  body: formData
                  // Note: Don't set Content-Type header - browser sets it automatically with boundary for FormData
                });
                
                const responseText = await res.text();
                console.log('Product response status:', res.status);
                console.log('Product response text:', responseText);
                console.log('Response headers:', Object.fromEntries(res.headers.entries()));
                
                let data;
                try {
                  data = JSON.parse(responseText);
                } catch (parseError) {
                  console.error('JSON parse error:', parseError);
                  console.error('Response text:', responseText);
                  console.error('Response status:', res.status);
                  
                  // Try to extract useful error info
                  if (responseText.includes('error') || responseText.includes('Error')) {
                    setErrorMessage('Server error: ' + responseText.substring(0, 200));
                  } else if (res.status === 413) {
                    setErrorMessage('File too large. Maximum size is ' + MAX_ZIP_MB + 'MB. Please use a smaller file or enable folder upload.');
                   } else if (res.status === 413 && uploadType === 'folder') {
                      setErrorMessage('Your folder has too many files for upload. Please convert it to a ZIP file instead, or use folder upload with fewer files.');
                  } else if (res.status >= 500) {
                      setErrorMessage('Server error: The request could not be processed. This may be due to file size or upload limits. Please try uploading as a ZIP file if you were using folder upload.');
                  } else {
                      setErrorMessage('Invalid server response. If you are uploading a folder with many files, please try converting it to a ZIP file instead.');
                  }
                  setIsSubmitting(false);
                  return;
                }
                
                  // Handle specific error codes from backend
                  if (!data.success) {
                    if (data.error_code === 'FILE_UPLOAD_TRUNCATED') {
                      const msg = data.message + ' Consider using ZIP file upload instead of folder upload.';
                      setErrorMessage(msg);
                      console.error('File upload truncated:', data.debug);
                      setIsSubmitting(false);
                      return;
                    }
                  }
                
                if (data.success) {
                  // Update preview URL with the one returned from backend (if provided)
                  if (data.preview_url) {
                    setLivePreviewUrl(data.preview_url);
                  }
                  setSuccessMessage('Product created successfully! Redirecting...');
                  setTimeout(() => {
                    window.location.href = '/admin/products';
                  }, 1500);
                } else {
                  const errorMsg = data.message || 'Failed to create product';
                    setErrorMessage(errorMsg + (uploadType === 'folder' ? '\n\nTip: If folder upload is not working, try converting your folder to a ZIP file.' : ''));
                  console.error('Product creation error:', data);
                }
              } catch (err) {
                console.error('Product submit exception', err);
                setErrorMessage('Error creating product: ' + (err.message || err));
              } finally {
                setIsSubmitting(false);
              }
            }}>
            {/* Layout wrapper: main form + preview sidebar */}
            <div className="p-8">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-8">

                {/* Section 1: Media */}
            <section className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-6 border border-gray-200">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-md">
                  <FiImage className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">
                    Product Media
                  </h3>
                  <p className="text-sm text-gray-500">Upload thumbnail image for your product</p>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 border-2 border-dashed border-gray-300 hover:border-green-400 transition-all duration-200">
                <label className="block text-sm font-semibold text-gray-700 mb-4">
                  Thumbnail Image <span className="text-red-500">*</span>
                </label>
                <div className="flex flex-col lg:flex-row items-start gap-6">
                  {/* Image Preview Area */}
                  <div className="shrink-0">
                    {imagePreview ? (
                      <div className="relative group">
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="w-32 h-32 rounded-xl border-2 border-gray-200 shadow-lg object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setImagePreview(null);
                            setImageFile(null);
                          }}
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
            </section>

            {/* Section 2: Basic Details */}
            <section className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-6 border border-gray-200">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-md">
                  <FiFileText className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">
                    Product Details
                  </h3>
                  <p className="text-sm text-gray-500">Basic information about your product</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Product Name */}
                <div className="group">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Template Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FiFileText className="w-5 h-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      className="w-full pl-11 pr-4 py-3 rounded-lg bg-white border border-gray-300 text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="Ex: Renev – Digital Agency Template"
                      value={name}
                      onChange={(e) => {
                        setName(e.target.value);
                        // Auto-generate preview URL if ZIP file is uploaded and no URL exists
                        if (zipFile && !livePreviewUrl && e.target.value.trim()) {
                          const generatedUrl = generatePreviewUrl(e.target.value);
                          setLivePreviewUrl(generatedUrl);
                        }
                      }}
                      required
                    />
                  </div>
                </div>

                {/* Category Dropdown */}
                <div className="group">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Category (Niche) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FiTag className="w-5 h-5 text-gray-400" />
                    </div>
                    <select
                      value={selectedCat}
                      onChange={(e) => setSelectedCat(e.target.value)}
                      className="w-full pl-11 pr-10 py-3 rounded-lg bg-white border border-gray-300 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none cursor-pointer"
                      required
                    >
                      <option value="">Select Category...</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.name}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Framework Dropdown */}
                <div className="group lg:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Framework <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FiCode className="w-5 h-5 text-gray-400" />
                    </div>
                    <select
                      value={selectedFramework}
                      onChange={(e) => setSelectedFramework(e.target.value)}
                      className="w-full pl-11 pr-10 py-3 rounded-lg bg-white border border-gray-300 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none cursor-pointer"
                      required
                    >
                      <option value="">Select Framework...</option>
                      {frameworks.map((fw) => (
                        <option key={fw.id} value={fw.name}>
                          {fw.name}
                        </option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Section 3: Pricing */}
            <section className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-6 border border-gray-200">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-lg shadow-md">
                  <FaRupeeSign className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">
                    Pricing Information
                  </h3>
                  <p className="text-sm text-gray-500">Set your product pricing</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="group">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Regular Price (₹) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaRupeeSign className="w-5 h-5 text-gray-400" />
                    </div>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      className="w-full pl-11 pr-4 py-3 rounded-lg bg-white border border-gray-300 text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all"
                      placeholder="Ex: 12.00"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="group">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Offer Price (₹) <span className="text-gray-400 font-normal text-xs ml-1">(Optional)</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaRupeeSign className="w-5 h-5 text-gray-400" />
                    </div>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      className="w-full pl-11 pr-4 py-3 rounded-lg bg-white border border-gray-300 text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all"
                      placeholder="Ex: 9.00"
                      value={offerPrice}
                      onChange={(e) => setOfferPrice(e.target.value)}
                    />
                  </div>
                  {offerPrice && price && parseFloat(offerPrice) < parseFloat(price) && (
                    <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
                      <FiCheck className="w-3 h-3" />
                      {Math.round(((parseFloat(price) - parseFloat(offerPrice)) / parseFloat(price)) * 100)}% discount
                    </p>
                  )}
                </div>
              </div>
            </section>

            {/* Section 4: Extra Info */}
            <section className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-6 border border-gray-200">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-md">
                  <FiLink className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">
                    Additional Information
                  </h3>
                  <p className="text-sm text-gray-500">Extra details and product files</p>
                </div>
              </div>

              <div className="space-y-6">
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
                      className="w-full pl-11 pr-4 py-3 rounded-lg bg-white border border-gray-300 text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                      value={livePreviewUrl}
                      onChange={(e) => setLivePreviewUrl(e.target.value)}
                    />
                  </div>
                  {zipFile && livePreviewUrl && (
                    <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
                      <FiCheck className="w-3 h-3" />
                      Auto-generated from product name. You can edit if needed.
                    </p>
                  )}
                </div>

                <div className="group">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    rows="5"
                    className="w-full px-4 py-3 rounded-lg bg-white border border-gray-300 text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all resize-none"
                    placeholder="Write a detailed description about the template features, design, and functionality..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  ></textarea>
                  <p className="text-xs text-gray-500 mt-2">{description.length} characters</p>
                </div>

                {/* Additional metadata fields from screenshot */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="group">
                    <label className={labelClasses}>Last Update</label>
                    <input
                      type="date"
                      className={inputClasses}
                      value={lastUpdate}
                      onChange={(e) => setLastUpdate(e.target.value)}
                    />
                  </div>


                  <div className="group flex items-center">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={highResolution}
                        onChange={(e) => setHighResolution(e.target.checked)}
                        className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500 focus:ring-2"
                      />
                      <div>
                        <div className="font-semibold text-gray-900">High Resolution</div>
                        <div className="text-sm text-gray-500">Includes high resolution assets</div>
                      </div>
                    </label>
                  </div>

                  

                  <div className="group">
                    <label className={labelClasses}>Compatible Browsers</label>
                    <input
                      type="text"
                      placeholder="Ex: Firefox, Safari, Chrome, Edge"
                      className={inputClasses}
                      value={compatibleBrowsers}
                      onChange={(e) => setCompatibleBrowsers(e.target.value)}
                    />
                  </div>

                  <div className="group">
                    <label className={labelClasses}>Compatible With</label>
                    <input
                      type="text"
                      placeholder="Ex: Contact Form 7, Elementor, WPML"
                      className={inputClasses}
                      value={compatibleWith}
                      onChange={(e) => setCompatibleWith(e.target.value)}
                    />
                  </div>


                  <div className="group">
                    <label className={labelClasses}>Themehub Files Included</label>
                    <input
                      type="text"
                      placeholder="Ex: PHP Files, CSS Files, JS Files"
                      className={inputClasses}
                      value={themehubFilesIncluded}
                      onChange={(e) => setThemehubFilesIncluded(e.target.value)}
                    />
                  </div>

                  

                  <div className="group">
                    <label className={labelClasses}>Documentation</label>
                    <select
                      value={documentation}
                      onChange={(e) => setDocumentation(e.target.value)}
                      className={inputClasses}
                    >
                      <option>Well Documented</option>
                      <option>Basic</option>
                      <option>Not Documented</option>
                    </select>
                  </div>

                  <div className="group">
                    <label className={labelClasses}>Layout</label>
                    <select
                      value={layout}
                      onChange={(e) => setLayout(e.target.value)}
                      className={inputClasses}
                    >
                      <option>Responsive</option>
                      <option>Fixed</option>
                    </select>
                  </div>

                  <div className="group lg:col-span-2">
                    <label className={labelClasses}>Tags</label>
                    <input
                      type="text"
                      placeholder="Comma-separated tags (Ex: business, event, conference)"
                      className={inputClasses}
                      value={tags}
                      onChange={(e) => setTags(e.target.value)}
                    />
                    <p className="text-xs text-gray-500 mt-2">Separate tags with commas.</p>
                  </div>
                </div>

                {/* Upload Type Selection */}
                <div className="group">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Upload Type <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-4 mb-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="uploadType"
                        value="zip"
                        checked={uploadType === 'zip'}
                        onChange={(e) => {
                          setUploadType('zip');
                          setFolderFiles(null);
                          setFolderName('');
                          setZipFile(null);
                          setZipFileName('');
                          setFileError('');
                        }}
                        className="w-4 h-4 text-green-600 border-gray-300 focus:ring-green-500"
                      />
                      <span className="text-sm font-medium text-gray-700">ZIP File</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="uploadType"
                        value="folder"
                        checked={uploadType === 'folder'}
                        onChange={(e) => {
                          setUploadType('folder');
                          setZipFile(null);
                          setZipFileName('');
                          setFolderFiles(null);
                          setFolderName('');
                          setFileError('');
                        }}
                        className="w-4 h-4 text-green-600 border-gray-300 focus:ring-green-500"
                      />
                      <span className="text-sm font-medium text-gray-700">Folder Upload (Recommended)</span>
                    </label>
                  </div>
                  <p className="text-xs text-blue-600 bg-blue-50 p-2 rounded mt-2">
                    💡 If ZIP upload fails, use Folder Upload instead. Folder Upload is more reliable and doesn't require server extensions.
                  </p>
                </div>

                {/* ZIP File Upload */}
                {uploadType === 'zip' && (
                  <div className="group">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Upload Product File (ZIP) <span className="text-red-500">*</span>
                    </label>
                    <div className="bg-white rounded-xl p-6 border-2 border-dashed border-gray-300 hover:border-purple-400 transition-all duration-200">
                      {zipFileName ? (
                        <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg border border-purple-200">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-purple-500 rounded-lg">
                              <FiFile className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900">{zipFileName}</p>
                              <p className="text-xs text-gray-500">
                                {(zipFile?.size / (1024 * 1024)).toFixed(2)} MB
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setZipFile(null);
                              setZipFileName('');
                            }}
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
                            ZIP, RAR, 7Z (Max {MAX_ZIP_MB}MB)
                          </span>
                          <input
                            type="file"
                            accept=".zip,.rar,.7z"
                            onChange={handleZipChange}
                            className="hidden"
                          />
                        </label>
                      )}
                    </div>
                  </div>
                )}

                {/* Folder Upload */}
                {uploadType === 'folder' && (
                  <div className="group">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Upload Template Folder <span className="text-red-500">*</span>
                    </label>
                    <div className="bg-white rounded-xl p-6 border-2 border-dashed border-gray-300 hover:border-purple-400 transition-all duration-200">
                      {folderFiles && folderFiles.length > 0 ? (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-green-500 rounded-lg">
                                <FiFile className="w-5 h-5 text-white" />
                              </div>
                              <div>
                                <p className="font-semibold text-gray-900">Folder: {folderName}</p>
                                <p className="text-xs text-gray-500">
                                  {folderFiles.length} file(s) • {((folderFiles.reduce((acc, f) => acc + f.size, 0)) / (1024 * 1024)).toFixed(2)} MB
                                </p>
                                <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                                  <FiCheck className="w-3 h-3" />
                                  index.html found ✓
                                </p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setFolderFiles(null);
                                setFolderName('');
                                const input = document.getElementById('folder-upload');
                                if (input) input.value = '';
                              }}
                              className="p-2 hover:bg-red-100 rounded-lg transition text-red-600"
                            >
                              <FiX className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <label htmlFor="folder-upload" className="cursor-pointer flex flex-col items-center justify-center py-8">
                          <div className="p-4 bg-green-100 rounded-full mb-4">
                            <FiUpload className="w-8 h-8 text-green-600" />
                          </div>
                          <span className="text-sm font-semibold text-gray-700 mb-1">
                            Click to select folder
                          </span>
                          <span className="text-xs text-gray-500 mb-2">
                            Select a folder containing your template files (Max {MAX_ZIP_MB}MB)
                          </span>
                          <span className="text-xs text-red-600 font-medium">
                            ⚠️ Must include index.html in the root folder
                          </span>
                          <input
                            type="file"
                            id="folder-upload"
                            webkitdirectory=""
                            directory=""
                            onChange={handleFolderChange}
                            className="hidden"
                          />
                        </label>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* Section 5: Display Options */}
            <section className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-6 border border-gray-200">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg shadow-md">
                  <FiStar className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">
                    Display Options
                  </h3>
                  <p className="text-sm text-gray-500">Choose where this product should appear on the homepage</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-white rounded-lg p-4 border-2 border-gray-200">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isLatest}
                      onChange={(e) => setIsLatest(e.target.checked)}
                      className="w-5 h-5 text-green-600 border-gray-300 rounded focus:ring-green-500 focus:ring-2"
                    />
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900">Latest Template</div>
                      <div className="text-sm text-gray-500">Show this product in the "Latest Templates" section on the homepage</div>
                    </div>
                  </label>
                </div>

                <div className="bg-white rounded-lg p-4 border-2 border-gray-200">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isFeatured}
                      onChange={(e) => setIsFeatured(e.target.checked)}
                      className="w-5 h-5 text-green-600 border-gray-300 rounded focus:ring-green-500 focus:ring-2"
                    />
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900">Featured Template</div>
                      <div className="text-sm text-gray-500">Show this product in the "Featured Templates" section on the homepage</div>
                    </div>
                  </label>
                </div>

                {!isLatest && !isFeatured && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-start gap-2">
                    <FiAlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                    <p className="text-sm text-yellow-800">
                      <strong>Note:</strong> If neither option is selected, this product will still be available in the product catalog but won't appear in the homepage sections.
                    </p>
                  </div>
                )}
              </div>
            </section>

                </div>

                {/* Preview sidebar removed per request */}

              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-6 flex flex-col sm:flex-row gap-4 justify-end border-t border-gray-200 mt-8">
              <button
                type="button"
                onClick={() => window.history.back()}
                className="px-8 py-3 rounded-xl font-semibold text-gray-700 bg-white border-2 border-gray-300 hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-300 flex items-center justify-center gap-2"
              >
                <FiX className="w-5 h-5" />
                Cancel
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="px-8 py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 shadow-lg shadow-green-500/30 transform hover:-translate-y-0.5 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <FiLoader className="w-5 h-5 animate-spin" />
                    Publishing...
                  </>
                ) : (
                  <>
                    <FiCheck className="w-5 h-5" />
                    Publish Product
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </MainLayout>
  );
}
