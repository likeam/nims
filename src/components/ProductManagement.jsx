import React, { useState, useEffect } from "react";
import { db } from "../db/indexedDB";

const ProductManagement = () => {
  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [sortBy, setSortBy] = useState("name");
  const [filterSupplier, setFilterSupplier] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "",
    supplierId: "",
    minStock: 10,
    initialStock: 0,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [productList, supplierList] = await Promise.all([
      db.getProducts(),
      db.getSuppliers(),
    ]);
    setProducts(productList);
    setSuppliers(supplierList);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editingProduct) {
      await db.updateProduct(editingProduct.id, formData);
    } else {
      await db.addProduct(formData);
    }
    resetForm();
    loadData();
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      category: "",
      supplierId: "",
      minStock: 10,
      initialStock: 0,
    });
    setEditingProduct(null);
    setShowForm(false);
  };

  const editProduct = (product) => {
    setFormData(product);
    setEditingProduct(product);
    setShowForm(true);
  };

  const deleteProduct = async (id) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      await db.deleteProduct(id);
      loadData();
    }
  };

  const filteredAndSortedProducts = products
    .filter((product) =>
      filterSupplier ? product.supplierId.toString() === filterSupplier : true
    )
    .sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name);
        case "supplier":
          return a.supplierName.localeCompare(b.supplierName);
        case "stock":
          return a.currentStock - b.currentStock;
        case "category":
          return a.category.localeCompare(b.category);
        default:
          return 0;
      }
    });

  const categories = [
    ...new Set(products.map((p) => p.category).filter(Boolean)),
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Product Management</h1>
        <button
          onClick={() => setShowForm(true)}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
        >
          Add Product
        </button>
      </div>

      {/* Filters and Sort */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sort By
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full border rounded-lg p-2"
            >
              <option value="name">Name</option>
              <option value="supplier">Supplier</option>
              <option value="category">Category</option>
              <option value="stock">Stock Level</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filter by Supplier
            </label>
            <select
              value={filterSupplier}
              onChange={(e) => setFilterSupplier(e.target.value)}
              className="w-full border rounded-lg p-2"
            >
              <option value="">All Suppliers</option>
              {suppliers.map((supplier) => (
                <option key={supplier.id} value={supplier.id}>
                  {supplier.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Quick Stats
            </label>
            <p className="text-sm text-gray-600">
              Total: {products.length} | Low Stock:{" "}
              {products.filter((p) => p.currentStock < p.minStock).length}
            </p>
          </div>
        </div>
      </div>

      {/* Product Form */}
      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">
            {editingProduct ? "Edit Product" : "Add New Product"}
          </h2>
          <form
            onSubmit={handleSubmit}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            <input
              type="text"
              placeholder="Product Name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="border rounded-lg p-3"
              required
            />
            <input
              type="text"
              placeholder="Category"
              value={formData.category}
              onChange={(e) =>
                setFormData({ ...formData, category: e.target.value })
              }
              className="border rounded-lg p-3"
              list="categories"
            />
            <datalist id="categories">
              {categories.map((category) => (
                <option key={category} value={category} />
              ))}
            </datalist>
            <select
              value={formData.supplierId}
              onChange={(e) =>
                setFormData({ ...formData, supplierId: e.target.value })
              }
              className="border rounded-lg p-3"
              required
            >
              <option value="">Select Supplier</option>
              {suppliers.map((supplier) => (
                <option key={supplier.id} value={supplier.id}>
                  {supplier.name}
                </option>
              ))}
            </select>
            <input
              type="number"
              placeholder="Minimum Stock"
              value={formData.minStock}
              onChange={(e) =>
                setFormData({ ...formData, minStock: parseInt(e.target.value) })
              }
              className="border rounded-lg p-3"
              min="0"
            />
            <input
              type="number"
              placeholder="Initial Stock"
              value={formData.initialStock}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  initialStock: parseInt(e.target.value),
                })
              }
              className="border rounded-lg p-3"
              min="0"
            />
            <textarea
              placeholder="Description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="border rounded-lg p-3 md:col-span-2"
              rows="3"
            />
            <div className="md:col-span-2 flex space-x-3">
              <button
                type="submit"
                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
              >
                {editingProduct ? "Update" : "Add"} Product
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Products List */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Products List</h2>
        </div>
        <div className="p-6">
          {filteredAndSortedProducts.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No products found</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Supplier
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Current Stock
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Min Stock
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredAndSortedProducts.map((product) => (
                    <tr
                      key={product.id}
                      className={
                        product.currentStock < product.minStock
                          ? "bg-red-50"
                          : ""
                      }
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="font-medium text-gray-900">
                            {product.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {product.description}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                        {product.category}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                        {product.supplierName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                        {product.currentStock}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                        {product.minStock}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            product.currentStock < product.minStock
                              ? "bg-red-100 text-red-800"
                              : "bg-green-100 text-green-800"
                          }`}
                        >
                          {product.currentStock < product.minStock
                            ? "Low Stock"
                            : "In Stock"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <button
                          onClick={() => editProduct(product)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => deleteProduct(product.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductManagement;
