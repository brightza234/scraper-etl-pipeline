"use client";

import { useRouter } from "next/navigation";

import { RANGE_OPTIONS } from "@/lib/trendRanges";

export default function TrendControls({
  names,
  selectedChannel,
  selectedRange,
}: {
  names: string[];
  selectedChannel: string;
  selectedRange: string;
}) {
  const router = useRouter();

  function navigate(channel: string, range: string) {
    router.push(`/trend?channel=${encodeURIComponent(channel)}&range=${encodeURIComponent(range)}`);
  }

  return (
    <div className="flex flex-wrap gap-3">
      <select
        value={selectedChannel}
        onChange={(e) => navigate(e.target.value, selectedRange)}
        className="rounded border border-black/10 dark:border-white/10 bg-background px-3 py-2 text-sm"
      >
        {names.map((name) => (
          <option key={name} value={name}>
            {name}
          </option>
        ))}
      </select>

      <select
        value={selectedRange}
        onChange={(e) => navigate(selectedChannel, e.target.value)}
        className="rounded border border-black/10 dark:border-white/10 bg-background px-3 py-2 text-sm"
      >
        {RANGE_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
