import type { Channel } from "@/lib/types";

export default function RankTable({ channels }: { channels: Channel[] }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-black/10 dark:border-white/10">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-black/10 dark:border-white/10 text-left text-foreground/60">
            <th className="px-4 py-2 font-medium">#</th>
            <th className="px-4 py-2 font-medium">Channel</th>
            <th className="px-4 py-2 font-medium">Subscribers</th>
            <th className="px-4 py-2 font-medium">Category</th>
            <th className="px-4 py-2 font-medium">Country</th>
            <th className="px-4 py-2 font-medium">Joined</th>
          </tr>
        </thead>
        <tbody>
          {channels.map((channel) => (
            <tr key={channel.name} className="border-b border-black/5 dark:border-white/5 last:border-0">
              <td className="px-4 py-2 text-foreground/60">{channel.rank}</td>
              <td className="px-4 py-2 font-medium">
                {channel.youtubeUrl ? (
                  <a
                    href={channel.youtubeUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="hover:underline"
                  >
                    {channel.name}
                  </a>
                ) : (
                  channel.name
                )}
              </td>
              <td className="px-4 py-2">{channel.subscribers?.toLocaleString() ?? "—"}</td>
              <td className="px-4 py-2 text-foreground/70">{channel.category ?? "—"}</td>
              <td className="px-4 py-2 text-foreground/70">{channel.country ?? "—"}</td>
              <td className="px-4 py-2 text-foreground/70">{channel.joinedYoutube ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
