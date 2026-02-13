
import React from 'react';
import { Link } from 'react-router-dom';
import { Language } from '../types';

interface QuizListViewProps {
  language: Language;
}

const QuizListView: React.FC<QuizListViewProps> = ({ language }) => {
  const QUIZZES = [
    { id: '1', title: 'Solar System Quest', subject: 'Science', xp: 150, icon: '🪐', difficulty: 'Easy' },
    { id: '2', title: 'Fraction Master', subject: 'Math', xp: 300, icon: '➗', difficulty: 'Medium' },
    { id: '3', title: 'Grammar Galaxy', subject: 'English', xp: 100, icon: '📖', difficulty: 'Easy' },
    { id: '4', title: 'Freedom Fighters', subject: 'History', xp: 500, icon: '🇮🇳', difficulty: 'Hard' },
  ];

  const getDifficultyColor = (diff: string) => {
    switch (diff) {
      case 'Easy': return 'bg-green-100 text-green-600 border-green-200';
      case 'Medium': return 'bg-orange-100 text-orange-600 border-orange-200';
      case 'Hard': return 'bg-red-100 text-red-600 border-red-200';
      default: return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 pt-24 pb-32 px-4">
      <Link to="/" className="inline-flex items-center gap-3 bg-white px-5 py-3 rounded-2xl clay-button text-slate-600 font-black hover:text-indigo-600 group">
        <span className="text-xl group-hover:-translate-x-1 transition-transform">←</span>
        Back to Dashboard
      </Link>

      <div className="text-center space-y-2">
        <h1 className="font-kids text-4xl text-slate-800 font-black tracking-tight drop-shadow-sm">Quiz Arena</h1>
        <p className="text-slate-500 font-bold italic">"Win challenges, earn double XP!"</p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {QUIZZES.map((quiz) => (
          <Link to={`/quiz/${quiz.id}?difficulty=${quiz.difficulty}`} key={quiz.id} className="group">
            <div className="clay-card bg-white p-6 flex items-center justify-between group-hover:scale-[1.02]">
              <div className="flex items-center gap-5">
                <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-4xl clay-button border-2 border-white shadow-inner group-hover:rotate-6 transition-transform">
                  {quiz.icon}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-kids text-xl font-black text-slate-800">{quiz.title}</h3>
                    <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full border shadow-inner ${getDifficultyColor(quiz.difficulty)}`}>
                      {quiz.difficulty}
                    </span>
                  </div>
                  <div className="flex gap-3">
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{quiz.subject}</span>
                    <span className="text-[10px] font-black uppercase text-teal-600 font-black">💎 {quiz.xp} XP</span>
                  </div>
                </div>
              </div>
              <div className="bg-teal-500 text-white px-6 py-3 rounded-2xl clay-button font-black text-sm">
                START
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="clay-card bg-yellow-400 p-8 text-center shadow-yellow-200">
        <h3 className="font-kids text-2xl font-black text-yellow-900 mb-2">Weekly Grand Challenge</h3>
        <p className="text-yellow-800 font-bold text-sm mb-6">Complete all 4 quizzes to unlock the "Village Genius" badge!</p>
        <div className="w-full bg-white/30 h-4 rounded-full overflow-hidden border-2 border-white/50 p-1 shadow-inner">
          <div className="bg-yellow-900 h-full w-[50%] rounded-full shadow-inner animate-pulse"></div>
        </div>
        <p className="mt-4 text-[10px] font-black text-yellow-900 uppercase tracking-[0.3em]">2 / 4 COMPLETED</p>
      </div>
    </div>
  );
};

export default QuizListView;
