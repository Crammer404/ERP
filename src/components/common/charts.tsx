
"use client"

import { Area, AreaChart, Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartConfig,
} from "@/components/ui/chart"
import { chartData } from "@/lib/chart-data"

const overviewChartConfig = {
  sales: {
    label: "Sales",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig

export function OverviewChart() {
  return (
    <ChartContainer config={overviewChartConfig} className="h-[250px] w-full">
      <AreaChart
        accessibilityLayer
        data={chartData}
        margin={{
          left: 12,
          right: 12,
        }}
      >
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="date"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          tickFormatter={(value) => {
            const date = new Date(value);
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          }}
        />
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent indicator="dot" formatter={(value, name) => [`$${value}`, name]} />}
        />
        <defs>
            <linearGradient id="fillSales" x1="0" y1="0" x2="0" y2="1">
            <stop
                offset="5%"
                stopColor="var(--color-sales)"
                stopOpacity={0.8}
            />
            <stop
                offset="95%"
                stopColor="var(--color-sales)"
                stopOpacity={0.1}
            />
            </linearGradient>
        </defs>
        <Area
          dataKey="sales"
          type="natural"
          fill="url(#fillSales)"
          stroke="var(--color-sales)"
          stackId="a"
        />
      </AreaChart>
    </ChartContainer>
  )
}

const barChartConfig = {
  value: {
    label: "Value",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig;

export function DashboardBarChart({ data, defaultCurrency }: { data: { name: string; value: number }[]; defaultCurrency?: { symbol: string } | null }) {
  return (
    <ChartContainer config={barChartConfig} className="h-[250px] w-full">
        <BarChart 
            accessibilityLayer 
            data={data}
            layout="vertical"
            margin={{ left: 10, right: 30 }}
        >
            <CartesianGrid horizontal={false} />
            <YAxis
                dataKey="name"
                type="category"
                tickLine={false}
                axisLine={false}
                tickMargin={10}
                width={80}
            />
            <XAxis dataKey="value" type="number" hide />
            <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent
                    formatter={(value, name, item) => {
                        if (item.payload.name === 'Customers') {
                            return `${Number(value).toLocaleString()}`;
                        }
                        return `${defaultCurrency?.symbol || '₱'}${Number(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                    }}
                />}
            />
            <Bar dataKey="value" fill="var(--color-value)" radius={5} />
        </BarChart>
    </ChartContainer>
  );
}
