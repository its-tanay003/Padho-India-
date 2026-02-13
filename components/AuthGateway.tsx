import React, { useState, useEffect } from 'react';
import { requestOTP, verifyOTP, checkUserExists, registerUser, loginUser } from '../services/authService';
import { Loader2, Phone, ShieldCheck, User as UserIcon, BookOpen } from 'lucide-react';

interface Props {
  onLoginSuccess: () => void;
}

const AuthGateway: React.FC<Props> = ({ onLoginSuccess }) => {
  const [step, setStep] = useState<'PHONE' | 'OTP' | 'PROFILE'>('PHONE');
  const [loading, setLoading] = useState(false);
  
  // Data
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [name, setName] = useState('');
  const [grade, setGrade] = useState('10'); // Default to Class 10
  
  // UI State
  const [countdown, setCountdown] = useState(0);
  const [error, setError] = useState('');

  useEffect(() => {
    let timer: any;
    if (countdown > 0) {
      timer = setInterval(() => setCountdown(c => c - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [countdown]);

  const handleSendOTP = async () => {
    if (phoneNumber.length < 10) {
      setError("Please enter a valid 10-digit mobile number.");
      return;
    }
    setError('');
    setLoading(true);
    await requestOTP(phoneNumber);
    setLoading(false);
    setStep('OTP');
    setCountdown(30);
  };

  const handleVerifyOTP = async () => {
    setLoading(true);
    const isValid = await verifyOTP(otp);
    if (!isValid) {
      setError("Invalid OTP. Try 1234.");
      setLoading(false);
      return;
    }

    // Check if user exists
    const existingUser = await checkUserExists(phoneNumber);
    
    if (existingUser && existingUser.id) {
      loginUser(existingUser.id);
      setLoading(false);
      onLoginSuccess();
    } else {
      // New User -> Profile Setup
      setLoading(false);
      setStep('PROFILE');
    }
  };

  const handleRegister = async () => {
    if (!name.trim()) {
      setError("Please enter your full name.");
      return;
    }
    setLoading(true);
    try {
      // @ts-ignore
      const newUserId = await registerUser(phoneNumber, name, grade);
      loginUser(newUserId as number);
      onLoginSuccess();
    } catch (e) {
      setError("Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

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

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4 text-center">
            {error}
          </div>
        )}

        {/* STEP 1: PHONE INPUT */}
        {step === 'PHONE' && (
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Mobile Number</label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 text-gray-400" size={20} />
                <input 
                  type="tel" 
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-lg tracking-widest"
                  placeholder="98765 43210"
                />
              </div>
            </div>
            <button 
              onClick={handleSendOTP}
              disabled={loading || phoneNumber.length < 10}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl shadow-lg active:scale-95 transition-all disabled:opacity-50 flex justify-center items-center"
            >
              {loading ? <Loader2 className="animate-spin" /> : "Get OTP"}
            </button>
          </div>
        )}

        {/* STEP 2: OTP VERIFICATION */}
        {step === 'OTP' && (
          <div className="space-y-6">
            <div className="text-center">
               <p className="text-sm text-gray-600">Enter code sent to <span className="font-bold text-gray-800">+91 {phoneNumber}</span></p>
               <button onClick={() => setStep('PHONE')} className="text-xs text-blue-500 mt-1">Change Number</button>
            </div>

            <div className="relative">
               <ShieldCheck className="absolute left-3 top-3 text-gray-400" size={20} />
               <input 
                  type="text" 
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.slice(0, 4))}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-center text-2xl tracking-[0.5em] font-bold"
                  placeholder="0000"
                />
            </div>

            <button 
              onClick={handleVerifyOTP}
              disabled={loading || otp.length < 4}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl shadow-lg active:scale-95 transition-all disabled:opacity-50 flex justify-center items-center"
            >
              {loading ? <Loader2 className="animate-spin" /> : "Verify & Enter"}
            </button>

            <div className="text-center">
              {countdown > 0 ? (
                <p className="text-xs text-gray-400">Resend in {countdown}s</p>
              ) : (
                <button onClick={handleSendOTP} className="text-sm text-blue-600 font-medium">Resend OTP</button>
              )}
            </div>
          </div>
        )}

        {/* STEP 3: PROFILE SETUP */}
        {step === 'PROFILE' && (
          <div className="space-y-5">
             <h3 className="text-lg font-bold text-center text-gray-800">Complete Your Profile</h3>
             
             <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-gray-500">Full Name</label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-3 text-gray-400" size={20} />
                  <input 
                    type="text" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Enter your name"
                  />
                </div>
             </div>

             <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-gray-500">Class / Grade</label>
                <select 
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                >
                  {[...Array(12)].map((_, i) => (
                    <option key={i} value={i + 1}>Class {i + 1}</option>
                  ))}
                </select>
             </div>

             <button 
              onClick={handleRegister}
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3.5 rounded-xl shadow-lg active:scale-95 transition-all flex justify-center items-center mt-4"
            >
              {loading ? <Loader2 className="animate-spin" /> : "Start Learning!"}
            </button>
          </div>
        )}
      </div>
      <p className="mt-8 text-xs text-gray-400">v1.0.0 • Offline Supported</p>
    </div>
  );
};

export default AuthGateway;