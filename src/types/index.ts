// ── ReelShort API types ────────────────────────────────────────────────────────

export interface Drama {
  book_id: string;
  title: string;
  pic: string;
  chapter_count: number;
  collect_count: number;
  theme: string[];
}

export interface ReelShortApiResponse {
  ok: boolean;
  items: Drama[];
}

export interface SearchParams {
  lang?: string;
  keyword?: string;
  book_id?: string;
  chapter_index?: number;
}
