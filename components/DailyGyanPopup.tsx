import React, { useState, useEffect, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { getSessionId } from '../services/authService';
import { facts, Fact } from '../data/facts';
import { X, Volume2, VolumeX, Sparkles, ThumbsUp, HelpCircle } from 'lucide-react';
import { useTranslation } from '../contexts/LanguageContext';

const DailyGyanPopup: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [fact, setFact] = useState<Fact | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [interactionStep, setInteractionStep] = useState<'READING' | 'QUESTION' | 'CLOSING'>('READING');
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  
  const userId = getSessionId();
  const user = useLiveQuery(() => userId ? db.users.get(userId) : undefined, [userId]);
  const speechRef = useRef<SpeechSynthesisUtterance | null>(null);
  const { t, language } = useTranslation();

  // Load voices
  useEffect(() => {
    const loadVoices = () => {
      const v = window.speechSynthesis.getVoices();
      setVoices(v);
    };
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }, []);

  // Main Trigger Logic
  useEffect(() => {
    if (!user || !userId) return;

    // Check Global Setting
    if (user.showDailyGyan === false) return;

    const sessionKey = `gyan_shown_session_${userId}`;
    const hasShownInSession = sessionStorage.getItem(sessionKey);
    
    if (!hasShownInSession) {
      const historyKey = `gyan_seen_history_${userId}`;
      const seenData = localStorage.getItem(historyKey);
      const seenIDs: number[] = seenData ? JSON.parse(seenData) : [];

      let availableFacts = facts.filter(f => !seenIDs.includes(f.id));

      if (availableFacts.length === 0) {
        availableFacts = facts;
        localStorage.setItem(historyKey, JSON.stringify([])); 
      }

      const randomFact = availableFacts[Math.floor(Math.random() * availableFacts.length)];
      setFact(randomFact);

      localStorage.setItem(historyKey, JSON.stringify([...seenIDs, randomFact.id]));
      sessionStorage.setItem(sessionKey, 'true');
      
      const timer = setTimeout(() => {
        setIsOpen(true);
        // Auto-play TTS if not muted
        handleSpeakFact(randomFact, user.name);
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [user, userId, language]); 

  const getVoiceForLanguage = () => {
    // If language is Hindi (hi) or Hinglish (hg), prefer Hindi voices
    if (language === 'hi' || language === 'hg') {
        const hindiVoice = voices.find(v => v.lang.includes('hi') || v.name.includes('Hindi'));
        if (hindiVoice) return hindiVoice;
    }

    // Default Fallback / English
    return voices.find(v => v.name.includes('Zira')) || 
           voices.find(v => v.name.includes('Google US English')) || 
           voices.find(v => v.name.includes('Samantha')) || 
           voices.find(v => v.name.toLowerCase().includes('female')) ||
           voices[0];
  };

  const speak = (text: string, onEnd?: () => void) => {
    if (isMuted) return;
    
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    const voice = getVoiceForLanguage();
    if (voice) utterance.voice = voice;
    
    utterance.rate = 0.9;
    utterance.pitch = 1.1; 

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => {
      setIsSpeaking(false);
      if (onEnd) onEnd();
    };
    utterance.onerror = () => setIsSpeaking(false);

    speechRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  const handleSpeakFact = (currentFact: Fact, userName: string) => {
     setInteractionStep('READING');
     const intro = language === 'hi' ? `नमस्ते ${userName}, क्या आप जानते हैं...` :
                   language === 'hg' ? `Hey ${userName}, Kya aapko pata hai...` :
                   `Hey ${userName}, Did you know that...`;
     
     const text = `${intro} ${currentFact.text}`;
     speak(text, () => {
         setInteractionStep('QUESTION');
     });
  };

  const handleResponse = (response: 'YES' | 'NO') => {
    setInteractionStep('CLOSING');
    if (response === 'YES') {
        speak(t('response_genius'), () => {
            setTimeout(handleClose, 1000);
        });
    } else {
        speak(t('response_glad'), () => {
            setTimeout(handleClose, 1000);
        });
    }
  };

  const toggleMute = () => {
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      setIsMuted(true);
    } else {
      setIsMuted(false);
    }
  };

  const handleClose = () => {
    window.speechSynthesis.cancel();
    setIsOpen(false);
  };

  if (!isOpen || !fact) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden relative transform transition-all scale-100 flex flex-col max-h-[90vh]">
        
        {/* Close Button */}
        <button 
          onClick={handleClose}
          className="absolute top-3 right-3 z-10 bg-black/30 hover:bg-black/50 text-white rounded-full p-1 transition-colors"
        >
          <X size={20} />
        </button>

        {/* Image Section */}
        <div className="h-56 relative shrink-0">
          <img 
            src={fact.image} 
            alt={fact.category} 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent flex flex-col justify-end p-4">
             <div className="flex items-center space-x-2 mb-2">
                <span className="bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider shadow-sm">
                  {t('daily_gyan')}
                </span>
                <span className="bg-yellow-400 text-yellow-900 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider shadow-sm">
                  {fact.category}
                </span>
             </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="p-6 flex-1 overflow-y-auto">
          
          {/* Fact Text & Animation */}
          <div className="flex items-start space-x-3 mb-6">
             <div className={`mt-1 min-w-[32px] h-8 flex items-center justify-center rounded-full transition-colors ${isSpeaking ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'}`}>
                {isSpeaking ? (
                  <div className="flex items-center space-x-0.5 h-4">
                    <div className="w-1 bg-blue-600 animate-[bounce_1s_infinite] h-2"></div>
                    <div className="w-1 bg-blue-600 animate-[bounce_1.2s_infinite] h-4"></div>
                    <div className="w-1 bg-blue-600 animate-[bounce_0.8s_infinite] h-2"></div>
                  </div>
                ) : (
                  <Sparkles size={18} />
                )}
             </div>
             
             <p className="text-gray-800 text-lg leading-relaxed font-semibold">
               {fact.text}
             </p>
          </div>

          {/* Interactive Feedback Loop */}
          <div className="min-h-[100px] flex flex-col justify-center transition-all duration-300">
             {interactionStep === 'QUESTION' && (
                <div className="animate-in slide-in-from-bottom-4 fade-in duration-500">
                    <h4 className="text-center font-bold text-gray-700 mb-3 flex items-center justify-center gap-2">
                        <HelpCircle size={18} /> {t('did_you_know')}
                    </h4>
                    <div className="grid grid-cols-2 gap-3">
                        <button 
                            onClick={() => handleResponse('YES')}
                            className="bg-green-50 hover:bg-green-100 border-2 border-green-200 text-green-700 font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors active:scale-95"
                        >
                            <ThumbsUp size={18} /> {t('yes_btn')}
                        </button>
                        <button 
                            onClick={() => handleResponse('NO')}
                            className="bg-blue-50 hover:bg-blue-100 border-2 border-blue-200 text-blue-700 font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors active:scale-95"
                        >
                            <Sparkles size={18} /> {t('no_btn')}
                        </button>
                    </div>
                </div>
             )}
             
             {interactionStep === 'READING' && (
                 <div className="text-center text-gray-400 text-sm italic animate-pulse">
                    {t('listening')}
                 </div>
             )}

             {interactionStep === 'CLOSING' && (
                 <div className="text-center text-blue-600 font-medium animate-in fade-in">
                    {t('see_tomorrow')}
                 </div>
             )}
          </div>
        </div>
        
        {/* Footer Controls */}
        <div className="bg-gray-50 p-3 flex justify-between items-center border-t border-gray-100">
             <button 
                 onClick={toggleMute}
                 className="p-2 rounded-full text-gray-500 hover:bg-gray-200"
             >
                 {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
             </button>
             <div className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">
                 VidyaSetu AI
             </div>
        </div>

      </div>
    </div>
  );
};

export default DailyGyanPopup;