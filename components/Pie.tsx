"use client";

import * as React from "react";
import { TrendingUp } from "lucide-react";
import { Label, Pie, PieChart } from "recharts";

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

interface PieData {
  [key: string]: string | number;
}

interface PieProps {
  data: PieData[];
  title: string;
  description: string;
  valueKey: string;
  nameKey: string;
  footerData?: {
    trend?: {
      value: number;
      direction: "up" | "down";
    };
    description?: string;
  };
}

export function Pie({
  data,
  title,
  description,
  valueKey,
  nameKey,
  footerData,
}: PieProps) {
  const total = React.useMemo(() => {
    return data.reduce((acc, curr) => acc + (curr[valueKey] as number), 0);
  }, [data, valueKey]);

  // Create chart config dynamically based on the data keys
  const dynamicChartConfig = data.reduce((acc, item) => {
    const name = item[nameKey] as string;
    if (!acc[name]) {
      acc[name] = {
        label: name.charAt(0).toUpperCase() + name.slice(1),
        color: `hsl(var(--chart-${Object.keys(acc).length + 1}))`,
      };
    }
    return acc;
  }, {} as ChartConfig);

  return (
    <Card className="flex flex-col">
      <CardHeader className="items-center pb-0">
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={dynamicChartConfig}
          className="mx-auto aspect-square max-h-[250px]"
        >
          <PieChart>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Pie
              data={data}
              dataKey={valueKey}
              nameKey={nameKey}
              innerRadius={60}
              strokeWidth={5}
            >
              <Label
                content={({ viewBox }) => {
                  if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                    return (
                      <text
                        x={viewBox.cx}
                        y={viewBox.cy}
                        textAnchor="middle"
                        dominantBaseline="middle"
                      >
                        <tspan
                          x={viewBox.cx}
                          y={viewBox.cy}
                          className="fill-foreground text-3xl font-bold"
                        >
                          {total.toLocaleString()}
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 24}
                          className="fill-muted-foreground"
                        >
                          Total
                        </tspan>
                      </text>
                    );
                  }
                }}
              />
            </Pie>
          </PieChart>
        </ChartContainer>
      </CardContent>
      {footerData && (
        <CardFooter className="flex-col gap-2 text-sm">
          {footerData.trend && (
            <div className="flex items-center gap-2 font-medium leading-none">
              Trending {footerData.trend.direction} by {footerData.trend.value}%
              this month
              <TrendingUp
                className={`h-4 w-4 ${
                  footerData.trend.direction === "down" ? "rotate-180" : ""
                }`}
              />
            </div>
          )}
          {footerData.description && (
            <div className="leading-none text-muted-foreground">
              {footerData.description}
            </div>
          )}
        </CardFooter>
      )}
    </Card>
  );
}
