import { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '../store/language';
import { formatCount } from '../utils/format';
import type { Drama, ReelShortApiResponse } from '../types';

export { formatCount };

// ── For You feed ──────────────────────────────────────────────────────────────
export const useDramas = () => {
  const [dramas, setDramas] = useState<Drama[]>([]);
  const [loading, setLoading] = useState(true);
  const { lang } = useLanguage();

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);

    fetch(`/api/foryou?lang=${lang}`, { signal: controller.signal })
      .then(r => r.json())
      .then((data: ReelShortApiResponse) => {
        if (data.ok && data.items) setDramas(data.items);
      })
      .catch(e => { if (e.name !== 'AbortError') console.error('useDramas:', e); })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [lang]);

  return { dramas, loading };
};

// ── Latest feed ───────────────────────────────────────────────────────────────
export const useInfiniteDramas = () => {
  const [dramas, setDramas] = useState<Drama[]>([]);
  const [loading, setLoading] = useState(true);
  const { lang } = useLanguage();

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setDramas([]);

    fetch(`/api/latest?lang=${lang}`, { signal: controller.signal })
      .then(r => r.json())
      .then((data: ReelShortApiResponse) => {
        if (data.ok && data.items) setDramas(data.items);
      })
      .catch(e => { if (e.name !== 'AbortError') console.error('useInfiniteDramas:', e); })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [lang]);

  // ReelShort returns everything in one response — no real pagination
  return { dramas, loading, loadingMore: false, hasMore: false, loadMore: () => {} };
};

// ── Trending (Rank page) ──────────────────────────────────────────────────────
export const useRankDramas = () => {
  const [dramas, setDramas] = useState<Drama[]>([]);
  const [loading, setLoading] = useState(true);
  const { lang } = useLanguage();

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);

    fetch(`/api/trending?lang=${lang}`, { signal: controller.signal })
      .then(r => r.json())
      .then((data: ReelShortApiResponse) => {
        if (data.ok && data.items) setDramas(data.items);
      })
      .catch(e => { if (e.name !== 'AbortError') console.error('useRankDramas:', e); })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [lang]);

  return { dramas, loading };
};

// ── Search ────────────────────────────────────────────────────────────────────
export const useSearchDramas = (query: string) => {
  const [dramas, setDramas] = useState<Drama[]>([]);
  const [loading, setLoading] = useState(false);
  const { lang } = useLanguage();

  useEffect(() => {
    if (!query.trim()) {
      setDramas([]);
      return;
    }

    const controller = new AbortController();

    // Debounce: wait 400 ms before firing the request
    const timer = setTimeout(() => {
      setLoading(true);
      fetch(`/search?lang=${lang}&keyword=${encodeURIComponent(query)}`, { signal: controller.signal })
        .then(r => r.json())
        .then((data: ReelShortApiResponse) => {
          if (data.ok && data.items) setDramas(data.items);
          else setDramas([]);
        })
        .catch(e => { if (e.name !== 'AbortError') console.error('useSearchDramas:', e); })
        .finally(() => setLoading(false));
    }, 400);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, lang]);

  return { dramas, loading };
};
