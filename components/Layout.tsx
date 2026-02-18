
import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { Home, BookOpen, Sparkles, User as UserIcon, Flame, Globe, Wifi, WifiOff, Star, Trophy } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { getSessionId } from '../services/authService';
import { useTranslation } from '../contexts/LanguageContext';
import { Language } from '../data/translations';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const userId = getSessionId();
  const user = useLiveQuery(() => userId ? db.users.get(userId) : undefined, [userId]);
  const location = useLocation();
  const { t, language } = useTranslation();
  
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

  const isActive = (path: string) => location.pathname === path;

  // Header Styles
  const isDarkMode = user?.darkMode;
  const bgColor = isDarkMode ? 'bg-gray-900' : 'bg-[#F0F2F5]'; 
  const textColor = isDarkMode ? 'text-gray-100' : 'text-gray-900';

  return (
    <div className={`flex flex-col h-screen ${bgColor} ${textColor} w-full overflow-hidden relative transition-colors duration-300 font-sans`}>
      
      {/* Header - Responsive */}
      <header className={`px-4 py-3 md:px-8 z-20 flex justify-between items-center bg-white/80 backdrop-blur-md border-b border-gray-200/50`}>
        {/* Left: User/Brand */}
        <div className="flex items-center gap-4">
             {/* Desktop Brand */}
             <div className="hidden md:flex items-center gap-2 mr-6">
                 <div className="bg-blue-600 p-2 rounded-lg text-white">
                     <BookOpen size={24} />
                 </div>
                 <h1 className="text-xl font-black tracking-wide text-gray-800">Padho India</h1>
             </div>

            {/* User Profile */}
            <div className="flex items-center gap-3 md:border-l md:pl-6 md:border-gray-200">
                <div className="relative">
                    <div className="w-10 h-10 rounded-xl bg-green-400 flex items-center justify-center text-white font-bold text-lg shadow-sm">
                        {user?.name?.charAt(0) || 'G'}
                    </div>
                    {/* Level Badge Overlay */}
                    <div className="absolute -bottom-1 -right-1 bg-yellow-400 text-[8px] font-bold px-1.5 py-0.5 rounded-full border border-white">
                        LVL {user?.level || 1}
                    </div>
                </div>
                <div className="flex flex-col">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Lvl {user?.level || 1}</span>
                    <div className="flex items-center gap-1 text-sm font-bold text-gray-800">
                        {user?.xp || 0} XP
                    </div>
                </div>
            </div>
        </div>

        {/* Center: Desktop Nav */}
        <div className="hidden md:flex items-center bg-gray-100/50 p-1 rounded-xl">
             <Link to="/" className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${isActive('/') || isActive('/courses') ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                <Home size={16} /> {t('home')}
            </Link>
            <Link to="/profile" className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${isActive('/profile') ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                <Trophy size={16} /> Profile
            </Link>
            <Link to="/ai-tools" className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${isActive('/ai-tools') ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                <Sparkles size={16} /> AI Lab
            </Link>
        </div>

        {/* Right Side Brand/Status */}
        <div className="flex flex-col items-end">
             <div className="md:hidden">
                <h1 className="text-sm font-black tracking-wide text-gray-800">Padho India</h1>
             </div>
             <div className="flex items-center gap-1 mt-1">
                {isOnline ? (
                   <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full bg-green-50 text-green-600 border border-green-100 transition-all">
                       <Wifi size={12} strokeWidth={3} /> <span className="hidden sm:inline">ONLINE</span>
                   </span>
                ) : (
                   <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full bg-red-50 text-red-600 border border-red-100 animate-pulse transition-all">
                       <WifiOff size={12} strokeWidth={3} /> OFFLINE
                   </span>
                )}
             </div>
        </div>
      </header>

      {/* Main Content - Expanded Width */}
      <main className="flex-1 overflow-y-auto pb-28 md:pb-8 px-4 md:px-8 scroll-smooth no-scrollbar">
        <div className="max-w-7xl mx-auto w-full h-full pt-4 md:pt-6">
            {children}
        </div>
      </main>

      {/* Floating Bottom Nav - Mobile Only */}
      <div className="md:hidden absolute bottom-6 left-0 right-0 z-20 flex justify-center pointer-events-none">
          <nav className={`bg-white rounded-full shadow-2xl px-2 py-2 flex items-center gap-1 pointer-events-auto border border-gray-100`}>
            
            <Link to="/" className={`flex flex-col items-center px-6 py-2 rounded-full transition-all duration-300 ${isActive('/') || isActive('/courses') ? 'bg-green-500 text-white shadow-lg shadow-green-200' : 'text-gray-400 hover:text-gray-600'}`}>
                <Home size={20} strokeWidth={2.5} />
                {isActive('/') && <span className="text-[10px] font-bold mt-0.5">{t('home')}</span>}
            </Link>

            <Link to="/profile" className={`flex flex-col items-center px-6 py-2 rounded-full transition-all duration-300 ${isActive('/profile') ? 'bg-purple-500 text-white shadow-lg shadow-purple-200' : 'text-gray-400 hover:text-gray-600'}`}>
                 <Trophy size={20} strokeWidth={2.5} />
                 {isActive('/profile') && <span className="text-[10px] font-bold mt-0.5">Profile</span>}
            </Link>

            <Link to="/ai-tools" className={`flex flex-col items-center px-6 py-2 rounded-full transition-all duration-300 ${isActive('/ai-tools') ? 'bg-orange-500 text-white shadow-lg shadow-orange-200' : 'text-gray-400 hover:text-gray-600'}`}>
                <div className="relative">
                    <Sparkles size={20} strokeWidth={2.5} />
                </div>
                {isActive('/ai-tools') && <span className="text-[10px] font-bold mt-0.5">AI Lab</span>}
            </Link>

          </nav>
      </div>
    </div>
  );
};

export default Layout;
