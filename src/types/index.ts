// ── Shortical API types ────────────────────────────────────────────────────────

export interface UILabel {
  value: string;
  color: string;
  is_visible: boolean;
}

export interface ComingSoonData {
  reservedCount: number;
  releaseDate: string | null;
}

export interface Series {
  id: number;
  name: string;
  description: string;
  uiElements: {
    labels: UILabel[];
  };
  categories: string[] | null;
  consentRequired: boolean;
  stars: number;
  isStarred: boolean;
  isReserved: boolean;
  comingSoonData: ComingSoonData;
  isEpisodicRelease: boolean;
  isOngoing: boolean;
  episodicReleaseThumbnail?: boolean;
  views: number;
  testSeriesData: any;
}

export interface SeriesListItem {
  series: Series;
  thumbnail: string;
  episode_thumbnail: string;
  label?: string;
  isEpisodicRelease: boolean;
}

export interface SeriesDetailResponse {
  series: Series;
  thumbnail: string;
  episode_thumbnail: string;
  label?: string;
  isEpisodicRelease: boolean;
}

export interface Episode {
  id: number;
  episode_number: number;
  title?: string;
  thumbnail?: string;
}

// The episodes endpoint returns an array directly, not an object
export type EpisodesResponse = Episode[];

// Compatibility type for existing components (maps Shortical to old ReelShort structure)
export interface Drama {
  book_id: string;
  title: string;
  pic: string;
  chapter_count: number;
  collect_count: number;
  theme: string[];
}

// Transform Shortical series to Drama format
export function seriesToDrama(item: SeriesListItem): Drama {
  return {
    book_id: item.series.id.toString(),
    title: item.series.name,
    pic: item.thumbnail,
    chapter_count: 0, // Shortical doesn't provide episode count in list view
    collect_count: item.series.views,
    theme: item.series.categories || []
  };
}
