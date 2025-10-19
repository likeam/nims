import React, { useState, useEffect } from "react";
import { db } from "../db/indexedDB";

const Reports = () => {
  const [reports, setReports] = useState([]);
  const [filterType, setFilterType] = useState("");
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    loadReports();
  }, [filterType]);

  const loadReports = async () => {
    const reportsList = await db.getReports(filterType || null);
    setReports(reportsList);
  };

  const generateReport = async (type) => {
    setGenerating(true);

    const now = new Date();
    let startDate, endDate, period;

    switch (type) {
      case "daily":
        startDate = new Date(now);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(now);
        endDate.setHours(23, 59, 59, 999);
        period = now.toISOString().split("T")[0];
        break;
      case "weekly":
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 7);
        endDate = new Date(now);
        period = `Week ${getWeekNumber(startDate)}`;
        break;
      case "monthly":
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        period = startDate.toISOString().slice(0, 7);
        break;
      default:
        return;
    }

    const transactions = await db.getTransactions(startDate, endDate);

    const summary = {
      totalIn: transactions
        .filter((tx) => tx.type === "in")
        .reduce((sum, tx) => sum + tx.quantity, 0),
      totalOut: transactions
        .filter((tx) => tx.type === "out")
        .reduce((sum, tx) => sum + tx.quantity, 0),
      totalTransactions: transactions.length,
      productsIn: [
        ...new Set(
          transactions
            .filter((tx) => tx.type === "in")
            .map((tx) => tx.productId)
        ),
      ].length,
      productsOut: [
        ...new Set(
          transactions
            .filter((tx) => tx.type === "out")
            .map((tx) => tx.productId)
        ),
      ].length,
    };

    await db.generateReport(type, period, {
      transactions,
      summary,
      generatedAt: new Date(),
    });

    setGenerating(false);
    loadReports();
  };

  const getWeekNumber = (date) => {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date - firstDayOfYear) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  };

  const printReport = (report) => {
    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <html>
        <head>
          <title>${report.type.toUpperCase()} Report - ${report.period}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .summary { margin: 20px 0; padding: 15px; background: #f5f5f5; }
            .transaction { margin: 10px 0; padding: 10px; border-bottom: 1px solid #ddd; }
            .in { color: green; }
            .out { color: red; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Grocery Store Inventory Report</h1>
            <h2>${report.type.toUpperCase()} Report - ${report.period}</h2>
            <p>Generated on: ${new Date(
              report.generatedAt
            ).toLocaleString()}</p>
          </div>
          <div class="summary">
            <h3>Summary</h3>
            <p>Total IN: ${report.data.summary.totalIn} units</p>
            <p>Total OUT: ${report.data.summary.totalOut} units</p>
            <p>Net Change: ${
              report.data.summary.totalIn - report.data.summary.totalOut
            } units</p>
            <p>Total Transactions: ${report.data.summary.totalTransactions}</p>
          </div>
          <div>
            <h3>Transaction Details</h3>
            ${report.data.transactions
              .map(
                (tx) => `
              <div class="transaction">
                <strong>${tx.productName}</strong> - 
                <span class="${tx.type}">${tx.type.toUpperCase()}</span> - 
                ${tx.quantity} units - 
                ${
                  tx.type === "in"
                    ? "From: " + tx.supplierName
                    : "To: " + tx.customerName
                } - 
                ${new Date(tx.date).toLocaleString()}
              </div>
            `
              )
              .join("")}
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const downloadReport = (report) => {
    const data = {
      type: report.type,
      period: report.period,
      generatedAt: report.generatedAt,
      data: report.data,
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `inventory-report-${report.type}-${report.period}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const deleteReport = async (id) => {
    if (window.confirm("Are you sure you want to delete this report?")) {
      await db.deleteReport(id);
      loadReports();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Reports</h1>
        <div className="flex space-x-3">
          <button
            onClick={() => generateReport("daily")}
            disabled={generating}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {generating ? "Generating..." : "Generate Daily"}
          </button>
          <button
            onClick={() => generateReport("weekly")}
            disabled={generating}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            {generating ? "Generating..." : "Generate Weekly"}
          </button>
          <button
            onClick={() => generateReport("monthly")}
            disabled={generating}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50"
          >
            {generating ? "Generating..." : "Generate Monthly"}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex items-center space-x-4">
          <label className="text-sm font-medium text-gray-700">
            Filter by Type:
          </label>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="border rounded-lg p-2"
          >
            <option value="">All Reports</option>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
        </div>
      </div>

      {/* Reports List */}
      <div className="bg-gray-200 shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Generated Reports
          </h2>
        </div>
        <div className="p-6">
          {reports.length === 0 ? (
            <p className="text-gray-500 text-center py-4">
              No reports generated yet
            </p>
          ) : (
            <div className="space-y-4">
              {reports.map((report) => (
                <div
                  key={report.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                >
                  <div className="flex items-center space-x-4">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        report.type === "daily"
                          ? "bg-blue-100"
                          : report.type === "weekly"
                          ? "bg-green-100"
                          : "bg-purple-100"
                      }`}
                    >
                      <span
                        className={`text-lg ${
                          report.type === "daily"
                            ? "text-blue-600"
                            : report.type === "weekly"
                            ? "text-green-600"
                            : "text-purple-600"
                        }`}
                      >
                        {report.type === "daily"
                          ? "📅"
                          : report.type === "weekly"
                          ? "📊"
                          : "📈"}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 capitalize">
                        {report.type} Report - {report.period}
                      </h3>
                      <p className="text-sm text-gray-500">
                        Generated:{" "}
                        {new Date(report.generatedAt).toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-500">
                        Transactions: {report.data.transactions.length} | IN:{" "}
                        {report.data.summary.totalIn} | OUT:{" "}
                        {report.data.summary.totalOut}
                      </p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => printReport(report)}
                      className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                    >
                      Print
                    </button>
                    <button
                      onClick={() => downloadReport(report)}
                      className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                    >
                      Download
                    </button>
                    <button
                      onClick={() => deleteReport(report.id)}
                      className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
                    >
                      Delete
                    </button>
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

export default Reports;
