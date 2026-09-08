import ChannelSelect from "@/components/ChannelSelect";
import EmptyState from "@/components/EmptyState";
import Nav from "@/components/Nav";
import SubscriberTrendChart from "@/components/SubscriberTrendChart";
import { getAllSnapshots, getChannelsForSnapshot, getLatestScrapedAt, getSubscriberTrend } from "@/lib/data";

export default async function TrendPage(props: PageProps<"/trend">) {
  const scrapedAt = getLatestScrapedAt();

  if (!scrapedAt) {
    return (
      <>
        <Nav />
        <EmptyState />
      </>
    );
  }

  const snapshots = getAllSnapshots();
  const latestChannels = getChannelsForSnapshot(scrapedAt);
  const names = latestChannels.map((c) => c.name);

  const searchParams = await props.searchParams;
  const requestedChannel = typeof searchParams.channel === "string" ? searchParams.channel : undefined;
  const selected = requestedChannel && names.includes(requestedChannel) ? requestedChannel : names[0];

  const trend = getSubscriberTrend(selected);

  return (
    <>
      <Nav />
      <main className="mx-auto max-w-5xl px-6 py-10 space-y-8">
        <div>
          <h1 className="text-xl font-semibold">Subscriber Trend</h1>
          <p className="mt-1 text-sm text-foreground/60">
            Subscriber count over time, built from every scheduled scrape.
          </p>
        </div>

        <ChannelSelect names={names} selected={selected} />

        {snapshots.length < 2 ? (
          <div className="rounded-lg border border-dashed border-black/15 dark:border-white/15 p-8 text-center">
            <h2 className="text-lg font-medium">Only one snapshot so far</h2>
            <p className="mt-2 text-sm text-foreground/60">
              The scheduled scrape (see <code>.github/workflows/scrape.yml</code>) runs daily and
              commits a new snapshot each time. Trend lines will appear once a few days of data
              have accumulated.
            </p>
          </div>
        ) : (
          <SubscriberTrendChart data={trend} />
        )}
      </main>
    </>
  );
}
