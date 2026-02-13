import React from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { Home, BookOpen, Sparkles, User as UserIcon, Flame, Globe } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { getSessionId } from '../services/authService';
import { useTranslation } from '../contexts/LanguageContext';
import { Language } from '../data/translations';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const userId = getSessionId();
  const user = useLiveQuery(() => userId ? db.users.get(userId) : undefined, [userId]);
  const location = useLocation();
  const { t, language, setLanguage } = useTranslation();

  const isActive = (path: string) => location.pathname === path ? "text-blue-600" : "text-gray-400";

  const handleLanguageToggle = () => {
    const nextLang: Record<Language, Language> = {
      'en': 'hi',
      'hi': 'hg',
      'hg': 'en'
    };
    setLanguage(nextLang[language]);
  };

  const getLangLabel = (lang: Language) => {
    switch(lang) {
      case 'en': return 'ENG';
      case 'hi': return 'हिंदी';
      case 'hg': return 'HIN-G';
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50 max-w-md mx-auto shadow-2xl overflow-hidden relative">
      {/* Header */}
      <header className="bg-blue-600 text-white p-4 flex justify-between items-center shadow-md z-10">
        <div>
          <h1 className="text-xl font-bold">{t('app_name')}</h1>
          <p className="text-xs text-blue-100 opacity-80">{t('tagline')}</p>
        </div>
        <div className="flex flex-col items-end gap-1">
          
          <div className="flex items-center gap-2">
            <span className="font-bold text-lg">{user?.name || t('guest')}</span>
            
            {/* Language Switcher */}
            <button 
              onClick={handleLanguageToggle}
              className="bg-blue-700 hover:bg-blue-800 text-xs font-bold px-2 py-1 rounded flex items-center gap-1 transition-colors border border-blue-500"
            >
              <Globe size={10} />
              {getLangLabel(language)}
            </button>
          </div>

          <div className="flex items-center space-x-2 text-xs bg-blue-700 px-2 py-1 rounded-full">
            <span className="font-mono text-yellow-300 flex items-center">
              <Flame size={12} className="mr-1 fill-yellow-300" /> {user?.streak || 0}
            </span>
            <span className="w-px h-3 bg-blue-500"></span>
            <span className="font-mono text-white">{t('xp')} {user?.xp || 0}</span>
            <span className="w-px h-3 bg-blue-500"></span>
            <span>{t('level')} {user?.level || 1}</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-20 p-4 scroll-smooth">
        {children}
      </main>

      {/* Bottom Nav */}
      <nav className="absolute bottom-0 w-full bg-white border-t border-gray-200 py-2 px-6 flex justify-between items-center z-20">
        <Link to="/" className={`flex flex-col items-center ${isActive('/')}`}>
          <Home size={24} />
          <span className="text-[10px] mt-1 font-medium">{t('home')}</span>
        </Link>
        <Link to="/courses" className={`flex flex-col items-center ${isActive('/courses')}`}>
          <BookOpen size={24} />
          <span className="text-[10px] mt-1 font-medium">{t('learn')}</span>
        </Link>
        <Link to="/ai-tools" className={`flex flex-col items-center ${isActive('/ai-tools')}`}>
          <div className="bg-blue-50 p-2 rounded-full -mt-6 border-4 border-white shadow-sm">
            <Sparkles size={28} className="text-blue-600" />
          </div>
          <span className="text-[10px] mt-1 font-medium text-blue-600">{t('ai_guru')}</span>
        </Link>
        <Link to="/profile" className={`flex flex-col items-center ${isActive('/profile')}`}>
            <UserIcon size={24} />
            <span className="text-[10px] mt-1 font-medium">{t('profile')}</span>
        </Link>
      </nav>
    </div>
  );
};

export default Layout;