import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations, Language } from '../data/translations';
import { db } from '../db';
import { getSessionId } from '../services/authService';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: keyof typeof translations.en) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>('en');

  // Load language preference on mount
  useEffect(() => {
    const loadLanguage = async () => {
      // 1. Check LocalStorage first for immediate UI render
      const savedLang = localStorage.getItem('app_language') as Language;
      if (savedLang) {
        setLanguageState(savedLang);
      }

      // 2. Check Database if user is logged in
      const userId = getSessionId();
      if (userId) {
        const user = await db.users.get(userId);
        if (user && user.language) {
          setLanguageState(user.language as Language);
          // Sync local storage
          localStorage.setItem('app_language', user.language);
        }
      }
    };
    loadLanguage();
  }, []);

  const setLanguage = async (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('app_language', lang);
    
    // Persist to DB if user is logged in
    const userId = getSessionId();
    if (userId) {
      await db.users.update(userId, { language: lang });
    }
  };

  const t = (key: keyof typeof translations.en) => {
    return translations[language][key] || translations['en'][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useTranslation = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useTranslation must be used within a LanguageProvider');
  }
  return context;
};