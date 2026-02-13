
import React, { useState } from 'react';
import { StudentStats } from '../types';

const INITIAL_STUDENTS: StudentStats[] = [
  { id: '1', name: "Amit Sharma", lastActive: "2 hours ago", score: 88, status: 'active' },
  { id: '2', name: "Sunita Roy", lastActive: "Yesterday", score: 42, status: 'struggling' },
  { id: '3', name: "Rajesh Kumar", lastActive: "5 mins ago", score: 95, status: 'active' },
  { id: '4', name: "Pooja V.", lastActive: "3 days ago", score: 65, status: 'inactive' },
  { id: '5', name: "Vikram S.", lastActive: "Online", score: 78, status: 'active' }
];

const TeacherPanel: React.FC = () => {
  const [students] = useState<StudentStats[]>(INITIAL_STUDENTS);
  const [activeTab, setActiveTab] = useState<'monitoring' | 'upload'>('monitoring');

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="font-kids text-3xl text-gray-800">Teacher Control Center</h1>
          <p className="text-gray-500">Class 7A - GSSS Rural School</p>
        </div>
        <div className="flex bg-gray-100 p-1 rounded-2xl">
           <button 
             onClick={() => setActiveTab('monitoring')}
             className={`px-6 py-2 rounded-xl font-bold text-sm transition-all ${activeTab === 'monitoring' ? 'bg-white shadow text-blue-600' : 'text-gray-500'}`}
           >
             Student Monitoring
           </button>
           <button 
             onClick={() => setActiveTab('upload')}
             className={`px-6 py-2 rounded-xl font-bold text-sm transition-all ${activeTab === 'upload' ? 'bg-white shadow text-blue-600' : 'text-gray-500'}`}
           >
             Content Upload
           </button>
        </div>
      </header>

      {activeTab === 'monitoring' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="p-4 font-bold text-gray-600 text-sm">Student Name</th>
                    <th className="p-4 font-bold text-gray-600 text-sm">Last Active</th>
                    <th className="p-4 font-bold text-gray-600 text-sm text-center">Avg Score</th>
                    <th className="p-4 font-bold text-gray-600 text-sm">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map(s => (
                    <tr key={s.id} className="border-b last:border-b-0 hover:bg-gray-50 transition-colors">
                      <td className="p-4 font-bold text-gray-800">{s.name}</td>
                      <td className="p-4 text-gray-500 text-sm">{s.lastActive}</td>
                      <td className="p-4 text-center">
                        <span className={`font-bold ${s.score > 80 ? 'text-green-600' : s.score < 50 ? 'text-red-600' : 'text-orange-600'}`}>
                          {s.score}%
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`text-xs px-2 py-1 rounded-full font-bold uppercase tracking-tighter ${
                          s.status === 'active' ? 'bg-green-100 text-green-700' : 
                          s.status === 'struggling' ? 'bg-red-100 text-red-700' : 
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {s.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-blue-600 p-6 rounded-3xl text-white shadow-lg">
              <h3 className="font-bold text-lg mb-4">Class Performance</h3>
              <div className="space-y-4">
                 <div>
                   <div className="flex justify-between text-sm mb-1">
                     <span>Active Students</span>
                     <span>82%</span>
                   </div>
                   <div className="w-full bg-white/20 h-2 rounded-full overflow-hidden">
                     <div className="bg-white h-full w-[82%]"></div>
                   </div>
                 </div>
                 <div>
                   <div className="flex justify-between text-sm mb-1">
                     <span>Syllabus Covered</span>
                     <span>45%</span>
                   </div>
                   <div className="w-full bg-white/20 h-2 rounded-full overflow-hidden">
                     <div className="bg-white h-full w-[45%]"></div>
                   </div>
                 </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl shadow-sm border border-red-100">
               <h3 className="font-bold text-lg text-red-600 mb-4">Urgent Attention</h3>
               <div className="space-y-4">
                 <div className="flex items-center gap-3 p-3 bg-red-50 rounded-2xl border border-red-100">
                   <div className="w-10 h-10 rounded-full bg-red-200 flex items-center justify-center text-red-600 font-bold">S</div>
                   <div>
                     <p className="text-sm font-bold text-gray-800">Sunita Roy</p>
                     <p className="text-xs text-red-500">Struggling with Decimals</p>
                   </div>
                 </div>
                 <div className="flex items-center gap-3 p-3 bg-red-50 rounded-2xl border border-red-100">
                   <div className="w-10 h-10 rounded-full bg-red-200 flex items-center justify-center text-red-600 font-bold">P</div>
                   <div>
                     <p className="text-sm font-bold text-gray-800">Pooja V.</p>
                     <p className="text-xs text-red-500">No activity for 3 days</p>
                   </div>
                 </div>
               </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white p-12 rounded-3xl shadow-sm border border-dashed border-gray-300 flex flex-col items-center justify-center text-center space-y-4">
          <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center text-4xl mb-4">📤</div>
          <h2 className="text-2xl font-bold text-gray-800">Upload New Content</h2>
          <p className="text-gray-500 max-w-md">Record your local lecture and upload it here. We will automatically compress it for slow internet users.</p>
          <div className="flex flex-col gap-4 w-full max-w-sm pt-8">
             <input type="file" id="upload-file" className="hidden" />
             <label 
               htmlFor="upload-file"
               className="bg-blue-600 text-white font-bold py-4 px-8 rounded-2xl shadow-lg hover:bg-blue-700 cursor-pointer transition-all"
             >
               Select Video / Audio File
             </label>
             <button className="bg-gray-100 text-gray-700 font-bold py-4 px-8 rounded-2xl hover:bg-gray-200 transition-all">
               Create Online Quiz
             </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherPanel;
