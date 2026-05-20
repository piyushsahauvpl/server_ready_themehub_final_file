import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import MainLayout from "../components/MainLayout";
import { FiFileText, FiImage, FiUpload, FiLoader, FiX, FiCheck, FiAlertCircle } from "react-icons/fi";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import TextAlign from "@tiptap/extension-text-align";
import { TextStyle } from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";

export default function AddBlog() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Check if page is opened in edit mode
  const editId = searchParams.get("id");
  const editTitle = searchParams.get("title");
  const editContent = searchParams.get("content");

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [loadingBlog, setLoadingBlog] = useState(false);

  // Initialize Tiptap editor
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3, 4, 5, 6],
        },
        link: {
          openOnClick: false,
        },
      }),
      Image,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      TextStyle,
      Color,
    ],
    content: content,
    onUpdate: ({ editor }) => {
      setContent(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none min-h-[300px] px-4 py-3',
      },
    },
  });

  // Update editor content when content prop changes (for edit mode)
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  // Fetch blog data when editing
  useEffect(() => {
    if (editId && !editTitle && !editContent) {
      setLoadingBlog(true);
      const API_URL = process.env.REACT_APP_API_URL || "https://uptulathemehub.com/backend/api";
      const ADMIN_API_URL = `${API_URL}/admin`;
      
      fetch(`${ADMIN_API_URL}/blogs.php?id=${editId}`, {
        credentials: 'include'
      })
        .then(res => res.json())
        .then(data => {
          if (data.success && data.blog) {
            setTitle(data.blog.title || "");
            setContent(data.blog.content || "");
            if (data.blog.image_url) {
              setImagePreview(`${API_URL}${data.blog.image_url}`);
            }
          } else {
            setErrorMessage('Failed to load blog post');
          }
        })
        .catch(err => {
          console.error('Error loading blog:', err);
          setErrorMessage('Error loading blog post');
        })
        .finally(() => setLoadingBlog(false));
    } else if (editId && (editTitle || editContent)) {
      // Use query params if provided
      setTitle(editTitle || "");
      setContent(editContent || "");
    }
  }, [editId, editTitle, editContent]);

  // Set editor content when editing
  useEffect(() => {
    if (editor && (editTitle || editContent)) {
      editor.commands.setContent(editContent || "");
    }
  }, [editor, editContent]);

  // Cleanup editor on unmount
  useEffect(() => {
    return () => {
      if (editor) {
        editor.destroy();
      }
    };
  }, [editor]);

  // Clear error messages on mount
  useEffect(() => {
    setErrorMessage('');
    setSuccessMessage('');
  }, []);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage('');
    setSuccessMessage('');

    // Validate content
    const textContent = editor ? editor.getText().trim() : content.replace(/<[^>]*>/g, '').trim();
    if (!title.trim()) {
      setErrorMessage('Please enter a blog title.');
      setIsSubmitting(false);
      return;
    }
    if (!textContent) {
      setErrorMessage('Please enter blog content.');
      setIsSubmitting(false);
      return;
    }

    try {
      const API_URL = process.env.REACT_APP_API_URL || "https://uptulathemehub.com/backend/api";
      const ADMIN_API_URL = `${API_URL}/admin`;
      
      // Get latest content from editor
      const finalContent = editor ? editor.getHTML() : content;
      
      if (editId) {
        // Update existing blog
        const res = await fetch(`${ADMIN_API_URL}/blogs.php`, {
          method: 'PUT',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editId, title, content: finalContent })
        });
        
        const data = await res.json();
        if (data.success) {
          setSuccessMessage('Blog updated successfully!');
          setTimeout(() => navigate('/admin/blogs'), 1500);
        } else {
          setErrorMessage(data.message || 'Failed to update blog');
          setIsSubmitting(false);
        }
      } else {
        // Create new blog with FormData for file upload
        const formData = new FormData();
        formData.append('title', title);
        formData.append('content', finalContent);
        if (image) formData.append('image', image);
        
        const res = await fetch(`${ADMIN_API_URL}/blogs.php`, {
          method: 'POST',
          credentials: 'include',
          body: formData
        });
        
        const data = await res.json();
        
        if (!res.ok || !data.success) {
          const errorMsg = data.message || data.debug?.message || `HTTP Error: ${res.status} ${res.statusText}`;
          setErrorMessage(errorMsg);
          setIsSubmitting(false);
          console.error('Blog creation error:', data);
        } else {
          setSuccessMessage('Blog created successfully!');
          setTimeout(() => navigate('/admin/blogs'), 1500);
        }
      }
    } catch (err) {
      console.error('Blog save error', err);
      setErrorMessage('Error saving blog: ' + (err.message || 'Unknown error'));
      setIsSubmitting(false);
    }
  };

  // Reusable styles
  const inputClasses = "w-full px-4 py-2.5 rounded-lg bg-gray-50 border border-gray-300 text-gray-700 placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 ease-in-out";
  const labelClasses = "block text-sm font-semibold text-gray-600 mb-1.5 group-focus-within:text-green-700 transition-colors";

  return (
    <MainLayout>
      <div className="w-full px-4 py-6">
        {/* Loading indicator for blog data */}
        {loadingBlog && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-3">
            <FiLoader className="w-5 h-5 text-blue-600 animate-spin" />
            <p className="text-blue-800">Loading blog post...</p>
          </div>
        )}

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg">
              <FiFileText className="w-6 h-6 text-white" />
            </div>
          <div>
              <h2 className="text-3xl font-bold text-gray-900">
              {editId ? "Edit Blog Post" : "Create New Blog"}
            </h2>
              <p className="text-gray-500 mt-1">{editId ? "Update your blog post" : "Write and publish a new blog post"}</p>
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

        {/* Main Form Card */}
        <div className="w-full bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200">
          <div className="h-1 bg-gradient-to-r from-green-400 via-green-500 to-green-600"></div>

          <form onSubmit={handleSubmit} className="p-8 space-y-8">
            {/* Section 1: Media */}
            <section className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-6 border border-gray-200">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-gradient-to-br from-green-500 to-green-600 rounded-lg">
                  <FiImage className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Featured Image</h3>
                  <p className="text-sm text-gray-500">Upload a cover image for your blog</p>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 border-2 border-dashed border-gray-300 hover:border-green-400 transition-all duration-200">
                <div className="flex flex-col lg:flex-row items-start gap-6">
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
                            setImage(null);
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
                  <div className="flex-1">
                        <label
                        htmlFor="blog-upload"
                      className="cursor-pointer inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg font-semibold text-sm shadow-lg hover:from-green-600 hover:to-green-700 transform hover:-translate-y-0.5 transition-all duration-200"
                        >
                      <FiUpload className="w-5 h-5" />
                      Choose Image
                        </label>
                        <input
                        type="file"
                        id="blog-upload"
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageChange}
                        />
                    <p className="text-xs text-gray-500 mt-3 flex items-center gap-1">
                      <FiAlertCircle className="w-3 h-3" />
                      Recommended size: 1200x600px (JPG, PNG)
                    </p>
                    </div>
                </div>
              </div>
            </section>

            {/* Section 2: Content */}
            <section className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-6 border border-gray-200">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg">
                  <FiFileText className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Blog Details</h3>
                  <p className="text-sm text-gray-500">Write your blog title and content</p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="group">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Blog Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Enter an engaging title..."
                    className="w-full px-4 py-3 rounded-lg bg-white border border-gray-300 text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                </div>

                <div className="group">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Content <span className="text-red-500">*</span>
                  </label>
                  <div className="bg-white rounded-lg border border-gray-300 focus-within:ring-2 focus-within:ring-green-500 focus-within:border-transparent transition overflow-hidden">
                    <style>{`
                      .tiptap-editor {
                        min-height: 300px;
                      }
                      .tiptap-editor .ProseMirror {
                        min-height: 300px;
                        padding: 16px;
                        outline: none;
                      }
                      .tiptap-editor .ProseMirror p.is-editor-empty:first-child::before {
                        color: #9ca3af;
                        content: attr(data-placeholder);
                        float: left;
                        height: 0;
                        pointer-events: none;
                      }
                      .tiptap-toolbar {
                        display: flex;
                        flex-wrap: wrap;
                        gap: 4px;
                        padding: 12px;
                        background: #f9fafb;
                        border-bottom: 1px solid #e5e7eb;
                      }
                      .tiptap-toolbar button {
                        display: inline-flex;
                        align-items: center;
                        justify-content: center;
                        padding: 6px 8px;
                        border: 1px solid #d1d5db;
                        background: white;
                        border-radius: 6px;
                        cursor: pointer;
                        color: #4b5563;
                        font-size: 14px;
                        transition: all 0.2s;
                      }
                      .tiptap-toolbar button:hover {
                        background: #f3f4f6;
                        border-color: #9ca3af;
                      }
                      .tiptap-toolbar button.is-active {
                        background: #04733c;
                        color: white;
                        border-color: #04733c;
                      }
                      .tiptap-toolbar select {
                        padding: 6px 8px;
                        border: 1px solid #d1d5db;
                        background: white;
                        border-radius: 6px;
                        color: #4b5563;
                        font-size: 14px;
                        cursor: pointer;
                      }
                      .tiptap-toolbar select:hover {
                        background: #f3f4f6;
                        border-color: #9ca3af;
                      }
                      .tiptap-toolbar .divider {
                        width: 1px;
                        height: 24px;
                        background: #e5e7eb;
                        margin: 0 4px;
                      }
                    `}</style>
                    {editor && (
                      <>
                        <div className="tiptap-toolbar">
                          <select
                            onChange={(e) => {
                              const level = parseInt(e.target.value);
                              if (level === 0) {
                                editor.chain().focus().setParagraph().run();
                              } else {
                                editor.chain().focus().toggleHeading({ level }).run();
                              }
                            }}
                            value={
                              editor.isActive('heading', { level: 1 }) ? 1 :
                              editor.isActive('heading', { level: 2 }) ? 2 :
                              editor.isActive('heading', { level: 3 }) ? 3 :
                              editor.isActive('heading', { level: 4 }) ? 4 :
                              editor.isActive('heading', { level: 5 }) ? 5 :
                              editor.isActive('heading', { level: 6 }) ? 6 : 0
                            }
                          >
                            <option value={0}>Paragraph</option>
                            <option value={1}>Heading 1</option>
                            <option value={2}>Heading 2</option>
                            <option value={3}>Heading 3</option>
                            <option value={4}>Heading 4</option>
                            <option value={5}>Heading 5</option>
                            <option value={6}>Heading 6</option>
                          </select>
                          <div className="divider"></div>
                          <button
                            onClick={() => editor.chain().focus().toggleBold().run()}
                            className={editor.isActive('bold') ? 'is-active' : ''}
                            type="button"
                            title="Bold"
                          >
                            <strong>B</strong>
                          </button>
                          <button
                            onClick={() => editor.chain().focus().toggleItalic().run()}
                            className={editor.isActive('italic') ? 'is-active' : ''}
                            type="button"
                            title="Italic"
                          >
                            <em>I</em>
                          </button>
                          <button
                            onClick={() => editor.chain().focus().toggleUnderline().run()}
                            className={editor.isActive('underline') ? 'is-active' : ''}
                            type="button"
                            title="Underline"
                          >
                            <u>U</u>
                          </button>
                          <button
                            onClick={() => editor.chain().focus().toggleStrike().run()}
                            className={editor.isActive('strike') ? 'is-active' : ''}
                            type="button"
                            title="Strikethrough"
                          >
                            <s>S</s>
                          </button>
                          <div className="divider"></div>
                          <button
                            onClick={() => editor.chain().focus().toggleBulletList().run()}
                            className={editor.isActive('bulletList') ? 'is-active' : ''}
                            type="button"
                            title="Bullet List"
                          >
                            •
                          </button>
                          <button
                            onClick={() => editor.chain().focus().toggleOrderedList().run()}
                            className={editor.isActive('orderedList') ? 'is-active' : ''}
                            type="button"
                            title="Numbered List"
                          >
                            1.
                          </button>
                          <button
                            onClick={() => editor.chain().focus().toggleBlockquote().run()}
                            className={editor.isActive('blockquote') ? 'is-active' : ''}
                            type="button"
                            title="Quote"
                          >
                            "
                          </button>
                          <div className="divider"></div>
                          <button
                            onClick={() => {
                              document.getElementById('editor-image-upload').click();
                            }}
                            type="button"
                            title="Upload & Insert Image"
                          >
                            <FiUpload className="inline w-5 h-5 mr-1" /> Insert Image
                          </button>
                          <input
                            type="file"
                            id="editor-image-upload"
                            accept="image/*"
                            style={{ display: 'none' }}
                            onChange={async (e) => {
                              const file = e.target.files[0];
                              if (!file) return;
                              // Upload image to server
                              const formData = new FormData();
                              formData.append('image', file);
                              try {
                                const API_URL = process.env.REACT_APP_API_URL || "https://uptulathemehub.com/backend/api";
                                const ADMIN_API_URL = `${API_URL}/admin`;
                                const res = await fetch(`${ADMIN_API_URL}/upload-image.php`, {
                                  method: 'POST',
                                  credentials: 'include',
                                  body: formData
                                });
                                const data = await res.json();
                                if (data.success && data.url) {
                                  editor.chain().focus().setImage({ src: data.url }).run();
                                } else {
                                  alert(data.message || 'Image upload failed');
                                }
                              } catch (err) {
                                alert('Image upload error: ' + (err.message || 'Unknown error'));
                              } finally {
                                e.target.value = '';
                              }
                            }}
                          />
                          <button
                            onClick={() => {
                              const url = window.prompt('Enter URL:');
                              if (url) {
                                editor.chain().focus().setLink({ href: url }).run();
                              }
                            }}
                            className={editor.isActive('link') ? 'is-active' : ''}
                            type="button"
                            title="Insert Link"
                          >
                            🔗
                          </button>
                          <div className="divider"></div>
                          <select
                            onChange={(e) => {
                              if (e.target.value === 'left') {
                                editor.chain().focus().setTextAlign('left').run();
                              } else if (e.target.value === 'center') {
                                editor.chain().focus().setTextAlign('center').run();
                              } else if (e.target.value === 'right') {
                                editor.chain().focus().setTextAlign('right').run();
                              } else {
                                editor.chain().focus().setTextAlign('justify').run();
                              }
                            }}
                          >
                            <option value="">Align</option>
                            <option value="left">Left</option>
                            <option value="center">Center</option>
                            <option value="right">Right</option>
                            <option value="justify">Justify</option>
                          </select>
                          <input
                            type="color"
                            onChange={(e) => editor.chain().focus().setColor(e.target.value).run()}
                            title="Text Color"
                            style={{ width: '40px', height: '32px', cursor: 'pointer', border: '1px solid #d1d5db', borderRadius: '6px' }}
                          />
                          <div className="divider"></div>
                          <button
                            onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()}
                            type="button"
                            title="Clear Formatting"
                          >
                            Clear
                          </button>
                        </div>
                        <div className="tiptap-editor">
                          <EditorContent editor={editor} />
                        </div>
                      </>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    {editor ? editor.getText().length : 0} characters
                    {content.includes('<') && ' (HTML content)'}
                  </p>
                </div>
              </div>
            </section>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row justify-end gap-4 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => navigate("/admin/blogs")}
                className="px-8 py-3 rounded-xl font-semibold text-gray-700 bg-white border-2 border-gray-300 hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 flex items-center justify-center gap-2"
              >
                <FiX className="w-5 h-5" />
                Cancel
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="px-8 py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 shadow-lg shadow-green-500/30 transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <FiLoader className="w-5 h-5 animate-spin" />
                    Publishing...
                  </>
                ) : (
                  <>
                    <FiCheck className="w-5 h-5" />
                {editId ? "Update Blog Post" : "Publish Blog Post"}
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
