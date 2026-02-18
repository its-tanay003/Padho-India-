
import React, { useState, useEffect } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';
import { findUserByEmail, registerUserWithGoogle, verifyPin, createGuestAccount } from '../db';
import { loginUser } from '../services/authService';
import { checkSyncStatus } from '../services/networkSim';
import { Lock, ShieldCheck, AlertCircle, Loader2, XCircle, UserCircle, HelpCircle } from 'lucide-react';

interface Props {
  onLoginSuccess: () => void;
}

type AuthStep = 'GOOGLE_SIGNIN' | 'SET_PIN' | 'ENTER_PIN';

const GoogleAuth: React.FC<Props> = ({ onLoginSuccess }) => {
  const [step, setStep] = useState<AuthStep>('GOOGLE_SIGNIN');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [tempUser, setTempUser] = useState<{name: string, email: string} | null>(null);
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const showError = (msg: string) => {
    setError(msg);
  };

  const handleGoogleSuccess = async (credentialResponse: any) => {
    setLoading(true);
    setError('');
    try {
      if (!credentialResponse.credential) {
         throw new Error("No credentials received from Google. Please try again.");
      }
      
      const details: any = jwtDecode(credentialResponse.credential);
      const email = details.email;
      const name = details.name;
      
      if (!email) throw new Error("Email not found in Google account. Please use a valid Google account.");

      // Check both local DB and Supabase via db.ts wrapper
      const existingUser = await findUserByEmail(email);

      if (existingUser) {
        setTempUser({ name: existingUser.name, email: existingUser.email! });
        setStep('ENTER_PIN');
        setPin(''); 
      } else {
        setTempUser({ name: name || 'Student', email });
        setStep('SET_PIN');
        setPin('');
        setConfirmPin('');
      }
    } catch (e: any) {
      console.error(e);
      showError(e.message || "Sign-in failed. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleError = () => {
      showError("Google Sign-In unavailable. Please try Guest Mode.");
  };

  const handleGuestLogin = async () => {
    setLoading(true);
    try {
        const id = await createGuestAccount();
        if (id) {
            loginUser(id);
            if (navigator.onLine) checkSyncStatus();
            onLoginSuccess();
        }
    } catch (e) {
        console.error("Guest login failed", e);
        showError("Guest login failed. Please reload.");
    } finally {
        setLoading(false);
    }
  };

  const handleSetPin = async () => {
    if (pin.length !== 4) return showError("PIN must be exactly 4 digits.");
    if (pin !== confirmPin) return showError("PINs do not match. Please re-enter.");
    if (!tempUser) return showError("Session expired. Please sign in again.");

    setLoading(true);
    try {
      // Registers locally and syncs to Supabase immediately
      const id = await registerUserWithGoogle(tempUser.name, tempUser.email, pin);
      // @ts-ignore
      loginUser(id);
      
      if (navigator.onLine) checkSyncStatus();
      
      onLoginSuccess();
    } catch (e) {
      console.error(e);
      showError("Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyPin = async () => {
    if (pin.length !== 4) {
        if (pin.length === 0) return showError("Please enter your PIN.");
        return showError("PIN must be 4 digits.");
    } 
    if (!tempUser) return showError("Session expired. Please switch account to log in again.");

    setLoading(true);
    try {
      const user = await findUserByEmail(tempUser.email);
      if (user && user.pin) {
        const isValid = await verifyPin(pin, user.pin);
        if (isValid) {
          loginUser(user.id!);
          if (navigator.onLine) checkSyncStatus();
          onLoginSuccess();
        } else {
          setPin('');
          showError("PIN mismatch. Please try again.");
        }
      } else {
          showError("Account not found. Please sign up to continue.");
          setStep('GOOGLE_SIGNIN');
      }
    } catch (e) {
      console.error(e);
      showError("System error during verification. Please check network.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full relative">
      {error && (
        <div className="absolute -top-16 left-0 right-0 mx-auto bg-red-50 text-red-600 p-3 rounded-xl text-xs font-bold mb-6 flex items-center justify-between shadow-sm animate-in slide-in-from-top duration-300 z-50 border border-red-100">
          <div className="flex items-center gap-2">
            <AlertCircle size={16} />
            {error}
          </div>
          <button onClick={() => setError('')} className="text-red-400 hover:text-red-700">
             <XCircle size={16} />
          </button>
        </div>
      )}

      {step === 'GOOGLE_SIGNIN' && (
        <div className="flex flex-col items-center space-y-6">
          <div className="text-center">
             <h3 className="font-bold text-gray-800 text-lg">Welcome to Padho India</h3>
             <p className="text-gray-500 text-sm mt-1">Sign in to start your learning journey</p>
          </div>
          
          <div className="w-full flex justify-center transform hover:scale-105 transition-transform duration-200">
             <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
                useOneTap={false}
                auto_select={false}
                theme="filled_blue"
                shape="pill"
                size="large"
                width="100%"
             />
          </div>
          
          <div className="text-[10px] text-gray-300 font-medium">
             SECURE LOGIN • PRIVACY PROTECTED
          </div>

          <button 
             onClick={handleGuestLogin}
             disabled={loading}
             className="flex items-center gap-1.5 text-xs font-bold text-blue-400 hover:text-blue-600 underline decoration-blue-200 underline-offset-4 transition-colors pt-2 disabled:opacity-50"
          >
             <UserCircle size={14} /> Continue as Guest (Dev Mode)
          </button>
        </div>
      )}

      {step === 'SET_PIN' && (
        <div className="space-y-6 animate-in slide-in-from-right duration-300">
           <div className="text-center">
              <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-600 shadow-sm">
                <ShieldCheck size={32} />
              </div>
              <h3 className="font-bold text-xl text-gray-800">Set Security PIN</h3>
              <p className="text-sm text-gray-500 mt-1">Create a 4-digit PIN for {tempUser?.name.split(' ')[0]}</p>
           </div>

           <div className="space-y-4">
                <div className="relative">
                    <input 
                    type="password" 
                    inputMode="numeric"
                    maxLength={4}
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    className="w-full text-center text-4xl font-black tracking-[0.5em] py-4 border-2 border-gray-100 rounded-2xl focus:border-blue-500 focus:ring-0 outline-none text-gray-800 placeholder-gray-200 transition-colors"
                    placeholder="••••"
                    autoFocus
                    />
                    <p className="text-xs text-center text-gray-400 mt-1">Enter PIN</p>
                </div>
                
                <div className="relative">
                    <input 
                    type="password" 
                    inputMode="numeric"
                    maxLength={4}
                    value={confirmPin}
                    onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    className={`w-full text-center text-xl font-bold tracking-widest py-3 bg-gray-50 border border-transparent rounded-xl focus:bg-white focus:border-blue-200 outline-none transition-colors ${pin && confirmPin && pin !== confirmPin ? 'border-red-300 bg-red-50' : ''}`}
                    placeholder="Confirm PIN"
                    />
                     <p className="text-xs text-center text-gray-400 mt-1">Confirm PIN</p>
                </div>
           </div>

           <button 
              onClick={handleSetPin}
              disabled={loading || pin.length < 4 || confirmPin.length < 4}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-2xl shadow-xl shadow-blue-200 active:scale-95 transition-all disabled:opacity-50 disabled:shadow-none flex justify-center items-center"
            >
              {loading ? <Loader2 className="animate-spin" /> : "Set PIN & Start Learning"}
            </button>
        </div>
      )}

      {step === 'ENTER_PIN' && (
        <div className="space-y-6 animate-in slide-in-from-right duration-300">
           <div className="text-center">
              <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-600 shadow-sm">
                <Lock size={32} />
              </div>
              <h3 className="font-bold text-xl text-gray-800">Welcome Back, {tempUser?.name.split(' ')[0]}!</h3>
              <p className="text-sm text-gray-500 mt-1">Enter PIN to unlock dashboard</p>
           </div>

           <div>
              <input 
                type="password" 
                inputMode="numeric"
                maxLength={4}
                value={pin}
                onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '').slice(0, 4);
                    setPin(val);
                    if (val.length === 0) setError(''); 
                }}
                className={`w-full text-center text-4xl font-black tracking-[0.5em] py-4 border-2 rounded-2xl focus:border-blue-500 focus:ring-0 outline-none text-gray-800 placeholder-gray-200 transition-colors ${error ? 'border-red-300 bg-red-50 animate-pulse' : 'border-gray-100'}`}
                placeholder="••••"
                autoFocus
              />
           </div>

           <button 
              onClick={handleVerifyPin}
              disabled={loading || pin.length < 4}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-2xl shadow-xl shadow-blue-200 active:scale-95 transition-all disabled:opacity-50 disabled:shadow-none flex justify-center items-center"
            >
              {loading ? <Loader2 className="animate-spin" /> : "Unlock Dashboard"}
            </button>
            
            <div className="flex flex-col gap-3">
                <div className="flex items-center justify-center gap-1 text-[10px] text-gray-400">
                     <HelpCircle size={12} />
                     <span>Forgot PIN? Ask your teacher or reset by switching account.</span>
                </div>
                <button 
                  onClick={() => {
                      setStep('GOOGLE_SIGNIN');
                      setTempUser(null);
                      setPin('');
                      setError('');
                  }}
                  className="w-full text-xs font-bold text-gray-400 hover:text-gray-600 uppercase tracking-wider"
                >
                  Switch Account
                </button>
            </div>
        </div>
      )}
    </div>
  );
};

export default GoogleAuth;
