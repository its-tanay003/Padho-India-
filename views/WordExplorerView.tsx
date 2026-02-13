
import React, { useState, useEffect } from 'react';
import { speakText } from '../services/gemini';
import { Language } from '../types';

interface WordExplorerViewProps {
  language: Language;
}

const ALL_WORDS = [
  { word: "Courage", phonetics: "/ˈkʌr.ɪdʒ/", meaning: "Being brave when something is scary.", usage: "The little bird had the courage to fly for the first time.", category: "Feeling", emoji: "🦁" },
  { word: "Gigantic", phonetics: "/dʒaɪˈɡæn.tɪk/", meaning: "Extremely big or huge.", usage: "The elephant looked gigantic next to the tiny mouse.", category: "Size", emoji: "🐘" },
  { word: "Curious", phonetics: "/ˈkjʊə.ri.əs/", meaning: "Wanting to learn or know about something.", usage: "The curious cat peeked inside the empty box.", category: "Feeling", emoji: "🧐" },
  { word: "Harmony", phonetics: "/ˈhɑː.mə.ni/", meaning: "Living together peacefully.", usage: "All the animals in the forest lived in perfect harmony.", category: "Social", emoji: "🤝" },
  { word: "Brilliant", phonetics: "/ˈbrɪl.jənt/", meaning: "Very bright or very smart.", usage: "The sun was brilliant today, and so was Rahul's idea!", category: "Smart", emoji: "✨" },
  { word: "Delicious", phonetics: "/dɪˈlɪʃ.əs/", meaning: "Something that tastes very good.", usage: "My grandmother made a delicious mango pickle.", category: "Food", emoji: "🥭" },
  { word: "Adventurous", phonetics: "/ədˈven.tʃər.əs/", meaning: "Willing to try new and exciting things.", usage: "The adventurous group climbed the highest hill in the village.", category: "Action", emoji: "🧗" },
  { word: "Grateful", phonetics: "/ˈɡreɪt.fəl/", meaning: "Feeling thankful for something good.", usage: "I am grateful for the delicious meal my mother cooked.", category: "Feeling", emoji: "🙏" },
  { word: "Ancient", phonetics: "/ˈeɪn.ʃənt/", meaning: "Something that is very, very old.", usage: "The banyan tree in our village is ancient.", category: "Time", emoji: "🌳" },
  { word: "Patience", phonetics: "/ˈpeɪ.ʃəns/", meaning: "Waiting calmly without getting upset.", usage: "Growing a garden takes a lot of patience.", category: "Virtue", emoji: "⏳" },
  { word: "Breeze", phonetics: "/briːz/", meaning: "A gentle, cool wind.", usage: "A cool breeze blew through the open window.", category: "Nature", emoji: "🍃" },
  { word: "Echo", phonetics: "/ˈek.əʊ/", meaning: "A sound that repeats when it hits a surface.", usage: "We heard our echo when we shouted into the cave.", category: "Science", emoji: "🗣️" },
];

const WordExplorerView: React.FC<WordExplorerViewProps> = ({ language }) => {
  const [displayWords, setDisplayWords] = useState<typeof ALL_WORDS>([]);
  const [selectedWord, setSelectedWord] = useState<typeof ALL_WORDS[0] | null>(null);

  useEffect(() => {
    // Shuffle and pick 6 words to show different content every time
    const shuffled = [...ALL_WORDS].sort(() => 0.5 - Math.random());
    setDisplayWords(shuffled.slice(0, 6));
  }, []);

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-24">
      <div className="text-center space-y-3">
        <h1 className="font-kids text-4xl text-indigo-600 font-black">English Word Explorer</h1>
        <p className="text-slate-500 font-bold max-w-md mx-auto italic">"A new set of words for a new adventure!"</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {displayWords.map((item) => (
          <button
            key={item.word}
            onClick={() => setSelectedWord(item)}
            className="bg-white p-6 rounded-[2rem] border-4 border-slate-100 border-b-[8px] border-b-slate-200 hover:border-indigo-400 hover:-translate-y-1 transition-all active:translate-y-1 active:border-b-4 text-center group"
          >
            <div className="text-4xl mb-3 group-hover:scale-125 transition-transform">{item.emoji}</div>
            <h3 className="font-kids text-xl font-black text-slate-800">{item.word}</h3>
            <span className="text-[10px] font-black uppercase text-indigo-400 tracking-widest">{item.category}</span>
          </button>
        ))}
      </div>

      <div className="text-center">
        <button 
           onClick={() => {
             const shuffled = [...ALL_WORDS].sort(() => 0.5 - Math.random());
             setDisplayWords(shuffled.slice(0, 6));
           }}
           className="bg-indigo-100 text-indigo-600 font-black px-6 py-2 rounded-xl border border-indigo-200 hover:bg-indigo-200 transition-all"
        >
          🔄 Show Different Words
        </button>
      </div>

      {selectedWord && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-lg rounded-[3rem] shadow-2xl overflow-hidden border-b-[12px] border-indigo-600 animate-in zoom-in duration-300">
            <div className="bg-indigo-600 p-8 text-white relative">
              <button 
                onClick={() => setSelectedWord(null)}
                className="absolute top-6 right-6 text-white/50 hover:text-white text-2xl"
              >
                ✕
              </button>
              <div className="flex items-center gap-4 mb-2">
                <span className="text-5xl">{selectedWord.emoji}</span>
                <div>
                  <h2 className="font-kids text-4xl font-black">{selectedWord.word}</h2>
                  <p className="text-indigo-200 font-mono text-sm">{selectedWord.phonetics}</p>
                </div>
              </div>
              <button 
                onClick={() => speakText(selectedWord.word, 'en')}
                className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-xl text-sm font-black flex items-center gap-2 transition-colors"
              >
                🔊 Listen to Sound
              </button>
            </div>

            <div className="p-8 space-y-6">
              <section className="space-y-2">
                <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-tighter">What it means</h4>
                <p className="text-xl font-bold text-slate-800 leading-tight">
                  {selectedWord.meaning}
                </p>
              </section>

              <section className="space-y-2 bg-slate-50 p-6 rounded-3xl border-2 border-slate-100">
                <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-tighter">How to use it</h4>
                <p className="text-lg font-bold text-indigo-600 italic leading-snug">
                  "{selectedWord.usage}"
                </p>
                <button 
                  onClick={() => speakText(selectedWord.usage, 'en')}
                  className="mt-2 text-[10px] font-black text-slate-400 hover:text-indigo-500 flex items-center gap-1"
                >
                  🔊 Hear Sentence
                </button>
              </section>

              <button 
                onClick={() => setSelectedWord(null)}
                className="w-full bg-slate-800 text-white font-black py-4 rounded-2xl shadow-lg active:scale-95 transition-all"
              >
                Got it! Let's find more words!
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WordExplorerView;
