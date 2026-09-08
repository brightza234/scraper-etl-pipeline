import "server-only";

import { getDb } from "@/lib/db";
import type {
  CategoryBreakdown,
  Channel,
  Snapshot,
  SubscriberTrendPoint,
} from "@/lib/types";

interface ChannelRow {
  rank: number;
  name: string;
  wikipedia_url: string | null;
  youtube_url: string | null;
  subscribers: number | null;
  subscribers_millions: number | null;
  primary_language: string | null;
  category: string | null;
  joined_youtube: string | null;
  country: string | null;
  scraped_at: string;
}

function toChannel(row: ChannelRow): Channel {
  return {
    rank: row.rank,
    name: row.name,
    wikipediaUrl: row.wikipedia_url,
    youtubeUrl: row.youtube_url,
    subscribers: row.subscribers,
    subscribersMillions: row.subscribers_millions,
    primaryLanguage: row.primary_language,
    category: row.category,
    joinedYoutube: row.joined_youtube,
    country: row.country,
    scrapedAt: row.scraped_at,
  };
}

export function getLatestScrapedAt(): string | null {
  try {
    const row = getDb()
      .prepare("SELECT scraped_at FROM channels ORDER BY scraped_at DESC LIMIT 1")
      .get() as { scraped_at: string } | undefined;
    return row?.scraped_at ?? null;
  } catch {
    // scraped.db doesn't exist yet — the scraper pipeline hasn't run.
    return null;
  }
}

export function getAllSnapshots(): Snapshot[] {
  const rows = getDb()
    .prepare(
      `SELECT scraped_at, COUNT(*) as channel_count
       FROM channels
       GROUP BY scraped_at
       ORDER BY scraped_at DESC`
    )
    .all() as { scraped_at: string; channel_count: number }[];
  return rows.map((r) => ({ scrapedAt: r.scraped_at, channelCount: r.channel_count }));
}

export function getChannelsForSnapshot(scrapedAt: string): Channel[] {
  const rows = getDb()
    .prepare(
      `SELECT rank, name, wikipedia_url, youtube_url, subscribers, subscribers_millions,
              primary_language, category, joined_youtube, country, scraped_at
       FROM channels
       WHERE scraped_at = ?
       ORDER BY rank ASC`
    )
    .all(scrapedAt) as ChannelRow[];
  return rows.map(toChannel);
}

export function getCategoryBreakdown(scrapedAt: string): CategoryBreakdown[] {
  const rows = getDb()
    .prepare(
      `SELECT COALESCE(category, 'Unknown') as category,
              COUNT(*) as channel_count,
              SUM(subscribers) as total_subscribers
       FROM channels
       WHERE scraped_at = ?
       GROUP BY category
       ORDER BY total_subscribers DESC`
    )
    .all(scrapedAt) as { category: string; channel_count: number; total_subscribers: number }[];
  return rows.map((r) => ({
    category: r.category,
    channelCount: r.channel_count,
    totalSubscribers: r.total_subscribers,
  }));
}

export function getSubscriberTrend(name: string): SubscriberTrendPoint[] {
  const rows = getDb()
    .prepare(
      `SELECT scraped_at, subscribers
       FROM channels
       WHERE name = ? AND subscribers IS NOT NULL
       ORDER BY scraped_at ASC`
    )
    .all(name) as { scraped_at: string; subscribers: number }[];
  return rows.map((r) => ({ scrapedAt: r.scraped_at, subscribers: r.subscribers }));
}
