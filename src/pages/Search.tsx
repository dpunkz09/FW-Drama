import { useState, useEffect } from 'react';
import { Search as SearchIcon, X, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useSearchDramas, useRankDramas } from '../hooks/useDramas';
import { formatCount } from '../utils/format';

const Search = () => {
  const [query, setQuery] = useState('');
  const { dramas: results, loading } = useSearchDramas(query);
  const { dramas: trendingDramas } = useRankDramas();

  return (
    <div className="space-y-4 pt-2">
      {/* Search Input */}
      <div className="relative">
        <SearchIcon size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search dramas..."
          className="w-full pl-10 pr-10 py-3 bg-zinc-900 border border-zinc-800 rounded-lg text-white text-sm placeholder-zinc-400 focus:outline-none focus:border-red-500 transition-colors"
          autoFocus
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin w-6 h-6 border-2 border-red-500 border-t-transparent rounded-full" />
        </div>
      )}

      {/* Results */}
      {!loading && results.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold mb-3 text-zinc-300">
            {results.length} results for "{query}"
          </h2>
          <div className="grid grid-cols-3 gap-3">
            {results.map(drama => (
              <Link key={drama.book_id} to={`/watch/${drama.book_id}`} className="group">
                <div className="relative aspect-[3/4] rounded-lg overflow-hidden mb-2 bg-zinc-900">
                  <img
                    src={drama.pic}
                    alt={drama.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                  />
                  {drama.theme?.[0] && (
                    <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-sm text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                      {drama.theme[0]}
                    </div>
                  )}
                </div>
                <h3 className="text-xs font-medium line-clamp-2 mb-1 leading-tight">{drama.title}</h3>
                {drama.chapter_count > 0 && (
                  <p className="text-xs text-muted">{drama.chapter_count} episodes</p>
                )}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* No results */}
      {!loading && query && results.length === 0 && (
        <div className="text-center py-16 text-muted">
          <SearchIcon size={40} className="mx-auto mb-3 opacity-50" />
          <p className="text-sm">No results for "{query}"</p>
          <p className="text-xs mt-1">Try different keywords</p>
        </div>
      )}

      {/* Trending (empty state) */}
      {!query && trendingDramas.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp size={16} className="text-red-500" />
            <h2 className="text-sm font-semibold text-zinc-300">Trending Now</h2>
          </div>
          <div className="space-y-3">
            {trendingDramas.slice(0, 10).map((drama, index) => (
              <Link
                key={drama.book_id}
                to={`/watch/${drama.book_id}`}
                className="card p-3 flex gap-3 hover:bg-zinc-800 transition-colors group"
              >
                <div className="relative shrink-0">
                  <img
                    src={drama.pic}
                    alt={drama.title}
                    className="w-16 h-20 object-cover rounded-lg group-hover:scale-105 transition-transform"
                  />
                  <div className="absolute -top-1 -left-1 w-6 h-6 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg">
                    {index + 1}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm mb-1 line-clamp-2 group-hover:text-red-500 transition-colors">
                    {drama.title}
                  </h3>
                  {drama.theme && drama.theme.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {drama.theme.slice(0, 2).map((tag, idx) => (
                        <span key={idx} className="text-[10px] bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-xs text-muted">
                    {drama.collect_count > 0 && (
                      <><span>{formatCount(drama.collect_count)} views</span><span>·</span></>
                    )}
                    {drama.chapter_count > 0 && (
                      <span>{drama.chapter_count} episodes</span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {!query && trendingDramas.length === 0 && !loading && (
        <div className="text-center py-16 text-muted">
          <SearchIcon size={40} className="mx-auto mb-3 opacity-50" />
          <h3 className="font-semibold mb-1">Search Dramas</h3>
          <p className="text-sm">Type to search your favorite dramas</p>
        </div>
      )}
    </div>
  );
};

export default Search;
