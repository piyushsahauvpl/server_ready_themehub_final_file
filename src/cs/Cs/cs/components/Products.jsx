import { useState, useEffect } from "react";
import MainLayout from "../components/MainLayout";
import { FiEdit, FiTrash2 } from "react-icons/fi";

const statusColors = {
  "In Stock": "text-green-600 bg-green-100",
  "Out of Stock": "text-red-600 bg-red-100",
  Limited: "text-yellow-600 bg-yellow-100",
};

export default function Products() {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [categories, setCategories] = useState([]);

  const [selectedProduct, setSelectedProduct] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  const itemsPerPage = 3;

  // Load categories dynamically from localStorage
  useEffect(() => {
    const savedCategories = JSON.parse(localStorage.getItem("categories"));

    if (savedCategories && savedCategories.length > 0) {
      setCategories(savedCategories);
    } else {
      setCategories([
        { id: 1, name: "React Templates" },
        { id: 2, name: "HTML Templates" },
        { id: 3, name: "Angular Templates" },
        { id: 4, name: "Next.js Templates" },
        { id: 5, name: "Vue Templates" },
        { id: 6, name: "Laravel Templates" },
      ]);
    }
  }, []);

  // Initial products (can be replaced by backend later)
  useEffect(() => {
    const initialProducts = [
      {
        id: 1,
        img: "https://via.placeholder.com/50",
        name: "React Admin Panel",
        category: "React Templates",
        stock: 25,
        price: 999,
        status: "In Stock",
      },
      {
        id: 2,
        img: "https://via.placeholder.com/50",
        name: "HTML Portfolio",
        category: "HTML Templates",
        stock: 0,
        price: 299,
        status: "Out of Stock",
      },
      {
        id: 3,
        img: "https://via.placeholder.com/50",
        name: "Next.js SaaS Template",
        category: "Next.js Templates",
        stock: 10,
        price: 499,
        status: "Limited",
      },
    ];

    setProducts(initialProducts);
  }, []);

  // Filtering logic
  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) &&
      (!categoryFilter || p.category === categoryFilter)
  );

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const visibleProducts = filtered.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Save Edit
  const handleEditSave = () => {
    setProducts((prev) =>
      prev.map((p) =>
        p.id === selectedProduct.id ? selectedProduct : p
      )
    );
    setSelectedProduct(null);
  };

  // Delete Product
  const confirmDelete = () => {
    setProducts((prev) => prev.filter((p) => p.id !== deleteId));
    setDeleteId(null);
  };

  return (
    <MainLayout>
      {/* Breadcrumb */}
      <div className="text-gray-500 text-sm mb-3">
        Home / <span className="text-gray-800 font-medium">Products</span>
      </div>

      {/* Title + Add Product Button */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Product Overview</h2>

        <button
          onClick={() => (window.location.href = "/add-product")}
          className="bg-green-600 text-white px-4 py-2 rounded-lg shadow hover:bg-green-700 transition"
        >
          + Add Product
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl shadow-md border-l-4 border-green-500">
          <p className="font-semibold text-gray-700">Total Products</p>
          <h3 className="text-3xl font-bold text-green-600">{products.length}</h3>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-md border-l-4 border-yellow-500">
          <p className="font-semibold text-gray-700">Limited Stock</p>
          <h3 className="text-3xl font-bold text-yellow-600">
            {products.filter((p) => p.status === "Limited").length}
          </h3>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-md border-l-4 border-red-500">
          <p className="font-semibold text-gray-700">Out of Stock</p>
          <h3 className="text-3xl font-bold text-red-600">
            {products.filter((p) => p.status === "Out of Stock").length}
          </h3>
        </div>
      </div>

      {/* Search + Filter */}
      <div className="flex gap-4 mb-4">
        <input
          type="text"
          placeholder="Search product..."
          className="border p-2 rounded-lg w-64 focus:ring-2 focus:ring-green-400"
          onChange={(e) => setSearch(e.target.value)}
        />

        <select
          className="border p-2 rounded-lg"
          onChange={(e) => setCategoryFilter(e.target.value)}
        >
          <option value="">All Categories</option>

          {categories.map((cat) => (
            <option key={cat.id}>{cat.name}</option>
          ))}
        </select>
      </div>

      {/* Product Table */}
      <div className="bg-white shadow-md rounded-xl p-4 overflow-x-auto">
        <table className="w-full text-left text-gray-700">
          <thead className="bg-gray-100 text-gray-800 font-semibold">
            <tr>
              <th className="p-3">Product</th>
              <th className="p-3">Category</th>
              <th className="p-3">Stock</th>
              <th className="p-3">Price</th>
              <th className="p-3">Status</th>
              <th className="p-3 text-center">Actions</th>
            </tr>
          </thead>

          <tbody>
            {visibleProducts.map((p) => (
              <tr key={p.id} className="border-b hover:bg-gray-50">
                <td className="p-3 flex items-center gap-3">
                  <img src={p.img} className="w-12 h-12 rounded-lg" />
                  {p.name}
                </td>
                <td className="p-3">{p.category}</td>
                <td className="p-3">{p.stock}</td>
                <td className="p-3 font-semibold">₹{p.price}</td>

                <td className="p-3">
                  <span
                    className={`px-3 py-1 rounded-lg text-sm font-medium ${statusColors[p.status]}`}
                  >
                    {p.status}
                  </span>
                </td>

                <td className="p-3 text-center flex justify-center gap-6">
                  <FiEdit
                    className="text-blue-600 cursor-pointer hover:scale-110"
                    onClick={() => setSelectedProduct({ ...p })}
                  />
                  <FiTrash2
                    className="text-red-600 cursor-pointer hover:scale-110"
                    onClick={() => setDeleteId(p.id)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex justify-center mt-5 gap-3">
        <button
          disabled={currentPage === 1}
          className="px-3 py-1 border rounded disabled:opacity-50"
          onClick={() => setCurrentPage(currentPage - 1)}
        >
          Prev
        </button>

        {Array.from({ length: totalPages }, (_, i) => (
          <button
            key={i}
            onClick={() => setCurrentPage(i + 1)}
            className={`px-3 py-1 rounded ${
              currentPage === i + 1 ? "bg-green-600 text-white" : "bg-gray-200"
            }`}
          >
            {i + 1}
          </button>
        ))}

        <button
          disabled={currentPage === totalPages}
          className="px-3 py-1 border rounded disabled:opacity-50"
          onClick={() => setCurrentPage(currentPage + 1)}
        >
          Next
        </button>
      </div>

      {/* Edit Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center">
          <div className="bg-white p-6 rounded-lg w-96 shadow-lg">
            <h3 className="text-xl font-bold mb-4">Edit Product</h3>

            <label className="font-medium">Name</label>
            <input
              type="text"
              className="border w-full p-2 rounded mb-2"
              value={selectedProduct.name}
              onChange={(e) =>
                setSelectedProduct({ ...selectedProduct, name: e.target.value })
              }
            />

            <label className="font-medium">Price</label>
            <input
              type="number"
              className="border w-full p-2 rounded mb-2"
              value={selectedProduct.price}
              onChange={(e) =>
                setSelectedProduct({ ...selectedProduct, price: Number(e.target.value) })
              }
            />

            <label className="font-medium">Category</label>
            <select
              value={selectedProduct.category}
              onChange={(e) =>
                setSelectedProduct({ ...selectedProduct, category: e.target.value })
              }
              className="border w-full p-2 rounded mb-3"
            >
              {categories.map((cat) => (
                <option key={cat.id}>{cat.name}</option>
              ))}
            </select>

            <div className="flex justify-end gap-3 mt-3">
              <button onClick={() => setSelectedProduct(null)}>Cancel</button>
              <button
                className="bg-blue-600 text-white px-4 py-2 rounded"
                onClick={handleEditSave}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {deleteId !== null && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center">
          <div className="bg-white p-6 rounded-lg w-80 shadow-lg">
            <p className="text-lg font-medium mb-4">
              Delete this product?
            </p>

            <div className="flex justify-end gap-3">
              <button onClick={() => setDeleteId(null)}>Cancel</button>
              <button
                className="bg-red-600 text-white px-4 py-2 rounded"
                onClick={confirmDelete}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
}
