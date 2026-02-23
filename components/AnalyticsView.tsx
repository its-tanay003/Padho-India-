import React from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell
} from 'recharts';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { getSessionId } from '../services/authService';
import { ChevronLeft, TrendingUp, Award, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const AnalyticsView: React.FC = () => {
  const userId = getSessionId();
  const user = useLiveQuery(() => userId ? db.users.get(userId) : undefined, [userId]);
  const courses = useLiveQuery(() => db.courses.toArray());
  const modules = useLiveQuery(() => db.modules.toArray());
  const navigate = useNavigate();

  if (!user || !courses || !modules) return <div className="p-8 text-center">Loading Analytics...</div>;

  // Mock data for charts (replace with real data logic)
  const progressData = [
    { name: 'Mon', xp: 120, quizzes: 2 },
    { name: 'Tue', xp: 200, quizzes: 3 },
    { name: 'Wed', xp: 150, quizzes: 1 },
    { name: 'Thu', xp: 300, quizzes: 4 },
    { name: 'Fri', xp: 250, quizzes: 3 },
    { name: 'Sat', xp: 400, quizzes: 5 },
    { name: 'Sun', xp: 350, quizzes: 4 },
  ];

  const courseCompletionData = courses.map(c => ({
    name: c.title,
    completed: c.completedModules,
    total: c.totalModules,
    percentage: Math.round((c.completedModules / c.totalModules) * 100)
  }));

  const pieData = [
    { name: 'Science', value: 400 },
    { name: 'Math', value: 300 },
    { name: 'History', value: 300 },
    { name: 'Tech', value: 200 },
  ];
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  return (
    <div className="space-y-8 pb-10 max-w-7xl mx-auto animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <button 
            onClick={() => navigate('/profile')} 
            className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-gray-800 bg-white px-4 py-2 rounded-full border border-gray-100 shadow-sm transition-colors"
        >
            <ChevronLeft size={16} /> Back to Profile
        </button>
        <h1 className="text-2xl font-black text-gray-800 flex items-center gap-2">
            <TrendingUp className="text-blue-500" /> Learning Analytics
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* XP Trend Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
                <Award size={18} className="text-yellow-500" /> Weekly XP Growth
            </h3>
            <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={progressData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} />
                        <YAxis axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} />
                        <Tooltip contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}} />
                        <Line type="monotone" dataKey="xp" stroke="#3b82f6" strokeWidth={3} dot={{r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff'}} activeDot={{r: 6}} />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>

        {/* Subject Distribution */}
        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 flex flex-col items-center justify-center">
            <h3 className="font-bold text-gray-700 mb-4 w-full text-left flex items-center gap-2">
                <Clock size={18} className="text-purple-500" /> Time Spent
            </h3>
            <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={pieData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            fill="#8884d8"
                            paddingAngle={5}
                            dataKey="value"
                        >
                            {pieData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip />
                        <Legend verticalAlign="bottom" height={36} iconType="circle" />
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </div>
      </div>

      {/* Course Progress Bars */}
      <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-700 mb-6 text-lg">Course Completion Rates</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={courseCompletionData} layout="vertical" margin={{top: 5, right: 30, left: 20, bottom: 5}}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" width={100} tick={{fill: '#4b5563', fontSize: 12, fontWeight: 600}} axisLine={false} tickLine={false} />
                    <Tooltip cursor={{fill: 'transparent'}} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}} />
                    <Bar dataKey="percentage" fill="#10b981" radius={[0, 10, 10, 0]} barSize={20} background={{ fill: '#f3f4f6', radius: [0, 10, 10, 0] }} />
                </BarChart>
            </ResponsiveContainer>
          </div>
      </div>
    </div>
  );
};

export default AnalyticsView;
