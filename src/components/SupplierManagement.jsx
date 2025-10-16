import React, { useState, useEffect } from "react";
import { db } from "../db/indexedDB";

const SupplierManagement = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    contact: "",
    email: "",
    phone: "",
    address: "",
  });

  useEffect(() => {
    loadSuppliers();
  }, []);

  const loadSuppliers = async () => {
    const supplierList = await db.getSuppliers();
    setSuppliers(supplierList);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editingSupplier) {
      await db.updateSupplier(editingSupplier.id, formData);
    } else {
      await db.addSupplier(formData);
    }
    resetForm();
    loadSuppliers();
  };

  const resetForm = () => {
    setFormData({
      name: "",
      contact: "",
      email: "",
      phone: "",
      address: "",
    });
    setEditingSupplier(null);
    setShowForm(false);
  };

  const editSupplier = (supplier) => {
    setFormData(supplier);
    setEditingSupplier(supplier);
    setShowForm(true);
  };

  const deleteSupplier = async (id) => {
    if (window.confirm("Are you sure you want to delete this supplier?")) {
      await db.deleteSupplier(id);
      loadSuppliers();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">
          Supplier Management
        </h1>
        <button
          onClick={() => setShowForm(true)}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
        >
          Add Supplier
        </button>
      </div>

      {/* Supplier Form */}
      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">
            {editingSupplier ? "Edit Supplier" : "Add New Supplier"}
          </h2>
          <form
            onSubmit={handleSubmit}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            <input
              type="text"
              placeholder="Supplier Name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="border rounded-lg p-3"
              required
            />
            <input
              type="text"
              placeholder="Contact Person"
              value={formData.contact}
              onChange={(e) =>
                setFormData({ ...formData, contact: e.target.value })
              }
              className="border rounded-lg p-3"
            />
            <input
              type="email"
              placeholder="Email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              className="border rounded-lg p-3"
            />
            <input
              type="tel"
              placeholder="Phone"
              value={formData.phone}
              onChange={(e) =>
                setFormData({ ...formData, phone: e.target.value })
              }
              className="border rounded-lg p-3"
            />
            <textarea
              placeholder="Address"
              value={formData.address}
              onChange={(e) =>
                setFormData({ ...formData, address: e.target.value })
              }
              className="border rounded-lg p-3 md:col-span-2"
              rows="3"
            />
            <div className="md:col-span-2 flex space-x-3">
              <button
                type="submit"
                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
              >
                {editingSupplier ? "Update" : "Add"} Supplier
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

      {/* Suppliers List */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Suppliers List
          </h2>
        </div>
        <div className="p-6">
          {suppliers.length === 0 ? (
            <p className="text-gray-500 text-center py-4">
              No suppliers added yet
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Phone
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {suppliers.map((supplier) => (
                    <tr key={supplier.id}>
                      <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                        {supplier.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                        {supplier.contact}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                        {supplier.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                        {supplier.phone}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <button
                          onClick={() => editSupplier(supplier)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => deleteSupplier(supplier.id)}
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

export default SupplierManagement;
