import React, { useEffect, useState } from 'react';
import { HashRouter, Routes, Route, useNavigate, useParams } from 'react-router-dom';
import Layout from './components/Layout';
import CourseCard from './components/CourseCard';
import GeminiTools from './components/GeminiTools';
import AuthGateway from './components/AuthGateway';
import ProfileView from './components/ProfileView';
import DailyGyanPopup from './components/DailyGyanPopup';
import { db, seedDatabase, addXP } from './db';
import { useLiveQuery } from 'dexie-react-hooks';
import { Play, CheckCircle, Award, BrainCircuit, Loader2 } from 'lucide-react';
import { isAuthenticated, logoutUser } from './services/authService';
import { LanguageProvider, useTranslation } from './contexts/LanguageContext';

// --- SUB-COMPONENTS FOR ROUTING ---

const HomeView: React.FC = () => {
  const courses = useLiveQuery(() => db.courses.toArray());
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div className="space-y-4">
      <DailyGyanPopup />
      <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl p-6 text-white shadow-lg">
        <h2 className="text-2xl font-bold mb-2">Namaste! 🙏</h2>
        <p className="opacity-90">{t('tagline')}</p>
      </div>

      <div>
        <h3 className="font-bold text-gray-800 mb-3 text-lg">{t('learn')}</h3>
        {courses?.map(course => (
          <CourseCard key={course.id} course={course} onClick={() => navigate(`/course/${course.id}`)} />
        ))}
        {(!courses || courses.length === 0) && <p className="text-center text-gray-500 py-4">Loading...</p>}
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
  const { t } = useTranslation();

  if (!course) return <div className="p-4">Loading...</div>;

  return (
    <div className="space-y-4">
      <button onClick={() => navigate('/')} className="text-sm text-blue-600 mb-2 font-medium">← {t('home')}</button>
      <div className="flex justify-between items-start">
         <h2 className="text-2xl font-bold text-gray-800">{course.title}</h2>
         {course.isDownloaded && <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full font-medium">{t('available_offline')}</span>}
      </div>
      <p className="text-gray-600">{course.description}</p>
      
      <div className="space-y-3 mt-4">
        {modules?.map((mod, idx) => (
          <div 
             key={mod.id} 
             onClick={() => navigate(`/module/${mod.id}`)}
             className={`p-4 rounded-xl border flex items-center justify-between cursor-pointer ${mod.isCompleted ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200 hover:border-blue-300'}`}
          >
             <div className="flex items-center space-x-3">
               <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${mod.isCompleted ? 'bg-green-200 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                 {idx + 1}
               </div>
               <div>
                 <h4 className={`font-semibold ${mod.isCompleted ? 'text-green-800' : 'text-gray-800'}`}>{mod.title}</h4>
                 <p className="text-xs text-gray-500 flex items-center gap-1">
                    {mod.type === 'quiz' ? <BrainCircuit size={10} /> : <Play size={10} />}
                    {mod.isCompleted ? t('completed') : mod.type === 'quiz' ? t('take_quiz') : t('watch_video')}
                 </p>
               </div>
             </div>
             {mod.isCompleted ? <CheckCircle className="text-green-500" size={20} /> : <Play className="text-blue-500" size={20} />}
          </div>
        ))}
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
    
    // Update completion
    await db.modules.update(moduleData.id!, { isCompleted: true });
    
    // Add XP using shared logic
    await addXP(50);
    
    // Update course progress
    const course = await db.courses.get(moduleData.courseId);
    if (course) {
        const count = await db.modules.where('courseId').equals(moduleData.courseId).filter(l => l.isCompleted).count();
        await db.courses.update(course.id!, { completedModules: count });
    }
    
    setJustFinished(true);
    // Delay navigation slightly to show success
    setTimeout(() => {
        navigate(`/course/${moduleData.courseId}`);
    }, 1500);
  };

  if (!moduleData) return <div>Loading...</div>;

  return (
    <div className="flex flex-col h-full">
       <button onClick={() => navigate(`/course/${moduleData.courseId}`)} className="text-sm text-blue-600 mb-4 font-medium">← Back to Course</button>
       
       {moduleData.type === 'video' && (
           <div className="aspect-video bg-black rounded-xl mb-4 flex items-center justify-center relative overflow-hidden group">
              {/* Simulated Video Player */}
              <div className="absolute inset-0 flex items-center justify-center bg-gray-900 text-white">
                 <div className="text-center">
                   <Play size={48} className="mx-auto mb-2 opacity-80" />
                   <p className="text-sm font-mono opacity-60">Simulated Video Player</p>
                   <p className="text-xs text-gray-500">{moduleData.videoUrl || moduleData.audioUrl}</p>
                 </div>
              </div>
           </div>
       )}

       <h2 className="text-xl font-bold mb-2">{moduleData.title}</h2>
       <p className="text-gray-700 leading-relaxed mb-6">{moduleData.content}</p>

       <div className="mt-auto space-y-4">
         
         {/* Action Button */}
         {!justFinished && !moduleData.isCompleted && (
           <>
              {moduleData.type === 'quiz' || showQuiz ? (
                 <div className="bg-white border-2 border-blue-100 p-4 rounded-xl">
                    <h4 className="font-bold mb-3 text-lg">{t('quiz_time')}</h4>
                    <p className="mb-4 text-gray-800">{moduleData.quiz?.question}</p>
                    <div className="space-y-2">
                      {moduleData.quiz?.options.map((opt, idx) => (
                        <button 
                          key={idx}
                          onClick={() => {
                              if (idx === moduleData.quiz?.correctIndex) {
                                 handleFinish();
                              } else {
                                 alert(t('try_again'));
                              }
                          }}
                          className="w-full text-left p-3 rounded-lg bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-300 transition-colors"
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                 </div>
              ) : (
                 <button onClick={() => moduleData.quiz ? setShowQuiz(true) : handleFinish()} className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold text-lg shadow-lg active:scale-95 transition-transform flex items-center justify-center gap-2">
                   {moduleData.quiz ? <BrainCircuit size={20} /> : <CheckCircle size={20} />}
                   {moduleData.quiz ? t('start_quiz') : t('mark_completed')}
                 </button>
              )}
           </>
         )}

         {(moduleData.isCompleted || justFinished) && (
            <div className="bg-green-100 text-green-800 p-4 rounded-xl text-center font-bold flex items-center justify-center gap-2 animate-pulse">
               <Award size={24} /> {t('module_completed')} (+50 XP)
            </div>
         )}
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
  }, []);

  const handleLogin = () => {
    setIsLoggedIn(true);
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    // Simulate processing time for smooth UX
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Perform cleanup
    logoutUser();
    
    // Clear navigation history/hash visually before unmounting the router to avoid race conditions
    if (window.location.hash) {
      window.location.hash = ''; 
    }
    
    setIsLoggedIn(false);
    setIsLoggingOut(false);
  };

  if (checkingAuth) {
    return <div className="min-h-screen flex items-center justify-center bg-blue-50 text-blue-600">Loading...</div>;
  }

  if (isLoggingOut) {
     return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-blue-50 text-blue-600">
           <Loader2 className="animate-spin mb-4" size={48} />
           <p className="text-lg font-bold animate-pulse">Logging out...</p>
        </div>
     );
  }

  // Wrap authenticated part with LanguageProvider
  // We can wrap AuthGateway too if we want it translated later
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