
import React from 'react';
import GoogleAuth from './GoogleAuth';
import { BookOpen } from 'lucide-react';

interface Props {
  onLoginSuccess: () => void;
}

const AuthGateway: React.FC<Props> = ({ onLoginSuccess }) => {
  return (
    <div className="min-h-screen bg-blue-50 flex flex-col items-center justify-center p-6">
      <div className="bg-white w-full max-w-sm rounded-2xl shadow-xl overflow-hidden p-8 border border-blue-100">
        
        {/* Header Logo Area */}
        <div className="flex flex-col items-center mb-8">
           <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mb-4 shadow-lg">
             <BookOpen className="text-white" size={32} />
           </div>
           <h1 className="text-2xl font-bold text-gray-800">Padho India</h1>
           <p className="text-gray-500 text-sm">Your Offline-First School</p>
        </div>

        {/* Authentication Flow */}
        <GoogleAuth onLoginSuccess={onLoginSuccess} />
        
      </div>
      <p className="mt-8 text-xs text-gray-400">v1.1.0 • Offline PIN Supported</p>
    </div>
  );
};

export default AuthGateway;