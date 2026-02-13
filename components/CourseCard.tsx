import React from 'react';
import { Course } from '../types';
import { PlayCircle, CheckCircle, Download } from 'lucide-react';

interface Props {
  course: Course;
  onClick: () => void;
}

const CourseCard: React.FC<Props> = ({ course, onClick }) => {
  return (
    <div onClick={onClick} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-4 active:scale-95 transition-transform duration-200 cursor-pointer">
      <div className="h-32 w-full bg-gray-200 relative">
        <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-3 justify-between">
          <span className="text-white font-medium text-sm flex items-center">
             <PlayCircle size={16} className="mr-1" /> {course.completedModules} / {course.totalModules} Modules
          </span>
          {course.isDownloaded && (
            <span className="text-green-400 bg-green-900/50 px-2 py-0.5 rounded text-xs flex items-center">
                <Download size={12} className="mr-1" /> Offline
            </span>
          )}
        </div>
      </div>
      <div className="p-4">
        <div className="flex justify-between items-start">
             <h3 className="font-bold text-gray-800 text-lg mb-1">{course.title}</h3>
             <span className="text-[10px] uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-1 rounded-sm font-bold">{course.subject}</span>
        </div>
        <p className="text-gray-500 text-xs line-clamp-2">{course.description}</p>
        
        {/* Progress Bar */}
        <div className="mt-3 w-full bg-gray-100 rounded-full h-1.5">
          <div 
            className="bg-blue-500 h-1.5 rounded-full transition-all duration-500" 
            style={{ width: `${(course.completedModules / course.totalModules) * 100}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
};

export default CourseCard;