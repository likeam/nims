import React, { useState, useEffect } from "react";
import { db } from "../db/indexedDB";

const TransactionManagement = () => {
  const [transactions, setTransactions] = useState([]);
  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [filterType, setFilterType] = useState("");
  const [filterProduct, setFilterProduct] = useState("");
  const [formData, setFormData] = useState({
    type: "in",
    productId: "",
    quantity: "",
    supplierId: "",
    customerId: "",
    notes: "",
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [transactionList, productList, supplierList, customerList] =
      await Promise.all([
        db.getTransactions(),
        db.getProducts(),
        db.getSuppliers(),
        db.getCustomers(),
      ]);
    setTransactions(transactionList);
    setProducts(productList);
    setSuppliers(supplierList);
    setCustomers(customerList);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await db.addTransaction(formData);
    resetForm();
    loadData();
  };

  const resetForm = () => {
    setFormData({
      type: "in",
      productId: "",
      quantity: "",
      supplierId: "",
      customerId: "",
      notes: "",
    });
    setShowForm(false);
  };

  const filteredTransactions = transactions
    .filter(
      (tx) =>
        (filterType ? tx.type === filterType : true) &&
        (filterProduct ? tx.productId.toString() === filterProduct : true)
    )
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  const getProductStock = (productId) => {
    const product = products.find((p) => p.id === productId);
    return product ? product.currentStock : 0;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">
          Transaction Management
        </h1>
        <button
          onClick={() => setShowForm(true)}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
        >
          New Transaction
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filter by Type
            </label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full border rounded-lg p-2"
            >
              <option value="">All Types</option>
              <option value="in">Product IN</option>
              <option value="out">Product OUT</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filter by Product
            </label>
            <select
              value={filterProduct}
              onChange={(e) => setFilterProduct(e.target.value)}
              className="w-full border rounded-lg p-2"
            >
              <option value="">All Products</option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Quick Stats
            </label>
            <p className="text-sm text-gray-600">
              Total: {transactions.length} | Today:{" "}
              {
                transactions.filter(
                  (tx) =>
                    new Date(tx.date).toDateString() ===
                    new Date().toDateString()
                ).length
              }
            </p>
          </div>
        </div>
      </div>

      {/* Transaction Form */}
      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">New Transaction</h2>
          <form
            onSubmit={handleSubmit}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Transaction Type
              </label>
              <select
                value={formData.type}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    type: e.target.value,
                    customerId: "",
                    supplierId: "",
                  })
                }
                className="w-full border rounded-lg p-3"
                required
              >
                <option value="in">Product IN (From Supplier)</option>
                <option value="out">Product OUT (To Customer)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Product
              </label>
              <select
                value={formData.productId}
                onChange={(e) =>
                  setFormData({ ...formData, productId: e.target.value })
                }
                className="w-full border rounded-lg p-3"
                required
              >
                <option value="">Select Product</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name} (Stock: {product.currentStock})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quantity
              </label>
              <input
                type="number"
                value={formData.quantity}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    quantity: parseInt(e.target.value),
                  })
                }
                className="w-full border rounded-lg p-3"
                min="1"
                required
              />
            </div>
            {formData.type === "in" ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Supplier
                </label>
                <select
                  value={formData.supplierId}
                  onChange={(e) =>
                    setFormData({ ...formData, supplierId: e.target.value })
                  }
                  className="w-full border rounded-lg p-3"
                  required
                >
                  <option value="">Select Supplier</option>
                  {suppliers.map((supplier) => (
                    <option key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Customer
                </label>
                <select
                  value={formData.customerId}
                  onChange={(e) =>
                    setFormData({ ...formData, customerId: e.target.value })
                  }
                  className="w-full border rounded-lg p-3"
                  required
                >
                  <option value="">Select Customer</option>
                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                className="w-full border rounded-lg p-3"
                rows="3"
                placeholder="Additional notes about this transaction..."
              />
            </div>
            {formData.productId && (
              <div className="md:col-span-2 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-700">
                  Current Stock: {getProductStock(parseInt(formData.productId))}{" "}
                  | After Transaction:{" "}
                  {getProductStock(parseInt(formData.productId)) +
                    (formData.type === "in"
                      ? parseInt(formData.quantity || 0)
                      : -parseInt(formData.quantity || 0))}
                </p>
              </div>
            )}
            <div className="md:col-span-2 flex space-x-3">
              <button
                type="submit"
                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
              >
                Record Transaction
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

      {/* Transactions List */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Recent Transactions
          </h2>
        </div>
        <div className="p-6">
          {filteredTransactions.length === 0 ? (
            <p className="text-gray-500 text-center py-4">
              No transactions found
            </p>
          ) : (
            <div className="space-y-4">
              {filteredTransactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                >
                  <div className="flex items-center space-x-4">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        transaction.type === "in"
                          ? "bg-green-100"
                          : "bg-red-100"
                      }`}
                    >
                      <span
                        className={`text-lg ${
                          transaction.type === "in"
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {transaction.type === "in" ? "⬇️" : "⬆️"}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {transaction.productName}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {transaction.type === "in" ? "From: " : "To: "}
                        {transaction.type === "in"
                          ? transaction.supplierName
                          : transaction.customerName}
                      </p>
                      <p className="text-xs text-gray-400">
                        {new Date(transaction.date).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p
                      className={`text-lg font-semibold ${
                        transaction.type === "in"
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {transaction.type === "in" ? "+" : "-"}
                      {transaction.quantity}
                    </p>
                    <p className="text-sm text-gray-500">units</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TransactionManagement;
