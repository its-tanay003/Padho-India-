
import React, { useState, useEffect } from 'react';
import { User, Language } from '../types';
import { speakText, getCompanionTip } from '../services/gemini';

interface CompanionProps {
  user: User;
  language: Language;
  context?: string;
}

const Companion: React.FC<CompanionProps> = ({ user, language, context }) => {
  const [message, setMessage] = useState<string>("");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showBubble, setShowBubble] = useState(false);

  const getMitraStyle = () => {
    if (user.level >= 5) return { color: '#fbbf24', aura: 'ring-yellow-400', emoji: '😎' }; 
    if (user.level >= 3) return { color: '#0ea5e9', aura: 'ring-blue-400', emoji: '🤓' }; 
    return { color: '#10b981', aura: 'ring-emerald-400', emoji: '😊' }; 
  };

  const mitra = getMitraStyle();

  const handleMitraClick = async () => {
    if (isSpeaking) return;
    setIsSpeaking(true);
    setShowBubble(true);
    try {
      const tip = await getCompanionTip(user, language, context || "general learning");
      setMessage(tip);
      await speakText(tip, language);
    } catch (err) {
      const fallback = language === 'hi' ? "खूब पढ़ते रहो!" : "Keep learning!";
      setMessage(fallback);
      await speakText(fallback, language);
    } finally {
      setTimeout(() => {
        setIsSpeaking(false);
        setTimeout(() => setShowBubble(false), 5000);
      }, 1000);
    }
  };

  return (
    <div className="fixed bottom-20 md:bottom-8 right-3 z-[100] flex flex-col items-end gap-2 group">
      {showBubble && message && (
        <div className="relative bg-white/95 backdrop-blur-xl p-3 rounded-xl shadow-lg border border-slate-100 max-w-[150px] animate-in fade-in slide-in-from-bottom-1 duration-300">
          <p className="text-[10px] font-black text-slate-700 leading-tight">
            {message}
          </p>
          <div className="absolute -bottom-1.5 right-4 w-3 h-3 bg-white border-b border-r border-slate-100 rotate-45"></div>
        </div>
      )}
      
      <div className="relative">
        {isSpeaking && <div className="absolute -inset-1 rounded-full bg-blue-400/20 animate-ping"></div>}
        <button 
          id="mitra-btn"
          onClick={handleMitraClick}
          className={`relative w-11 h-11 rounded-lg flex items-center justify-center transition-all active:scale-90 shadow-md border border-white ring-2 ${mitra.aura} animate-bounce-subtle pointer-events-auto`}
          style={{ backgroundColor: mitra.color }}
        >
          <div className="text-xl drop-shadow-sm">
            {isSpeaking ? '🗣️' : mitra.emoji}
          </div>
          <div className="absolute -bottom-1 -right-1 bg-slate-800 text-white text-[6px] px-1 py-0.5 rounded-full font-black border border-white">
            MITRA
          </div>
        </button>
      </div>
    </div>
  );
};

export default Companion;
