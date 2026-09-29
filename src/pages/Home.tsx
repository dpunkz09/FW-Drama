import { Play, Users, Flame, ChevronRight } from 'lucide-react';
import { useDramas, useInfiniteDramas } from '../hooks/useDramas';
import { useContinueWatching } from '../hooks/useWatchProgress';
import { Link } from 'react-router-dom';
import { useEffect, useRef } from 'react';
import { formatCount } from '../utils/format';

const Home = () => {
  const { dramas: featuredDramas, loading: featuredLoading } = useDramas();
  const { dramas, loading, loadingMore, hasMore, loadMore } = useInfiniteDramas();
  const { items: continueItems, loading: continueLoading, refresh } = useContinueWatching();

  // Re-fetch when user navigates back to this tab
  useEffect(() => {
    const onVisible = () => { if (document.visibilityState === 'visible') refresh(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [refresh]);

  // Infinite scroll - load more when near bottom
  const scrollHandlerRef = useRef<() => void>(() => {});
  scrollHandlerRef.current = () => {
    if (loadingMore || !hasMore) return;
    
    const scrollPosition = window.innerHeight + window.scrollY;
    const threshold = document.documentElement.scrollHeight - 500; // 500px before bottom
    
    if (scrollPosition >= threshold) {
      loadMore();
    }
  };
  
  useEffect(() => {
    const fn = () => scrollHandlerRef.current();
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  // Only the most recently watched drama
  const latest = !continueLoading && continueItems.length > 0 ? continueItems[0] : null;
  const pct = latest && latest.total > 0 ? Math.round((latest.chapter / latest.total) * 100) : 0;

  return (
    <>
      {/* ── Page content ───────────────────────────────────────────────────── */}
      {/* Extra bottom padding so the floating banner never overlaps content   */}
      <div className={`space-y-6 pt-2 ${latest ? 'pb-28' : 'pb-4'}`}>

        {/* ── Featured hero ─────────────────────────────────────────────── */}
        {featuredLoading ? (
          <div className="aspect-[16/9] rounded-xl bg-zinc-900 animate-pulse" />
        ) : featuredDramas[0] ? (
          <Link to={`/watch/${featuredDramas[0].book_id}`} className="block">
            <div className="relative aspect-[16/9] rounded-xl overflow-hidden">
              <img src={featuredDramas[0].pic} alt={featuredDramas[0].title} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
              <div className="absolute bottom-4 left-4 right-4">
                <div className="inline-block bg-red-500 text-white text-xs font-semibold px-2 py-1 rounded mb-2">For You</div>
                <h1 className="text-xl font-bold mb-2 line-clamp-2">{featuredDramas[0].title}</h1>
                {featuredDramas[0].theme?.length > 0 && (
                  <p className="text-sm text-zinc-300 mb-3">{featuredDramas[0].theme.slice(0, 2).join(' • ')}</p>
                )}
                <div className="btn-primary inline-flex items-center gap-2">
                  <Play size={16} /> Watch Now
                </div>
              </div>
            </div>
          </Link>
        ) : null}

        {/* ── For You grid ──────────────────────────────────────────────── */}
        {featuredDramas.length > 1 && (
          <div>
            <h2 className="text-lg font-semibold mb-4">For You</h2>
            <div className="grid grid-cols-3 gap-3">
              {featuredDramas.slice(1, 7).map((drama, index) => (
                <Link key={`foryou-${drama.book_id}-${index}`} to={`/watch/${drama.book_id}`} className="group">
                  <div className="relative aspect-[3/4] rounded-lg overflow-hidden mb-2">
                    <img src={drama.pic} alt={drama.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200" />
                    {drama.theme?.[0] && (
                      <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-sm text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow-lg">
                        {drama.theme[0]}
                      </div>
                    )}
                    {drama.collect_count > 10_000 && (
                      <div className="absolute bottom-2 left-2 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow-lg flex items-center gap-1">
                        <Flame size={10} />{formatCount(drama.collect_count)}
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Play size={20} className="text-white" />
                    </div>
                  </div>
                  <h3 className="text-sm font-medium line-clamp-2 mb-1">{drama.title}</h3>
                  <div className="flex items-center gap-1 text-xs text-muted">
                    <Users size={12} /><span>{formatCount(drama.collect_count)} views</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* ── Latest Dramas ─────────────────────────────────────────────── */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Latest Dramas</h2>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin w-6 h-6 border-2 border-red-500 border-t-transparent rounded-full" />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-3">
                {dramas.map((drama, index) => (
                  <Link key={`${drama.book_id}-${index}`} to={`/watch/${drama.book_id}`} className="group">
                    <div className="relative aspect-[3/4] rounded-lg overflow-hidden mb-2">
                      <img src={drama.pic} alt={drama.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200" />
                      {drama.theme?.[0] && (
                        <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-sm text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow-lg">
                          {drama.theme[0]}
                        </div>
                      )}
                      {drama.collect_count > 10_000 && (
                        <div className="absolute bottom-2 left-2 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow-lg flex items-center gap-1">
                          <Flame size={10} />{formatCount(drama.collect_count)}
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Play size={20} className="text-white" />
                      </div>
                    </div>
                    <h3 className="text-sm font-medium line-clamp-2 mb-1">{drama.title}</h3>
                    <div className="flex items-center gap-1 text-xs text-muted">
                      <Users size={12} /><span>{formatCount(drama.collect_count)} views</span>
                    </div>
                  </Link>
                ))}
              </div>
              {loadingMore && (
                <div className="flex items-center justify-center py-6">
                  <div className="animate-spin w-6 h-6 border-2 border-red-500 border-t-transparent rounded-full" />
                </div>
              )}
              {!hasMore && dramas.length > 0 && (
                <div className="text-center py-6 text-sm text-muted">
                  All dramas loaded ({dramas.length} total)
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ── Continue Watching — floating banner above bottom nav ─────────── */}
      {latest && (
        <Link
          to={`/watch/${latest.book_id}?ep=${latest.chapter}`}
          className="fixed bottom-16 left-0 right-0 z-40 mx-3 mb-2 animate-slideUp"
        >
          <div className="relative flex items-center gap-3 bg-zinc-900/95 backdrop-blur-md border border-zinc-700/60 rounded-2xl px-3 py-2.5 shadow-2xl overflow-hidden">

            {/* Red glow accent */}
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500 rounded-l-2xl" />

            {/* Cover thumbnail */}
            <div className="relative shrink-0 w-12 h-16 rounded-lg overflow-hidden bg-zinc-800 ml-1">
              <img src={latest.pic} alt={latest.title} className="w-full h-full object-cover" />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-semibold text-red-400 uppercase tracking-wide mb-0.5">
                Continue Watching
              </p>
              <p className="text-sm font-semibold text-white line-clamp-1">{latest.title}</p>
              <p className="text-xs text-zinc-400 mt-0.5">
                EP {latest.chapter + 1} of {latest.total}
              </p>
              {/* Progress bar */}
              <div className="mt-1.5 h-1 bg-zinc-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-red-500 rounded-full transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>

            {/* Play button */}
            <div className="shrink-0 w-9 h-9 bg-red-500 rounded-full flex items-center justify-center shadow-lg shadow-red-500/30">
              <Play size={16} fill="white" className="text-white ml-0.5" />
            </div>

            {/* Chevron */}
            <ChevronRight size={16} className="text-zinc-500 shrink-0 -ml-1" />
          </div>

          {/* Full-width progress bar at the very bottom of the card */}
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-zinc-800 rounded-b-2xl overflow-hidden">
            <div className="h-full bg-red-500" style={{ width: `${pct}%` }} />
          </div>
        </Link>
      )}
    </>
  );
};

export default Home;
