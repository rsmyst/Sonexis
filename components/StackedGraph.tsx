"use client";

import { TrendingUp } from "lucide-react";
import {
  Area,
  AreaChart as RechartsAreaChart,
  CartesianGrid,
  XAxis,
} from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

interface StackedData {
  [key: string]: string | number;
}

interface StackedGraphProps {
  data: StackedData[];
  title: string;
  description: string;
  xAxisKey: string;
  yAxisKeys: string[];
  footerData?: {
    trend?: {
      value: number;
      direction: "up" | "down";
    };
    description?: string;
  };
}

export function StackedGraph({
  data,
  title,
  description,
  xAxisKey,
  yAxisKeys,
  footerData,
}: StackedGraphProps) {
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
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={dynamicChartConfig}>
          <RechartsAreaChart
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
              tickFormatter={(value) => value.slice(0, 3)}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="dot" />}
            />
            {yAxisKeys.map((key, index) => (
              <Area
                key={key}
                dataKey={key}
                type="natural"
                fill={`var(--color-${key})`}
                fillOpacity={0.4}
                stroke={`var(--color-${key})`}
                stackId="a"
              />
            ))}
          </RechartsAreaChart>
        </ChartContainer>
      </CardContent>
      {footerData && (
        <CardFooter>
          <div className="flex w-full items-start gap-2 text-sm">
            <div className="grid gap-2">
              {footerData.trend && (
                <div className="flex items-center gap-2 font-medium leading-none">
                  Trending {footerData.trend.direction} by{" "}
                  {footerData.trend.value}% this month
                  <TrendingUp
                    className={`h-4 w-4 ${
                      footerData.trend.direction === "down" ? "rotate-180" : ""
                    }`}
                  />
                </div>
              )}
              {footerData.description && (
                <div className="flex items-center gap-2 leading-none text-muted-foreground">
                  {footerData.description}
                </div>
              )}
            </div>
          </div>
        </CardFooter>
      )}
    </Card>
  );
}
