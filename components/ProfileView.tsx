
import React from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { getSessionId } from '../services/authService';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, MapPin, Mail, Phone, Edit3, Award, Trophy, Settings } from 'lucide-react';
import SettingsMenu from './SettingsMenu';

interface Props {
  onLogout: () => void;
}

const ProfileView: React.FC<Props> = ({ onLogout }) => {
  const userId = getSessionId();
  const user = useLiveQuery(() => userId ? db.users.get(userId) : undefined, [userId]);
  const navigate = useNavigate();
  const [showSettings, setShowSettings] = React.useState(false);

  if (!user) return <div className="p-4">Loading Profile...</div>;

  if (showSettings) {
    return <SettingsMenu onBack={() => setShowSettings(false)} onLogout={onLogout} />;
  }

  return (
    <div className="space-y-6">
       {/* Nav */}
       <button onClick={() => navigate('/')} className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-gray-800 w-fit bg-white px-3 py-1.5 rounded-full border border-gray-100 shadow-sm">
         <ChevronLeft size={16} /> Back to Home
       </button>

       {/* Big Profile Card */}
       <div className="bg-white rounded-3xl p-8 shadow-lg shadow-gray-100 border border-gray-50 flex flex-col items-center relative overflow-hidden">
           
           {/* Background Blob */}
           <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-r from-green-50 to-emerald-50"></div>

           <div className="relative z-10 flex flex-col items-center">
               <div className="w-24 h-24 rounded-3xl bg-green-400 flex items-center justify-center text-4xl text-white font-bold shadow-xl shadow-green-100 mb-4 relative">
                   {user.name.charAt(0)}
                   <div className="absolute -bottom-2 -right-2 bg-yellow-400 p-1.5 rounded-full border-2 border-white text-white">
                       <StarIcon size={14} fill="currentColor" />
                   </div>
               </div>
               
               <h2 className="text-2xl font-black text-gray-800">{user.name}</h2>
               <p className="text-xs font-bold text-gray-400 tracking-widest uppercase mt-1">Level {user.level} Explorer</p>
           </div>

           {/* Info List */}
           <div className="w-full mt-8 space-y-4">
                <div className="flex items-center gap-4 p-3 rounded-2xl bg-gray-50 border border-gray-100">
                    <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-gray-400 shadow-sm">
                        <Mail size={18} />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Email Address</p>
                        <p className="font-bold text-gray-800 text-sm">{user.email || 'No email linked'}</p>
                    </div>
                </div>

                <div className="flex items-center gap-4 p-3 rounded-2xl bg-gray-50 border border-gray-100">
                    <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-gray-400 shadow-sm">
                        <Phone size={18} />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Mobile Number</p>
                        <p className="font-bold text-gray-800 text-sm">{user.phoneNumber || '+91 98765 43210'}</p>
                    </div>
                </div>

                <div className="flex items-center gap-4 p-3 rounded-2xl bg-gray-50 border border-gray-100">
                    <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-gray-400 shadow-sm">
                        <MapPin size={18} />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Village/Town</p>
                        <p className="font-bold text-gray-800 text-sm">Kishanpur, Uttar Pradesh</p>
                    </div>
                </div>
           </div>

           {/* Achievements */}
           <div className="w-full mt-6">
                <h3 className="font-bold text-gray-800 mb-3">Achievements</h3>
                <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                    {user.badges.map((b, i) => (
                        <div key={i} className="flex-shrink-0 bg-white border border-gray-100 p-2 rounded-xl flex items-center gap-2 shadow-sm pr-4">
                            <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-500">
                                <Trophy size={14} />
                            </div>
                            <div className="flex flex-col">
                                <span className="font-bold text-xs text-gray-800">{b}</span>
                                <span className="text-[8px] text-gray-400 font-bold">2023-10-01</span>
                            </div>
                        </div>
                    ))}
                    {user.badges.length === 0 && <span className="text-gray-400 text-xs font-medium italic">No badges yet. Play quizzes!</span>}
                </div>
           </div>

           {/* Big CTA Button */}
           <button 
             onClick={() => setShowSettings(true)}
             className="w-full bg-gray-900 text-white font-bold py-4 rounded-2xl mt-8 shadow-xl shadow-gray-200 active:scale-95 transition-transform flex items-center justify-center gap-2"
           >
             Update Profile Settings <Settings size={18} />
           </button>

       </div>
    </div>
  );
};

// Helper Icon
const StarIcon = ({ size, fill }: { size: number, fill?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={fill || "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
    </svg>
);

export default ProfileView;
