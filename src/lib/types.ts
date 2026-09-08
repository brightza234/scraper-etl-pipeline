export interface Channel {
  rank: number;
  name: string;
  wikipediaUrl: string | null;
  youtubeUrl: string | null;
  subscribers: number | null;
  subscribersMillions: number | null;
  primaryLanguage: string | null;
  category: string | null;
  joinedYoutube: string | null;
  country: string | null;
  scrapedAt: string;
}

export interface Snapshot {
  scrapedAt: string;
  channelCount: number;
}

export interface CategoryBreakdown {
  category: string;
  channelCount: number;
  totalSubscribers: number;
}

export interface SubscriberTrendPoint {
  scrapedAt: string;
  subscribers: number;
}
