import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { Home, BookOpen, Sparkles, User as UserIcon, Flame, Globe, Wifi, WifiOff } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { getSessionId } from '../services/authService';
import { useTranslation } from '../contexts/LanguageContext';
import { Language } from '../data/translations';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const userId = getSessionId();
  const user = useLiveQuery(() => userId ? db.users.get(userId) : undefined, [userId]);
  const location = useLocation();
  const { t, language, setLanguage } = useTranslation();
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

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

  // Dark Mode Styles
  const isDarkMode = user?.darkMode;
  const bgColor = isDarkMode ? 'bg-gray-900' : 'bg-gray-50';
  const textColor = isDarkMode ? 'text-gray-100' : 'text-gray-900';
  const headerColor = isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-blue-600';
  const navColor = isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200';

  return (
    <div className={`flex flex-col h-screen ${bgColor} ${textColor} w-full overflow-hidden relative transition-colors duration-300`}>
      {/* Header */}
      <header className={`${headerColor} text-white p-4 shadow-md z-10 transition-colors duration-300`}>
        <div className="max-w-6xl mx-auto w-full flex justify-between items-center">
            <div>
            <h1 className="text-xl font-bold">{t('app_name')}</h1>
            <p className="text-xs opacity-80">{t('tagline')}</p>
            </div>
            <div className="flex flex-col items-end gap-1">
            
            <div className="flex items-center gap-2">
                <span className="font-bold text-lg truncate max-w-[100px] sm:max-w-none">{user?.name || t('guest')}</span>
                
                {/* Network Status Indicator */}
                <div 
                  className={`flex items-center justify-center p-1 rounded-md transition-colors ${
                    isOnline 
                      ? 'bg-white/10 text-green-300' 
                      : 'bg-red-500 text-white shadow-sm'
                  }`}
                  title={isOnline ? "Online" : "Offline Mode"}
                >
                    {isOnline ? (
                       <Wifi size={14} />
                    ) : (
                       <div className="flex items-center gap-1 px-1">
                          <WifiOff size={12} />
                          <span className="text-[10px] font-bold uppercase tracking-wider hidden sm:inline">Offline</span>
                       </div>
                    )}
                </div>

                {/* Language Switcher */}
                <button 
                onClick={handleLanguageToggle}
                className={`${isDarkMode ? 'bg-gray-700 hover:bg-gray-600 border-gray-600' : 'bg-blue-700 hover:bg-blue-800 border-blue-500'} text-xs font-bold px-2 py-1 rounded flex items-center gap-1 transition-colors border`}
                >
                <Globe size={10} />
                {getLangLabel(language)}
                </button>
            </div>

            <div className={`flex items-center space-x-2 text-xs ${isDarkMode ? 'bg-gray-700' : 'bg-blue-700'} px-2 py-1 rounded-full transition-colors duration-300`}>
                <span className="font-mono text-yellow-300 flex items-center">
                <Flame size={12} className="mr-1 fill-yellow-300" /> {user?.streak || 0}
                </span>
                <span className={`w-px h-3 ${isDarkMode ? 'bg-gray-600' : 'bg-blue-500'}`}></span>
                <span className="font-mono text-white">{t('xp')} {user?.xp || 0}</span>
                <span className={`w-px h-3 ${isDarkMode ? 'bg-gray-600' : 'bg-blue-500'}`}></span>
                <span>{t('level')} {user?.level || 1}</span>
            </div>
            </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-20 p-4 scroll-smooth">
        <div className="max-w-6xl mx-auto w-full h-full">
            {children}
        </div>
      </main>

      {/* Bottom Nav */}
      <nav className={`absolute bottom-0 w-full ${navColor} py-2 px-6 z-20 transition-colors duration-300`}>
        <div className="max-w-md mx-auto w-full flex justify-between items-center">
            <Link to="/" className={`flex flex-col items-center ${isActive('/')}`}>
            <Home size={24} />
            <span className="text-[10px] mt-1 font-medium">{t('home')}</span>
            </Link>
            <Link to="/courses" className={`flex flex-col items-center ${isActive('/courses')}`}>
            <BookOpen size={24} />
            <span className="text-[10px] mt-1 font-medium">{t('learn')}</span>
            </Link>
            <Link to="/ai-tools" className={`flex flex-col items-center ${isActive('/ai-tools')}`}>
            <div className={`${isDarkMode ? 'bg-gray-700 border-gray-800' : 'bg-blue-50 border-white'} p-2 rounded-full -mt-6 border-4 shadow-sm transition-colors duration-300`}>
                <Sparkles size={28} className="text-blue-600" />
            </div>
            <span className="text-[10px] mt-1 font-medium text-blue-600">{t('ai_guru')}</span>
            </Link>
            <Link to="/profile" className={`flex flex-col items-center ${isActive('/profile')}`}>
                <UserIcon size={24} />
                <span className="text-[10px] mt-1 font-medium">{t('profile')}</span>
            </Link>
        </div>
      </nav>
    </div>
  );
};

export default Layout;