"use client";

import { useState, useEffect } from "react";
import { Chart } from "@/components/Chart";

interface ChartData {
  [key: string]: string | number;
}

interface QueryConfig {
  query: string;
  xAxis: string;
  yAxis: string;
  title: string;
  description: string;
  chartType?: "bar" | "pie" | "line" | "area" | "donut";
  stackKey?: string;
}

export default function Graphs() {
  const [chartsData, setChartsData] = useState<{ [key: string]: ChartData[] }>(
    {}
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const queries: QueryConfig[] = [
    {
      query: `
        SELECT 
          department,
          COUNT(*) as employee_count,
          ROUND(AVG(salary), 2) as avg_salary,
          ROUND(SUM(salary), 2) as total_salary,
          ROUND(AVG(performance_score), 1) as avg_performance_score
        FROM employees
        GROUP BY department
        ORDER BY total_salary DESC
      `,
      xAxis: "department",
      yAxis: "total_salary",
      stackKey: "employee_count",
      title: "Employee Salary Analysis by Department",
      description:
        "Total salary expense and employee distribution across departments",
      chartType: "bar",
    },
    {
      query: `
        SELECT 
          EXTRACT(YEAR FROM hire_date) AS hire_year,
          COUNT(*) as hires,
          ROUND(AVG(salary), 2) as avg_salary
        FROM employees
        GROUP BY hire_year
        ORDER BY hire_year ASC
      `,
      xAxis: "hire_year",
      yAxis: "hires",
      stackKey: "avg_salary",
      title: "Employee Hiring Trend by Year",
      description: "Number of hires and average salary trends over the years",
      chartType: "line",
    },
    {
      query: `
        SELECT 
          category,
          COUNT(*) as product_count,
          SUM(stock_quantity) as total_stock,
          ROUND(AVG(profit_margin), 2) as avg_profit_margin,
          ROUND(SUM((selling_price - cost_price) * stock_quantity), 2) as potential_profit
        FROM inventory
        GROUP BY category
        ORDER BY potential_profit DESC
      `,
      xAxis: "category",
      yAxis: "potential_profit",
      stackKey: "product_count",
      title: "Inventory Profit Potential by Category",
      description:
        "Aggregated potential profit and product distribution across inventory categories",
      chartType: "area",
    },
    {
      query: `
        SELECT 
          supplier as name,
          SUM(stock_quantity) AS value
        FROM inventory
        GROUP BY supplier
        ORDER BY value DESC
      `,
      xAxis: "name",
      yAxis: "value",
      title: "Inventory Distribution by Supplier",
      description: "Total stock distribution across various suppliers",
      chartType: "pie",
    },
    {
      query: `
        SELECT 
          department as name,
          COUNT(*) as value
        FROM employees
        GROUP BY department
        ORDER BY value DESC
      `,
      xAxis: "name",
      yAxis: "value",
      title: "Employee Distribution by Department",
      description: "Employee count distribution across departments",
      chartType: "donut",
    },
  ];

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        const results: { [key: string]: ChartData[] } = {};

        for (const queryConfig of queries) {
          const response = await fetch("/api/execute-query", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(queryConfig),
          });

          if (!response.ok) {
            throw new Error(`Failed to fetch data for ${queryConfig.title}`);
          }

          const result = await response.json();
          results[queryConfig.title] = result.data;
        }

        setChartsData(results);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError(err instanceof Error ? err.message : "An error occurred");
        setLoading(false);
      }
    };

    fetchAllData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-[#bfff00]">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-500">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8 bg-black">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-[#bfff00] text-center p-25">
          Data Visualizations
        </h1>

        <div className="grid grid-cols-1 gap-8">
          {queries.map((queryConfig) => (
            <div key={queryConfig.title} className="bg-gray-900 p-6 rounded-lg">
              <Chart
                data={chartsData[queryConfig.title]}
                xAxis={{
                  key: queryConfig.xAxis,
                  label: "Customer Segment",
                  formatter: (value) => value.toString(),
                }}
                yAxis={{
                  key: queryConfig.yAxis,
                  label: "Total Revenue",
                  formatter: (value) => `$${value.toLocaleString()}`,
                }}
                title={queryConfig.title}
                description={queryConfig.description}
                color="#4ade80"
                chartType={queryConfig.chartType}
                stackKey={queryConfig.stackKey}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
