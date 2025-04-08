"use client";

import * as React from "react";
import {
  Bar,
  BarChart as RechartsBarChart,
  CartesianGrid,
  XAxis,
} from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

interface InteractiveData {
  [key: string]: string | number;
}

interface BarChartInteractiveProps {
  data: InteractiveData[];
  title: string;
  description: string;
  xAxisKey: string;
  yAxisKeys: string[];
  dateFormat?: string;
}

export function BarChartInteractive({
  data,
  title,
  description,
  xAxisKey,
  yAxisKeys,
  dateFormat = "MMM d",
}: BarChartInteractiveProps) {
  const [activeChart, setActiveChart] = React.useState<string>(yAxisKeys[0]);

  const total = React.useMemo(
    () =>
      yAxisKeys.reduce((acc, key) => {
        acc[key] = data.reduce((sum, item) => sum + (item[key] as number), 0);
        return acc;
      }, {} as Record<string, number>),
    [data, yAxisKeys]
  );

  // Create chart config dynamically based on the data keys
  const dynamicChartConfig = yAxisKeys.reduce((acc, key, index) => {
    acc[key] = {
      label: key.charAt(0).toUpperCase() + key.slice(1),
      color: `hsl(var(--chart-${index + 1}))`,
    };
    return acc;
  }, {} as ChartConfig);

  return (
    <Card>
      <CardHeader className="flex flex-col items-stretch space-y-0 border-b p-0 sm:flex-row">
        <div className="flex flex-1 flex-col justify-center gap-1 px-6 py-5 sm:py-6">
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
        <div className="flex">
          {yAxisKeys.map((key) => (
            <button
              key={key}
              data-active={activeChart === key}
              className="relative z-30 flex flex-1 flex-col justify-center gap-1 border-t px-6 py-4 text-left even:border-l data-[active=true]:bg-muted/50 sm:border-l sm:border-t-0 sm:px-8 sm:py-6"
              onClick={() => setActiveChart(key)}
            >
              <span className="text-xs text-muted-foreground">
                {dynamicChartConfig[key].label}
              </span>
              <span className="text-lg font-bold leading-none sm:text-3xl">
                {total[key].toLocaleString()}
              </span>
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent className="px-2 sm:p-6">
        <ChartContainer
          config={dynamicChartConfig}
          className="aspect-auto h-[250px] w-full"
        >
          <RechartsBarChart
            accessibilityLayer
            data={data}
            margin={{
              left: 12,
              right: 12,
            }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey={xAxisKey}
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) => {
                const date = new Date(value);
                return date.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                });
              }}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  className="w-[150px]"
                  nameKey="views"
                  labelFormatter={(value) => {
                    return new Date(value).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    });
                  }}
                />
              }
            />
            <Bar dataKey={activeChart} fill={`var(--color-${activeChart})`} />
          </RechartsBarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
