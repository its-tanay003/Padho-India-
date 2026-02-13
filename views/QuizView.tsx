
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { QuizQuestion, Language, User } from '../types';
import { speakText } from '../services/gemini';
import Companion from '../components/Companion';

interface QuizViewProps {
  setUser: React.Dispatch<React.SetStateAction<User>>;
  language: Language;
  user: User;
}

const ALL_QUESTIONS: Record<string, QuizQuestion[]> = {
  '1': [
    { id: '1', question: "Which planet is known as the Red Planet?", options: ["Venus", "Mars", "Jupiter", "Earth"], correctAnswer: 1 },
    { id: '2', question: "Which is the largest planet in our solar system?", options: ["Saturn", "Neptune", "Jupiter", "Uranus"], correctAnswer: 2 },
    { id: '3', question: "Is the Moon a planet?", options: ["Yes", "No", "Sometimes", "Maybe"], correctAnswer: 1 }
  ],
  '2': [
     { id: 'q1', question: "What is 1/2 + 1/4?", options: ["1/6", "3/4", "2/6", "1/4"], correctAnswer: 1 },
     { id: 'q2', question: "What is 2/3 of 12?", options: ["4", "6", "8", "9"], correctAnswer: 2 },
     { id: 'q3', question: "Which is larger?", options: ["1/2", "1/3", "1/4", "1/5"], correctAnswer: 0 },
     { id: 'q4', question: "Convert 0.5 to a fraction.", options: ["1/5", "1/2", "5/100", "2/5"], correctAnswer: 1 },
     { id: 'q5', question: "Simplify 4/8.", options: ["2/4", "1/2", "3/4", "None"], correctAnswer: 1 }
  ],
  'default': [
    { id: 'd1', question: "Ready to test your knowledge?", options: ["Yes!", "Definitely!", "Let's Go!", "Always!"], correctAnswer: 0 }
  ]
};

const Confetti: React.FC = () => {
  return (
    <div className="fixed inset-0 pointer-events-none z-[60] overflow-hidden">
      {[...Array(40)].map((_, i) => (
        <div
          key={i}
          className="absolute w-2 h-2 rounded-full animate-celebrate"
          style={{
            left: `${Math.random() * 100}%`,
            top: `-5%`,
            backgroundColor: ['#f59e0b', '#10b981', '#3b82f6', '#ec4899', '#8b5cf6'][Math.floor(Math.random() * 5)],
            animationDelay: `${Math.random() * 3}s`,
            animationDuration: `${2 + Math.random() * 2}s`
          }}
        />
      ))}
      <style>{`
        @keyframes celebrate {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(110vh) rotate(720deg); opacity: 0; }
        }
        .animate-celebrate {
          animation: celebrate linear infinite;
        }
      `}</style>
    </div>
  );
};

const QuizView: React.FC<QuizViewProps> = ({ setUser, language, user }) => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const difficulty = searchParams.get('difficulty') || 'Easy';
  const navigate = useNavigate();

  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    let quizQuestions = ALL_QUESTIONS[id || ''] || ALL_QUESTIONS['default'];
    
    // Adjust number of questions based on difficulty if needed
    if (difficulty === 'Easy') {
      quizQuestions = quizQuestions.slice(0, 3);
    } else if (difficulty === 'Medium') {
      quizQuestions = quizQuestions.slice(0, 5);
    }
    
    setQuestions(quizQuestions);
  }, [id, difficulty]);

  const getXPPerQuestion = () => {
    switch (difficulty) {
      case 'Easy': return 50;
      case 'Medium': return 100;
      case 'Hard': return 150;
      default: return 50;
    }
  };

  const handleNext = () => {
    if (questions.length === 0) return;

    let finalScore = score;
    if (selected === questions[currentStep].correctAnswer) {
      finalScore = score + 1;
      setScore(finalScore);
    }

    if (currentStep < questions.length - 1) {
      setCurrentStep(s => s + 1);
      setSelected(null);
    } else {
      setFinished(true);
      const xpPerQ = getXPPerQuestion();
      const xpGained = finalScore * xpPerQ;
      setUser(prev => ({ 
        ...prev, 
        xp: prev.xp + xpGained, 
        level: prev.xp + xpGained >= (prev.level * 1000) ? prev.level + 1 : prev.level 
      }));
    }
  };

  const handleSpeak = () => {
    if (questions[currentStep]) {
      speakText(questions[currentStep].question, language);
    }
  };

  const getDiffColor = () => {
    switch (difficulty) {
      case 'Easy': return 'text-green-500';
      case 'Medium': return 'text-orange-500';
      case 'Hard': return 'text-red-500';
      default: return 'text-slate-500';
    }
  };

  if (finished) {
    return (
      <div className="relative min-h-[70vh] flex items-center justify-center p-4">
        <Confetti />
        
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
           <div className="absolute top-1/4 left-1/4 text-4xl animate-bounce-subtle delay-100 opacity-50">⭐</div>
           <div className="absolute top-1/3 right-1/4 text-3xl animate-bounce-subtle delay-300 opacity-50">✨</div>
           <div className="absolute bottom-1/4 left-1/3 text-4xl animate-bounce-subtle delay-500 opacity-50">🌟</div>
           <div className="absolute top-1/2 right-1/3 text-2xl animate-bounce-subtle opacity-50">💫</div>
        </div>

        <div className="relative z-10 max-w-2xl w-full text-center space-y-8 bg-white p-8 md:p-12 rounded-[3rem] shadow-2xl border-b-[12px] border-yellow-500 animate-in zoom-in duration-500">
          <Companion user={user} language={language} context="celebrating completing a quiz with a high score" />
          
          <div className="relative inline-block">
            <div className="text-8xl animate-bounce drop-shadow-2xl">🏆</div>
            <div className="absolute -top-4 -right-4 bg-yellow-400 text-white text-[10px] font-black px-3 py-1 rounded-full shadow-lg rotate-12 uppercase">
              {difficulty} Clear!
            </div>
          </div>

          <div className="space-y-2">
            <h1 className="font-kids text-4xl md:text-5xl text-slate-800 font-black tracking-tight">Challenge Won!</h1>
            <p className="text-slate-500 text-sm md:text-lg font-bold uppercase tracking-widest px-4">You mastered the {difficulty} path!</p>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-blue-50 p-6 rounded-[2rem] border-2 border-blue-100 transform transition-transform hover:scale-105 duration-300">
              <p className="text-3xl font-black text-blue-600">{score}/{questions.length}</p>
              <p className="text-[10px] font-black text-blue-400 uppercase">Correct Answers</p>
            </div>
            <div className="bg-teal-50 p-6 rounded-[2rem] border-2 border-teal-100 transform transition-transform hover:scale-105 duration-300">
              <p className="text-3xl font-black text-teal-600">+{score * getXPPerQuestion()}</p>
              <p className="text-[10px] font-black text-teal-400 uppercase">XP Gained</p>
            </div>
          </div>

          <div className="pt-4">
            <button 
              onClick={() => navigate('/')}
              className="w-full bg-orange-500 text-white font-black py-4 md:py-6 rounded-[2rem] shadow-[0_8px_0_#c2410c] hover:translate-y-1 hover:shadow-[0_2px_0_#c2410c] active:scale-95 transition-all text-xl md:text-2xl"
            >
              Collect Rewards! ✨
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (questions.length === 0) return <div className="p-20 text-center font-black animate-pulse">Loading adventure...</div>;

  const q = questions[currentStep];

  return (
    <div className="max-w-3xl mx-auto space-y-6 md:pt-10 px-2 pb-24">
      <Companion user={user} language={language} context={`helping with question ${currentStep + 1} on ${difficulty} level`} />
      
      <div className="flex justify-between items-center bg-white px-4 py-3 md:px-6 md:py-4 rounded-3xl border-2 md:border-4 border-slate-100 shadow-sm">
         <div className="flex items-center gap-3">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-indigo-100 rounded-2xl flex items-center justify-center font-black text-indigo-600 border-2 border-indigo-200 text-sm md:text-base">
              {currentStep + 1}
            </div>
            <div className="flex flex-col gap-1">
              <div className="h-2.5 w-32 md:h-3 md:w-48 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                <div 
                  className="bg-indigo-500 h-full transition-all duration-500 liquid-progress" 
                  style={{ width: `${((currentStep + 1) / questions.length) * 100}%` }}
                />
              </div>
              <p className={`text-[8px] font-black uppercase tracking-widest ${getDiffColor()}`}>
                Level: {difficulty}
              </p>
            </div>
         </div>
         <button 
           onClick={handleSpeak}
           className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-teal-500 flex items-center justify-center text-white text-lg md:text-xl shadow-[0_4px_0_#0d9488] active:translate-y-1 active:shadow-none transition-all hover:bg-teal-600"
         >
           🔊
         </button>
      </div>

      <div className="bg-white p-6 md:p-10 rounded-[2rem] md:rounded-[3rem] shadow-2xl border-4 border-slate-100 border-b-[8px] md:border-b-[12px] space-y-6 md:space-y-8">
        <h2 className="text-xl md:text-3xl font-black text-slate-800 text-center leading-tight px-2">{q.question}</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
          {q.options.map((opt, idx) => (
            <button
              key={idx}
              onClick={() => setSelected(idx)}
              className={`p-4 md:p-6 rounded-[1.5rem] md:rounded-[2rem] text-sm md:text-xl font-black transition-all text-left border-4 relative group ${
                selected === idx 
                  ? 'bg-indigo-600 border-indigo-800 text-white shadow-xl scale-[1.02]' 
                  : 'bg-slate-50 border-slate-100 text-slate-700 hover:bg-slate-100 hover:border-slate-200'
              }`}
            >
              <div className="flex items-center gap-3 md:gap-4 pr-10">
                <span className={`w-8 h-8 md:w-10 md:h-10 rounded-xl flex items-center justify-center border-2 flex-shrink-0 font-kids ${selected === idx ? 'bg-white text-indigo-600 border-white' : 'bg-white text-slate-400 border-slate-200'}`}>
                  {String.fromCharCode(65 + idx)}
                </span>
                <span className="line-clamp-2">{opt}</span>
              </div>
              
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  speakText(opt, language);
                }}
                className={`absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-xl transition-all hover:scale-110 active:scale-95 ${
                  selected === idx ? 'bg-white/20 text-white' : 'bg-indigo-50 text-indigo-600 border border-indigo-100'
                }`}
                title="Hear Option"
              >
                🔊
              </button>
            </button>
          ))}
        </div>

        <button
          disabled={selected === null}
          onClick={handleNext}
          className={`w-full py-4 md:py-6 rounded-[1.5rem] md:rounded-[2rem] text-lg md:text-2xl font-black transition-all ${
            selected === null 
              ? 'bg-slate-100 text-slate-300 border-2 md:border-4 border-slate-200 cursor-not-allowed' 
              : 'bg-teal-500 text-white shadow-[0_8px_0_#0d9488] border-teal-600 border-2 md:border-4 hover:translate-y-1 hover:shadow-[0_2px_0_#0d9488]'
          }`}
        >
          {currentStep === questions.length - 1 ? 'Finish Challenge! 🏁' : 'Next Question →'}
        </button>
      </div>
    </div>
  );
};

export default QuizView;
