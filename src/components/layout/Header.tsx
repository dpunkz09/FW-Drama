import { Search } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { useLanguage, languages } from '../../store/language';

export default function Header() {
  const location = useLocation();
  const isSearchPage = location.pathname === '/search';
  const { lang, setLang } = useLanguage();
  const [showLangMenu, setShowLangMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close the dropdown when clicking outside
  useEffect(() => {
    if (!showLangMenu) return;

    const handleOutsideClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowLangMenu(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [showLangMenu]);

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-zinc-950/95 backdrop-blur-md border-b border-zinc-800 z-50">
      <div className="flex items-center justify-between h-full px-4 max-w-md mx-auto">
        <Link to="/" className="flex items-center">
          <img
            src="/logo.png"
            alt="FlixWorld"
            className="h-8 w-auto object-contain"
          />
        </Link>

        <div className="flex items-center gap-3">
          {/* Language Selector */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setShowLangMenu(v => !v)}
              className="p-2 hover:bg-zinc-800 rounded-lg transition-colors text-sm"
            >
              {languages.find(l => l.code === lang)?.flag ?? '🌐'}
            </button>

            {showLangMenu && (
              <div className="absolute top-full right-0 mt-2 bg-zinc-900 border border-zinc-700 rounded-xl w-48 max-h-80 overflow-y-auto z-50 shadow-xl">
                {languages.map(language => (
                  <button
                    key={language.code}
                    onClick={() => { setLang(language.code); setShowLangMenu(false); }}
                    className={`w-full text-left px-3 py-2 hover:bg-zinc-800 transition-colors flex items-center gap-2 text-sm
                      ${lang === language.code ? 'bg-zinc-800 text-red-400' : 'text-white'}`}
                  >
                    <span>{language.flag}</span>
                    <span>{language.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {!isSearchPage && (
            <Link to="/search" className="p-2 hover:bg-zinc-800 rounded-lg transition-colors">
              <Search size={20} className="text-zinc-400" />
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
