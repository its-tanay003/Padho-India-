
import React from 'react';
import { Link } from 'react-router-dom';
import { User } from '../types';

interface LeaderboardProps {
  user: User;
}

const Leaderboard: React.FC<LeaderboardProps> = ({ user }) => {
  const RANKS = [
    { name: "Rahul J.", xp: 2450, rank: 1, avatar: "🦁" },
    { name: "Sita M.", xp: 2100, rank: 2, avatar: "🦋" },
    { name: "Priya K.", xp: 1980, rank: 3, avatar: "🐼" },
    { name: user.name, xp: user.xp, rank: 4, avatar: "🦊", isCurrent: true },
    { name: "Deepak S.", xp: 1100, rank: 5, avatar: "🐯" },
    { name: "Meera B.", xp: 950, rank: 6, avatar: "🐱" },
    { name: "Anil P.", xp: 820, rank: 7, avatar: "🐰" }
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-6 pt-20 pb-32">
      <Link to="/" className="inline-flex items-center gap-2 text-slate-500 font-black hover:text-indigo-600 transition-colors group px-4">
        <span className="bg-white w-8 h-8 rounded-full flex items-center justify-center shadow-sm border border-slate-100 group-hover:scale-110 transition-transform">←</span>
        Back to Dashboard
      </Link>

      <div className="text-center space-y-2">
        <h1 className="font-kids text-4xl text-gray-800">Village Heroes</h1>
        <p className="text-gray-500">Who is the top learner in your village this week?</p>
      </div>

      <div className="flex justify-center gap-4 py-8">
        <div className="flex flex-col items-center mt-8">
          <div className="text-2xl mb-1">🥈</div>
          <div className="w-16 h-16 rounded-full bg-slate-300 border-4 border-gray-100 flex items-center justify-center text-3xl">🦋</div>
          <p className="font-bold mt-2">Sita M.</p>
          <span className="text-xs bg-gray-200 px-2 py-0.5 rounded-full font-bold">2,100</span>
        </div>
        <div className="flex flex-col items-center scale-110">
          <div className="text-3xl mb-1">🥇</div>
          <div className="w-20 h-20 rounded-full bg-yellow-400 border-4 border-white flex items-center justify-center text-4xl shadow-xl shadow-yellow-200">🦁</div>
          <p className="font-bold mt-2">Rahul J.</p>
          <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-bold border border-yellow-200">2,450</span>
        </div>
        <div className="flex flex-col items-center mt-10">
          <div className="text-2xl mb-1">🥉</div>
          <div className="w-16 h-16 rounded-full bg-orange-400 border-4 border-white flex items-center justify-center text-3xl">🐼</div>
          <p className="font-bold mt-2">Priya K.</p>
          <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-bold border border-orange-200">1,980</span>
        </div>
      </div>

      <div className="bg-white rounded-3xl overflow-hidden shadow-lg border border-gray-100 mx-4">
        {RANKS.map((r) => (
          <div 
            key={r.name} 
            className={`flex items-center justify-between p-4 border-b last:border-b-0 transition-colors ${r.isCurrent ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
          >
            <div className="flex items-center gap-4">
              <span className={`w-8 text-center font-bold ${r.rank <= 3 ? 'text-orange-500' : 'text-gray-400'}`}>
                {r.rank}
              </span>
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-2xl border border-gray-200">
                {r.avatar}
              </div>
              <div>
                <p className={`font-bold ${r.isCurrent ? 'text-blue-600' : 'text-gray-800'}`}>
                  {r.name} {r.isCurrent && "(You)"}
                </p>
                <p className="text-xs text-gray-500">Explorer Class</p>
              </div>
            </div>
            <div className="flex items-center gap-1 font-bold text-gray-700">
              {r.xp.toLocaleString()} <span className="text-blue-400 text-xs">XP</span>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-blue-600 p-6 rounded-3xl text-white text-center shadow-lg shadow-blue-200 mx-4">
        <h3 className="font-bold text-lg mb-1">Only 150 XP to beat Priya!</h3>
        <p className="text-blue-100 text-sm mb-4">Complete one more math chapter to climb up the rank!</p>
        <Link to="/" className="inline-block bg-white text-blue-600 font-bold px-8 py-3 rounded-2xl hover:bg-blue-50 transition-all">
          Study Now 📚
        </Link>
      </div>
    </div>
  );
};

export default Leaderboard;
