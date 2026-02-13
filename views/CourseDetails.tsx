
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Language, Lesson } from '../types';

interface CourseDetailsProps {
  language: Language;
  isLiteMode: boolean;
}

const CourseDetails: React.FC<CourseDetailsProps> = ({ language, isLiteMode }) => {
  const { id } = useParams();
  const [downloadedIds, setDownloadedIds] = useState<string[]>(['1']);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Mock data for courses - in a real app these would be fetched
  const isEnglishCourse = id === '3';
  const courseProgress = isEnglishCourse ? 85 : 45;

  const lessons: Lesson[] = [
    { id: '1', title: 'Introduction to Planets', type: 'video', isDownloaded: true },
    { id: '2', title: 'The Sun: Our Star', type: 'video', isDownloaded: false },
    { id: '3', title: 'Inner vs Outer Planets', type: 'audio', isDownloaded: false },
    { id: '4', title: 'Mars Exploration', type: 'text', isDownloaded: false },
    { id: '5', title: 'Chapter Quiz', type: 'video', isDownloaded: false }
  ];

  const handleDownload = (id: string) => {
    // Simulate downloading
    setDownloadedIds(prev => [...prev, id]);
    alert("Lesson downloaded! You can now watch it offline.");
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Link to="/" className="text-blue-600 font-black flex items-center gap-2 mb-4 hover:translate-x-1 transition-transform">
        ← Back to Dashboard
      </Link>

      <div className="bg-white rounded-3xl p-6 shadow-md border-2 border-slate-100">
        <div className="flex flex-col md:flex-row gap-8 items-center md:items-start">
          <div className="w-full md:w-1/3 aspect-video md:aspect-square bg-indigo-100 rounded-2xl flex items-center justify-center text-5xl shadow-inner border-2 border-indigo-200">
            {isEnglishCourse ? '📖' : '🚀'}
          </div>
          <div className="flex-1 space-y-4">
            <div>
              <h1 className="font-kids text-3xl text-slate-800 font-black">
                {isEnglishCourse ? 'English Fun' : 'The Story of Earth'}
              </h1>
              <div className="mt-2 space-y-1">
                <div className="flex justify-between items-end text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  <span>Progress</span>
                  <span className="text-indigo-600">{courseProgress}%</span>
                </div>
                <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden border-2 border-slate-50">
                  <div 
                    className="h-full bg-indigo-500 transition-all duration-1000 ease-out liquid-progress"
                    style={{ width: mounted ? `${courseProgress}%` : '0%' }}
                  ></div>
                </div>
              </div>
            </div>
            
            <p className="text-slate-600 leading-relaxed font-bold">
              {isEnglishCourse 
                ? "Let's explore the world of stories, words, and magic together! Learning English is like finding a key to a new universe." 
                : "In this course, we will journey through space and time to learn how our beautiful blue planet was born and how it supports life!"}
            </p>
            <div className="flex flex-wrap gap-3">
               <div className="flex items-center gap-2 bg-green-50 text-green-700 px-3 py-1 rounded-full text-[10px] font-black uppercase border border-green-100">
                 ✅ Beginner Level
               </div>
               <div className="flex items-center gap-2 bg-orange-50 text-orange-700 px-3 py-1 rounded-full text-[10px] font-black uppercase border border-orange-100">
                 ⭐ Earn 500 XP
               </div>
               <div className="flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-[10px] font-black uppercase border border-blue-100">
                 📊 5 Lessons
               </div>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="font-kids text-2xl text-slate-800 font-black px-1">Your Lessons</h2>
        <div className="grid gap-3">
          {lessons.map((lesson, index) => {
            const isDownloaded = downloadedIds.includes(lesson.id);
            return (
              <div key={lesson.id} className="bg-white p-4 rounded-2xl shadow-sm border-2 border-slate-50 flex items-center justify-between group hover:border-indigo-200 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center font-black border-2 border-slate-100 group-hover:bg-indigo-50 group-hover:text-indigo-500 group-hover:border-indigo-100 transition-colors">
                    {index + 1}
                  </div>
                  <div>
                    <h3 className="font-black text-slate-800 text-sm">{lesson.title}</h3>
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-400">
                       <span>{lesson.type}</span>
                       <span>•</span>
                       <span>10 mins</span>
                       {isDownloaded && <span className="text-teal-500">✓ Downloaded</span>}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {!isDownloaded && (
                    <button 
                      onClick={() => handleDownload(lesson.id)}
                      className="p-2 text-indigo-500 hover:bg-indigo-50 rounded-xl transition-colors border-2 border-transparent hover:border-indigo-100"
                      title="Download for Offline"
                    >
                      ⬇️
                    </button>
                  )}
                  {lesson.id === '5' ? (
                    <Link to="/quiz/1" className="bg-orange-500 text-white font-black px-6 py-2 rounded-xl hover:bg-orange-600 shadow-[0_4px_0_#c2410c] active:translate-y-1 active:shadow-none transition-all text-xs">
                      Start Quiz
                    </Link>
                  ) : (
                    <button className="bg-indigo-600 text-white font-black px-6 py-2 rounded-xl hover:bg-indigo-700 shadow-[0_4px_0_#3730a3] active:translate-y-1 active:shadow-none transition-all text-xs">
                      Play {isLiteMode ? '(Lite)' : ''}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default CourseDetails;
