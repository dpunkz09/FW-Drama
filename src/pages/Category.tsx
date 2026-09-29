import { Grid, Tag } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import { formatCount } from '../utils/format';
import type { Drama, SeriesListItem, seriesToDrama } from '../types';
import { seriesToDrama as transformSeries } from '../types';

// Shortical categories are extracted from all series data
const Category = () => {
  const [allDramas, setAllDramas]         = useState<Drama[]>([]);
  const [categories, setCategories]       = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [loading, setLoading]             = useState(true);

  // Fetch all series once → derive category list + drama list
  useEffect(() => {
    setLoading(true);
    setAllDramas([]);
    setCategories([]);
    setSelectedCategory(null);

    api.get<SeriesListItem[]>('/api/v1/series?pageSize=100')
      .then(response => {
        const transformed = response.data.map(transformSeries);
        setAllDramas(transformed);

        // Extract unique categories from all dramas
        const categorySet = new Set<string>();
        response.data.forEach(item => {
          if (item.series.categories) {
            item.series.categories.forEach(cat => categorySet.add(cat));
          }
        });
        
        const categoryList = Array.from(categorySet).sort();
        setCategories(categoryList);
        if (categoryList.length > 0) setSelectedCategory(categoryList[0]);
      })
      .catch(e => console.error('Category fetch:', e))
      .finally(() => setLoading(false));
  }, []);

  // Client-side filter by selected category
  const filtered = selectedCategory
    ? allDramas.filter(d => d.theme?.includes(selectedCategory))
    : allDramas;

  return (
    <div className="space-y-6 pt-2">
      <div className="flex items-center gap-2">
        <Grid size={20} className="text-red-500" />
        <h1 className="text-xl font-bold">Categories</h1>
      </div>

      {/* Category tabs */}
      {categories.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all
                ${selectedCategory === category
                  ? 'bg-red-500 text-white shadow-md shadow-red-500/30'
                  : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'}`}
            >
              <Tag size={11} />
              {category}
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
      {!loading && filtered.length === 0 && categories.length > 0 && (
        <div className="text-center py-12 text-zinc-500">
          <p className="text-sm">No dramas in this category</p>
        </div>
      )}
    </div>
  );
};

export default Category;
