
import React, { useState } from 'react';
import { findUserByEmail, registerUserManual, verifyPin } from '../db';
import { loginUser } from '../services/authService';
import { Mail, Lock, User, ArrowRight, Loader2, AlertCircle, CheckCircle } from 'lucide-react';

interface Props {
  onLoginSuccess: () => void;
  onSwitchToGoogle: () => void;
}

const EmailAuth: React.FC<Props> = ({ onLoginSuccess, onSwitchToGoogle }) => {
  const [isSignup, setIsSignup] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Form Fields
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');

  const showError = (msg: string) => {
    setError(msg);
    setTimeout(() => setError(''), 4000);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !pin) return showError("Please fill in all fields");
    
    setLoading(true);
    try {
        const user = await findUserByEmail(email);
        if (!user) {
            setLoading(false);
            return showError("Account not found. Please sign up.");
        }
        
        if (user.pin) {
            const isValid = await verifyPin(pin, user.pin);
            if (isValid) {
                // @ts-ignore
                loginUser(user.id);
                onLoginSuccess();
            } else {
                showError("Incorrect PIN.");
            }
        } else {
            showError("Account corrupted. Please contact support.");
        }
    } catch (err) {
        console.error(err);
        showError("Login failed.");
    } finally {
        setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !name || !pin || !confirmPin) return showError("Please fill in all fields");
    if (pin.length !== 4) return showError("PIN must be 4 digits");
    if (pin !== confirmPin) return showError("PINs do not match");

    setLoading(true);
    try {
        const existing = await findUserByEmail(email);
        if (existing) {
            setLoading(false);
            return showError("Email already registered. Please Login.");
        }

        const id = await registerUserManual(name, email, pin);
        // @ts-ignore
        loginUser(id);
        onLoginSuccess();
    } catch (err) {
        console.error(err);
        showError("Registration failed.");
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="w-full animate-in slide-in-from-right duration-300">
        
        {/* Toggle Header */}
        <div className="flex bg-gray-100 p-1 rounded-xl mb-6">
            <button 
                onClick={() => { setIsSignup(false); setError(''); }}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${!isSignup ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-400'}`}
            >
                Login
            </button>
            <button 
                onClick={() => { setIsSignup(true); setError(''); }}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${isSignup ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-400'}`}
            >
                Sign Up
            </button>
        </div>

        {error && (
            <div className="mb-4 bg-red-50 text-red-600 p-3 rounded-xl flex items-center gap-2 text-xs font-bold">
                <AlertCircle size={16} /> {error}
            </div>
        )}

        <form onSubmit={isSignup ? handleSignup : handleLogin} className="space-y-4">
            
            {isSignup && (
                <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 ml-1">Full Name</label>
                    <div className="relative">
                        <User className="absolute left-3 top-3.5 text-gray-400" size={18} />
                        <input 
                            type="text" 
                            placeholder="Student Name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full bg-gray-50 border border-transparent focus:bg-white focus:border-blue-500 rounded-xl pl-10 pr-4 py-3 outline-none text-sm font-medium transition-all"
                        />
                    </div>
                </div>
            )}

            <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 ml-1">Email Address</label>
                <div className="relative">
                    <Mail className="absolute left-3 top-3.5 text-gray-400" size={18} />
                    <input 
                        type="email" 
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-gray-50 border border-transparent focus:bg-white focus:border-blue-500 rounded-xl pl-10 pr-4 py-3 outline-none text-sm font-medium transition-all"
                    />
                </div>
            </div>

            <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 ml-1">Security PIN (4 Digits)</label>
                <div className="relative">
                    <Lock className="absolute left-3 top-3.5 text-gray-400" size={18} />
                    <input 
                        type="password" 
                        inputMode="numeric"
                        maxLength={4}
                        placeholder="••••"
                        value={pin}
                        onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                        className="w-full bg-gray-50 border border-transparent focus:bg-white focus:border-blue-500 rounded-xl pl-10 pr-4 py-3 outline-none text-sm font-medium transition-all tracking-widest"
                    />
                </div>
            </div>

            {isSignup && (
                <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 ml-1">Confirm PIN</label>
                    <div className="relative">
                        <CheckCircle className="absolute left-3 top-3.5 text-gray-400" size={18} />
                        <input 
                            type="password" 
                            inputMode="numeric"
                            maxLength={4}
                            placeholder="••••"
                            value={confirmPin}
                            onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                            className={`w-full bg-gray-50 border border-transparent focus:bg-white focus:border-blue-500 rounded-xl pl-10 pr-4 py-3 outline-none text-sm font-medium transition-all tracking-widest ${pin && confirmPin && pin !== confirmPin ? 'border-red-300 bg-red-50' : ''}`}
                        />
                    </div>
                </div>
            )}

            <button 
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-blue-200 active:scale-95 transition-all flex justify-center items-center gap-2 mt-4"
            >
                {loading ? <Loader2 className="animate-spin" /> : (
                    <>
                       {isSignup ? "Create Account" : "Unlock Dashboard"} <ArrowRight size={18} />
                    </>
                )}
            </button>

            <div className="relative py-4">
                <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-100"></div>
                </div>
                <div className="relative flex justify-center text-xs">
                    <span className="bg-white px-2 text-gray-400 font-bold uppercase">Or</span>
                </div>
            </div>

            <button 
                type="button"
                onClick={onSwitchToGoogle}
                className="w-full bg-white border border-gray-200 text-gray-600 font-bold py-3 rounded-xl hover:bg-gray-50 transition-colors text-xs"
            >
                Back to Google Login
            </button>
        </form>
    </div>
  );
};

export default EmailAuth;
