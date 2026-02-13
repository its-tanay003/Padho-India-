
import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Dashboard from './views/Dashboard';
import CourseDetails from './views/CourseDetails';
import QuizView from './views/QuizView';
import QuizListView from './views/QuizListView';
import AIView from './views/AIView';
import Leaderboard from './views/Leaderboard';
import TeacherPanel from './views/TeacherPanel';
import ProfileView from './views/ProfileView';
import Tutorial from './components/Tutorial';
import { User, Language } from './types';

const INITIAL_USER: User = {
  name: "Arjun Singh",
  email: "arjun.singh@villageedu.in",
  mobile: "+91 98765 43210",
  village: "Kishanpur, Uttar Pradesh",
  level: 3,
  xp: 1250,
  rank: "Explorer",
  streak: 5,
  badges: [
    { id: '1', name: 'Fast Learner', icon: '⚡', earnedAt: '2023-10-01' },
    { id: '2', name: 'Quiz Master', icon: '🏆', earnedAt: '2023-10-05' }
  ]
};

const App: React.FC = () => {
  const [user, setUser] = useState<User>(INITIAL_USER);
  const [language, setLanguage] = useState<Language>('en');
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [isLiteMode, setIsLiteMode] = useState(false);

  useEffect(() => {
    const handleStatusChange = () => {
      setIsOffline(!navigator.onLine);
      if (!navigator.onLine) setIsLiteMode(true);
    };
    window.addEventListener('online', handleStatusChange);
    window.addEventListener('offline', handleStatusChange);
    return () => {
      window.removeEventListener('online', handleStatusChange);
      window.removeEventListener('offline', handleStatusChange);
    };
  }, []);

  return (
    <HashRouter>
      <div className="min-h-screen flex flex-col">
        <Tutorial language={language} />
        
        <Navbar 
          user={user} 
          language={language} 
          setLanguage={setLanguage} 
          isOffline={isOffline}
          isLiteMode={isLiteMode}
          setIsLiteMode={setIsLiteMode}
        />
        
        <main className="flex-1 container mx-auto px-4 py-6">
          <Routes>
            <Route path="/" element={<Dashboard user={user} language={language} isLiteMode={isLiteMode} />} />
            <Route path="/quizzes" element={<QuizListView language={language} />} />
            <Route path="/ai-lab" element={<AIView user={user} language={language} />} />
            <Route path="/course/:id" element={<CourseDetails language={language} isLiteMode={isLiteMode} />} />
            <Route path="/quiz/:id" element={<QuizView setUser={setUser} user={user} language={language} />} />
            <Route path="/leaderboard" element={<Leaderboard user={user} />} />
            <Route path="/profile" element={<ProfileView user={user} />} />
            <Route path="/teacher" element={<TeacherPanel />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>

        <footer className="bg-white border-t p-4 text-center text-gray-500 text-sm mb-20 md:mb-0">
          Padho India • Empowering Bharat with Knowledge
        </footer>
      </div>
    </HashRouter>
  );
};

export default App;
