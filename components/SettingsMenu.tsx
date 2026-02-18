
import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, updateUser } from '../db';
import { getSessionId } from '../services/authService';
import { useTranslation } from '../contexts/LanguageContext';
import { Language } from '../data/translations';
import { 
  ChevronLeft, Moon, Sun, Globe, Bell, BellOff, 
  LogOut, User as UserIcon, Check, Volume2
} from 'lucide-react';

interface Props {
  onBack: () => void;
  onLogout: () => void;
}

const SettingsMenu: React.FC<Props> = ({ onBack, onLogout }) => {
  const userId = getSessionId();
  const user = useLiveQuery(() => userId ? db.users.get(userId) : undefined, [userId]);
  const { setLanguage, language, t } = useTranslation();

  const [editName, setEditName] = useState('');
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceURI, setSelectedVoiceURI] = useState('');
  
  useEffect(() => {
    if (user) {
      setEditName(user.name);
    }
  }, [user]);

  useEffect(() => {
    const loadVoices = () => {
      const allVoices = window.speechSynthesis.getVoices();
      // Sort Female voices to top for better UX
      const sorted = allVoices.sort((a, b) => {
          const aFemale = /female|zira|samantha|google us english|google हिन्दी/i.test(a.name);
          const bFemale = /female|zira|samantha|google us english|google हिन्दी/i.test(b.name);
          if (aFemale && !bFemale) return -1;
          if (!aFemale && bFemale) return 1;
          return a.name.localeCompare(b.name);
      });
      setVoices(sorted);
    };
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;

    const saved = localStorage.getItem('padho_voice_uri');
    if (saved) setSelectedVoiceURI(saved);
  }, []);

  const toggleDarkMode = async () => {
    if (!user || !userId) return;
    await updateUser(userId, { darkMode: !user.darkMode });
  };

  const toggleDailyGyan = async () => {
    if (!user || !userId) return;
    // Default to true if undefined, so toggle logic handles the first switch correctly
    const currentVal = user.showDailyGyan !== false; 
    await updateUser(userId, { showDailyGyan: !currentVal });
  };

  const saveName = async () => {
    if (!user || !userId) return;
    if (editName.trim()) {
      await updateUser(userId, { name: editName });
    }
  };

  const handleLanguageChange = (lang: Language) => {
    setLanguage(lang);
  };

  const handleVoiceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const uri = e.target.value;
    setSelectedVoiceURI(uri);
    localStorage.setItem('padho_voice_uri', uri);

    // Play preview
    window.speechSynthesis.cancel();
    const v = voices.find(voice => voice.voiceURI === uri);
    if (v) {
        const u = new SpeechSynthesisUtterance("Namaste! I am your AI Tutor.");
        u.voice = v;
        window.speechSynthesis.speak(u);
    }
  };

  if (!user) return null;

  return (
    <div className="flex flex-col h-full bg-white animate-in slide-in-from-right duration-300">
      {/* Header */}
      <div className="flex items-center p-4 border-b border-gray-100">
        <button onClick={onBack} className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-full">
          <ChevronLeft size={24} />
        </button>
        <h2 className="text-xl font-bold ml-2">Settings</h2>
      </div>

      <div className="p-4 space-y-6 overflow-y-auto flex-1">
        
        {/* Appearance Section */}
        <div className="space-y-3">
           <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
             <Sun size={12} /> Appearance
           </h3>
           
           <div className="bg-gray-50 p-4 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                 <div className={`p-2 rounded-full ${user.darkMode ? 'bg-indigo-900 text-indigo-200' : 'bg-orange-100 text-orange-500'}`}>
                    {user.darkMode ? <Moon size={20} /> : <Sun size={20} />}
                 </div>
                 <div>
                    <p className="font-bold text-gray-800">Dark Mode</p>
                    <p className="text-xs text-gray-500">Easier on the eyes at night</p>
                 </div>
              </div>
              <button 
                onClick={toggleDarkMode}
                className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 ${user.darkMode ? 'bg-blue-600' : 'bg-gray-300'}`}
              >
                <div className={`bg-white w-4 h-4 rounded-full shadow-sm transform transition-transform duration-300 ${user.darkMode ? 'translate-x-6' : 'translate-x-0'}`} />
              </button>
           </div>
        </div>

        {/* Language Section */}
        <div className="space-y-3">
           <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
             <Globe size={12} /> Language
           </h3>
           <div className="grid grid-cols-3 gap-2">
              <button 
                onClick={() => handleLanguageChange('en')}
                className={`p-3 rounded-xl border-2 font-bold text-sm transition-all ${language === 'en' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-100 bg-gray-50 text-gray-600'}`}
              >
                English
              </button>
              <button 
                onClick={() => handleLanguageChange('hi')}
                className={`p-3 rounded-xl border-2 font-bold text-sm transition-all ${language === 'hi' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-100 bg-gray-50 text-gray-600'}`}
              >
                हिंदी
              </button>
              <button 
                onClick={() => handleLanguageChange('hg')}
                className={`p-3 rounded-xl border-2 font-bold text-sm transition-all ${language === 'hg' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-100 bg-gray-50 text-gray-600'}`}
              >
                Hinglish
              </button>
           </div>
        </div>

        {/* Audio Section */}
        <div className="space-y-3">
           <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
             <Volume2 size={12} /> Audio Settings
           </h3>
           
           <div className="bg-gray-50 p-4 rounded-xl">
               <label className="block text-xs font-bold text-gray-500 mb-2">AI Tutor Voice (Female Preferred)</label>
               <select 
                 value={selectedVoiceURI} 
                 onChange={handleVoiceChange}
                 className="w-full p-3 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
               >
                 <option value="">Default System Voice</option>
                 {voices.map(v => {
                   const isFemale = /female|zira|samantha|google us english|google हिन्दी/i.test(v.name);
                   return (
                    <option key={v.voiceURI} value={v.voiceURI}>
                        {v.name} {isFemale ? '(Recommended)' : ''} ({v.lang})
                    </option>
                   );
                 })}
               </select>
               <p className="text-[10px] text-gray-400 mt-2">
                 We prioritize female voices for a better tutoring experience.
               </p>
           </div>
        </div>

        {/* Preferences Section */}
        <div className="space-y-3">
           <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
             <Bell size={12} /> Preferences
           </h3>
           
           <div className="bg-gray-50 p-4 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                 <div className={`p-2 rounded-full ${user.showDailyGyan !== false ? 'bg-blue-100 text-blue-600' : 'bg-gray-200 text-gray-500'}`}>
                    {user.showDailyGyan !== false ? <Bell size={20} /> : <BellOff size={20} />}
                 </div>
                 <div>
                    <p className="font-bold text-gray-800">Daily Gyan</p>
                    <p className="text-xs text-gray-500">Show daily fact popup</p>
                 </div>
              </div>
              <button 
                onClick={toggleDailyGyan}
                className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 ${user.showDailyGyan !== false ? 'bg-blue-600' : 'bg-gray-300'}`}
              >
                <div className={`bg-white w-4 h-4 rounded-full shadow-sm transform transition-transform duration-300 ${user.showDailyGyan !== false ? 'translate-x-6' : 'translate-x-0'}`} />
              </button>
           </div>
        </div>

        {/* Account Section */}
        <div className="space-y-3">
           <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
             <UserIcon size={12} /> Account
           </h3>
           
           <div className="space-y-2">
             <label className="text-xs text-gray-500 font-semibold ml-1">Edit Name</label>
             <div className="flex gap-2">
               <input 
                  type="text" 
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="flex-1 border border-gray-200 rounded-xl px-4 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
               />
               <button 
                 onClick={saveName}
                 disabled={editName === user.name}
                 className="bg-blue-600 text-white p-2 rounded-xl disabled:bg-gray-300 disabled:cursor-not-allowed"
               >
                 <Check size={20} />
               </button>
             </div>
           </div>

           <button 
             onClick={onLogout}
             className="w-full mt-4 bg-red-50 text-red-600 border border-red-200 py-3 rounded-xl font-bold flex items-center justify-center gap-2 active:scale-95 transition-transform"
           >
             <LogOut size={18} /> {t('log_out')}
           </button>
        </div>

      </div>
    </div>
  );
};

export default SettingsMenu;
