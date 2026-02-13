
import React, { useState, useEffect, useLayoutEffect } from 'react';
import { Language } from '../types';

interface TutorialStep {
  targetId?: string;
  title: string;
  content: string;
  emoji: string;
  actionLabel: string;
}

interface TutorialProps {
  language: Language;
}

const Tutorial: React.FC<TutorialProps> = ({ language }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [spotlightRect, setSpotlightRect] = useState<DOMRect | null>(null);

  const translations = {
    en: { next: "Next ➡️", skip: "Skip", finish: "Start! 🚀" },
    hi: { next: "आगे ➡️", skip: "छोड़ें", finish: "शुरू करें! 🚀" },
    ta: { next: "அடுத்து ➡️", skip: "தவிர்", finish: "துவங்கு! 🚀" }
  };

  const t = translations[language];

  const steps: TutorialStep[] = [
    {
      title: "Namaste! 🤖",
      content: language === 'hi' ? "मैं मित्रा हूँ। चलिए आपके नए स्कूल को देखते हैं!" : "I'm Mitra. Let's explore your new digital school!",
      emoji: "🤖",
      actionLabel: "Start ✨"
    },
    {
      targetId: 'nav-stats',
      title: "Power Bar 💪",
      content: language === 'hi' ? "आपका लेवल यहाँ है। पढ़ते रहें!" : "Your Level is here. Keep studying!",
      emoji: "⚡",
      actionLabel: t.next
    },
    {
      targetId: 'streak-card',
      title: "Daily Fire 🔥",
      content: language === 'hi' ? "हर दिन पढ़ने से यह आग जलती रहेगी!" : "Keep studying every day to keep this fire bright!",
      emoji: "🔥",
      actionLabel: t.next
    },
    {
      targetId: 'course-grid',
      title: "Worlds 🌎",
      content: language === 'hi' ? "अपनी एडवेंचर चुनने के लिए किसी पर भी क्लिक करें!" : "Click any world to start your adventure!",
      emoji: "📚",
      actionLabel: t.next
    },
    {
      targetId: 'mitra-btn',
      title: "Help! 💡",
      content: language === 'hi' ? "मदद के लिए मुझ पर क्लिक करें!" : "Click me anytime for a helpful tip!",
      emoji: "🤖",
      actionLabel: t.finish
    }
  ];

  useEffect(() => {
    // Check if the user has EVER seen the tutorial
    const hasSeenTutorial = localStorage.getItem('padho_india_tour_completed_v2');
    if (!hasSeenTutorial) {
      const timer = setTimeout(() => {
        setIsVisible(true);
        // Mark as seen IMMEDIATELY so it never triggers again
        localStorage.setItem('padho_india_tour_completed_v2', 'true');
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  useLayoutEffect(() => {
    if (!isVisible) return;
    const targetId = steps[currentStep].targetId;
    if (targetId) {
      const element = document.getElementById(targetId);
      if (element) {
        const rect = element.getBoundingClientRect();
        setSpotlightRect(rect);
        const elementCenter = rect.top + window.pageYOffset;
        window.scrollTo({
          top: elementCenter - window.innerHeight / 2 + rect.height / 2,
          behavior: 'smooth'
        });
      }
    } else {
      setSpotlightRect(null);
    }
  }, [currentStep, isVisible]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      setIsVisible(false);
    }
  };

  const handleClose = () => {
    setIsVisible(false);
  };

  if (!isVisible) return null;
  const step = steps[currentStep];

  const getCardPositioning = () => {
    if (!spotlightRect) return { style: { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' } };
    const padding = 16;
    const isBottomHalf = spotlightRect.bottom > window.innerHeight * 0.55;
    return {
      style: {
        position: 'absolute' as const,
        left: '50%',
        transform: 'translateX(-50%)',
        top: isBottomHalf ? 'auto' : `${spotlightRect.bottom + padding}px`,
        bottom: isBottomHalf ? `${(window.innerHeight - spotlightRect.top) + padding}px` : 'auto',
        zIndex: 500
      },
      arrowPos: isBottomHalf ? 'bottom' : 'top'
    };
  };

  const { style, arrowPos } = getCardPositioning();

  return (
    <div className="fixed inset-0 z-[400] font-kids pointer-events-none">
      <div 
        className="absolute inset-0 bg-slate-950/80 transition-all duration-700 pointer-events-auto"
        style={{
          clipPath: spotlightRect 
            ? `polygon(0% 0%, 0% 100%, ${spotlightRect.left - 8}px 100%, ${spotlightRect.left - 8}px ${spotlightRect.top - 8}px, ${spotlightRect.right + 8}px ${spotlightRect.top - 8}px, ${spotlightRect.right + 8}px ${spotlightRect.bottom + 8}px, ${spotlightRect.left - 8}px ${spotlightRect.bottom + 8}px, ${spotlightRect.left - 8}px 100%, 100% 100%, 100% 0%)`
            : 'none'
        }}
      />

      <div style={style as React.CSSProperties} className="pointer-events-auto transition-all duration-300 w-[90%] max-w-[280px]">
        <div className="relative bg-white rounded-[2rem] p-5 shadow-2xl border-4 border-indigo-100 animate-in zoom-in duration-300">
          {spotlightRect && (
            <div className={`absolute left-1/2 -translate-x-1/2 w-4 h-4 bg-white rotate-45 border-4 border-indigo-100 border-r-0 border-b-0 ${arrowPos === 'top' ? '-top-2.5' : '-bottom-2.5'}`} />
          )}

          <div className="flex items-center gap-4 mb-3">
            <div className="w-12 h-12 flex-shrink-0 bg-indigo-600 rounded-2xl flex items-center justify-center text-3xl shadow-lg border-2 border-white/20">
              {step.emoji}
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-black text-slate-800">{step.title}</h3>
              <button 
                onClick={handleClose} 
                className="text-indigo-400 hover:text-red-500 text-[9px] font-black uppercase tracking-widest"
              >
                {t.skip} ✕
              </button>
            </div>
          </div>

          <p className="text-slate-600 font-bold text-xs leading-relaxed mb-4">{step.content}</p>

          <div className="flex items-center justify-between">
            <div className="flex gap-1">
              {steps.map((_, idx) => (
                <div key={idx} className={`h-1.5 rounded-full transition-all duration-300 ${idx === currentStep ? 'w-4 bg-indigo-600' : 'w-1.5 bg-slate-200'}`} />
              ))}
            </div>
            <button 
              onClick={handleNext} 
              className="bg-teal-500 text-white font-black px-5 py-2 rounded-xl shadow-[0_4px_0_#0d9488] active:translate-y-1 active:shadow-none transition-all text-xs"
            >
              {step.actionLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Tutorial;
