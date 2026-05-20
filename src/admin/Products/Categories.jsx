import { useState, useEffect } from "react";
import MainLayout from "../components/MainLayout";
import { FiEdit2, FiTrash2, FiCheck, FiX, FiPlus, FiTag, FiCode, FiLoader } from "react-icons/fi";

/* DEFAULT DOMAIN CATEGORIES */
const defaultCategories = [
  "Ecommerce",
  "Portfolio",
  "Travelling",
  "Fashion",
  "Education",
  "Corporate",
  "Technology",
  "Medical",
];

/* DEFAULT FRAMEWORKS (TECH STACK) */
const defaultFrameworks = [
  "HTML Templates",
  "React Templates",
  "Angular Templates",
  "Next.js Templates",
  "Vue Templates",
  "WordPress Themes",
  "Shopify Themes",
];

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [frameworks, setFrameworks] = useState([]);
  const [loading, setLoading] = useState(true);

  const [newCategory, setNewCategory] = useState("");
  const [newFramework, setNewFramework] = useState("");
  const [addingCategory, setAddingCategory] = useState(false);
  const [addingFramework, setAddingFramework] = useState(false);

  const [editing, setEditing] = useState({ type: null, id: null });
  const [editValue, setEditValue] = useState("");

  const API_URL = process.env.REACT_APP_API_URL || "https://uptulathemehub.com/backend/api";
  const ADMIN_API_URL = `${API_URL}/admin`;

  /* LOAD DATA FROM API */
  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch(`${ADMIN_API_URL}/categories.php?type=category`, { credentials: "include" })
        .then(res => res.json())
        .then(data => {
          if (data.success && data.categories) {
            setCategories(data.categories);
          }
        })
        .catch(err => console.error('Categories fetch error', err)),
      fetch(`${ADMIN_API_URL}/categories.php?type=framework`, { credentials: "include" })
        .then(res => res.json())
        .then(data => {
          if (data.success && data.frameworks) {
            setFrameworks(data.frameworks);
          }
        })
        .catch(err => console.error('Frameworks fetch error', err))
    ]).finally(() => setLoading(false));
  }, []);

  /* ADD */
  const addCategory = async (e) => {
    e.preventDefault();
    if (!newCategory.trim()) return;
    setAddingCategory(true);

    try {
      const res = await fetch(`${ADMIN_API_URL}/categories.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name: newCategory.trim(), type: 'category' })
      });
      
      const data = await res.json();
      if (data.success) {
        setCategories([...categories, { id: data.id, name: newCategory.trim() }]);
        setNewCategory("");
      } else {
        alert('Error: ' + (data.message || 'Failed to add category'));
      }
    } catch (err) {
      console.error('Add category error', err);
      alert('Error adding category');
    } finally {
      setAddingCategory(false);
    }
  };

  const addFramework = async (e) => {
    e.preventDefault();
    if (!newFramework.trim()) return;
    setAddingFramework(true);

    try {
      const res = await fetch(`${ADMIN_API_URL}/categories.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name: newFramework.trim(), type: 'framework' })
      });
      
      const data = await res.json();
      if (data.success) {
        setFrameworks([...frameworks, { id: data.id, name: newFramework.trim() }]);
        setNewFramework("");
      } else {
        alert('Error: ' + (data.message || 'Failed to add framework'));
      }
    } catch (err) {
      console.error('Add framework error', err);
      alert('Error adding framework');
    } finally {
      setAddingFramework(false);
    }
  };

  /* DELETE */
  const deleteItem = async (type, id) => {
    if (!window.confirm(`Delete this ${type}?`)) return;

    try {
      const res = await fetch(`${ADMIN_API_URL}/categories.php`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ id, type })
      });
      
      const data = await res.json();
      if (data.success) {
        if (type === "category") {
          setCategories(categories.filter((c) => c.id !== id));
        } else {
          setFrameworks(frameworks.filter((f) => f.id !== id));
        }
      } else {
        alert('Error: ' + (data.message || 'Failed to delete'));
      }
    } catch (err) {
      console.error('Delete error', err);
      alert('Error deleting item');
    }
  };

  /* EDIT */
  const startEdit = (type, item) => {
    setEditing({ type, id: item.id });
    setEditValue(item.name);
  };

  const cancelEdit = () => {
    setEditing({ type: null, id: null });
    setEditValue("");
  };

  const saveEdit = async () => {
    if (!editValue.trim()) return;

    try {
      const res = await fetch(`${ADMIN_API_URL}/categories.php`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ id: editing.id, name: editValue.trim(), type: editing.type })
      });
      
      const data = await res.json();
      if (data.success) {
        if (editing.type === "category") {
          setCategories(categories.map((c) =>
            c.id === editing.id ? { ...c, name: editValue.trim() } : c
          ));
        } else {
          setFrameworks(frameworks.map((f) =>
            f.id === editing.id ? { ...f, name: editValue.trim() } : f
          ));
        }
        cancelEdit();
      } else {
        alert('Error: ' + (data.message || 'Failed to update'));
      }
    } catch (err) {
      console.error('Update error', err);
      alert('Error updating item');
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <FiLoader className="w-12 h-12 text-gray-400 animate-spin mx-auto mb-4" />
            <p className="text-gray-500">Loading categories and frameworks...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          Categories & Frameworks
        </h2>
        <p className="text-gray-500">Manage product categories and technology frameworks</p>
      </div>

      {/* ADD FORMS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Add Category Card */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <FiTag className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white">Add Category</h3>
            </div>
          </div>
          <form onSubmit={addCategory} className="p-6">
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Category Name
              </label>
              <input
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                placeholder="e.g., Ecommerce, Portfolio, Fashion"
                required
              />
            </div>
            <button
              type="submit"
              disabled={addingCategory}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {addingCategory ? (
                <>
                  <FiLoader className="animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <FiPlus />
                  Add Category
                </>
              )}
            </button>
          </form>
        </div>

        {/* Add Framework Card */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-purple-500 to-purple-600 px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <FiCode className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white">Add Framework</h3>
            </div>
          </div>
          <form onSubmit={addFramework} className="p-6">
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Framework Name
              </label>
              <input
                value={newFramework}
                onChange={(e) => setNewFramework(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition"
                placeholder="e.g., React Templates, Vue Templates"
                required
              />
            </div>
            <button
              type="submit"
              disabled={addingFramework}
              className="w-full bg-gradient-to-r from-purple-600 to-purple-700 text-white px-6 py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-purple-800 shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {addingFramework ? (
                <>
                  <FiLoader className="animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <FiPlus />
                  Add Framework
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* LISTS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CATEGORIES */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500 rounded-lg">
                  <FiTag className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Categories</h3>
                  <p className="text-sm text-gray-500">{categories.length} categories</p>
                </div>
              </div>
            </div>
          </div>
          <div className="p-6">
            {categories.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FiTag className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-500 font-medium">No categories yet</p>
                <p className="text-sm text-gray-400 mt-1">Add your first category above</p>
              </div>
            ) : (
              <div className="space-y-3">
                {categories.map((c) => (
                  <div
                    key={c.id}
                    className="group flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-blue-50 border border-gray-200 hover:border-blue-300 transition-all duration-200"
                  >
                    {editing.type === "category" && editing.id === c.id ? (
                      <div className="flex-1 flex items-center gap-2">
                        <input
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className="flex-1 border-2 border-blue-500 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') saveEdit();
                            if (e.key === 'Escape') cancelEdit();
                          }}
                        />
                        <button
                          onClick={saveEdit}
                          className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition"
                          title="Save"
                        >
                          <FiCheck size={18} />
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="p-2 bg-gray-400 text-white rounded-lg hover:bg-gray-500 transition"
                          title="Cancel"
                        >
                          <FiX size={18} />
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                            {c.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-semibold text-gray-900">{c.name}</span>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => startEdit("category", c)}
                            className="p-2 hover:bg-blue-100 rounded-lg transition text-blue-600"
                            title="Edit Category"
                          >
                            <FiEdit2 size={18} />
                          </button>
                          <button
                            onClick={() => deleteItem("category", c.id)}
                            className="p-2 hover:bg-red-100 rounded-lg transition text-red-600"
                            title="Delete Category"
                          >
                            <FiTrash2 size={18} />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* FRAMEWORKS */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-purple-50 to-purple-100 px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500 rounded-lg">
                  <FiCode className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Frameworks</h3>
                  <p className="text-sm text-gray-500">{frameworks.length} frameworks</p>
                </div>
              </div>
            </div>
          </div>
          <div className="p-6">
            {frameworks.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FiCode className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-500 font-medium">No frameworks yet</p>
                <p className="text-sm text-gray-400 mt-1">Add your first framework above</p>
              </div>
            ) : (
              <div className="space-y-3">
                {frameworks.map((f) => (
                  <div
                    key={f.id}
                    className="group flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-purple-50 border border-gray-200 hover:border-purple-300 transition-all duration-200"
                  >
                    {editing.type === "framework" && editing.id === f.id ? (
                      <div className="flex-1 flex items-center gap-2">
                        <input
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className="flex-1 border-2 border-purple-500 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') saveEdit();
                            if (e.key === 'Escape') cancelEdit();
                          }}
                        />
                        <button
                          onClick={saveEdit}
                          className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition"
                          title="Save"
                        >
                          <FiCheck size={18} />
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="p-2 bg-gray-400 text-white rounded-lg hover:bg-gray-500 transition"
                          title="Cancel"
                        >
                          <FiX size={18} />
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                            {f.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-semibold text-gray-900">{f.name}</span>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => startEdit("framework", f)}
                            className="p-2 hover:bg-purple-100 rounded-lg transition text-purple-600"
                            title="Edit Framework"
                          >
                            <FiEdit2 size={18} />
                          </button>
                          <button
                            onClick={() => deleteItem("framework", f.id)}
                            className="p-2 hover:bg-red-100 rounded-lg transition text-red-600"
                            title="Delete Framework"
                          >
                            <FiTrash2 size={18} />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
