import { Grid, Tag } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../store/language';
import { formatCount } from '../utils/format';
import type { Drama, ReelShortApiResponse } from '../types';

// ReelShort doesn't have a dedicated /categories endpoint.
// We derive themes from the /api/foryou feed and use them as filter labels.
// Clicking a theme filters the already-loaded dramas client-side (no extra request).

const Category = () => {
  const [allDramas, setAllDramas]         = useState<Drama[]>([]);
  const [themes, setThemes]               = useState<string[]>([]);
  const [selectedTheme, setSelectedTheme] = useState<string | null>(null);
  const [loading, setLoading]             = useState(true);
  const { lang } = useLanguage();

  // Fetch For-You feed once → derive theme list + drama list
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setAllDramas([]);
    setThemes([]);
    setSelectedTheme(null);

    fetch(`/api/foryou?lang=${lang}`, { signal: controller.signal })
      .then(r => r.json())
      .then((data: ReelShortApiResponse) => {
        if (!data.ok || !data.items) return;

        setAllDramas(data.items);

        // Extract unique themes, preserve insertion order
        const seen = new Set<string>();
        data.items.forEach(d => d.theme?.forEach(t => seen.add(t)));
        const themeList = Array.from(seen).slice(0, 10);
        setThemes(themeList);
        if (themeList.length > 0) setSelectedTheme(themeList[0]);
      })
      .catch(e => { if (e.name !== 'AbortError') console.error('Category fetch:', e); })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [lang]);

  // Client-side filter — no extra request needed
  const filtered = selectedTheme
    ? allDramas.filter(d => d.theme?.includes(selectedTheme))
    : allDramas;

  return (
    <div className="space-y-6 pt-2">
      <div className="flex items-center gap-2">
        <Grid size={20} className="text-red-500" />
        <h1 className="text-xl font-bold">Category</h1>
      </div>

      {/* Theme tabs */}
      {themes.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {themes.map(theme => (
            <button
              key={theme}
              onClick={() => setSelectedTheme(theme)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all
                ${selectedTheme === theme
                  ? 'bg-red-500 text-white shadow-md shadow-red-500/30'
                  : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'}`}
            >
              <Tag size={11} />
              {theme}
            </button>
          ))}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin w-6 h-6 border-2 border-red-500 border-t-transparent rounded-full" />
        </div>
      )}

      {/* Drama grid */}
      {!loading && filtered.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {filtered.map(drama => (
            <Link key={drama.book_id} to={`/watch/${drama.book_id}`} className="group">
              <div className="relative aspect-[3/4] rounded-lg overflow-hidden mb-2 bg-zinc-900">
                <img
                  src={drama.pic}
                  alt={drama.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="text-white text-xs font-bold">▶ Watch</span>
                </div>
              </div>
              <h3 className="text-sm font-medium line-clamp-2 mb-1">{drama.title}</h3>
              {drama.collect_count > 0 && (
                <p className="text-xs text-muted">{formatCount(drama.collect_count)} views</p>
              )}
            </Link>
          ))}
        </div>
      )}

      {/* Empty */}
      {!loading && filtered.length === 0 && themes.length > 0 && (
        <div className="text-center py-12 text-zinc-500">
          <p className="text-sm">No dramas in this category</p>
        </div>
      )}
    </div>
  );
};

export default Category;
