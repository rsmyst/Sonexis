import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

interface QueryResult {
  department: string;
  avg_salary: number;
}

export async function GET() {
  try {
    const results = await prisma.$queryRaw<QueryResult[]>`
      SELECT department, AVG(salary) as avg_salary 
      FROM employees 
      GROUP BY department 
      ORDER BY avg_salary DESC
    `;

    return NextResponse.json(results);
  } catch (error) {
    console.error("Error executing query:", error);
    return NextResponse.json(
      { error: "Failed to fetch salary data" },
      { status: 500 }
    );
  }
}
