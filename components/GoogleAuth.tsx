import React, { useState } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import { db, hashPin } from '../db';
import { loginUser } from '../services/authService';
import { Loader2, Lock, ShieldCheck, AlertCircle, Chrome, User } from 'lucide-react';

interface Props {
  onLoginSuccess: () => void;
}

interface GoogleUser {
  email: string;
  name: string;
  picture: string;
}

const GoogleAuth: React.FC<Props> = ({ onLoginSuccess }) => {
  const [step, setStep] = useState<'LOGIN' | 'SETUP_PIN' | 'ENTER_PIN'>('LOGIN');
  const [currentUser, setCurrentUser] = useState<GoogleUser | null>(null);
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Use the hook for more control and to avoid iframe/COOP issues
  const login = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setLoading(true);
      setError('');
      try {
        // Fetch user info using the access token
        const userInfo = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
        }).then((res) => res.json());

        if (userInfo.email) {
            handleUserIdentified({
                email: userInfo.email,
                name: userInfo.name,
                picture: userInfo.picture
            });
        } else {
            setError("Could not retrieve email from Google.");
        }
      } catch (err) {
        console.error(err);
        setError("Failed to fetch user profile.");
      } finally {
        setLoading(false);
      }
    },
    onError: (errorResponse) => {
        console.error(errorResponse);
        setError("Google Login Failed. Please try again.");
    }
  });

  const handleUserIdentified = async (gUser: GoogleUser) => {
    setCurrentUser(gUser);
    
    // Check DB for user
    try {
        const existingUser = await db.users.where('email').equals(gUser.email).first();
        if (existingUser) {
            setStep('ENTER_PIN');
        } else {
            setStep('SETUP_PIN');
        }
    } catch (e) {
        setError("Database error occurred.");
    }
  };

  const handleGuestLogin = () => {
     handleUserIdentified({
         email: 'guest@padhoindia.com',
         name: 'Guest User',
         picture: 'https://ui-avatars.com/api/?name=Guest+User&background=random'
     });
  };

  const handlePinSubmit = async () => {
    if (pin.length !== 4) {
      setError("PIN must be 4 digits.");
      return;
    }
    setLoading(true);
    setError('');

    try {
      const hashedPin = await hashPin(pin);

      if (step === 'SETUP_PIN' && currentUser) {
        // Register New User
        const newUserId = await db.users.add({
          email: currentUser.email,
          name: currentUser.name,
          pin: hashedPin,
          grade: '10', 
          role: 'student',
          xp: 0,
          level: 1,
          streak: 1,
          badges: ['New Explorer'],
          quizzesPassed: 0,
          language: 'en'
        });
        
        // @ts-ignore
        loginUser(newUserId);
        onLoginSuccess();
      } else if (step === 'ENTER_PIN' && currentUser) {
        // Verify PIN
        const user = await db.users.where('email').equals(currentUser.email).first();
        if (user && user.pin === hashedPin) {
          if (user.id) loginUser(user.id);
          onLoginSuccess();
        } else {
          setError("Incorrect PIN. Please try again.");
          setPin('');
        }
      }
    } catch (e) {
      console.error(e);
      setError("Database Error.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4 flex items-center gap-2 animate-in fade-in">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {step === 'LOGIN' && (
        <div className="flex flex-col items-center space-y-4">
          
          <button
            onClick={() => login()}
            disabled={loading}
            className="w-full bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-bold py-3 rounded-full shadow-sm flex items-center justify-center gap-3 transition-all active:scale-95"
          >
             {loading ? (
                <Loader2 className="animate-spin text-blue-600" />
             ) : (
                <>
                  <Chrome className="text-blue-600" size={20} />
                  <span>Sign in with Google</span>
                </>
             )}
          </button>

          <div className="flex items-center w-full">
             <div className="h-px bg-gray-200 flex-1"></div>
             <span className="px-2 text-xs text-gray-400">OR</span>
             <div className="h-px bg-gray-200 flex-1"></div>
          </div>

          <button
            onClick={handleGuestLogin}
            className="w-full bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold py-3 rounded-full flex items-center justify-center gap-2 transition-colors text-sm"
          >
             <User size={18} />
             Continue as Guest
          </button>
          
          <p className="text-[10px] text-gray-400 mt-4 text-center">
             By continuing, you agree to our Offline-First Policy.
          </p>
        </div>
      )}

      {(step === 'SETUP_PIN' || step === 'ENTER_PIN') && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="text-center">
             {currentUser?.picture && (
               <img src={currentUser.picture} alt="Profile" className="w-16 h-16 rounded-full mx-auto mb-3 border-2 border-blue-100" />
             )}
             <h3 className="text-lg font-bold text-gray-800">
               {step === 'SETUP_PIN' ? `Welcome, ${currentUser?.name}!` : `Welcome Back!`}
             </h3>
             <p className="text-sm text-gray-500">
               {step === 'SETUP_PIN' ? "Set a 4-digit PIN to secure your account." : "Enter your 4-digit PIN."}
             </p>
          </div>

          <div className="relative">
             <Lock className="absolute left-3 top-3 text-gray-400" size={20} />
             <input 
                type="password" 
                inputMode="numeric"
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                onKeyDown={(e) => e.key === 'Enter' && handlePinSubmit()}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-center text-2xl tracking-[0.5em] font-bold"
                placeholder="••••"
                autoFocus
              />
          </div>

          <button 
            onClick={handlePinSubmit}
            disabled={loading || pin.length < 4}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl shadow-lg active:scale-95 transition-all disabled:opacity-50 flex justify-center items-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin" /> : step === 'SETUP_PIN' ? "Set PIN & Login" : "Unlock"}
            {!loading && <ShieldCheck size={18} />}
          </button>
          
          <button onClick={() => { setStep('LOGIN'); setPin(''); setError(''); }} className="w-full text-sm text-gray-400 hover:text-gray-600">
            Cancel / Switch Account
          </button>
        </div>
      )}
    </div>
  );
};

export default GoogleAuth;