
import React, { useState, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, updateUser } from '../db';
import { getSessionId } from '../services/authService';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, MapPin, Mail, Phone, Trophy, Settings, Camera, Upload, X, Check } from 'lucide-react';
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
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert("Please upload an image file (JPEG, PNG, etc).");
        return;
      }
      // Validate file size (500KB)
      if (file.size > 500000) { 
        alert("File is too large. Please choose an image under 500KB.");
        return;
      }

      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        if (userId) {
            await updateUser(userId, { avatar: base64 });
        }
        setShowAvatarModal(false);
      };
      reader.readAsDataURL(file);
    }
    // Reset input
    e.target.value = '';
  };

  const selectPreset = async (url: string) => {
    if (userId) await updateUser(userId, { avatar: url });
    setShowAvatarModal(false);
  };

  if (!user) return <div className="p-4 flex justify-center items-center h-full">Loading Profile...</div>;

  if (showSettings) {
    return <SettingsMenu onBack={() => setShowSettings(false)} onLogout={onLogout} />;
  }

  return (
    <div className="space-y-6 relative animate-in slide-in-from-right duration-300">
       {/* Nav */}
       <button onClick={() => navigate('/')} className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-gray-800 w-fit bg-white px-3 py-1.5 rounded-full border border-gray-100 shadow-sm transition-colors">
         <ChevronLeft size={16} /> Back to Home
       </button>

       {/* Big Profile Card */}
       <div className="bg-white rounded-[2rem] p-8 shadow-xl shadow-gray-100 border border-gray-50 flex flex-col items-center relative overflow-hidden">
           
           {/* Background Blob */}
           <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-blue-50 to-white"></div>

           <div className="relative z-10 flex flex-col items-center group">
               <div 
                 className="relative w-32 h-32 rounded-full border-4 border-white shadow-2xl mb-4 cursor-pointer hover:scale-105 transition-transform duration-300 bg-gray-100 flex-shrink-0"
                 onClick={() => setShowAvatarModal(true)}
               >
                   {user.avatar ? (
                     <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover rounded-full" />
                   ) : (
                     <div className="w-full h-full flex items-center justify-center text-5xl text-gray-400 font-black bg-gray-100 rounded-full">
                        {user.name.charAt(0)}
                     </div>
                   )}
                   
                   {/* Level Star Badge */}
                   <div className="absolute bottom-0 right-0 bg-yellow-400 p-2 rounded-full border-4 border-white text-white z-20 shadow-sm">
                       <StarIcon size={16} fill="currentColor" />
                   </div>

                   {/* Edit Overlay */}
                   <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10 backdrop-blur-[2px]">
                      <Camera size={32} className="text-white drop-shadow-md" />
                      <span className="absolute bottom-6 text-[10px] font-bold text-white uppercase tracking-wider">Edit</span>
                   </div>
               </div>

               <h2 className="text-2xl font-black text-gray-800 text-center">{user.name}</h2>
               <div className="flex items-center gap-2 mt-1">
                 <span className="px-3 py-1 bg-yellow-100 text-yellow-700 text-[10px] font-bold uppercase tracking-wider rounded-full border border-yellow-200">
                   Level {user.level} Explorer
                 </span>
               </div>
           </div>

           {/* Info List */}
           <div className="w-full max-w-md mt-8 space-y-4">
                <div className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50 border border-gray-100 transition-colors hover:bg-white hover:shadow-md hover:border-blue-100 group">
                    <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-blue-500 shadow-sm border border-gray-100 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                        <Mail size={18} />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Email Address</p>
                        <p className="font-bold text-gray-800 text-sm truncate">{user.email || 'No email linked'}</p>
                    </div>
                </div>

                <div className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50 border border-gray-100 transition-colors hover:bg-white hover:shadow-md hover:border-blue-100 group">
                    <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-green-500 shadow-sm border border-gray-100 group-hover:bg-green-500 group-hover:text-white transition-colors">
                        <Phone size={18} />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Mobile Number</p>
                        <p className="font-bold text-gray-800 text-sm">{user.phoneNumber || 'Not provided'}</p>
                    </div>
                </div>

                <div className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50 border border-gray-100 transition-colors hover:bg-white hover:shadow-md hover:border-blue-100 group">
                    <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-purple-500 shadow-sm border border-gray-100 group-hover:bg-purple-500 group-hover:text-white transition-colors">
                        <MapPin size={18} />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Location</p>
                        <p className="font-bold text-gray-800 text-sm">India</p>
                    </div>
                </div>
           </div>

           {/* Achievements */}
           <div className="w-full max-w-md mt-8">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-black text-gray-800 text-lg">Achievements</h3>
                    <span className="text-xs font-bold text-gray-400 bg-gray-100 px-2 py-1 rounded-lg">{user.badges.length} Unlocked</span>
                </div>
                
                <div className="flex gap-3 overflow-x-auto pb-4 no-scrollbar mask-gradient-right">
                    {user.badges.map((b, i) => (
                        <div key={i} className="flex-shrink-0 bg-gradient-to-br from-orange-50 to-white border border-orange-100 p-3 rounded-2xl flex items-center gap-3 shadow-sm min-w-[160px]">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-white shadow-md">
                                <Trophy size={16} />
                            </div>
                            <div className="flex flex-col">
                                <span className="font-bold text-xs text-gray-800 leading-tight">{b}</span>
                                <span className="text-[9px] text-gray-400 font-bold uppercase mt-1">Earned</span>
                            </div>
                        </div>
                    ))}
                    {user.badges.length === 0 && (
                        <div className="w-full p-6 text-center border-2 border-dashed border-gray-200 rounded-2xl text-gray-400 text-sm font-medium">
                            Complete quizzes to earn badges!
                        </div>
                    )}
                </div>
           </div>

           {/* Big CTA Button */}
           <button 
             onClick={() => setShowSettings(true)}
             className="w-full max-w-md bg-gray-900 text-white font-bold py-4 rounded-2xl mt-8 shadow-xl shadow-gray-200 active:scale-95 transition-all flex items-center justify-center gap-2 hover:bg-black"
           >
             <Settings size={18} /> Settings & Logout
           </button>

       </div>

       {/* Avatar Modal */}
       {showAvatarModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
           <div className="bg-white rounded-[2rem] p-6 w-full max-w-sm shadow-2xl relative animate-in zoom-in-95 duration-200 border border-white/20">
              <button 
                onClick={() => setShowAvatarModal(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-800 p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
              
              <div className="text-center mb-6">
                <h3 className="text-xl font-black text-gray-800">Customize Look</h3>
                <p className="text-gray-500 text-sm mt-1">Choose an avatar or upload your own.</p>
              </div>
              
              <div className="grid grid-cols-3 gap-4 mb-8">
                  {AVATAR_PRESETS.map((url, idx) => (
                      <button 
                        key={idx}
                        onClick={() => selectPreset(url)}
                        className={`aspect-square rounded-2xl border-2 overflow-hidden hover:scale-105 active:scale-95 transition-all relative group ${user.avatar === url ? 'border-blue-500 ring-4 ring-blue-100' : 'border-gray-100 hover:border-blue-200'}`}
                      >
                         <img src={url} alt={`Preset ${idx}`} className="w-full h-full object-cover bg-gray-50" />
                         {user.avatar === url && (
                             <div className="absolute inset-0 bg-blue-500/20 flex items-center justify-center">
                                 <div className="bg-blue-500 text-white p-1 rounded-full">
                                     <Check size={12} strokeWidth={4} />
                                 </div>
                             </div>
                         )}
                      </button>
                  ))}
              </div>

              <div className="relative mb-6">
                 <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-100"></div>
                 </div>
                 <div className="relative flex justify-center text-xs">
                    <span className="bg-white px-3 text-gray-400 uppercase font-bold tracking-wider">Or Upload Photo</span>
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
                className="w-full bg-blue-50 text-blue-600 border border-blue-200 font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 hover:bg-blue-100 active:bg-blue-200 transition-colors"
              >
                 <Upload size={18} /> Upload from Device
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
