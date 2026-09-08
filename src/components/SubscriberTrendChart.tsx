"use client";

import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import type { SubscriberTrendPoint } from "@/lib/types";

function formatMillions(value: number) {
  return `${(value / 1_000_000).toFixed(0)}M`;
}

export default function SubscriberTrendChart({ data }: { data: SubscriberTrendPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={320}>
      <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-black/10 dark:stroke-white/10" />
        <XAxis dataKey="scrapedAt" tick={{ fontSize: 12 }} />
        <YAxis tickFormatter={formatMillions} tick={{ fontSize: 12 }} />
        <Tooltip formatter={(value) => [Number(value).toLocaleString(), "Subscribers"]} />
        <Line type="monotone" dataKey="subscribers" stroke="#2563eb" strokeWidth={2} dot={{ r: 3 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}
