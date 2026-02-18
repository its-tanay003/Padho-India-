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
import { LanguageProvider, useTranslation } from './contexts/LanguageContext';
import { simulateDownload, checkSyncStatus } from './services/networkSim';

// --- STYLED COMPONENTS ---

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
    <div className="space-y-6 pb-8">
      <DailyGyanPopup />

      {/* Search Bar */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="text-gray-400" size={18} />
        </div>
        <input 
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search courses, subjects..."
          className="w-full pl-10 pr-4 py-3 bg-white border border-gray-100 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm font-medium text-gray-700 placeholder-gray-400 transition-all"
        />
      </div>

      {/* Stats Row */}
      <div className="flex gap-4">
         <div className="flex-1 bg-white p-3 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-3">
            <div className="bg-orange-100 p-2 rounded-xl text-orange-500">
               <Flame size={20} fill="currentColor" />
            </div>
            <div>
               <p className="font-black text-xl text-gray-800">{user?.streak || 0}</p>
               <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Streak</p>
            </div>
         </div>
         <div className="flex-1 bg-white p-3 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-3">
            <div className="bg-teal-100 p-2 rounded-xl text-teal-500">
               <Star size={20} fill="currentColor" />
            </div>
            <div>
               <p className="font-black text-xl text-gray-800">{user?.xp || 0}</p>
               <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total XP</p>
            </div>
         </div>
      </div>

      {/* Hero Banner - Matches "Chalo Padhte Hain" Screenshot */}
      <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] p-6 text-white shadow-xl shadow-indigo-200">
        <div className="relative z-10">
            <p className="text-indigo-100 font-bold text-xs uppercase tracking-widest mb-1">Today's Adventure</p>
            <h2 className="text-2xl font-black leading-tight mb-4">
              Chalo Padhte Hain,<br/>
              <span className="text-yellow-300">{user?.name?.split(' ')[0] || 'Dost'}!</span>
            </h2>
            <button 
              onClick={() => navigate('/courses')}
              className="bg-white text-indigo-600 px-5 py-2.5 rounded-xl font-bold text-sm shadow-lg hover:scale-105 transition-transform active:scale-95 flex items-center gap-2"
            >
              Keep Playing <Play size={14} fill="currentColor" />
            </button>
        </div>
        
        {/* Background Decor */}
        <div className="absolute right-0 bottom-0 opacity-10 font-black text-8xl text-white transform translate-x-4 translate-y-4">
            PAD
        </div>
        <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-5 rounded-full blur-2xl transform -translate-y-1/2 translate-x-1/2"></div>
      </div>

      {/* Explore Worlds */}
      <div>
        <h3 className="font-black text-gray-800 text-lg mb-4">
            {searchQuery ? `Search Results (${filteredCourses?.length})` : 'Explore Worlds'}
        </h3>
        
        {filteredCourses && filteredCourses.length === 0 ? (
            <div className="text-center py-8 bg-white rounded-2xl border border-dashed border-gray-200">
                <p className="text-gray-400 font-medium text-sm">No courses found matching "{searchQuery}"</p>
            </div>
        ) : (
            <div className="flex gap-4 overflow-x-auto pb-4 snap-x no-scrollbar">
                {filteredCourses?.map((course, idx) => {
                    // Determine styling based on index/subject
                    const styles = [
                        { bg: 'from-slate-700 to-slate-900', accent: 'text-slate-200', icon: '📐' }, // Math
                        { bg: 'from-blue-500 to-cyan-500', accent: 'text-blue-100', icon: '🧪' },   // Science
                        { bg: 'from-purple-500 to-pink-500', accent: 'text-purple-100', icon: '📚' }, // English
                        { bg: 'from-emerald-500 to-teal-500', accent: 'text-emerald-100', icon: '🌍' }, // History
                    ];
                    const style = styles[idx % styles.length];

                    return (
                        <div 
                            key={course.id}
                            onClick={() => navigate(`/course/${course.id}`)}
                            className="min-w-[160px] snap-start cursor-pointer group"
                        >
                            <div className={`h-40 rounded-3xl bg-gradient-to-br ${style.bg} p-4 flex flex-col justify-between shadow-lg relative overflow-hidden transition-transform group-active:scale-95`}>
                                <div className="text-4xl">{style.icon}</div>
                                {course.isDownloaded && (
                                    <div className="absolute top-3 right-3 bg-white/20 backdrop-blur-sm p-1.5 rounded-full text-white">
                                        <Download size={12} />
                                    </div>
                                )}
                                <div>
                                    <p className={`text-[10px] font-bold uppercase tracking-wider opacity-80 text-white`}>{course.subject}</p>
                                    <h4 className="text-white font-bold text-lg leading-tight">{course.title}</h4>
                                </div>
                            </div>
                            <button className="mt-2 w-full text-center text-xs font-bold text-gray-400 group-hover:text-blue-600 flex items-center justify-center gap-1 transition-colors">
                                START <ArrowRight size={12} />
                            </button>
                        </div>
                    );
                })}
            </div>
        )}
      </div>
      
      {/* Leaderboard Teaser */}
      {!searchQuery && (
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center justify-between">
             <div className="flex items-center gap-3">
                 <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center text-2xl">
                     🦊
                 </div>
                 <div>
                     <p className="font-bold text-gray-800">Your Rank: Explorer</p>
                     <p className="text-xs text-green-500 font-semibold">You're in the top 10% this week!</p>
                 </div>
             </div>
             <button className="bg-gray-900 text-white text-xs font-bold px-3 py-2 rounded-lg">
                 See Leaderboard
             </button>
          </div>
      )}

    </div>
  );
};

const CourseView: React.FC = () => {
  const { id } = useParams();
  const courseId = parseInt(id || '0');
  const course = useLiveQuery(() => db.courses.get(courseId), [courseId]);
  const modules = useLiveQuery(() => db.modules.where('courseId').equals(courseId).toArray(), [courseId]);
  const navigate = useNavigate();
  const { t } = useTranslation();
  
  const [downloadingModuleId, setDownloadingModuleId] = useState<number | null>(null);

  if (!course) return <div className="p-4 flex justify-center"><Loader2 className="animate-spin text-blue-500" /></div>;

  const progress = Math.round((course.completedModules / course.totalModules) * 100) || 0;

  const handlePlayModule = async (modId: number) => {
    // If course is already downloaded or module is complete, navigate immediately
    if (course.isDownloaded) {
        navigate(`/module/${modId}`);
        return;
    }

    // Simulate download delay for visual feedback
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
    <div className="space-y-6">
      {/* Nav Back */}
      <button 
        onClick={() => navigate('/')} 
        className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-gray-800 transition-colors bg-white px-3 py-1.5 rounded-full border border-gray-100 shadow-sm w-fit"
      >
        <ChevronLeft size={16} /> Back to Dashboard
      </button>

      {/* Course Header Card - Matches "English Fun" Screenshot */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
         <div className="flex gap-4 mb-4">
             <div className="w-20 h-20 rounded-2xl bg-blue-50 flex items-center justify-center text-4xl shadow-inner">
                 📖
             </div>
             <div className="flex-1">
                 <h2 className="text-2xl font-black text-gray-800 leading-none mb-2">{course.title}</h2>
                 <div className="space-y-2">
                     <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-gray-400">
                         <span>Syllabus Progress</span>
                         <span className="text-blue-600">{progress}%</span>
                     </div>
                     <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                         <div className="h-full bg-blue-500 rounded-full transition-all duration-1000" style={{ width: `${progress}%` }}></div>
                     </div>
                 </div>
             </div>
         </div>
         
         <p className="text-gray-600 text-sm leading-relaxed mb-4">
            {course.description}
         </p>

         <div className="flex gap-2">
             <span className="px-2 py-1 bg-green-50 text-green-700 text-[10px] font-bold uppercase rounded flex items-center gap-1">
                 Beginner
             </span>
             <span className="px-2 py-1 bg-orange-50 text-orange-700 text-[10px] font-bold uppercase rounded flex items-center gap-1">
                 <Flame size={10} /> 500 XP
             </span>
         </div>
      </div>

      {/* Module List - Matches "Path to Mastery" style */}
      <div>
         <h3 className="font-black text-gray-800 text-lg mb-4">Path to Mastery</h3>
         <div className="space-y-3">
            {modules?.map((mod, idx) => (
                <div key={mod.id} className="group bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex items-center justify-between transition-all hover:border-blue-200">
                    <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-lg ${mod.isCompleted ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                            {mod.isCompleted ? <CheckCircle size={20} /> : (idx + 1)}
                        </div>
                        <div>
                            <h4 className="font-bold text-gray-800 text-sm">{mod.title}</h4>
                            <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{mod.type}</span>
                                {mod.isCompleted && <span className="text-[10px] font-bold text-green-500 uppercase tracking-wider flex items-center gap-0.5">✓ Saved</span>}
                            </div>
                        </div>
                    </div>
                    
                    {mod.type === 'quiz' ? (
                         <button 
                            onClick={() => navigate(`/module/${mod.id}`)}
                            className="bg-orange-500 text-white px-4 py-2 rounded-xl font-bold text-xs shadow-md shadow-orange-200 active:scale-95 transition-transform"
                        >
                            QUIZ
                        </button>
                    ) : (
                        <button 
                            onClick={() => handlePlayModule(mod.id!)}
                            disabled={downloadingModuleId === mod.id}
                            className={`px-4 py-2 rounded-xl font-bold text-xs shadow-md active:scale-95 transition-transform flex items-center justify-center w-20 ${downloadingModuleId === mod.id ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 shadow-blue-200 hover:bg-blue-700'} text-white`}
                        >
                            {downloadingModuleId === mod.id ? <Loader2 size={16} className="animate-spin" /> : "PLAY"}
                        </button>
                    )}
                </div>
            ))}
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
    // Note: CoursePlayer handles XP separately for videos, but we can double check logic here if needed.
    // For now, we rely on CoursePlayer calling this onComplete.
    
    // Only add XP here if it's NOT a video (CoursePlayer handles video XP) or if we want a completion bonus.
    // CoursePlayer adds 50 XP. We can just handle the module marking here.
    
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

  if (!moduleData) return <div>Loading...</div>;

  return (
    <div className="flex flex-col h-full space-y-4">
       <button onClick={() => navigate(`/course/${moduleData.courseId}`)} className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-gray-800 w-fit">
         <ChevronLeft size={16} /> Back to Course
       </button>
       
       <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex-1 flex flex-col">
            <h2 className="text-2xl font-black text-gray-800 mb-4">{moduleData.title}</h2>
            
            {moduleData.type === 'video' && (
                <div className="mb-6">
                    <CoursePlayer 
                        module={moduleData} 
                        onComplete={handleFinish} 
                        poster="https://picsum.photos/800/400"
                    />
                </div>
            )}

            <div className="prose prose-sm text-gray-600 flex-1">
                <p>{moduleData.content}</p>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-100">
                {!justFinished && !moduleData.isCompleted && (
                <>
                    {moduleData.type === 'quiz' || showQuiz ? (
                        <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100">
                            <h4 className="font-bold mb-4 text-lg text-blue-900">{moduleData.quiz?.question}</h4>
                            <div className="grid gap-3">
                            {moduleData.quiz?.options.map((opt, idx) => (
                                <button 
                                key={idx}
                                onClick={() => {
                                    if (idx === moduleData.quiz?.correctIndex) {
                                        addXP(50); // XP for Quiz
                                        handleFinish();
                                    } else {
                                        alert(t('try_again'));
                                    }
                                }}
                                className="w-full text-left p-4 rounded-xl bg-white hover:bg-blue-600 hover:text-white border border-blue-200 font-bold text-sm transition-all shadow-sm"
                                >
                                {opt}
                                </button>
                            ))}
                            </div>
                        </div>
                    ) : (
                        // If it's a video, the "Complete" button is less relevant as the video player handles it, 
                        // but we keep it for manual override or text-only modules.
                        moduleData.type !== 'video' && (
                            <button onClick={() => moduleData.quiz ? setShowQuiz(true) : handleFinish()} className="w-full bg-gray-900 text-white py-4 rounded-2xl font-bold text-lg shadow-xl active:scale-95 transition-transform flex items-center justify-center gap-2">
                                {moduleData.quiz ? "Start Quiz" : "Complete Module"} <ArrowRight size={20} />
                            </button>
                        )
                    )}
                </>
                )}

                {(moduleData.isCompleted || justFinished) && (
                    <div className="bg-green-100 text-green-700 p-4 rounded-2xl text-center font-bold flex items-center justify-center gap-2 animate-in zoom-in duration-300">
                        <Award size={24} /> Module Completed!
                    </div>
                )}
            </div>
       </div>
    </div>
  );
};

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

    // Auto-sync when online
    const handleOnline = () => checkSyncStatus();
    window.addEventListener('online', handleOnline);
    // Initial check
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
      <LanguageProvider>
        <AuthGateway onLoginSuccess={handleLogin} />
      </LanguageProvider>
    );
  }

  return (
    <LanguageProvider>
      <HashRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<HomeView />} />
            <Route path="/courses" element={<HomeView />} />
            <Route path="/course/:id" element={<CourseView />} />
            <Route path="/module/:id" element={<ModuleView />} />
            <Route path="/ai-tools" element={<GeminiTools />} />
            <Route path="/profile" element={<ProfileView onLogout={handleLogout} />} />
          </Routes>
        </Layout>
      </HashRouter>
    </LanguageProvider>
  );
};

export default App;