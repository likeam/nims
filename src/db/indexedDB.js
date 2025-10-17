import { openDB } from "idb";

const DB_NAME = "GroceryInventory";
const DB_VERSION = 1;

export class InventoryDB {
  constructor() {
    this.db = null;
    this.initialized = false;
  }

  async init() {
    if (this.initialized) return this.db;

    this.db = await openDB(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion, newVersion, transaction) {
        console.log(
          "Upgrading database from version",
          oldVersion,
          "to",
          newVersion
        );

        // Suppliers store
        if (!db.objectStoreNames.contains("suppliers")) {
          const supplierStore = db.createObjectStore("suppliers", {
            keyPath: "id",
            autoIncrement: true,
          });
          supplierStore.createIndex("name", "name");
          console.log("Created suppliers store");
        }

        // Customers store
        if (!db.objectStoreNames.contains("customers")) {
          const customerStore = db.createObjectStore("customers", {
            keyPath: "id",
            autoIncrement: true,
          });
          customerStore.createIndex("name", "name");
          console.log("Created customers store");
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
          console.log("Created products store");
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
          console.log("Created transactions store");
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
          console.log("Created reports store");
        }
      },
    });

    this.initialized = true;
    console.log("Database initialized successfully");
    return this.db;
  }

  // Ensure database is initialized before operations
  async ensureInitialized() {
    if (!this.initialized) {
      await this.init();
    }
    return this.db;
  }

  // Supplier methods
  async addSupplier(supplier) {
    await this.ensureInitialized();
    const newSupplier = {
      ...supplier,
      createdAt: new Date(),
    };
    console.log("Adding supplier:", newSupplier);
    const id = await this.db.add("suppliers", newSupplier);
    console.log("Supplier added with ID:", id);
    return id;
  }

  async getSuppliers() {
    await this.ensureInitialized();
    try {
      const suppliers = await this.db.getAll("suppliers");
      console.log("Retrieved suppliers:", suppliers);
      return suppliers;
    } catch (error) {
      console.error("Error getting suppliers:", error);
      return [];
    }
  }

  async updateSupplier(id, updates) {
    await this.ensureInitialized();
    const supplier = await this.db.get("suppliers", id);
    if (!supplier) throw new Error("Supplier not found");

    const updatedSupplier = {
      ...supplier,
      ...updates,
      updatedAt: new Date(),
    };
    return await this.db.put("suppliers", updatedSupplier);
  }

  async deleteSupplier(id) {
    await this.ensureInitialized();
    return await this.db.delete("suppliers", id);
  }

  // Customer methods
  async addCustomer(customer) {
    await this.ensureInitialized();
    const newCustomer = {
      ...customer,
      createdAt: new Date(),
    };
    console.log("Adding customer:", newCustomer);
    const id = await this.db.add("customers", newCustomer);
    console.log("Customer added with ID:", id);
    return id;
  }

  async getCustomers() {
    await this.ensureInitialized();
    try {
      const customers = await this.db.getAll("customers");
      console.log("Retrieved customers:", customers);
      return customers;
    } catch (error) {
      console.error("Error getting customers:", error);
      return [];
    }
  }

  async updateCustomer(id, updates) {
    await this.ensureInitialized();
    const customer = await this.db.get("customers", id);
    if (!customer) throw new Error("Customer not found");

    const updatedCustomer = {
      ...customer,
      ...updates,
      updatedAt: new Date(),
    };
    return await this.db.put("customers", updatedCustomer);
  }

  async deleteCustomer(id) {
    await this.ensureInitialized();
    return await this.db.delete("customers", id);
  }

  // Product methods
  async addProduct(product) {
    await this.ensureInitialized();
    const newProduct = {
      ...product,
      supplierId: parseInt(product.supplierId),
      minStock: parseInt(product.minStock) || 10,
      initialStock: parseInt(product.initialStock) || 0,
      currentStock: parseInt(product.initialStock) || 0,
      createdAt: new Date(),
    };
    console.log("Adding product:", newProduct);
    const id = await this.db.add("products", newProduct);
    console.log("Product added with ID:", id);
    return id;
  }

  async getProducts() {
    await this.ensureInitialized();
    try {
      const products = await this.db.getAll("products");
      const suppliers = await this.getSuppliers();

      const productsWithSupplier = products.map((product) => {
        const supplier = suppliers.find((s) => s.id === product.supplierId);
        return {
          ...product,
          supplierName: supplier ? supplier.name : "Unknown Supplier",
        };
      });

      console.log("Retrieved products:", productsWithSupplier);
      return productsWithSupplier;
    } catch (error) {
      console.error("Error getting products:", error);
      return [];
    }
  }

  async updateProduct(id, updates) {
    await this.ensureInitialized();
    const product = await this.db.get("products", id);
    if (!product) throw new Error("Product not found");

    const updatedProduct = {
      ...product,
      ...updates,
      supplierId: parseInt(updates.supplierId || product.supplierId),
      updatedAt: new Date(),
    };
    return await this.db.put("products", updatedProduct);
  }

  async deleteProduct(id) {
    await this.ensureInitialized();
    return await this.db.delete("products", id);
  }

  // Transaction methods
  async addTransaction(transaction) {
    await this.ensureInitialized();
    const newTransaction = {
      ...transaction,
      productId: parseInt(transaction.productId),
      quantity: parseInt(transaction.quantity),
      supplierId: transaction.supplierId
        ? parseInt(transaction.supplierId)
        : null,
      customerId: transaction.customerId
        ? parseInt(transaction.customerId)
        : null,
      date: new Date(),
    };

    const txId = await this.db.add("transactions", newTransaction);
    console.log("Transaction added with ID:", txId);

    // Update product stock
    const product = await this.db.get("products", newTransaction.productId);
    if (product) {
      const stockChange =
        newTransaction.type === "in"
          ? newTransaction.quantity
          : -newTransaction.quantity;
      await this.updateProduct(newTransaction.productId, {
        currentStock: product.currentStock + stockChange,
      });
      console.log(
        `Updated product ${product.name} stock from ${
          product.currentStock
        } to ${product.currentStock + stockChange}`
      );
    }

    return txId;
  }

  async getTransactions(startDate = null, endDate = null) {
    await this.ensureInitialized();
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

    const transactionsWithDetails = transactions.map((tx) => {
      const product = products.find((p) => p.id === tx.productId);
      const customer = customers.find((c) => c.id === tx.customerId);
      const supplier = suppliers.find((s) => s.id === tx.supplierId);

      return {
        ...tx,
        productName: product ? product.name : "Unknown Product",
        customerName: customer ? customer.name : "N/A",
        supplierName: supplier ? supplier.name : "N/A",
      };
    });

    return transactionsWithDetails.sort(
      (a, b) => new Date(b.date) - new Date(a.date)
    );
  }

  // Report methods
  async generateReport(type, period, data) {
    await this.ensureInitialized();
    const report = {
      type,
      period,
      data,
      generatedAt: new Date(),
    };
    console.log("Generating report:", report);
    return await this.db.add("reports", report);
  }

  async getReports(type = null) {
    await this.ensureInitialized();
    let reports = await this.db.getAll("reports");
    if (type) {
      reports = reports.filter((report) => report.type === type);
    }
    return reports.sort(
      (a, b) => new Date(b.generatedAt) - new Date(a.generatedAt)
    );
  }

  async deleteReport(id) {
    await this.ensureInitialized();
    return await this.db.delete("reports", id);
  }
}

// Create and export a single instance
export const db = new InventoryDB();
