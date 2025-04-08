// ecommerce_seed.js
import pkg from "pg";
const { Pool } = pkg;
import { faker } from "@faker-js/faker";
import dotenv from "dotenv";

dotenv.config();

// Database connection configuration for Neon
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

async function seedDatabase() {
  let client;

  try {
    // Connect to database
    client = await pool.connect();
    console.log("Connected to database successfully");

    // Create tables
    await createTables(client);

    // Seed tables with data
    await seedEmployees(client);
    await seedInventory(client);
    await seedCustomers(client);
    console.log("Database seeding completed successfully");
  } catch (error) {
    console.error("Error seeding database:", error);
  } finally {
    if (client) {
      await client.release();
      await pool.end();
      console.log("Database connection closed");
    }
  }
}

async function createTables(client) {
  // Drop tables if they exist
  await client.query("DROP TABLE IF EXISTS employee_benefits CASCADE");
  await client.query("DROP TABLE IF EXISTS sales CASCADE");
  await client.query("DROP TABLE IF EXISTS orders CASCADE");
  await client.query("DROP TABLE IF EXISTS customers CASCADE");
  await client.query("DROP TABLE IF EXISTS inventory CASCADE");
  await client.query("DROP TABLE IF EXISTS employees CASCADE");

  // Create employees table
  await client.query(`
    CREATE TABLE employees (
      employee_id SERIAL PRIMARY KEY,
      first_name VARCHAR(50) NOT NULL,
      last_name VARCHAR(50) NOT NULL,
      department VARCHAR(50) NOT NULL,
      position VARCHAR(50) NOT NULL,
      hire_date DATE NOT NULL,
      salary DECIMAL(10, 2) NOT NULL,
      commission_pct DECIMAL(4, 2),
      manager_id INTEGER,
      performance_score DECIMAL(3, 1)
    )
  `);

  // Create inventory table
  await client.query(`
    CREATE TABLE inventory (
      product_id SERIAL PRIMARY KEY,
      product_name VARCHAR(100) NOT NULL,
      category VARCHAR(50) NOT NULL,
      supplier VARCHAR(100) NOT NULL,
      stock_quantity INTEGER NOT NULL,
      cost_price DECIMAL(10, 2) NOT NULL,
      selling_price DECIMAL(10, 2) NOT NULL,
      reorder_level INTEGER NOT NULL,
      last_restock_date DATE NOT NULL,
      profit_margin DECIMAL(5, 2) NOT NULL
    )
  `);

  // Create customers table
  await client.query(`
    CREATE TABLE customers (
      customer_id SERIAL PRIMARY KEY,
      first_name VARCHAR(50) NOT NULL,
      last_name VARCHAR(50) NOT NULL,
      email VARCHAR(100) UNIQUE NOT NULL,
      phone VARCHAR(50),
      registration_date DATE NOT NULL,
      total_spent DECIMAL(12, 2) DEFAULT 0,
      loyalty_points INTEGER DEFAULT 0,
      segment VARCHAR(50),
      last_purchase_date DATE
    )
  `);

  console.log("Tables created successfully");
}
async function seedEmployees(client) {
  const departments = [
    "Sales",
    "Marketing",
    "IT",
    "HR",
    "Finance",
    "Operations",
    "Customer Support",
  ];
  const positions = {
    Sales: [
      "Sales Representative",
      "Sales Manager",
      "Account Executive",
      "Sales Director",
    ],
    Marketing: [
      "Marketing Specialist",
      "Marketing Manager",
      "Digital Marketer",
      "Brand Manager",
    ],
    IT: [
      "Software Developer",
      "IT Manager",
      "System Administrator",
      "Data Analyst",
    ],
    HR: ["HR Specialist", "HR Manager", "Recruiter", "Compensation Analyst"],
    Finance: [
      "Accountant",
      "Financial Analyst",
      "Finance Manager",
      "Controller",
    ],
    Operations: [
      "Operations Manager",
      "Supply Chain Analyst",
      "Logistics Coordinator",
      "Warehouse Manager",
    ],
    "Customer Support": [
      "Support Representative",
      "Support Manager",
      "Customer Success Manager",
      "Technical Support",
    ],
  };

  for (let i = 0; i < 50; i++) {
    const department =
      departments[Math.floor(Math.random() * departments.length)];
    const position =
      positions[department][
        Math.floor(Math.random() * positions[department].length)
      ];
    const hireDate = faker.date.past(5);
    const baseSalary = faker.number.int({ min: 40000, max: 120000 });
    const commissionPct =
      department === "Sales"
        ? faker.number.float({ min: 0.01, max: 0.05, precision: 0.01 })
        : null;
    const managerId = faker.number.int({ min: 1, max: 5 });
    const performanceScore = faker.number.float({
      min: 1,
      max: 5,
      precision: 0.1,
    });

    await client.query(
      `
      INSERT INTO employees (
        first_name,
        last_name,
        department,
        position,
        hire_date,
        salary,
        commission_pct,
        manager_id,
        performance_score
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    `,
      [
        faker.person.firstName(),
        faker.person.lastName(),
        department,
        position,
        hireDate,
        baseSalary,
        commissionPct,
        managerId,
        performanceScore,
      ]
    );
  }

  console.log("Employees table seeded with 50 records");
}

async function seedInventory(client) {
  const categories = [
    "Electronics",
    "Clothing",
    "Home & Kitchen",
    "Books",
    "Sports",
    "Beauty",
    "Toys",
  ];
  const suppliers = [
    "ABC Suppliers",
    "Global Imports",
    "Quality Products Inc",
    "Prime Distributors",
    "Elite Merchandise",
    "Value Chain Suppliers",
  ];

  for (let i = 0; i < 100; i++) {
    const category = categories[Math.floor(Math.random() * categories.length)];
    const supplier = suppliers[Math.floor(Math.random() * suppliers.length)];
    const costPrice = faker.number.float({
      min: 10,
      max: 500,
      precision: 0.01,
    });
    const profitMargin = faker.number.float({
      min: 0.1,
      max: 0.5,
      precision: 0.01,
    });
    const sellingPrice = costPrice * (1 + profitMargin);

    await client.query(
      `
      INSERT INTO inventory (
        product_name,
        category,
        supplier,
        stock_quantity,
        cost_price,
        selling_price,
        reorder_level,
        last_restock_date,
        profit_margin
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    `,
      [
        faker.commerce.productName(),
        category,
        supplier,
        faker.number.int({ min: 10, max: 1000 }),
        costPrice,
        sellingPrice,
        faker.number.int({ min: 5, max: 50 }),
        faker.date.recent(30),
        profitMargin,
      ]
    );
  }

  console.log("Inventory table seeded with 100 records");
}

async function seedCustomers(client) {
  for (let i = 0; i < 200; i++) {
    const registrationDate = faker.date.past(2);
    const lastPurchaseDate = faker.date.between({
      from: registrationDate,
      to: new Date(),
    });
    const totalSpent = faker.number.float({
      min: 0,
      max: 5000,
      precision: 0.01,
    });

    await client.query(
      `
      INSERT INTO customers (
        first_name,
        last_name,
        email,
        phone,
        registration_date,
        total_spent,
        loyalty_points,
        segment,
        last_purchase_date
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    `,
      [
        faker.person.firstName(),
        faker.person.lastName(),
        faker.internet.email(),
        faker.phone.number(),
        registrationDate,
        totalSpent,
        Math.floor(totalSpent / 10),
        totalSpent > 1000 ? "Premium" : totalSpent > 500 ? "Regular" : "Basic",
        lastPurchaseDate,
      ]
    );
  }

  console.log("Customers table seeded with 200 records");
}

async function seedOrders(client) {
  const customersResult = await client.query(
    "SELECT customer_id FROM customers"
  );
  const customers = customersResult.rows;
  const statuses = ["Pending", "Shipped", "Delivered", "Cancelled"];
  const paymentMethods = [
    "Credit Card",
    "PayPal",
    "Bank Transfer",
    "Cash on Delivery",
  ];

  for (let i = 0; i < 300; i++) {
    const customer = customers[Math.floor(Math.random() * customers.length)];
    const totalAmount = faker.number.float({
      min: 50,
      max: 1000,
      precision: 0.01,
    });
    const shippingCost = faker.number.float({
      min: 5,
      max: 50,
      precision: 0.01,
    });
    const taxAmount = totalAmount * 0.1;
    const hasDiscount = Math.random() > 0.7;
    const discountAmount = hasDiscount
      ? totalAmount *
        faker.number.float({ min: 0.05, max: 0.2, precision: 0.01 })
      : 0;
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const deliveryDays =
      status === "Delivered"
        ? faker.number.int({ min: 1, max: 7 })
        : status === "Shipped"
        ? faker.number.int({ min: 1, max: 3 })
        : null;

    await client.query(
      `
      INSERT INTO orders (
        customer_id,
        order_date,
        total_amount,
        payment_method,
        shipping_cost,
        tax_amount,
        discount_amount,
        status,
        delivery_days
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    `,
      [
        customer.customer_id,
        faker.date.recent(90),
        totalAmount,
        paymentMethods[Math.floor(Math.random() * paymentMethods.length)],
        shippingCost,
        taxAmount,
        discountAmount,
        status,
        deliveryDays,
      ]
    );
  }

  console.log("Orders table seeded with 300 records");
}

async function seedSales(client) {
  const [employees] = await client.query(
    "SELECT employee_id, commission_pct FROM employees WHERE department = 'Sales'"
  );
  const [products] = await client.query(
    "SELECT product_id, cost_price, selling_price FROM inventory"
  );
  const [orders] = await client.query("SELECT order_id FROM orders");

  for (let i = 0; i < 500; i++) {
    const employee =
      employees.rows[Math.floor(Math.random() * employees.rows.length)];
    const product =
      products.rows[Math.floor(Math.random() * products.rows.length)];
    const order = orders.rows[Math.floor(Math.random() * orders.rows.length)];
    const quantity = faker.number.int({ min: 1, max: 10 });
    const unitPrice = product.selling_price;
    const profit = quantity * (product.selling_price - product.cost_price);
    const commissionAmount = employee.commission_pct
      ? profit * employee.commission_pct
      : null;
    const hasRating = Math.random() > 0.3;
    const rating = hasRating ? faker.number.int({ min: 1, max: 5 }) : null;

    await client.query(
      `
      INSERT INTO sales (
        employee_id,
        product_id,
        order_id,
        quantity,
        unit_price,
        sale_date,
        commission_amount,
        profit,
        customer_rating
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    `,
      [
        employee.employee_id,
        product.product_id,
        order.order_id,
        quantity,
        unitPrice,
        faker.date.recent(90),
        commissionAmount,
        profit,
        rating,
      ]
    );
  }

  console.log("Sales table seeded with 500 records");
}

async function seedEmployeeBenefits(client) {
  const [employees] = await client.query(
    "SELECT employee_id, salary, position FROM employees"
  );
  const healthPlans = [
    "Basic",
    "Standard",
    "Premium",
    "Family",
    "Comprehensive",
  ];

  for (const employee of employees.rows) {
    const isManager =
      employee.position.includes("Manager") ||
      employee.position.includes("Director");
    const healthPlan =
      healthPlans[Math.floor(Math.random() * healthPlans.length)];
    const healthInsuranceCost =
      healthPlan === "Premium" || healthPlan === "Comprehensive"
        ? faker.number.float({ min: 800, max: 1200, precision: 0.01 })
        : healthPlan === "Family"
        ? faker.number.float({ min: 1000, max: 1500, precision: 0.01 })
        : faker.number.float({ min: 400, max: 800, precision: 0.01 });

    const retirementPct = isManager
      ? faker.number.float({ min: 5, max: 8, precision: 0.1 })
      : faker.number.float({ min: 3, max: 6, precision: 0.1 });

    const ptoBase = isManager ? 20 : 15;
    const paidTimeOffDays = ptoBase + Math.floor(Math.random() * 6);

    const sickLeaveBase = isManager ? 10 : 7;
    const sickLeaveDays = sickLeaveBase + Math.floor(Math.random() * 4);

    const hasTuitionReimbursement = Math.random() > 0.4;
    const tuitionReimbursement = hasTuitionReimbursement
      ? faker.number.float({ min: 1000, max: 5000, precision: 0.01 })
      : 0;

    const lifeSalaryMultiple = isManager
      ? faker.number.float({ min: 2, max: 3 })
      : faker.number.float({ min: 1, max: 2 });
    const lifeInsuranceCoverage = employee.salary * lifeSalaryMultiple;

    const hasDental = Math.random() > 0.1;
    const hasVision = Math.random() > 0.2;
    const wellnessStipend = faker.number.float({
      min: 200,
      max: 800,
      precision: 0.01,
    });

    await client.query(
      `
      INSERT INTO employee_benefits (
        employee_id,
        health_insurance_plan,
        health_insurance_cost,
        retirement_contribution_pct,
        paid_time_off_days,
        sick_leave_days,
        tuition_reimbursement,
        life_insurance_coverage,
        dental_coverage,
        vision_coverage,
        wellness_stipend
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    `,
      [
        employee.employee_id,
        healthPlan,
        healthInsuranceCost,
        retirementPct,
        paidTimeOffDays,
        sickLeaveDays,
        tuitionReimbursement,
        lifeInsuranceCoverage,
        hasDental,
        hasVision,
        wellnessStipend,
      ]
    );
  }

  console.log("Employee Benefits table seeded with records");
}

// Run the seed function
seedDatabase();
