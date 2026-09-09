"use client";

import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import type { SubscriberTrendPoint } from "@/lib/types";

function formatMillions(value: number) {
  return `${(value / 1_000_000).toFixed(0)}M`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function SubscriberTrendChart({ data }: { data: SubscriberTrendPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={320}>
      <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-black/10 dark:stroke-white/10" />
        <XAxis dataKey="scrapedAt" tickFormatter={formatDate} tick={{ fontSize: 12 }} />
        <YAxis tickFormatter={formatMillions} tick={{ fontSize: 12 }} />
        <Tooltip
          formatter={(value) => [Number(value).toLocaleString(), "Subscribers"]}
          labelFormatter={(label) => formatDate(String(label))}
        />
        <Line type="monotone" dataKey="subscribers" stroke="#2563eb" strokeWidth={2} dot={{ r: 3 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}
