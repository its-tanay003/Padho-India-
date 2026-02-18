
import React, { useState } from 'react';
import GoogleAuth from './GoogleAuth';
import EmailAuth from './EmailAuth';
import { BookOpen, Mail } from 'lucide-react';

interface Props {
  onLoginSuccess: () => void;
}

const AuthGateway: React.FC<Props> = ({ onLoginSuccess }) => {
  const [authMethod, setAuthMethod] = useState<'google' | 'email'>('google');

  return (
    <div className="min-h-screen bg-blue-50 flex flex-col items-center justify-center p-6">
      <div className="bg-white w-full max-w-sm rounded-2xl shadow-xl overflow-hidden p-8 border border-blue-100">
        
        {/* Header Logo Area */}
        <div className="flex flex-col items-center mb-6">
           <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mb-4 shadow-lg">
             <BookOpen className="text-white" size={32} />
           </div>
           <h1 className="text-2xl font-bold text-gray-800">Padho India</h1>
           <p className="text-gray-500 text-sm">Your Offline-First School</p>
        </div>

        {/* Authentication Flow */}
        {authMethod === 'google' ? (
            <>
                <GoogleAuth onLoginSuccess={onLoginSuccess} />
                
                <div className="relative py-6">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-100"></div>
                    </div>
                    <div className="relative flex justify-center text-xs">
                        <span className="bg-white px-2 text-gray-400 font-bold uppercase">Or</span>
                    </div>
                </div>

                <button 
                    onClick={() => setAuthMethod('email')}
                    className="w-full flex items-center justify-center gap-2 bg-gray-50 hover:bg-gray-100 text-gray-700 font-bold py-3 rounded-xl border border-gray-200 transition-colors text-xs"
                >
                    <Mail size={16} /> Continue with Email
                </button>
            </>
        ) : (
            <EmailAuth 
                onLoginSuccess={onLoginSuccess} 
                onSwitchToGoogle={() => setAuthMethod('google')} 
            />
        )}
        
      </div>
      <p className="mt-8 text-xs text-gray-400">v1.2.0 • Offline PIN Supported</p>
    </div>
  );
};

export default AuthGateway;
