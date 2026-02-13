
import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { User, Language } from '../types';
import { GoogleGenAI } from "@google/genai";
import { speakText } from '../services/gemini';

interface AIViewProps {
  user: User;
  language: Language;
}

const AIView: React.FC<AIViewProps> = ({ user, language }) => {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<{role: 'user' | 'mitra', text: string}[]>([
    { role: 'mitra', text: language === 'hi' ? "नमस्ते अर्जुन! मैं मित्रा हूँ। आप आज क्या सीखना चाहते हैं?" : "Namaste Arjun! I'm Mitra. What do you want to learn today?" }
  ]);
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Initialize Web Speech API for voice assistance
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = language === 'hi' ? 'hi-IN' : language === 'ta' ? 'ta-IN' : 'en-IN';

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        setIsListening(false);
      };

      recognitionRef.current.onerror = () => {
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, [language]);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      setInput("");
      recognitionRef.current?.start();
      setIsListening(true);
    }
  };

  const handleSend = async (overrideInput?: string) => {
    const textToSend = overrideInput || input;
    if (!textToSend.trim() || loading) return;
    
    const userMsg = textToSend.trim();
    setInput("");
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `You are 'Mitra', a friendly AI tutor for a 5th grade student in rural India. Answer this question simply in ${language}: ${userMsg}`,
      });
      
      const mitraText = response.text || "I'm not sure, but let's find out together!";
      setMessages(prev => [...prev, { role: 'mitra', text: mitraText }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'mitra', text: "Oops, my thinking wires are tangled. Try again!" }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto h-[calc(100vh-14rem)] mt-20 mb-28 flex flex-col bg-white/90 backdrop-blur rounded-[2.5rem] shadow-2xl border-4 border-white overflow-hidden relative">
      <div className="bg-orange-500 p-5 text-white flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-3">
          <Link to="/" className="w-10 h-10 bg-white/20 hover:bg-white/40 rounded-xl flex items-center justify-center text-xl transition-colors">←</Link>
          <div>
            <h1 className="font-kids font-black text-lg">Mitra AI Lab</h1>
            <p className="text-[10px] font-bold opacity-80 uppercase tracking-widest">Always Online • Voice Enabled</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/30">
        {messages.map((m, idx) => (
          <div key={idx} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`relative max-w-[85%] p-4 rounded-[1.5rem] font-bold text-sm shadow-md border group ${
              m.role === 'user' 
                ? 'bg-indigo-600 text-white border-indigo-700 rounded-br-none' 
                : 'bg-white text-slate-800 border-slate-100 rounded-bl-none'
            }`}>
              {m.text}
              {m.role === 'mitra' && (
                <button 
                  onClick={() => speakText(m.text, language)}
                  className="absolute -right-10 top-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full border border-slate-200 flex items-center justify-center text-xs shadow-md hover:scale-110 active:scale-95 transition-all"
                  title="Read Aloud"
                >
                  🔊
                </button>
              )}
            </div>
          </div>
        ))}
        {loading && <div className="text-xs font-black text-slate-400 animate-pulse flex items-center gap-2 px-2">
          <span className="w-2 h-2 bg-orange-400 rounded-full animate-bounce"></span>
          Mitra is thinking... 💭
        </div>}
      </div>

      <div className="p-4 border-t-2 border-slate-100 bg-white">
        <div className="flex gap-2">
          <button 
            onClick={toggleListening}
            className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-lg transition-all ${
              isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-indigo-100 text-indigo-600 border border-indigo-200'
            }`}
            title="Talk to Mitra"
          >
            {isListening ? '⏹️' : '🎤'}
          </button>
          
          <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder={isListening ? "Listening..." : "Ask Mitra anything..."}
            className="flex-1 bg-slate-100 rounded-xl px-4 py-3 text-sm font-bold border-2 border-transparent focus:border-orange-500 outline-none transition-all"
          />
          
          <button 
            onClick={() => handleSend()}
            disabled={loading || !input.trim()}
            className="bg-orange-500 text-white w-12 h-12 rounded-xl flex items-center justify-center shadow-lg active:scale-90 transition-all disabled:opacity-50"
          >
            🚀
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIView;
