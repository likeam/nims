import React, { useState, useEffect } from "react";
import { db } from "../db/indexedDB";

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalSuppliers: 0,
    totalCustomers: 0,
    lowStockItems: 0,
    todayIn: 0,
    todayOut: 0,
  });

  const [recentTransactions, setRecentTransactions] = useState([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    const products = await db.getProducts();
    const suppliers = await db.getSuppliers();
    const customers = await db.getCustomers();

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const transactions = await db.getTransactions(today, new Date());

    const todayIn = transactions
      .filter((tx) => tx.type === "in")
      .reduce((sum, tx) => sum + tx.quantity, 0);

    const todayOut = transactions
      .filter((tx) => tx.type === "out")
      .reduce((sum, tx) => sum + tx.quantity, 0);

    setStats({
      totalProducts: products.length,
      totalSuppliers: suppliers.length,
      totalCustomers: customers.length,
      lowStockItems: products.filter((p) => p.currentStock < (p.minStock || 10))
        .length,
      todayIn,
      todayOut,
    });

    setRecentTransactions(transactions.slice(-5).reverse());
  };

  const StatCard = ({ title, value, icon, color }) => (
    <div className={`bg-white rounded-lg shadow p-6 ${color}`}>
      <div className="flex items-center">
        <div className="text-3xl mr-4">{icon}</div>
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-semibold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Products"
          value={stats.totalProducts}
          icon="📦"
          color="border-l-4 border-blue-500"
        />
        <StatCard
          title="Total Suppliers"
          value={stats.totalSuppliers}
          icon="🏢"
          color="border-l-4 border-green-500"
        />
        <StatCard
          title="Total Customers"
          value={stats.totalCustomers}
          icon="👥"
          color="border-l-4 border-purple-500"
        />
        <StatCard
          title="Low Stock Items"
          value={stats.lowStockItems}
          icon="⚠️"
          color="border-l-4 border-red-500"
        />
        <StatCard
          title="Today IN"
          value={stats.todayIn}
          icon="⬇️"
          color="border-l-4 border-green-500"
        />
        <StatCard
          title="Today OUT"
          value={stats.todayOut}
          icon="⬆️"
          color="border-l-4 border-red-500"
        />
      </div>

      {/* Recent Transactions */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Recent Transactions
          </h2>
        </div>
        <div className="p-6">
          {recentTransactions.length === 0 ? (
            <p className="text-gray-500 text-center py-4">
              No recent transactions
            </p>
          ) : (
            <div className="space-y-3">
              {recentTransactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex justify-between items-center py-2 border-b border-gray-100"
                >
                  <div className="flex items-center">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        tx.type === "in"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {tx.type.toUpperCase()}
                    </span>
                    <span className="ml-3 font-medium">{tx.productName}</span>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">Qty: {tx.quantity}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(tx.date).toLocaleTimeString()}
                    </p>
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

export default Dashboard;
