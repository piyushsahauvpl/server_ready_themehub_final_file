import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import MainLayout from "../components/MainLayout";
import { FiFileText, FiPlus, FiEdit, FiTrash2, FiSearch, FiLoader } from "react-icons/fi";

export default function ViewBlogs() {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const API_URL = process.env.REACT_APP_API_URL || "https://uptulathemehub.com/backend/api";
  const ADMIN_API_URL = `${API_URL}/admin`;

  const fetchBlogs = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${ADMIN_API_URL}/blogs.php`, { credentials: "include" });
      const data = await res.json();
      
      if (data.success && data.blogs) {
        setBlogs(data.blogs);
      }
    } catch (err) {
      console.error('Blogs fetch error', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlogs();
  }, []);

  // Refresh blogs when returning to this page (visibility change)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchBlogs();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  const filteredBlogs = blogs.filter(blog =>
    blog.title?.toLowerCase().includes(search.toLowerCase()) ||
    blog.content?.toLowerCase().includes(search.toLowerCase())
  );

  const deleteBlog = async (id) => {
    if (!window.confirm("Delete this blog?")) return;
    
    try {
      const res = await fetch(`${ADMIN_API_URL}/blogs.php`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ id })
      });
      
      const data = await res.json();
      if (data.success) {
        setBlogs((prev) => prev.filter((b) => b.id !== id));
      } else {
        alert('Error: ' + (data.message || 'Failed to delete blog'));
      }
    } catch (err) {
      console.error('Delete blog error', err);
      alert('Error deleting blog');
    }
  };

  return (
    <MainLayout>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg">
            <FiFileText className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h2 className="text-3xl font-bold text-gray-900">Blog Management</h2>
            <p className="text-gray-500 mt-1">Manage and edit your blog posts</p>
          </div>
          <Link
            to="/admin/add-blog"
            className="bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-3 rounded-lg shadow-lg hover:shadow-xl hover:from-green-700 hover:to-green-800 transition-all duration-200 font-semibold flex items-center gap-2"
          >
            <FiPlus className="w-5 h-5" />
            Add Blog
          </Link>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-6">
        <div className="relative">
          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search blogs by title or content..."
            className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white shadow-lg rounded-xl overflow-hidden border border-gray-200">
        {loading ? (
          <div className="text-center py-16">
            <FiLoader className="w-12 h-12 text-gray-400 animate-spin mx-auto mb-4" />
            <p className="text-gray-500">Loading blogs...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-700 uppercase tracking-wider">#</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-700 uppercase tracking-wider">Title</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-700 uppercase tracking-wider">Content</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-700 uppercase tracking-wider">Image</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-700 uppercase tracking-wider text-center">Actions</th>
                </tr>
              </thead>

              <tbody className="bg-white divide-y divide-gray-200">
                {filteredBlogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center">
                        <FiFileText className="w-16 h-16 text-gray-300 mb-4" />
                        <p className="text-lg font-medium text-gray-500">No blogs found</p>
                        <p className="text-sm text-gray-400 mt-1">
                          {search ? "Try adjusting your search" : "Create your first blog post"}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredBlogs.map((blog, index) => (
                    <tr key={blog.id} className="hover:bg-green-50 transition-colors duration-150">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{index + 1}</td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-semibold text-gray-900">{blog.title}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-600 max-w-md truncate">
                          {blog.content ? blog.content.replace(/<[^>]*>/g, '').slice(0, 80) : 'No content'}...
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {blog.image_url ? (
                          <img
                            src={`${API_URL}${blog.image_url}`}
                            className="w-20 h-20 object-cover rounded-lg border border-gray-200 shadow-sm"
                            alt="blog"
                          />
                        ) : (
                          <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center border border-gray-200">
                            <FiFileText className="w-8 h-8 text-gray-400" />
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="flex justify-center gap-2">
                          <Link
                            to={`/admin/add-blog?id=${blog.id}`}
                            className="p-2 hover:bg-blue-100 rounded-lg transition text-blue-600"
                            title="Edit Blog"
                          >
                            <FiEdit size={18} />
                          </Link>
                          <button
                            onClick={() => deleteBlog(blog.id)}
                            className="p-2 hover:bg-red-100 rounded-lg transition text-red-600"
                            title="Delete Blog"
                          >
                            <FiTrash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {!loading && (
        <div className="mt-6 flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Showing <span className="font-semibold">{filteredBlogs.length}</span> of <span className="font-semibold">{blogs.length}</span> blogs
          </p>
        </div>
      )}
    </MainLayout>
  );
}
