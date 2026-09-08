"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import type { CategoryBreakdown } from "@/lib/types";

function formatMillions(value: number) {
  return `${(value / 1_000_000).toFixed(0)}M`;
}

export default function CategoryChart({ data }: { data: CategoryBreakdown[] }) {
  return (
    <ResponsiveContainer width="100%" height={320}>
      <BarChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-black/10 dark:stroke-white/10" />
        <XAxis dataKey="category" tick={{ fontSize: 12 }} interval={0} angle={-20} textAnchor="end" height={60} />
        <YAxis tickFormatter={formatMillions} tick={{ fontSize: 12 }} />
        <Tooltip
          formatter={(value) => [Number(value).toLocaleString(), "Total subscribers"]}
          labelStyle={{ color: "#171717" }}
        />
        <Bar dataKey="totalSubscribers" fill="#2563eb" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
