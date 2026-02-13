import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { getSessionId } from '../services/authService';
import { User, LogOut, Award, Flame, Phone, Edit2, Check, X } from 'lucide-react';

interface Props {
  onLogout: () => void;
}

const ProfileView: React.FC<Props> = ({ onLogout }) => {
  const userId = getSessionId();
  const user = useLiveQuery(() => userId ? db.users.get(userId) : undefined, [userId]);
  
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editGrade, setEditGrade] = useState('');

  useEffect(() => {
    if (user) {
      setEditName(user.name);
      setEditGrade(user.grade || '10');
    }
  }, [user]);

  const handleLogoutClick = () => {
    onLogout();
  };

  const handleSave = async () => {
    if (userId && editName.trim()) {
      await db.users.update(userId, { name: editName, grade: editGrade });
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    if (user) {
      setEditName(user.name);
      setEditGrade(user.grade || '10');
    }
    setIsEditing(false);
  };

  if (!user) return <div className="p-4">Loading Profile...</div>;

  return (
    <div className="p-4 space-y-6">
      {/* Profile Header */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center relative">
        
        {/* Edit Button */}
        {!isEditing && (
            <button 
                onClick={() => setIsEditing(true)} 
                className="absolute top-4 right-4 p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                aria-label="Edit Profile"
            >
                <Edit2 size={18} />
            </button>
        )}

        <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 mb-4">
           <User size={48} />
        </div>

        {isEditing ? (
            <div className="w-full space-y-4 animate-in fade-in duration-200">
                <div className="space-y-1">
                    <label className="text-xs text-gray-500 font-bold uppercase tracking-wider">Name</label>
                    <input 
                        type="text" 
                        value={editName} 
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full border border-gray-300 rounded-xl p-3 text-center font-bold text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
                        placeholder="Your Name"
                    />
                </div>
                <div className="space-y-1">
                    <label className="text-xs text-gray-500 font-bold uppercase tracking-wider">Grade</label>
                    <select 
                        value={editGrade} 
                        onChange={(e) => setEditGrade(e.target.value)}
                        className="w-full border border-gray-300 rounded-xl p-3 text-center bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                        {[...Array(12)].map((_, i) => (
                            <option key={i} value={(i + 1).toString()}>Class {i + 1}</option>
                        ))}
                    </select>
                </div>
                <div className="flex gap-3 justify-center pt-2">
                    <button 
                        onClick={handleCancel} 
                        className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center gap-1"
                    >
                        <X size={16} /> Cancel
                    </button>
                    <button 
                        onClick={handleSave} 
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center gap-1 shadow-md"
                    >
                        <Check size={16} /> Save
                    </button>
                </div>
            </div>
        ) : (
            <>
                <h2 className="text-2xl font-bold text-gray-900">{user.name}</h2>
                <div className="flex items-center text-gray-500 text-sm mt-1 space-x-2">
                {user.grade && <span className="bg-gray-100 px-2 py-0.5 rounded">Class {user.grade}</span>}
                {user.phoneNumber && <span className="flex items-center"><Phone size={12} className="mr-1" /> {user.phoneNumber}</span>}
                </div>
            </>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
         <div className="bg-orange-50 p-4 rounded-xl border border-orange-100 flex flex-col items-center">
            <Flame className="text-orange-500 mb-2" size={24} />
            <span className="text-2xl font-bold text-gray-800">{user.streak}</span>
            <span className="text-xs text-gray-500 uppercase font-bold">Day Streak</span>
         </div>
         <div className="bg-purple-50 p-4 rounded-xl border border-purple-100 flex flex-col items-center">
            <Award className="text-purple-500 mb-2" size={24} />
            <span className="text-2xl font-bold text-gray-800">{user.xp}</span>
            <span className="text-xs text-gray-500 uppercase font-bold">Total XP</span>
         </div>
      </div>

      {/* Badges */}
      <div className="bg-white p-4 rounded-xl border border-gray-100">
        <h3 className="font-bold text-gray-800 mb-3">My Badges</h3>
        <div className="flex flex-wrap gap-2">
           {user.badges.map((b, i) => (
             <span key={i} className="px-3 py-1 bg-yellow-50 text-yellow-700 border border-yellow-200 rounded-full text-xs font-medium">
                {b}
             </span>
           ))}
           {user.badges.length === 0 && <p className="text-sm text-gray-400">Keep learning to earn badges!</p>}
        </div>
      </div>

      {/* Logout Button */}
      <button 
        type="button"
        onClick={handleLogoutClick}
        className="w-full bg-red-50 text-red-600 border border-red-200 py-3 rounded-xl font-medium flex items-center justify-center gap-2 active:scale-95 transition-transform cursor-pointer"
      >
        <LogOut size={18} /> Log Out
      </button>
    </div>
  );
};

export default ProfileView;