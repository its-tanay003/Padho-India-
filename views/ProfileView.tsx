
import React from 'react';
import { Link } from 'react-router-dom';
import { User } from '../types';

interface ProfileViewProps {
  user: User;
}

const ProfileView: React.FC<ProfileViewProps> = ({ user }) => {
  return (
    <div className="max-w-2xl mx-auto pt-24 pb-32 px-4 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <Link to="/" className="inline-flex items-center gap-3 bg-white px-5 py-3 rounded-2xl clay-button text-slate-600 font-black hover:text-indigo-600 group">
        <span className="text-xl group-hover:-translate-x-1 transition-transform">←</span>
        Back to Home
      </Link>

      <div className="clay-card bg-white p-8 relative overflow-hidden">
        {/* Profile Header */}
        <div className="flex flex-col items-center text-center space-y-4 mb-8">
          <div className="relative">
            <div className="w-32 h-32 bg-teal-500 rounded-[2.5rem] flex items-center justify-center text-white text-5xl font-black shadow-inner border-4 border-teal-400 transform -rotate-3 hover:rotate-0 transition-transform">
              {user.name.charAt(0)}
            </div>
            <div className="absolute -bottom-2 -right-2 bg-yellow-400 w-12 h-12 rounded-2xl flex items-center justify-center text-2xl clay-button border-4 border-white animate-bounce-subtle">
              ⭐
            </div>
          </div>
          <div>
            <h1 className="font-kids text-3xl font-black text-slate-800">{user.name}</h1>
            <p className="text-teal-600 font-black uppercase tracking-[0.2em] text-[10px]">Level {user.level} {user.rank}</p>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 gap-4 mb-8">
          <div className="bg-slate-50 p-6 rounded-3xl shadow-inner border-2 border-white flex items-center gap-4 group">
            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-2xl clay-button border-2 border-indigo-50">📧</div>
            <div>
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Email Address</p>
              <p className="font-bold text-slate-700">{user.email}</p>
            </div>
          </div>
          
          <div className="bg-slate-50 p-6 rounded-3xl shadow-inner border-2 border-white flex items-center gap-4 group">
            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-2xl clay-button border-2 border-indigo-50">📱</div>
            <div>
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Mobile Number</p>
              <p className="font-bold text-slate-700">{user.mobile}</p>
            </div>
          </div>

          <div className="bg-slate-50 p-6 rounded-3xl shadow-inner border-2 border-white flex items-center gap-4 group">
            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-2xl clay-button border-2 border-indigo-50">🏘️</div>
            <div>
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Village/Town</p>
              <p className="font-bold text-slate-700">{user.village}</p>
            </div>
          </div>
        </div>

        {/* Badges */}
        <div className="space-y-4">
          <h3 className="font-kids text-xl font-black text-slate-800 px-2 drop-shadow-sm">Achievements</h3>
          <div className="flex flex-wrap gap-4">
            {user.badges.map(badge => (
              <div key={badge.id} className="bg-indigo-50 px-5 py-4 rounded-3xl border-2 border-white shadow-inner flex items-center gap-3">
                <span className="text-2xl animate-pulse">{badge.icon}</span>
                <div className="leading-tight">
                  <p className="font-black text-indigo-900 text-xs">{badge.name}</p>
                  <p className="text-[8px] font-bold text-indigo-400 uppercase tracking-widest">{badge.earnedAt}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <button className="w-full bg-slate-800 text-white font-black py-5 rounded-[2rem] clay-button text-sm">
        Update Profile Settings 📝
      </button>
    </div>
  );
};

export default ProfileView;
