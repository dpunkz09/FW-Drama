import { Play, Users, Flame } from 'lucide-react';
import { useDramas, useInfiniteDramas } from '../hooks/useDramas';
import { Link } from 'react-router-dom';
import { useEffect, useRef } from 'react';
import { formatCount } from '../utils/format';

const Home = () => {
  const { dramas: featuredDramas, loading: featuredLoading } = useDramas();
  const { dramas, loading } = useInfiniteDramas();

  // ── Stable scroll listener (registered once, reads latest callback via ref) ─
  const scrollHandlerRef = useRef<() => void>(() => {});

  // Nothing to load more (ReelShort returns everything in one response)
  // Keep the ref pattern for correctness if pagination is ever added back
  scrollHandlerRef.current = () => { /* no-op */ };

  useEffect(() => {
    const handler = () => scrollHandlerRef.current();
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []); // registers exactly once

  return (
    <div className="space-y-6 pt-2">
      {/* ── Featured hero (For You first item) ─────────────────────────── */}
      {featuredLoading ? (
        <div className="aspect-[16/9] rounded-xl bg-zinc-900 animate-pulse" />
      ) : featuredDramas[0] ? (
        <Link to={`/watch/${featuredDramas[0].book_id}`} className="block">
          <div className="relative aspect-[16/9] rounded-xl overflow-hidden">
            <img
              src={featuredDramas[0].pic}
              alt={featuredDramas[0].title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
            <div className="absolute bottom-4 left-4 right-4">
              <div className="inline-block bg-red-500 text-white text-xs font-semibold px-2 py-1 rounded mb-2">
                For You
              </div>
              <h1 className="text-xl font-bold mb-2 line-clamp-2">{featuredDramas[0].title}</h1>
              {featuredDramas[0].theme?.length > 0 && (
                <p className="text-sm text-zinc-300 mb-3">{featuredDramas[0].theme.slice(0, 2).join(' • ')}</p>
              )}
              <div className="btn-primary inline-flex items-center gap-2">
                <Play size={16} />
                Watch Now
              </div>
            </div>
          </div>
        </Link>
      ) : null}

      {/* ── For You grid ─────────────────────────────────────────────────── */}
      {featuredDramas.length > 1 && (
        <div>
          <h2 className="text-lg font-semibold mb-4">For You</h2>
          <div className="grid grid-cols-3 gap-3">
            {featuredDramas.slice(1, 7).map((drama, index) => (
              <Link key={`foryou-${drama.book_id}-${index}`} to={`/watch/${drama.book_id}`} className="group">
                <div className="relative aspect-[3/4] rounded-lg overflow-hidden mb-2">
                  <img
                    src={drama.pic}
                    alt={drama.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                  />
                  {drama.theme?.[0] && (
                    <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-sm text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow-lg">
                      {drama.theme[0]}
                    </div>
                  )}
                  {drama.collect_count > 10_000 && (
                    <div className="absolute bottom-2 left-2 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow-lg flex items-center gap-1">
                      <Flame size={10} />
                      {formatCount(drama.collect_count)}
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Play size={20} className="text-white" />
                  </div>
                </div>
                <h3 className="text-sm font-medium line-clamp-2 mb-1">{drama.title}</h3>
                <div className="flex items-center gap-1 text-xs text-muted">
                  <Users size={12} />
                  <span>{formatCount(drama.collect_count)} views</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ── Latest Dramas ─────────────────────────────────────────────────── */}
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
                    <img
                      src={drama.pic}
                      alt={drama.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                    {drama.theme?.[0] && (
                      <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-sm text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow-lg">
                        {drama.theme[0]}
                      </div>
                    )}
                    {drama.collect_count > 10_000 && (
                      <div className="absolute bottom-2 left-2 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow-lg flex items-center gap-1">
                        <Flame size={10} />
                        {formatCount(drama.collect_count)}
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Play size={20} className="text-white" />
                    </div>
                  </div>
                  <h3 className="text-sm font-medium line-clamp-2 mb-1">{drama.title}</h3>
                  <div className="flex items-center gap-1 text-xs text-muted">
                    <Users size={12} />
                    <span>{formatCount(drama.collect_count)} views</span>
                  </div>
                </Link>
              ))}
            </div>

            {!loading && dramas.length > 0 && (
              <div className="text-center py-6 text-sm text-muted">
                All dramas loaded ({dramas.length} total)
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Home;
