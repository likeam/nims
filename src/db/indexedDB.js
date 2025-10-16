import { openDB } from "idb";

const DB_NAME = "GroceryInventory";
const DB_VERSION = 1;

export class InventoryDB {
  constructor() {
    this.db = null;
  }

  async init() {
    this.db = await openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // Suppliers store
        if (!db.objectStoreNames.contains("suppliers")) {
          const supplierStore = db.createObjectStore("suppliers", {
            keyPath: "id",
            autoIncrement: true,
          });
          supplierStore.createIndex("name", "name");
        }

        // Customers store
        if (!db.objectStoreNames.contains("customers")) {
          const customerStore = db.createObjectStore("customers", {
            keyPath: "id",
            autoIncrement: true,
          });
          customerStore.createIndex("name", "name");
        }

        // Products store
        if (!db.objectStoreNames.contains("products")) {
          const productStore = db.createObjectStore("products", {
            keyPath: "id",
            autoIncrement: true,
          });
          productStore.createIndex("name", "name");
          productStore.createIndex("supplierId", "supplierId");
          productStore.createIndex("category", "category");
        }

        // Transactions store
        if (!db.objectStoreNames.contains("transactions")) {
          const transactionStore = db.createObjectStore("transactions", {
            keyPath: "id",
            autoIncrement: true,
          });
          transactionStore.createIndex("date", "date");
          transactionStore.createIndex("type", "type");
          transactionStore.createIndex("productId", "productId");
        }

        // Reports store
        if (!db.objectStoreNames.contains("reports")) {
          const reportStore = db.createObjectStore("reports", {
            keyPath: "id",
            autoIncrement: true,
          });
          reportStore.createIndex("type", "type");
          reportStore.createIndex("period", "period");
          reportStore.createIndex("generatedAt", "generatedAt");
        }
      },
    });
    return this.db;
  }

  // Supplier methods
  async addSupplier(supplier) {
    return await this.db.add("suppliers", {
      ...supplier,
      createdAt: new Date(),
    });
  }

  async getSuppliers() {
    return await this.db.getAll("suppliers");
  }

  async updateSupplier(id, updates) {
    return await this.db.put("suppliers", {
      id,
      ...updates,
      updatedAt: new Date(),
    });
  }

  async deleteSupplier(id) {
    return await this.db.delete("suppliers", id);
  }

  // Customer methods
  async addCustomer(customer) {
    return await this.db.add("customers", {
      ...customer,
      createdAt: new Date(),
    });
  }

  async getCustomers() {
    return await this.db.getAll("customers");
  }

  async updateCustomer(id, updates) {
    return await this.db.put("customers", {
      id,
      ...updates,
      updatedAt: new Date(),
    });
  }

  async deleteCustomer(id) {
    return await this.db.delete("customers", id);
  }

  // Product methods
  async addProduct(product) {
    return await this.db.add("products", {
      ...product,
      createdAt: new Date(),
      currentStock: product.initialStock || 0,
    });
  }

  async getProducts() {
    const products = await this.db.getAll("products");
    const suppliers = await this.getSuppliers();

    return products.map((product) => {
      const supplier = suppliers.find((s) => s.id === product.supplierId);
      return {
        ...product,
        supplierName: supplier ? supplier.name : "Unknown",
      };
    });
  }

  async updateProduct(id, updates) {
    return await this.db.put("products", {
      id,
      ...updates,
      updatedAt: new Date(),
    });
  }

  async deleteProduct(id) {
    return await this.db.delete("products", id);
  }

  // Transaction methods
  async addTransaction(transaction) {
    const tx = await this.db.add("transactions", {
      ...transaction,
      date: new Date(),
    });

    // Update product stock
    const product = await this.db.get("products", transaction.productId);
    if (product) {
      const stockChange =
        transaction.type === "in"
          ? transaction.quantity
          : -transaction.quantity;
      await this.updateProduct(transaction.productId, {
        currentStock: product.currentStock + stockChange,
      });
    }

    return tx;
  }

  async getTransactions(startDate, endDate) {
    let transactions = await this.db.getAll("transactions");
    const products = await this.getProducts();
    const customers = await this.getCustomers();
    const suppliers = await this.getSuppliers();

    if (startDate && endDate) {
      transactions = transactions.filter((tx) => {
        const txDate = new Date(tx.date);
        return txDate >= startDate && txDate <= endDate;
      });
    }

    return transactions.map((tx) => {
      const product = products.find((p) => p.id === tx.productId);
      const customer = customers.find((c) => c.id === tx.customerId);
      const supplier = suppliers.find((s) => s.id === tx.supplierId);

      return {
        ...tx,
        productName: product ? product.name : "Unknown",
        customerName: customer ? customer.name : "N/A",
        supplierName: supplier ? supplier.name : "N/A",
      };
    });
  }

  // Report methods
  async generateReport(type, period, data) {
    return await this.db.add("reports", {
      type,
      period,
      data,
      generatedAt: new Date(),
    });
  }

  async getReports(type = null) {
    let reports = await this.db.getAll("reports");
    if (type) {
      reports = reports.filter((report) => report.type === type);
    }
    return reports.sort(
      (a, b) => new Date(b.generatedAt) - new Date(a.generatedAt)
    );
  }

  async deleteReport(id) {
    return await this.db.delete("reports", id);
  }
}

export const db = new InventoryDB();
