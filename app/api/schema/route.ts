import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface TableColumn {
  table_name: string;
  column_name: string;
  data_type: string;
  is_nullable: string;
  column_default: string | null;
}

interface SchemaTable {
  columns: {
    name: string;
    type: string;
    nullable: boolean;
    default: string | null;
  }[];
}

interface Schema {
  [tableName: string]: SchemaTable;
}

export async function GET() {
  try {
    // Get all tables and their columns from the database
    const tables = await prisma.$queryRaw<TableColumn[]>`
      SELECT 
        table_name,
        column_name,
        data_type,
        is_nullable,
        column_default
      FROM 
        information_schema.columns 
      WHERE 
        table_schema = 'public'
      ORDER BY 
        table_name, ordinal_position;
    `;

    // Format the schema into a more usable structure
    const schema = tables.reduce((acc: Schema, table: TableColumn) => {
      if (!acc[table.table_name]) {
        acc[table.table_name] = {
          columns: [],
        };
      }
      acc[table.table_name].columns.push({
        name: table.column_name,
        type: table.data_type,
        nullable: table.is_nullable === "YES",
        default: table.column_default,
      });
      return acc;
    }, {} as Schema);

    return NextResponse.json(schema);
  } catch (error) {
    console.error("Error fetching schema:", error);
    return NextResponse.json(
      { error: "Failed to fetch database schema" },
      { status: 500 }
    );
  }
}
