import CategoryChart from "@/components/CategoryChart";
import EmptyState from "@/components/EmptyState";
import Nav from "@/components/Nav";
import RankTable from "@/components/RankTable";
import { getCategoryBreakdown, getChannelsForSnapshot, getLatestScrapedAt } from "@/lib/data";

export default function OverviewPage() {
  const scrapedAt = getLatestScrapedAt();

  if (!scrapedAt) {
    return (
      <>
        <Nav />
        <EmptyState />
      </>
    );
  }

  const channels = getChannelsForSnapshot(scrapedAt);
  const categories = getCategoryBreakdown(scrapedAt);
  const totalSubscribers = channels.reduce((sum, c) => sum + (c.subscribers ?? 0), 0);

  return (
    <>
      <Nav />
      <main className="mx-auto max-w-5xl px-6 py-10 space-y-10">
        <div>
          <h1 className="text-xl font-semibold">Most-Subscribed YouTube Channels</h1>
          <p className="mt-1 text-sm text-foreground/60">
            Scraped from{" "}
            <a
              href="https://en.wikipedia.org/wiki/List_of_most-subscribed_YouTube_channels"
              target="_blank"
              rel="noreferrer"
              className="hover:underline"
            >
              Wikipedia
            </a>{" "}
            — snapshot as of {new Date(scrapedAt).toUTCString()}.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <div className="rounded-lg border border-black/10 dark:border-white/10 p-4">
            <p className="text-sm text-foreground/60">Channels tracked</p>
            <p className="mt-1 text-2xl font-semibold">{channels.length}</p>
          </div>
          <div className="rounded-lg border border-black/10 dark:border-white/10 p-4">
            <p className="text-sm text-foreground/60">Combined subscribers</p>
            <p className="mt-1 text-2xl font-semibold">{totalSubscribers.toLocaleString()}</p>
          </div>
          <div className="rounded-lg border border-black/10 dark:border-white/10 p-4">
            <p className="text-sm text-foreground/60">Categories</p>
            <p className="mt-1 text-2xl font-semibold">{categories.length}</p>
          </div>
        </div>

        <div>
          <h2 className="text-sm font-medium text-foreground/60 mb-3">Subscribers by category</h2>
          <CategoryChart data={categories} />
        </div>

        <div>
          <h2 className="text-sm font-medium text-foreground/60 mb-3">Full ranking</h2>
          <RankTable channels={channels} />
        </div>
      </main>
    </>
  );
}
