"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import Link from "next/link";
import { Graph } from "@/components/BarGraph";
import { BarChartInteractive } from "@/components/BarChartInteractive";
import { BarGraph2Cat } from "@/components/BarGraph2Cat";
import { Pie } from "@/components/Pie";
import { AreaChart } from "@/components/AreaChart";
import { StackedGraph } from "@/components/StackedGraph";

interface QueryResult {
  columns: string[];
  rows: Record<string, string | number>[];
  chartType?:
    | "bar"
    | "pie"
    | "area"
    | "stacked"
    | "bar-interactive"
    | "bar-2cat";
  chartConfig?: {
    xAxisKey?: string;
    yAxisKey?: string;
    yAxisKeys?: string[];
    valueKey?: string;
    nameKey?: string;
    dateFormat?: string;
    title?: string;
    description?: string;
  };
}

interface QueryHistory {
  id: string;
  userQuery: string;
  sqlQuery: string;
  executionTime: number | null;
  successful: boolean;
  errorMessage: string | null;
  createdAt: string;
  results: QueryResult | null;
  visualizationData?: {
    graphSqlQuery: string;
    relatedQueries: {
      description: string;
      sql: string;
      returned_data: any;
    }[];
    suggestedVisualization: {
      chartType: string;
      chartOptions: {
        xAxisKey: string;
        yAxisKeys: string[];
        dateFormat: string;
      };
      title: string;
      description: string;
    };
  };
}

export default function QueryHistoryPage() {
  const { data: session } = useSession();
  const [history, setHistory] = useState<QueryHistory[]>([]);
  const [selectedQuery, setSelectedQuery] = useState<QueryHistory | null>(null);

  useEffect(() => {
    if (session?.user?.id) {
      fetchHistory();
    }
  }, [session]);

  const fetchHistory = async () => {
    try {
      const response = await fetch(
        `/api/query-history/user/${session?.user?.id}`
      );
      if (response.ok) {
        const data = await response.json();
        setHistory(data || []);
      }
    } catch (err) {
      console.error("Error fetching history:", err);
      toast.error("Failed to fetch query history");
    }
  };

  const handleShowResults = (query: QueryHistory) => {
    setSelectedQuery(query);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const renderVisualization = (query: QueryHistory) => {
    if (!query.results?.chartType || !query.results?.chartConfig) return null;

    const { chartType, chartConfig, rows } = query.results;
    const {
      xAxisKey,
      yAxisKey,
      yAxisKeys,
      valueKey,
      nameKey,
      dateFormat,
      title,
      description,
    } = chartConfig;

    switch (chartType) {
      case "bar":
        return (
          <Graph
            data={rows}
            title={title || "Bar Chart"}
            description={description || ""}
            xAxisKey={xAxisKey || ""}
          />
        );
      case "bar-interactive":
        return (
          <BarChartInteractive
            data={rows}
            title={title || "Interactive Bar Chart"}
            description={description || ""}
            xAxisKey={xAxisKey || ""}
            yAxisKeys={yAxisKeys || []}
            dateFormat={dateFormat}
          />
        );
      case "bar-2cat":
        return (
          <BarGraph2Cat
            data={rows}
            title={title || "2 Category Bar Chart"}
            description={description || ""}
            xAxisKey={xAxisKey || ""}
          />
        );
      case "pie":
        return (
          <Pie
            data={rows}
            title={title || "Pie Chart"}
            description={description || ""}
            valueKey={valueKey || ""}
            nameKey={nameKey || ""}
          />
        );
      case "area":
        return (
          <AreaChart
            data={rows}
            title={title || "Area Chart"}
            description={description || ""}
            xAxisKey={xAxisKey || ""}
            yAxisKey={yAxisKey || ""}
          />
        );
      case "stacked":
        return (
          <StackedGraph
            data={rows}
            title={title || "Stacked Chart"}
            description={description || ""}
            xAxisKey={xAxisKey || ""}
            yAxisKeys={yAxisKeys || []}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto py-25">
      <Card>
        <CardHeader>
          <CardTitle>Query History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {history.map((query) => (
              <Card key={query.id}>
                <CardContent className="pt-6">
                  <div className="space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">Natural Language Query:</p>
                        <p className="text-sm text-gray-500">
                          {query.userQuery}
                        </p>
                      </div>
                      <div className="text-sm text-gray-500">
                        {formatDate(query.createdAt)}
                      </div>
                    </div>
                    <div>
                      <p className="font-medium">SQL Query:</p>
                      <p className="text-sm text-gray-500">{query.sqlQuery}</p>
                    </div>
                    <div className="flex justify-between items-center">
                      <div>
                        {query.executionTime && (
                          <p className="text-sm text-gray-500">
                            Execution Time: {query.executionTime}ms
                          </p>
                        )}
                        {!query.successful && (
                          <p className="text-sm text-red-500">
                            Error: {query.errorMessage}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          onClick={() => handleShowResults(query)}
                        >
                          Show Results
                        </Button>
                        {query.visualizationData && (
                          <Link href={`/history/visualization?id=${query.id}`}>
                            <Button variant="outline">
                              View Visualization
                            </Button>
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {selectedQuery?.results && (
        <Card className="mt-4">
          <CardHeader>
            <CardTitle>Query Results</CardTitle>
          </CardHeader>
          <CardContent>
            <>
              {renderVisualization(selectedQuery)}
              <div className="mt-4 overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      {selectedQuery.results?.columns?.map((column) => (
                        <th
                          key={column}
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          {column}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {selectedQuery.results?.rows?.map((row, rowIndex) => (
                      <tr key={rowIndex}>
                        {selectedQuery?.results?.columns.map((column) => (
                          <td
                            key={column}
                            className="px-6 py-4 whitespace-nowrap text-sm text-gray-500"
                          >
                            {typeof row[column] === "number"
                              ? `$${row[column].toLocaleString()}`
                              : row[column]}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
