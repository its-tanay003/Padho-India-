
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { User, Language } from '../types';

interface NavbarProps {
  user: User;
  language: Language;
  setLanguage: (lang: Language) => void;
  isOffline: boolean;
  isLiteMode: boolean;
  setIsLiteMode: (mode: boolean) => void;
}

const Navbar: React.FC<NavbarProps> = ({ 
  user, 
  language, 
  isOffline, 
  isLiteMode,
  setIsLiteMode 
}) => {
  const location = useLocation();
  const isHome = location.pathname === '/';

  const translations = {
    en: { home: 'Home', quiz: 'Quiz', ai: 'AI Lab', offline: 'Offline', lite: 'Lite' },
    hi: { home: 'घर', quiz: 'क्विज़', ai: 'मित्रा AI', offline: 'ऑफलाइन', lite: 'लाइट' },
    ta: { home: 'முகப்பு', quiz: 'வினாடி வினா', ai: 'AI கூடம்', offline: 'ஆஃப்லைன்', lite: 'லைட்' }
  };

  const t = translations[language];

  return (
    <>
      {/* TOP HEADER */}
      <header className="fixed top-0 left-0 right-0 z-[60] p-4 pointer-events-none">
        <div className="container mx-auto flex items-center justify-between pointer-events-auto">
          
          {/* Top Left: Profile Card - Only on Home Page */}
          <div className="flex items-center gap-2 min-h-[50px]">
            {isHome ? (
              <Link 
                to="/profile" 
                className="flex items-center gap-2 bg-white px-3 py-2 rounded-2xl clay-button group animate-in slide-in-from-left-4"
              >
                <div className="w-8 h-8 rounded-xl bg-teal-500 flex items-center justify-center text-white font-black text-xs shadow-inner group-hover:rotate-12 transition-transform">
                  {user.name.charAt(0)}
                </div>
                <div className="flex flex-col leading-none">
                  <span className="text-[9px] uppercase font-black text-teal-600 tracking-tighter">Lvl {user.level}</span>
                  <span className="text-xs font-black text-slate-800">{user.xp} XP</span>
                </div>
              </Link>
            ) : (
              /* Branding placeholder when profile is hidden */
              <Link to="/" className="flex items-center gap-2 group animate-in fade-in">
                 <div className="w-9 h-9 bg-orange-500 rounded-xl flex items-center justify-center text-white text-lg clay-button active:scale-95 transition-all">🚀</div>
              </Link>
            )}
          </div>

          {/* Top Right: Status */}
          <div className="flex items-center gap-3">
              <div className="hidden md:flex items-center gap-2 mr-4 bg-white/50 backdrop-blur-sm px-3 py-1.5 rounded-2xl border border-white">
                 <span className="font-kids text-lg font-black text-slate-700 tracking-tight">Padho India</span>
              </div>

              {isOffline && (
                <div className="flex items-center gap-1 bg-red-500 text-white px-3 py-1.5 rounded-xl clay-button animate-pulse">
                  <span className="text-sm">📴</span>
                  <span className="text-[10px] font-black uppercase hidden sm:inline">{t.offline}</span>
                </div>
              )}
              {isLiteMode && (
                <button 
                  onClick={() => setIsLiteMode(!isLiteMode)}
                  className="flex items-center gap-1 bg-indigo-500 text-white px-3 py-1.5 rounded-xl clay-button"
                >
                  <span className="text-sm">⚡</span>
                  <span className="text-[10px] font-black uppercase hidden sm:inline">{t.lite}</span>
                </button>
              )}
          </div>
        </div>
      </header>

      {/* BOTTOM NAVIGATION: Claymorphic Dock */}
      <nav className="fixed bottom-0 left-0 right-0 z-[60] p-6 pointer-events-none">
        <div className="container mx-auto flex justify-center pointer-events-auto">
          <div className="bg-white rounded-[3rem] clay-card p-2 w-full max-w-xs sm:max-w-sm flex items-center gap-2 border-none">
            <Link to="/" className={`flex-1 flex flex-col items-center py-2.5 rounded-[2.2rem] transition-all group ${location.pathname === '/' ? 'bg-teal-500 text-white shadow-inner scale-105' : 'text-slate-400 hover:bg-slate-50'}`}>
              <span className="text-2xl mb-0.5 group-hover:scale-110 transition-transform">🏠</span>
              <span className="text-[9px] font-black uppercase tracking-widest">{t.home}</span>
            </Link>
            
            <Link to="/quizzes" className={`flex-1 flex flex-col items-center py-2.5 rounded-[2.2rem] transition-all group ${location.pathname === '/quizzes' ? 'bg-indigo-500 text-white shadow-inner scale-105' : 'text-slate-400 hover:bg-slate-50'}`}>
              <span className="text-2xl mb-0.5 group-hover:scale-110 transition-transform">📝</span>
              <span className="text-[9px] font-black uppercase tracking-widest">{t.quiz}</span>
            </Link>
            
            <Link to="/ai-lab" className={`flex-1 flex flex-col items-center py-2.5 rounded-[2.2rem] transition-all group ${location.pathname === '/ai-lab' ? 'bg-orange-500 text-white shadow-inner scale-105' : 'text-slate-400 hover:bg-slate-50'}`}>
              <span className="text-2xl mb-0.5 group-hover:scale-110 transition-transform">🤖</span>
              <span className="text-[9px] font-black uppercase tracking-widest">{t.ai}</span>
            </Link>
          </div>
        </div>
      </nav>
    </>
  );
};

export default Navbar;
