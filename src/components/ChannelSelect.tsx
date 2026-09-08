"use client";

import { useRouter } from "next/navigation";

export default function ChannelSelect({
  names,
  selected,
}: {
  names: string[];
  selected: string;
}) {
  const router = useRouter();

  return (
    <select
      value={selected}
      onChange={(e) => router.push(`/trend?channel=${encodeURIComponent(e.target.value)}`)}
      className="rounded border border-black/10 dark:border-white/10 bg-background px-3 py-2 text-sm"
    >
      {names.map((name) => (
        <option key={name} value={name}>
          {name}
        </option>
      ))}
    </select>
  );
}
