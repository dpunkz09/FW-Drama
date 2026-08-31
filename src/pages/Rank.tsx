import { TrendingUp, Flame, Clock, Users } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../store/language';
import { formatCount } from '../utils/format';
import type { Drama, ReelShortApiResponse } from '../types';

interface Tab {
  id: string;
  label: string;
  icon: React.ReactNode;
  endpoint: string;
}

const TABS: Tab[] = [
  { id: 'latest',   label: 'Latest',   icon: <Clock size={14} />,      endpoint: '/api/latest'   },
  { id: 'trending', label: 'Trending', icon: <TrendingUp size={14} />, endpoint: '/api/trending' },
];

const BADGE: Record<number, string> = {
  0: 'bg-yellow-500',
  1: 'bg-zinc-400',
  2: 'bg-amber-600',
};

const Rank = () => {
  const [activeTab, setActiveTab] = useState('trending');
  const [dramas, setDramas]       = useState<Drama[]>([]);
  const [loading, setLoading]     = useState(true);
  const { lang } = useLanguage();

  useEffect(() => {
    const tab = TABS.find(t => t.id === activeTab)!;
    const controller = new AbortController();
    setLoading(true);
    setDramas([]);

    fetch(`${tab.endpoint}?lang=${lang}`, { signal: controller.signal })
      .then(r => r.json())
      .then((data: ReelShortApiResponse) => {
        if (data.ok && data.items) setDramas(data.items);
      })
      .catch(e => { if (e.name !== 'AbortError') console.error('Rank fetch:', e); })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [activeTab, lang]);

  return (
    <div className="space-y-5 pt-2">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Flame size={22} className="text-red-500" />
        <h1 className="text-xl font-bold">Rankings</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-all
              ${activeTab === tab.id
                ? 'bg-red-500 text-white shadow-lg shadow-red-500/30'
                : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'}`}
          >
            {tab.icon}{tab.label}
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin w-6 h-6 border-2 border-red-500 border-t-transparent rounded-full" />
        </div>
      )}

      {/* List */}
      {!loading && dramas.length > 0 && (
        <div className="space-y-3">
          {dramas.map((drama, index) => (
            <Link key={drama.book_id} to={`/watch/${drama.book_id}`} className="block group">
              <div className="flex gap-3 p-3 rounded-xl bg-zinc-900/50 hover:bg-zinc-800/80 transition-colors">
                {/* Rank badge */}
                <div className="flex flex-col items-center justify-center w-7 shrink-0">
                  {index < 3 ? (
                    <span className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-black ${BADGE[index]}`}>
                      {index + 1}
                    </span>
                  ) : (
                    <span className="text-zinc-500 text-sm font-bold">{index + 1}</span>
                  )}
                </div>

                {/* Cover */}
                <div className="relative w-14 h-20 rounded-lg overflow-hidden shrink-0 bg-zinc-800">
                  <img
                    src={drama.pic}
                    alt={drama.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                  />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0 flex flex-col justify-center gap-1.5">
                  <h3 className="font-semibold text-sm leading-snug line-clamp-2 group-hover:text-red-400 transition-colors">
                    {drama.title}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-zinc-400">
                    {drama.collect_count > 0 && (
                      <>
                        <div className="flex items-center gap-1">
                          <Users size={11} />
                          <span>{formatCount(drama.collect_count)}</span>
                        </div>
                        <span className="text-zinc-700">·</span>
                      </>
                    )}
                    <span>{drama.chapter_count} ep</span>
                  </div>
                  {drama.theme?.length > 0 && (
                    <div className="flex gap-1 flex-wrap">
                      {drama.theme.slice(0, 2).map((tag, i) => (
                        <span key={i} className="text-[10px] bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-full">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Empty */}
      {!loading && dramas.length === 0 && (
        <div className="text-center py-16 text-zinc-500">
          <TrendingUp size={40} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">No dramas available</p>
        </div>
      )}
    </div>
  );
};

export default Rank;
