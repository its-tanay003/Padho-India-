
import React, { useEffect, useState } from 'react';
import { HashRouter, Routes, Route, useNavigate, useParams } from 'react-router-dom';
import Layout from './components/Layout';
import GeminiTools from './components/GeminiTools';
import AuthGateway from './components/AuthGateway';
import ProfileView from './components/ProfileView';
import DailyGyanPopup from './components/DailyGyanPopup';
import CoursePlayer from './components/CoursePlayer';
import { db, seedDatabase, addXP } from './db';
import { useLiveQuery } from 'dexie-react-hooks';
import { Play, CheckCircle, Award, BrainCircuit, Loader2, ArrowRight, ChevronLeft, Download, Flame, Star, Lock, Search } from 'lucide-react';
import { isAuthenticated, logoutUser, getSessionId } from './services/authService';
import { useTranslation } from './contexts/LanguageContext';
import { simulateDownload, checkSyncStatus } from './services/networkSim';

// --- COMPONENTS ---

const HomeView: React.FC = () => {
  const userId = getSessionId();
  const user = useLiveQuery(() => userId ? db.users.get(userId) : undefined, [userId]);
  const courses = useLiveQuery(() => db.courses.toArray());
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCourses = courses?.filter(c => 
    c.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.subject.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 pb-8">
      <DailyGyanPopup />

      <div className="flex flex-col lg:flex-row gap-8">
        <div className="flex-1 space-y-6">
            
            {/* Stats Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-3 transition-transform hover:-translate-y-1">
                    <div className="bg-orange-100 p-2 rounded-xl text-orange-500">
                    <Flame size={20} fill="currentColor" />
                    </div>
                    <div>
                    <p className="font-black text-xl text-gray-800">{user?.streak || 0}</p>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Streak</p>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-3 transition-transform hover:-translate-y-1">
                    <div className="bg-teal-100 p-2 rounded-xl text-teal-500">
                    <Star size={20} fill="currentColor" />
                    </div>
                    <div>
                    <p className="font-black text-xl text-gray-800">{user?.xp || 0}</p>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total XP</p>
                    </div>
                </div>
                 <div className="hidden sm:flex bg-white p-4 rounded-2xl shadow-sm border border-gray-100 items-center gap-3 transition-transform hover:-translate-y-1">
                    <div className="bg-purple-100 p-2 rounded-xl text-purple-500">
                    <Award size={20} />
                    </div>
                    <div>
                    <p className="font-black text-xl text-gray-800">{user?.badges?.length || 0}</p>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Badges</p>
                    </div>
                </div>
                 <div className="hidden sm:flex bg-white p-4 rounded-2xl shadow-sm border border-gray-100 items-center gap-3 transition-transform hover:-translate-y-1">
                    <div className="bg-blue-100 p-2 rounded-xl text-blue-500">
                    <CheckCircle size={20} />
                    </div>
                    <div>
                    <p className="font-black text-xl text-gray-800">{user?.quizzesPassed || 0}</p>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Quizzes</p>
                    </div>
                </div>
            </div>

            {/* Hero Banner */}
            <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] p-8 md:p-10 text-white shadow-xl shadow-indigo-200">
                <div className="relative z-10 max-w-lg">
                    <p className="text-indigo-100 font-bold text-xs uppercase tracking-widest mb-2">Today's Adventure</p>
                    <h2 className="text-3xl md:text-5xl font-black leading-tight mb-6">
                    Chalo Padhte Hain,<br/>
                    <span className="text-yellow-300">{user?.name?.split(' ')[0] || 'Dost'}!</span>
                    </h2>
                    <button 
                    onClick={() => navigate('/courses')}
                    className="bg-white text-indigo-600 px-8 py-3.5 rounded-xl font-bold text-sm shadow-lg hover:scale-105 transition-transform active:scale-95 flex items-center gap-2"
                    >
                    Keep Playing <Play size={14} fill="currentColor" />
                    </button>
                </div>
                
                {/* Background Decor */}
                <div className="absolute right-0 bottom-0 opacity-10 font-black text-9xl text-white transform translate-x-4 translate-y-4 select-none">
                    PAD
                </div>
                <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl transform -translate-y-1/2 translate-x-1/2"></div>
            </div>
        </div>

        {/* Desktop Sidebar Area (Leaderboard) */}
        <div className="w-full lg:w-80 shrink-0">
            <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100 h-full sticky top-6">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="font-black text-gray-800 text-lg">Your Progress</h3>
                    <Award className="text-orange-500" />
                </div>
                
                <div className="flex flex-col items-center text-center py-6 bg-gray-50 rounded-2xl border border-gray-100">
                    <div className="w-24 h-24 bg-white shadow-sm rounded-full flex items-center justify-center text-5xl mb-4 relative">
                        🦊
                        <div className="absolute -bottom-2 bg-green-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full border-2 border-white">TOP 10%</div>
                    </div>
                    <p className="font-bold text-gray-800 text-xl">Rank: Explorer</p>
                    <p className="text-xs text-gray-400 font-semibold mb-6 mt-1">Keep learning to level up!</p>
                    
                    <div className="w-full px-6">
                        <div className="flex justify-between text-[10px] font-bold text-gray-400 mb-1">
                            <span>Level 1</span>
                            <span>Level 2</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                            <div className="bg-gradient-to-r from-green-400 to-green-600 h-full rounded-full w-[70%]"></div>
                        </div>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-2">700 XP to next rank</p>
                    </div>
                </div>
                
                <button className="w-full mt-4 bg-gray-900 text-white text-sm font-bold px-4 py-3.5 rounded-xl hover:bg-gray-800 transition-colors shadow-lg shadow-gray-200">
                    View Full Leaderboard
                </button>
            </div>
        </div>
      </div>

            {/* Explore Worlds */}
            <div className="space-y-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <h3 className="font-black text-gray-800 text-xl flex items-center gap-2">
                        {searchQuery ? `Search Results (${filteredCourses?.length})` : 'Explore Worlds'}
                    </h3>
                    
                    {/* Search Bar */}
                    <div className="relative w-full md:max-w-md">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="text-gray-400" size={18} />
                        </div>
                        <input 
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search courses or subjects..."
                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-100 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm font-medium text-gray-700 placeholder-gray-400 transition-all"
                        />
                    </div>
                </div>

                {/* Recommended Path (Personalized) */}
                {!searchQuery && (
                    <div className="bg-gradient-to-r from-emerald-50 to-teal-50 p-6 rounded-[2rem] border border-emerald-100 relative overflow-hidden">
                        <div className="relative z-10">
                            <h4 className="font-black text-emerald-800 text-lg mb-2 flex items-center gap-2">
                                <BrainCircuit size={20} /> Recommended Path
                            </h4>
                            <p className="text-emerald-600 text-sm font-medium mb-4 max-w-lg">
                                Based on your interest in Science, we've curated a special learning path for you.
                            </p>
                            <button 
                                onClick={() => navigate('/course/1')} 
                                className="bg-emerald-600 text-white px-6 py-2.5 rounded-xl font-bold text-xs shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition-colors"
                            >
                                Continue Science Journey
                            </button>
                        </div>
                        <div className="absolute right-0 top-0 opacity-10">
                            <BrainCircuit size={150} className="text-emerald-500 transform translate-x-10 -translate-y-10" />
                        </div>
                    </div>
                )}
                
                {filteredCourses && filteredCourses.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-[2rem] border-2 border-dashed border-gray-100">
                <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3 text-gray-300">
                    <Search size={24} />
                </div>
                <p className="text-gray-400 font-bold">No courses found matching "{searchQuery}"</p>
                <p className="text-xs text-gray-300 mt-1">Try searching for 'Math' or 'Science'</p>
            </div>
        ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
                {filteredCourses?.map((course, idx) => {
                    const styles = [
                        { bg: 'from-slate-700 to-slate-900', accent: 'text-slate-200', icon: '📐' },
                        { bg: 'from-blue-500 to-cyan-500', accent: 'text-blue-100', icon: '🧪' },
                        { bg: 'from-purple-500 to-pink-500', accent: 'text-purple-100', icon: '📚' },
                        { bg: 'from-emerald-500 to-teal-500', accent: 'text-emerald-100', icon: '🌍' },
                    ];
                    const style = styles[idx % styles.length];

                    return (
                        <div 
                            key={course.id}
                            onClick={() => navigate(`/course/${course.id}`)}
                            className="group cursor-pointer flex flex-col h-full"
                        >
                            <div className={`h-56 rounded-[2rem] bg-gradient-to-br ${style.bg} p-6 flex flex-col justify-between shadow-lg relative overflow-hidden transition-all duration-300 group-hover:-translate-y-2 group-hover:shadow-2xl`}>
                                <div className="text-6xl drop-shadow-md transform group-hover:scale-110 transition-transform duration-500">{style.icon}</div>
                                {course.isDownloaded && (
                                    <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-md p-2 rounded-full text-white border border-white/10">
                                        <Download size={16} />
                                    </div>
                                )}
                                <div className="relative z-10">
                                    <p className={`text-xs font-bold uppercase tracking-wider opacity-80 text-white mb-1`}>{course.subject}</p>
                                    <h4 className="text-white font-bold text-2xl leading-tight">{course.title}</h4>
                                </div>
                                {/* Decorative circle */}
                                <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
                            </div>
                            <button className="mt-4 w-full text-center text-sm font-bold text-gray-400 group-hover:text-blue-600 flex items-center justify-center gap-1.5 transition-colors">
                                START LEARNING <ArrowRight size={14} />
                            </button>
                        </div>
                    );
                })}
            </div>
        )}
      </div>

    </div>
  );
};

const CourseView: React.FC = () => {
  const { id } = useParams();
  const courseId = parseInt(id || '0');
  const course = useLiveQuery(() => db.courses.get(courseId), [courseId]);
  const modules = useLiveQuery(() => db.modules.where('courseId').equals(courseId).toArray(), [courseId]);
  const navigate = useNavigate();
  const [downloadingModuleId, setDownloadingModuleId] = useState<number | null>(null);

  if (!course) return <div className="p-12 flex justify-center"><Loader2 className="animate-spin text-blue-500" size={32} /></div>;

  const progress = Math.round((course.completedModules / course.totalModules) * 100) || 0;

  const handlePlayModule = async (modId: number) => {
    if (course.isDownloaded) {
        navigate(`/module/${modId}`);
        return;
    }

    setDownloadingModuleId(modId);
    try {
        await simulateDownload(course.id!);
        navigate(`/module/${modId}`);
    } catch (e) {
        console.error("Download failed", e);
    } finally {
        setDownloadingModuleId(null);
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-10">
      <button 
        onClick={() => navigate('/')} 
        className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-gray-800 transition-colors bg-white px-4 py-2 rounded-full border border-gray-100 shadow-sm w-fit"
      >
        <ChevronLeft size={16} /> Back to Dashboard
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Course Info */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100 sticky top-6">
                <div className="w-28 h-28 rounded-[1.5rem] bg-blue-50 flex items-center justify-center text-6xl shadow-inner mb-6 mx-auto lg:mx-0">
                    📖
                </div>
                
                <h2 className="text-3xl lg:text-4xl font-black text-gray-800 leading-tight mb-4">{course.title}</h2>
                <p className="text-gray-500 font-medium text-sm leading-relaxed mb-8">
                    {course.description}
                </p>

                <div className="space-y-4 mb-8">
                     <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-gray-400">
                         <span>Syllabus Progress</span>
                         <span className="text-blue-600">{progress}%</span>
                     </div>
                     <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden">
                         <div className="h-full bg-blue-500 rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(59,130,246,0.5)]" style={{ width: `${progress}%` }}></div>
                     </div>
                </div>

                <div className="flex flex-wrap gap-2">
                    <span className="px-4 py-2 bg-green-50 text-green-700 text-xs font-bold uppercase rounded-xl flex items-center gap-1.5 border border-green-100">
                        Beginner
                    </span>
                    <span className="px-4 py-2 bg-orange-50 text-orange-700 text-xs font-bold uppercase rounded-xl flex items-center gap-1.5 border border-orange-100">
                        <Flame size={12} /> 500 XP
                    </span>
                </div>
            </div>
          </div>

          {/* Right: Module List */}
          <div className="lg:col-span-2">
             <h3 className="font-black text-gray-800 text-2xl mb-6">Path to Mastery</h3>
             <div className="space-y-4">
                {modules?.map((mod, idx) => (
                    <div key={mod.id} className="group bg-white rounded-[1.5rem] p-6 border border-gray-100 shadow-sm flex items-center justify-between transition-all hover:border-blue-200 hover:shadow-lg">
                        <div className="flex items-center gap-6">
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-lg shrink-0 transition-colors ${mod.isCompleted ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400 group-hover:bg-blue-50 group-hover:text-blue-500'}`}>
                                {mod.isCompleted ? <CheckCircle size={24} /> : (idx + 1)}
                            </div>
                            <div>
                                <h4 className="font-bold text-gray-800 text-lg mb-1">{mod.title}</h4>
                                <div className="flex items-center gap-3">
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider bg-gray-50 px-2 py-0.5 rounded border border-gray-100">{mod.type}</span>
                                    {mod.isCompleted && <span className="text-[10px] font-bold text-green-500 uppercase tracking-wider flex items-center gap-0.5">✓ Completed</span>}
                                </div>
                            </div>
                        </div>
                        
                        <div className="pl-4">
                            {mod.type === 'quiz' ? (
                                <button 
                                    onClick={() => navigate(`/module/${mod.id}`)}
                                    className="bg-orange-500 text-white px-6 py-3 rounded-xl font-bold text-xs shadow-md shadow-orange-200 active:scale-95 transition-transform hover:bg-orange-600 hover:shadow-lg tracking-wider"
                                >
                                    QUIZ
                                </button>
                            ) : (
                                <button 
                                    onClick={() => handlePlayModule(mod.id!)}
                                    disabled={downloadingModuleId === mod.id}
                                    className={`px-6 py-3 rounded-xl font-bold text-xs shadow-md active:scale-95 transition-transform flex items-center justify-center tracking-wider ${downloadingModuleId === mod.id ? 'bg-blue-400 cursor-not-allowed w-32' : 'bg-blue-600 shadow-blue-200 hover:bg-blue-700 w-28 hover:shadow-lg'} text-white transition-all duration-300`}
                                >
                                    {downloadingModuleId === mod.id ? (
                                        <div className="flex items-center gap-2">
                                            <Loader2 size={14} className="animate-spin" />
                                            <span className="text-[10px]">Loading...</span>
                                        </div>
                                    ) : "PLAY"}
                                </button>
                            )}
                        </div>
                    </div>
                ))}
             </div>
          </div>
      </div>
    </div>
  );
};

const ModuleView: React.FC = () => {
  const { id } = useParams();
  const moduleId = parseInt(id || '0');
  const moduleData = useLiveQuery(() => db.modules.get(moduleId), [moduleId]);
  const navigate = useNavigate();
  const [showQuiz, setShowQuiz] = useState(false);
  const [justFinished, setJustFinished] = useState(false);
  const { t } = useTranslation();

  const handleFinish = async () => {
    if (!moduleData) return;
    await db.modules.update(moduleData.id!, { isCompleted: true });
    
    const course = await db.courses.get(moduleData.courseId);
    if (course) {
        const count = await db.modules.where('courseId').equals(moduleData.courseId).filter(l => l.isCompleted).count();
        await db.courses.update(course.id!, { completedModules: count });
    }
    setJustFinished(true);
    setTimeout(() => {
        navigate(`/course/${moduleData.courseId}`);
    }, 1500);
  };

  if (!moduleData) return <div className="p-12 text-center text-gray-400 font-bold">Loading content...</div>;

  return (
    <div className="flex flex-col h-full space-y-6 max-w-7xl mx-auto pb-10">
       <button onClick={() => navigate(`/course/${moduleData.courseId}`)} className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-gray-800 w-fit bg-white px-4 py-2 rounded-full shadow-sm border border-gray-100 transition-colors">
         <ChevronLeft size={16} /> Back to Course
       </button>
       
       <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-full">
            <div className="lg:col-span-2 space-y-6">
                 <div className="bg-black rounded-[2rem] overflow-hidden shadow-2xl">
                    {moduleData.type === 'video' ? (
                        <CoursePlayer 
                            module={moduleData} 
                            onComplete={handleFinish} 
                            poster="https://picsum.photos/800/400"
                        />
                    ) : (
                        <div className="aspect-video bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center flex-col p-12 text-center">
                            <div className="bg-white p-6 rounded-full shadow-xl mb-6">
                                <BrainCircuit size={48} className="text-blue-500" />
                            </div>
                            <h2 className="text-3xl font-black text-blue-900 mb-2">Interactive Quiz</h2>
                            <p className="text-blue-500 font-medium">Test your knowledge to proceed to the next level</p>
                        </div>
                    )}
                 </div>
                 
                 <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100">
                     <h2 className="text-3xl font-black text-gray-800 mb-2">{moduleData.title}</h2>
                     <p className="text-gray-500 text-sm font-medium flex items-center gap-2">
                        <span className="bg-gray-100 px-2 py-1 rounded text-xs font-bold text-gray-600 uppercase">Lesson 1</span>
                        • {moduleData.type === 'video' ? 'Video Format' : 'Interactive Quiz'}
                     </p>
                 </div>
            </div>

            <div className="lg:col-span-1 flex flex-col h-full">
                <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100 flex-1 flex flex-col h-full sticky top-6">
                     <h3 className="font-bold text-gray-800 mb-4 uppercase text-xs tracking-wider border-b border-gray-100 pb-4">Lesson Notes</h3>
                     <div className="prose prose-sm text-gray-600 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                        <p className="leading-relaxed text-base">{moduleData.content}</p>
                     </div>

                     <div className="mt-6 pt-6 border-t border-gray-100">
                        {!justFinished && !moduleData.isCompleted && (
                        <>
                            {moduleData.type === 'quiz' || showQuiz ? (
                                <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100 animate-in slide-in-from-bottom-4">
                                    <h4 className="font-bold mb-4 text-lg text-blue-900 leading-tight">{moduleData.quiz?.question}</h4>
                                    <div className="grid gap-3">
                                    {moduleData.quiz?.options.map((opt, idx) => (
                                        <button 
                                        key={idx}
                                        onClick={() => {
                                            if (idx === moduleData.quiz?.correctIndex) {
                                                addXP(50);
                                                handleFinish();
                                            } else {
                                                alert(t('try_again'));
                                            }
                                        }}
                                        className="w-full text-left p-4 rounded-xl bg-white hover:bg-blue-600 hover:text-white border border-blue-200 font-bold text-sm transition-all shadow-sm hover:shadow-md"
                                        >
                                        {opt}
                                        </button>
                                    ))}
                                    </div>
                                </div>
                            ) : (
                                moduleData.type !== 'video' && (
                                    <button onClick={() => moduleData.quiz ? setShowQuiz(true) : handleFinish()} className="w-full bg-gray-900 text-white py-4 rounded-2xl font-bold text-lg shadow-xl active:scale-95 transition-transform flex items-center justify-center gap-2 hover:bg-black hover:shadow-2xl">
                                        {moduleData.quiz ? "Start Quiz" : "Complete Module"} <ArrowRight size={20} />
                                    </button>
                                )
                            )}
                        </>
                        )}

                        {(moduleData.isCompleted || justFinished) && (
                            <div className="bg-green-50 border border-green-100 text-green-700 p-8 rounded-2xl text-center font-bold flex flex-col items-center justify-center gap-3 animate-in zoom-in duration-300">
                                <div className="bg-green-100 p-3 rounded-full">
                                    <Award size={32} /> 
                                </div>
                                <span className="text-xl">Module Completed!</span>
                                <span className="text-xs uppercase tracking-wide opacity-80 font-black bg-green-200 px-3 py-1 rounded-full text-green-800">+50 XP Earned</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
       </div>
    </div>
  );
};

import VoiceControl from './components/VoiceControl';
import AnalyticsView from './components/AnalyticsView';

// --- MAIN APP COMPONENT ---

const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    seedDatabase().then(() => {
        setIsLoggedIn(isAuthenticated());
        setCheckingAuth(false);
    });

    const handleOnline = () => checkSyncStatus();
    window.addEventListener('online', handleOnline);
    checkSyncStatus();

    return () => window.removeEventListener('online', handleOnline);
  }, []);

  const handleLogin = () => {
    setIsLoggedIn(true);
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    logoutUser();
    if (window.location.hash) window.location.hash = ''; 
    setIsLoggedIn(false);
    setIsLoggingOut(false);
  };

  if (checkingAuth) return <div className="min-h-screen flex items-center justify-center bg-[#F0F2F5] text-gray-400 font-bold">Loading...</div>;

  if (isLoggingOut) return <div className="min-h-screen flex items-center justify-center bg-[#F0F2F5] text-gray-400 font-bold"><Loader2 className="animate-spin mr-2"/> Logging out...</div>;

  if (!isLoggedIn) {
    return (
      <AuthGateway onLoginSuccess={handleLogin} />
    );
  }

  return (
    <HashRouter>
    <Layout>
        <VoiceControl />
        <Routes>
        <Route path="/" element={<HomeView />} />
        <Route path="/courses" element={<HomeView />} />
        <Route path="/course/:id" element={<CourseView />} />
        <Route path="/module/:id" element={<ModuleView />} />
        <Route path="/ai-tools" element={<GeminiTools />} />
        <Route path="/profile" element={<ProfileView onLogout={handleLogout} />} />
        <Route path="/analytics" element={<AnalyticsView />} />
        </Routes>
    </Layout>
    </HashRouter>
  );
};

export default App;
