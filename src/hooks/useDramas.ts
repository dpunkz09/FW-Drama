import { useState, useEffect, useCallback } from 'react';
import api from '../api/client';
import { formatCount } from '../utils/format';
import type { Drama, SeriesListItem, seriesToDrama } from '../types';
import { seriesToDrama as transformSeries } from '../types';

export { formatCount };

// ── Featured/For You feed (first 15 series) ──────────────────────────────────
export const useDramas = () => {
  const [dramas, setDramas] = useState<Drama[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);

    api.get<SeriesListItem[]>('/api/v1/series?pageSize=15', { 
      signal: controller.signal 
    })
      .then(response => {
        const transformed = response.data.map(transformSeries);
        setDramas(transformed);
      })
      .catch(e => { 
        if (e.name !== 'AbortError' && !controller.signal.aborted) {
          console.error('useDramas:', e); 
        }
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, []);

  return { dramas, loading };
};

// ── All series feed (paginated) ───────────────────────────────────────────────
export const useInfiniteDramas = () => {
  const [dramas, setDramas] = useState<Drama[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);

  const loadMore = useCallback(() => {
    if (loadingMore || !hasMore) return;
    
    setLoadingMore(true);
    const nextPage = page + 1;

    api.get<SeriesListItem[]>(`/api/v1/series?pageSize=15&page=${nextPage}`)
      .then(response => {
        const transformed = response.data.map(transformSeries);
        if (transformed.length === 0) {
          setHasMore(false);
        } else {
          setDramas(prev => [...prev, ...transformed]);
          setPage(nextPage);
        }
      })
      .catch(e => console.error('useInfiniteDramas loadMore:', e))
      .finally(() => setLoadingMore(false));
  }, [page, loadingMore, hasMore]);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setDramas([]);
    setPage(1);
    setHasMore(true);

    api.get<SeriesListItem[]>('/api/v1/series?pageSize=15', { 
      signal: controller.signal 
    })
      .then(response => {
        const transformed = response.data.map(transformSeries);
        setDramas(transformed);
        setHasMore(transformed.length === 15);
      })
      .catch(e => { 
        if (e.name !== 'AbortError' && !controller.signal.aborted) {
          console.error('useInfiniteDramas:', e); 
        }
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, []);

  return { dramas, loading, loadingMore, hasMore, loadMore };
};

// ── Trending (sorted by views/stars) ──────────────────────────────────────────
export const useRankDramas = () => {
  const [dramas, setDramas] = useState<Drama[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);

    api.get<SeriesListItem[]>('/api/v1/series?pageSize=50', { 
      signal: controller.signal 
    })
      .then(response => {
        const transformed = response.data.map(transformSeries);
        // Sort by views (collect_count) descending
        const sorted = [...transformed].sort((a, b) => b.collect_count - a.collect_count);
        setDramas(sorted);
      })
      .catch(e => { 
        if (e.name !== 'AbortError' && !controller.signal.aborted) {
          console.error('useRankDramas:', e); 
        }
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, []);

  return { dramas, loading };
};

// ── Search (client-side filtering for now) ───────────────────────────────────
export const useSearchDramas = (query: string) => {
  const [dramas, setDramas] = useState<Drama[]>([]);
  const [loading, setLoading] = useState(false);
  const [allSeries, setAllSeries] = useState<Drama[]>([]);

  // Load all series once for search
  useEffect(() => {
    api.get<SeriesListItem[]>('/api/v1/series?pageSize=100')
      .then(response => {
        const transformed = response.data.map(transformSeries);
        setAllSeries(transformed);
      })
      .catch(e => console.error('useSearchDramas preload:', e));
  }, []);

  useEffect(() => {
    if (!query.trim()) {
      setDramas([]);
      return;
    }

    // Debounce: wait 400 ms before filtering
    const timer = setTimeout(() => {
      setLoading(true);
      const searchLower = query.toLowerCase();
      const filtered = allSeries.filter(drama => 
        drama.title.toLowerCase().includes(searchLower) ||
        drama.theme.some(t => t.toLowerCase().includes(searchLower))
      );
      setDramas(filtered);
      setLoading(false);
    }, 400);

    return () => clearTimeout(timer);
  }, [query, allSeries]);

  return { dramas, loading };
};
