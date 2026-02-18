
import React, { useState } from 'react';
import { findUserByEmail, registerUserManual, verifyPin } from '../db';
import { loginUser } from '../services/authService';
import { checkSyncStatus } from '../services/networkSim';
import { Mail, Lock, User, ArrowRight, Loader2, AlertCircle, CheckCircle, ShieldCheck } from 'lucide-react';

interface Props {
  onLoginSuccess: () => void;
  onSwitchToGoogle: () => void;
}

type Step = 'EMAIL' | 'LOGIN_PIN' | 'SIGNUP_DETAILS';

const EmailAuth: React.FC<Props> = ({ onLoginSuccess, onSwitchToGoogle }) => {
  const [step, setStep] = useState<Step>('EMAIL');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  
  // Store found user name for welcome message
  const [existingUserName, setExistingUserName] = useState('');

  const showError = (msg: string) => {
    setError(msg);
    setTimeout(() => setError(''), 4000);
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes('@')) return showError("Please enter a valid email.");
    
    setLoading(true);
    try {
        const user = await findUserByEmail(email);
        if (user) {
            setExistingUserName(user.name);
            setStep('LOGIN_PIN');
            setPin('');
        } else {
            setStep('SIGNUP_DETAILS');
            setPin('');
            setConfirmPin('');
        }
    } catch (err) {
        console.error(err);
        showError("Unable to verify email.");
    } finally {
        setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.length !== 4) return showError("PIN must be 4 digits.");

    setLoading(true);
    try {
        const user = await findUserByEmail(email);
        if (user && user.pin) {
            const isValid = await verifyPin(pin, user.pin);
            if (isValid) {
                // @ts-ignore
                loginUser(user.id);
                if (navigator.onLine) checkSyncStatus();
                onLoginSuccess();
            } else {
                setPin('');
                showError("PIN mismatch. Please try again.");
            }
        } else {
            showError("Account error. Please try again.");
            setStep('EMAIL');
        }
    } catch (err) {
        showError("Login failed.");
    } finally {
        setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !pin || !confirmPin) return showError("Please fill in all fields.");
    if (pin.length !== 4) return showError("PIN must be 4 digits.");
    if (pin !== confirmPin) return showError("PINs do not match.");

    setLoading(true);
    try {
        const id = await registerUserManual(name, email, pin);
        // @ts-ignore
        loginUser(id);
        if (navigator.onLine) checkSyncStatus();
        onLoginSuccess();
    } catch (err) {
        console.error(err);
        showError("Registration failed.");
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="w-full animate-in slide-in-from-right duration-300 relative">
        {error && (
            <div className="absolute -top-20 left-0 right-0 mx-auto bg-red-50 text-red-600 p-3 rounded-xl text-xs font-bold mb-6 flex items-center justify-between shadow-sm z-50 border border-red-100">
                <div className="flex items-center gap-2">
                    <AlertCircle size={16} /> {error}
                </div>
            </div>
        )}

        {/* STEP 1: EMAIL ENTRY */}
        {step === 'EMAIL' && (
            <form onSubmit={handleEmailSubmit} className="space-y-6">
                 <div className="text-center mb-6">
                    <h3 className="font-bold text-gray-800 text-lg">Continue with Email</h3>
                    <p className="text-gray-500 text-sm mt-1">Enter your email to login or sign up</p>
                 </div>

                 <div className="space-y-1">
                    <div className="relative">
                        <Mail className="absolute left-3 top-3.5 text-gray-400" size={18} />
                        <input 
                            type="email" 
                            placeholder="student@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-gray-50 border border-transparent focus:bg-white focus:border-blue-500 rounded-xl pl-10 pr-4 py-3 outline-none text-sm font-medium transition-all"
                            autoFocus
                        />
                    </div>
                </div>

                <button 
                    type="submit"
                    disabled={loading || !email}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-blue-200 active:scale-95 transition-all flex justify-center items-center gap-2 disabled:opacity-50 disabled:shadow-none"
                >
                    {loading ? <Loader2 className="animate-spin" /> : <>Continue <ArrowRight size={18} /></>}
                </button>

                 <div className="relative py-4">
                    <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-100"></div></div>
                    <div className="relative flex justify-center text-xs"><span className="bg-white px-2 text-gray-400 font-bold uppercase">Or</span></div>
                </div>

                <button type="button" onClick={onSwitchToGoogle} className="w-full bg-white border border-gray-200 text-gray-600 font-bold py-3 rounded-xl hover:bg-gray-50 transition-colors text-xs">
                    Sign in with Google
                </button>
            </form>
        )}

        {/* STEP 2: LOGIN PIN */}
        {step === 'LOGIN_PIN' && (
            <div className="space-y-6">
                 <div className="text-center mb-2">
                    <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-600 shadow-sm">
                        <Lock size={32} />
                    </div>
                    <h3 className="font-bold text-gray-800 text-lg">Welcome back, {existingUserName.split(' ')[0]}!</h3>
                    <p className="text-gray-500 text-xs mt-1">{email}</p>
                 </div>

                 <div className="space-y-4">
                    <input 
                        type="password" 
                        inputMode="numeric"
                        maxLength={4}
                        placeholder="••••"
                        value={pin}
                        onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, '').slice(0, 4);
                            setPin(val);
                        }}
                        className="w-full text-center text-4xl font-black tracking-[0.5em] py-4 border-2 border-gray-100 rounded-2xl focus:border-blue-500 focus:ring-0 outline-none text-gray-800 placeholder-gray-200 transition-colors"
                        autoFocus
                    />
                 </div>

                 <button 
                    onClick={handleLogin}
                    disabled={loading || pin.length < 4}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-blue-200 active:scale-95 transition-all flex justify-center items-center gap-2 disabled:opacity-50"
                >
                    {loading ? <Loader2 className="animate-spin" /> : "Unlock Dashboard"}
                </button>

                <button onClick={() => setStep('EMAIL')} className="w-full text-xs font-bold text-gray-400 hover:text-gray-600 uppercase tracking-wider">
                    Switch Account
                </button>
            </div>
        )}

        {/* STEP 3: SIGNUP DETAILS */}
        {step === 'SIGNUP_DETAILS' && (
             <form onSubmit={handleSignup} className="space-y-4">
                 <div className="text-center mb-2">
                    <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-600 shadow-sm">
                        <ShieldCheck size={32} />
                    </div>
                    <h3 className="font-bold text-gray-800 text-lg">Create Account</h3>
                    <p className="text-gray-500 text-xs mt-1">{email}</p>
                 </div>

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
                            autoFocus
                        />
                    </div>
                </div>

                <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 ml-1">Set PIN (4 Digits)</label>
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

                <button 
                    type="submit"
                    disabled={loading || !name || pin.length < 4 || confirmPin.length < 4}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-blue-200 active:scale-95 transition-all flex justify-center items-center gap-2 mt-2 disabled:opacity-50"
                >
                    {loading ? <Loader2 className="animate-spin" /> : "Set PIN & Start Learning"}
                </button>
                
                <button type="button" onClick={() => setStep('EMAIL')} className="w-full text-xs font-bold text-gray-400 hover:text-gray-600 uppercase tracking-wider text-center mt-2">
                    Use different email
                </button>
            </form>
        )}
    </div>
  );
};

export default EmailAuth;
