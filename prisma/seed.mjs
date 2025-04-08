import { PrismaClient } from "@prisma/client";
// import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Create admin user with a fixed salt for development
  // const salt = "$2a$10$CwTycUXWue0Thq9StjUM0u"; // Fixed salt for development
  // const hashedPassword = await bcrypt.hash("admin123", salt);
  const hashedPassword = "admin123"; //Test time password

  const admin = await prisma.user.upsert({
    where: { userId: 1 },
    update: {
      password: hashedPassword, // Update password if user exists
    },
    create: {
      name: "Admin User",
      password: hashedPassword,
      role: "ADMIN",
      settings: {
        create: {
          language: "en",
          voiceEnabled: true,
          autoSuggestEnabled: true,
        },
      },
    },
  });

  // Create sample database metadata
  await prisma.databaseMetadata.upsert({
    where: { tableName: "users" },
    update: {},
    create: {
      tableName: "users",
      description: "Stores user information and authentication details",
      isVisible: true,
      columns: {
        create: [
          {
            columnName: "id",
            dataType: "String",
            description: "Unique identifier for the user",
            isIdentifier: true,
            isSensitive: false,
          },
          {
            columnName: "name",
            dataType: "String",
            description: "Full name of the user",
            isIdentifier: false,
            isSensitive: true,
          },
          {
            columnName: "role",
            dataType: "String",
            description: "User role (ADMIN/USER)",
            isIdentifier: false,
            isSensitive: false,
          },
        ],
      },
    },
  });

  // Create a sample dashboard for the admin
  await prisma.dashboard.create({
    data: {
      userId: admin.id,
      widgets: {
        create: [
          {
            title: "User Statistics",
            description: "Overview of user activity",
            sqlQuery: "SELECT role, COUNT(*) as count FROM users GROUP BY role",
            chartType: "pie",
            chartOptions: {
              title: "User Distribution by Role",
            },
          },
        ],
      },
    },
  });

  // Create a sample query history
  await prisma.queryHistory.create({
    data: {
      userId: admin.id,
      userQuery: "Show me the number of users by role",
      sqlQuery: "SELECT role, COUNT(*) as count FROM users GROUP BY role",
      successful: true,
      executionTime: 150,
      visualization: {
        create: {
          chartType: "bar",
          title: "User Distribution",
          chartOptions: {
            xAxis: "role",
            yAxis: "count",
          },
        },
      },
    },
  });

  console.log("Seed data created successfully");
}

main()
  .catch((e) => {
    console.error("Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
