import React, { useState, useEffect, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { getSessionId } from '../services/authService';
import { facts } from '../data/facts';
import { X, Volume2, VolumeX, RotateCcw, Sparkles } from 'lucide-react';

const DailyGyanPopup: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [fact, setFact] = useState(facts[0]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  
  const userId = getSessionId();
  const user = useLiveQuery(() => userId ? db.users.get(userId) : undefined, [userId]);
  const speechRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    // Check if already shown in this session
    const hasShown = sessionStorage.getItem('daily_gyan_shown');
    
    if (!hasShown && user) {
      // Pick a fact based on the day of the year to ensure all users see the same "Daily" fact
      const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
      const factIndex = dayOfYear % facts.length;
      setFact(facts[factIndex]);
      
      // Delay slightly for effect
      const timer = setTimeout(() => {
        setIsOpen(true);
        sessionStorage.setItem('daily_gyan_shown', 'true');
        // Auto-play TTS if not muted by default
        handleSpeak(facts[factIndex], user.name);
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, [user]);

  const handleSpeak = (currentFact: typeof facts[0], userName: string) => {
    if (isMuted) return;

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const text = `Hey ${userName}, did you know? ${currentFact.text}`;
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Attempt to select a better voice
    const voices = window.speechSynthesis.getVoices();
    // Prefer Indian English, then general English
    const preferredVoice = voices.find(v => v.lang.includes('en-IN')) || voices.find(v => v.lang.includes('en'));
    if (preferredVoice) utterance.voice = preferredVoice;

    utterance.rate = 0.9; // Slightly slower for clarity
    utterance.pitch = 1;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    speechRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  const toggleMute = () => {
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      setIsMuted(true);
    } else {
      setIsMuted(false);
      if (user) handleSpeak(fact, user.name);
    }
  };

  const handleReplay = () => {
    setIsMuted(false);
    if (user) handleSpeak(fact, user.name);
  };

  const handleClose = () => {
    window.speechSynthesis.cancel();
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden relative transform transition-all scale-100">
        
        {/* Close Button */}
        <button 
          onClick={handleClose}
          className="absolute top-3 right-3 z-10 bg-black/20 hover:bg-black/40 text-white rounded-full p-1 transition-colors"
        >
          <X size={20} />
        </button>

        {/* Image Section */}
        <div className="h-48 relative">
          <img 
            src={fact.image} 
            alt={fact.category} 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-4">
             <div className="flex items-center space-x-2 mb-1">
                <span className="bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                  Daily Gyan
                </span>
                <span className="bg-yellow-400 text-yellow-900 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                  {fact.category}
                </span>
             </div>
             <h3 className="text-white font-bold text-xl leading-tight">Fact of the Day</h3>
          </div>
        </div>

        {/* Content Section */}
        <div className="p-6">
          <div className="flex items-start space-x-3 mb-4">
             {/* Sound Wave Animation Icon */}
             <div className={`mt-1 min-w-[24px] h-6 flex items-center justify-center rounded-full ${isSpeaking ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'}`}>
                {isSpeaking ? (
                  <div className="flex items-center space-x-0.5 h-3">
                    <div className="w-0.5 bg-blue-600 animate-[bounce_1s_infinite] h-2"></div>
                    <div className="w-0.5 bg-blue-600 animate-[bounce_1.2s_infinite] h-3"></div>
                    <div className="w-0.5 bg-blue-600 animate-[bounce_0.8s_infinite] h-1.5"></div>
                  </div>
                ) : (
                  <Sparkles size={14} />
                )}
             </div>
             
             <p className="text-gray-700 text-lg leading-relaxed font-medium">
               {fact.text}
             </p>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-between border-t border-gray-100 pt-4 mt-2">
            <div className="flex space-x-2">
               <button 
                 onClick={toggleMute}
                 className="p-2 rounded-full bg-gray-50 text-gray-600 hover:bg-gray-100 transition-colors"
                 title={isMuted ? "Unmute" : "Mute"}
               >
                 {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} className={isSpeaking ? "text-blue-600" : ""} />}
               </button>
               <button 
                 onClick={handleReplay}
                 className="p-2 rounded-full bg-gray-50 text-gray-600 hover:bg-gray-100 transition-colors"
                 title="Replay"
               >
                 <RotateCcw size={20} />
               </button>
            </div>
            
            <button 
              onClick={handleClose}
              className="px-6 py-2 bg-blue-600 text-white rounded-xl font-semibold shadow-lg shadow-blue-200 active:scale-95 transition-transform"
            >
              Awesome!
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DailyGyanPopup;