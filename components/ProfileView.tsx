
import React, { useState, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { getSessionId } from '../services/authService';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, MapPin, Mail, Phone, Edit3, Award, Trophy, Settings, Camera, Upload, X, Check } from 'lucide-react';
import SettingsMenu from './SettingsMenu';

interface Props {
  onLogout: () => void;
}

const AVATAR_PRESETS = [
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Zack',
  'https://api.dicebear.com/7.x/bottts/svg?seed=Midnight',
  'https://api.dicebear.com/7.x/bottts/svg?seed=Socks',
  'https://api.dicebear.com/7.x/notionists/svg?seed=Tigger'
];

const ProfileView: React.FC<Props> = ({ onLogout }) => {
  const userId = getSessionId();
  const user = useLiveQuery(() => userId ? db.users.get(userId) : undefined, [userId]);
  const navigate = useNavigate();
  const [showSettings, setShowSettings] = useState(false);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 500000) { // 500KB limit
        alert("File is too large. Please choose an image under 500KB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        if (userId) await db.users.update(userId, { avatar: base64 });
        setShowAvatarModal(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const selectPreset = async (url: string) => {
    if (userId) await db.users.update(userId, { avatar: url });
    setShowAvatarModal(false);
  };

  if (!user) return <div className="p-4">Loading Profile...</div>;

  if (showSettings) {
    return <SettingsMenu onBack={() => setShowSettings(false)} onLogout={onLogout} />;
  }

  return (
    <div className="space-y-6 relative">
       {/* Nav */}
       <button onClick={() => navigate('/')} className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-gray-800 w-fit bg-white px-3 py-1.5 rounded-full border border-gray-100 shadow-sm">
         <ChevronLeft size={16} /> Back to Home
       </button>

       {/* Big Profile Card */}
       <div className="bg-white rounded-3xl p-8 shadow-lg shadow-gray-100 border border-gray-50 flex flex-col items-center relative overflow-hidden">
           
           {/* Background Blob */}
           <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-r from-green-50 to-emerald-50"></div>

           <div className="relative z-10 flex flex-col items-center group">
               <div className="relative w-24 h-24 rounded-3xl bg-green-400 shadow-xl shadow-green-100 mb-4 cursor-pointer" onClick={() => setShowAvatarModal(true)}>
                   {user.avatar ? (
                     <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover rounded-3xl bg-white" />
                   ) : (
                     <div className="w-full h-full flex items-center justify-center text-4xl text-white font-bold">
                        {user.name.charAt(0)}
                     </div>
                   )}
                   
                   {/* Level Star Badge */}
                   <div className="absolute -bottom-2 -right-2 bg-yellow-400 p-1.5 rounded-full border-2 border-white text-white z-20">
                       <StarIcon size={14} fill="currentColor" />
                   </div>

                   {/* Edit Overlay */}
                   <div className="absolute inset-0 bg-black/30 rounded-3xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10">
                      <Camera size={24} className="text-white" />
                   </div>
               </div>
               
               <button 
                onClick={() => setShowAvatarModal(true)}
                className="absolute top-20 right-0 bg-gray-900 text-white p-2 rounded-full border-2 border-white shadow-md z-30 transform hover:scale-110 transition-transform"
               >
                  <Edit3 size={12} />
               </button>

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

       {/* Avatar Modal */}
       {showAvatarModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
           <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl relative">
              <button 
                onClick={() => setShowAvatarModal(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-800"
              >
                <X size={24} />
              </button>
              
              <h3 className="text-xl font-black text-gray-800 mb-1">Customize Look</h3>
              <p className="text-gray-500 text-sm mb-6">Choose an avatar or upload your own.</p>
              
              <div className="grid grid-cols-3 gap-3 mb-6">
                  {AVATAR_PRESETS.map((url, idx) => (
                      <button 
                        key={idx}
                        onClick={() => selectPreset(url)}
                        className={`aspect-square rounded-2xl border-2 overflow-hidden hover:scale-105 transition-transform ${user.avatar === url ? 'border-green-500 ring-2 ring-green-200' : 'border-gray-100'}`}
                      >
                         <img src={url} alt={`Preset ${idx}`} className="w-full h-full object-cover bg-gray-50" />
                      </button>
                  ))}
              </div>

              <div className="relative">
                 <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-100"></div>
                 </div>
                 <div className="relative flex justify-center text-xs">
                    <span className="bg-white px-2 text-gray-400 uppercase font-bold">Or Upload</span>
                 </div>
              </div>

              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*"
                onChange={handleFileUpload}
              />
              
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="w-full mt-6 bg-blue-50 text-blue-600 border border-blue-200 font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-blue-100 transition-colors"
              >
                 <Upload size={18} /> Upload Photo
              </button>
           </div>
        </div>
       )}

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
