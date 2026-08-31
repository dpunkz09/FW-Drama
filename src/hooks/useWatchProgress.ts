import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { getDeviceId } from '../store/deviceId';
import type { WatchProgressRow } from '../types/supabase';

// ─── Upsert progress ──────────────────────────────────────────────────────────
export function useSaveProgress() {
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  const save = useCallback((params: {
    book_id: string;
    title: string;
    pic: string;
    chapter: number;
    total: number;
  }) => {
    // Debounce: wait 1.5s after last call to avoid flooding DB on rapid swipes
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      const device_id = getDeviceId();

      const { data, error } = await supabase
        .from('watch_progress')
        .upsert(
          {
            device_id,
            book_id:    params.book_id,
            title:      params.title,
            pic:        params.pic,
            chapter:    params.chapter,
            total:      params.total,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'device_id,book_id' }
        )
        .select('id')
        .single();

      if (error) {
        console.error('[watch_progress] upsert failed:', error.code, error.message);
      } else {
        console.debug('[watch_progress] saved:', data?.id, `EP${params.chapter + 1}/${params.total}`);
      }
    }, 1500);
  }, []);

  // Cancel pending write on unmount
  useEffect(() => () => clearTimeout(timerRef.current), []);

  return save;
}

// ─── Fetch continue watching ──────────────────────────────────────────────────
export function useContinueWatching() {
  const [items, setItems]     = useState<WatchProgressRow[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    const device_id = getDeviceId();
    setLoading(true);

    supabase
      .from('watch_progress')
      .select('*')
      .eq('device_id', device_id)
      .order('updated_at', { ascending: false })
      .limit(8)
      .then(({ data, error }) => {
        if (error) {
          console.error('[watch_progress] fetch failed:', error.code, error.message);
        } else {
          setItems((data as WatchProgressRow[]) ?? []);
        }
        setLoading(false);
      });
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  return { items, loading, refresh };
}
