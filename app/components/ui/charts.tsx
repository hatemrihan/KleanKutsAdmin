import { Card } from "./card";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";
import { ReactElement } from "react";

interface ChartContainerProps {
  children: ReactElement;
  title?: string;
}

interface ChartData {
  name: string;
  value: number;
}

interface TooltipProps {
  active?: boolean;
  payload?: Array<{ value: number }>;
}

export function ChartContainer({ children, title }: ChartContainerProps) {
  return (
    <Card className="p-4">
      {title && <h3 className="text-lg font-semibold mb-4">{title}</h3>}
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          {children}
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

export function ChartTooltipContent({ active, payload }: TooltipProps) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-2 border border-gray-200 rounded-lg shadow-sm">
        <p className="text-sm text-gray-900">
          L.E {payload[0].value.toLocaleString()}
        </p>
      </div>
    );
  }
  return null;
}

export function BarChartComponent({ data }: { data: ChartData[] }) {
  return (
    <BarChart data={data}>
      <XAxis dataKey="name" />
      <YAxis />
      <Tooltip content={<ChartTooltipContent />} />
      <Bar dataKey="value" fill="#8884d8" />
    </BarChart>
  );
} 