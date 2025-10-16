import React, { useState, useEffect } from "react";
import { db } from "./db/indexedDB";
import Dashboard from "./components/Dashboard";
import SupplierManagement from "./components/SupplierManagement";
import CustomerManagement from "./components/CustomerManagement";
import ProductManagement from "./components/ProductManagement";
import TransactionManagement from "./components/TransactionManagement";
import Reports from "./components/Reports";

function App() {
  const [currentView, setCurrentView] = useState("dashboard");
  const [dbInitialized, setDbInitialized] = useState(false);

  useEffect(() => {
    const initializeDB = async () => {
      await db.init();
      setDbInitialized(true);
      await checkAndGeneratePendingReports();
    };

    initializeDB();

    // Set up automatic report generation at 11 PM
    const scheduleAutoReports = () => {
      const now = new Date();
      const targetTime = new Date();
      targetTime.setHours(23, 0, 0, 0); // 11 PM

      let timeUntilTarget = targetTime - now;
      if (timeUntilTarget < 0) {
        timeUntilTarget += 24 * 60 * 60 * 1000; // Next day
      }

      setTimeout(() => {
        generateDailyReports();
        // Set interval for daily generation
        setInterval(generateDailyReports, 24 * 60 * 60 * 1000);
      }, timeUntilTarget);
    };

    scheduleAutoReports();
  }, []);

  const checkAndGeneratePendingReports = async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const reports = await db.getReports();
    const lastReportDate =
      reports.length > 0 ? new Date(reports[0].generatedAt) : null;

    if (!lastReportDate || lastReportDate < today) {
      await generateDailyReports();
    }
  };

  const generateDailyReports = async () => {
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    // Generate daily report
    const dailyTransactions = await db.getTransactions(
      yesterday,
      new Date(yesterday.getTime() + 24 * 60 * 60 * 1000)
    );
    await db.generateReport("daily", yesterday.toISOString().split("T")[0], {
      transactions: dailyTransactions,
      summary: generateSummary(dailyTransactions),
    });

    // Generate weekly report on Sunday
    if (now.getDay() === 0) {
      const weekStart = new Date(now);
      weekStart.setDate(weekStart.getDate() - 7);
      const weeklyTransactions = await db.getTransactions(weekStart, now);
      await db.generateReport("weekly", `Week ${getWeekNumber(weekStart)}`, {
        transactions: weeklyTransactions,
        summary: generateSummary(weeklyTransactions),
      });
    }

    // Generate monthly report on first day of month
    if (now.getDate() === 1) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
      const monthlyTransactions = await db.getTransactions(
        monthStart,
        monthEnd
      );
      await db.generateReport("monthly", monthStart.toISOString().slice(0, 7), {
        transactions: monthlyTransactions,
        summary: generateSummary(monthlyTransactions),
      });
    }
  };

  const generateSummary = (transactions) => {
    const inTotal = transactions
      .filter((tx) => tx.type === "in")
      .reduce((sum, tx) => sum + tx.quantity, 0);

    const outTotal = transactions
      .filter((tx) => tx.type === "out")
      .reduce((sum, tx) => sum + tx.quantity, 0);

    return { inTotal, outTotal, netChange: inTotal - outTotal };
  };

  const getWeekNumber = (date) => {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date - firstDayOfYear) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  };

  if (!dbInitialized) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-xl">Loading Inventory System...</div>
      </div>
    );
  }

  const navigation = [
    { id: "dashboard", name: "Dashboard", icon: "📊" },
    { id: "suppliers", name: "Suppliers", icon: "🏢" },
    { id: "customers", name: "Customers", icon: "👥" },
    { id: "products", name: "Products", icon: "📦" },
    { id: "transactions", name: "Transactions", icon: "🔄" },
    { id: "reports", name: "Reports", icon: "📋" },
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navigation */}
      <nav className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <span className="text-2xl font-bold text-green-600">
                🍏 Grocery Inventory
              </span>
            </div>
            <div className="flex space-x-4">
              {navigation.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setCurrentView(item.id)}
                  className={`flex items-center px-3 py-2 rounded-md text-sm font-medium ${
                    currentView === item.id
                      ? "bg-green-100 text-green-700"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <span className="mr-2">{item.icon}</span>
                  {item.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 px-4">
        {currentView === "dashboard" && <Dashboard />}
        {currentView === "suppliers" && <SupplierManagement />}
        {currentView === "customers" && <CustomerManagement />}
        {currentView === "products" && <ProductManagement />}
        {currentView === "transactions" && <TransactionManagement />}
        {currentView === "reports" && <Reports />}
      </main>
    </div>
  );
}

export default App;
