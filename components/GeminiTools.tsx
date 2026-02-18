
import React, { useState, useRef, useEffect } from 'react';
import { 
  Sparkles, MessageSquare, Image as ImageIcon, Video, Mic, 
  Search, Volume2, Edit, Zap, BrainCircuit, Loader2, Play, Paperclip, X, Settings2, Send, StopCircle, ChevronLeft, PenTool, FileText, Key, Leaf, Book
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import * as GeminiService from '../services/geminiService';
import { GeminiModel } from '../types';
import { GEMINI_API_KEY } from '../constants';

type MessageType = 'text' | 'image' | 'video' | 'audio';
type ToolMode = 'chat' | 'generate_image' | 'generate_video' | 'tts';

interface ChatMessage {
  role: 'user' | 'model';
  type: MessageType;
  content: string;
  grounding?: any;
}

const GeminiTools: React.FC = () => {
  const navigate = useNavigate();
  // Unified State
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<ToolMode>('chat');
  
  // Settings
  const [useSearch, setUseSearch] = useState(false);
  const [useThinking, setUseThinking] = useState(false);
  const [videoRatio, setVideoRatio] = useState<'16:9'|'9:16'>('16:9');
  const [imgSize, setImgSize] = useState('1K');
  const [imgRatio, setImgRatio] = useState('1:1');
  
  // Refs for media
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Audio Recording
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Audio Context
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const checkApiKey = async () => {
     // @ts-ignore
     if (window.aistudio && !await window.aistudio.hasSelectedApiKey()) {
        // @ts-ignore
        await window.aistudio.openSelectKey();
        return true;
     }
     return true;
  }

  const handleSelectKey = async () => {
      // @ts-ignore
      if (window.aistudio) {
          // @ts-ignore
          await window.aistudio.openSelectKey();
      } else {
          // Fallback for local/manual
          const current = localStorage.getItem('custom_gemini_key') || '';
          const newKey = window.prompt("Enter your Gemini API Key (or leave empty to use default/env key):", current);
          if (newKey !== null) {
              localStorage.setItem('custom_gemini_key', newKey);
              if (newKey) alert("Key updated locally.");
              else alert("Custom key cleared. Using default.");
          }
      }
  };

  const handleMicToggle = async () => {
    if (isRecording) {
        mediaRecorderRef.current?.stop();
        setIsRecording(false);
    } else {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : '';
            const mediaRecorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
            
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) audioChunksRef.current.push(event.data);
            };

            mediaRecorder.onstop = async () => {
                setIsTranscribing(true);
                const type = mediaRecorder.mimeType || 'audio/webm';
                const audioBlob = new Blob(audioChunksRef.current, { type });
                const reader = new FileReader();
                reader.readAsDataURL(audioBlob);
                reader.onloadend = async () => {
                    const base64Audio = reader.result as string;
                    try {
                        const text = await GeminiService.transcribeAudio(base64Audio, type);
                        setInput(prev => prev + (prev ? ' ' : '') + (text || ''));
                    } catch (err) {
                        setMessages(prev => [...prev, { role: 'model', type: 'text', content: "⚠️ Transcription failed." }]);
                    } finally {
                        setIsTranscribing(false);
                    }
                };
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.start();
            setIsRecording(true);
        } catch (err) {
            alert("Could not access microphone.");
        }
    }
  };

  const handleSend = async (forcedInput?: string) => {
    const textToSend = forcedInput || input;
    if (!textToSend.trim() && !selectedFile) return;
    
    setMessages(prev => [...prev, {
        role: 'user',
        type: selectedFile ? 'image' : 'text',
        content: textToSend, 
        grounding: selectedFile ? { preview: selectedFile.type.startsWith('image/') ? URL.createObjectURL(selectedFile) : undefined, fileName: selectedFile.name } : undefined
    }]);

    setLoading(true);
    const currentInput = textToSend;
    const currentFile = selectedFile;
    setInput('');
    setSelectedFile(null);
    
    try {
      if (currentFile) {
        await checkApiKey();
        const reader = new FileReader();
        reader.readAsDataURL(currentFile);
        reader.onload = async () => {
          const base64 = reader.result as string;
          try {
            if (mode === 'generate_image' && currentFile.type.startsWith('image/')) {
               const res = await GeminiService.editImage(base64, currentInput || "Enhance image");
               setMessages(prev => [...prev, { role: 'model', type: 'image', content: res }]);
            } else {
               const prompt = currentInput || (currentFile.type.startsWith('image/') ? "Describe this image." : "Summarize this document.");
               const res = await GeminiService.analyzeMedia(base64, currentFile.type, prompt);
               setMessages(prev => [...prev, { role: 'model', type: 'text', content: res }]);
            }
          } catch (e: any) {
             setMessages(prev => [...prev, { role: 'model', type: 'text', content: `⚠️ Error: ${e.message || "Failed to analyze file."}` }]);
          }
          setLoading(false);
        };
        return;
      }

      if (mode === 'chat') {
        const history = messages.filter(m => m.type === 'text').map(m => ({ role: m.role, parts: [{ text: m.content }] }));
        let responseText = '', grounding = undefined;

        if (useThinking) {
             await checkApiKey();
             const res = await GeminiService.getChatResponse(history, currentInput, GeminiModel.PRO_3, true, false);
             responseText = res.text || '';
        } else if (useSearch) {
             await checkApiKey();
             const res = await GeminiService.getChatResponse(history, currentInput, GeminiModel.FLASH_3, false, true);
             responseText = res.text || '';
             // @ts-ignore
             if (res.grounding) grounding = res.grounding;
        } else {
             const res = await GeminiService.getChatResponse(history, currentInput, GeminiModel.FLASH_3);
             responseText = res.text || '';
        }
        setMessages(prev => [...prev, { role: 'model', type: 'text', content: responseText, grounding }]);
      }
      else if (mode === 'generate_image') {
        await checkApiKey();
        const img = await GeminiService.generateImage(currentInput, imgSize, imgRatio);
        setMessages(prev => [...prev, { role: 'model', type: 'image', content: img }]);
      }
      else if (mode === 'generate_video') {
        await checkApiKey();
        const uri = await GeminiService.generateVideo(currentInput, videoRatio);
        const finalUrl = `${uri}&key=${localStorage.getItem('custom_gemini_key') || process.env.API_KEY || GEMINI_API_KEY}`;
        setMessages(prev => [...prev, { role: 'model', type: 'video', content: finalUrl }]);
      }
      else if (mode === 'tts') {
         const audioBase64 = await GeminiService.generateSpeech(currentInput);
         setMessages(prev => [...prev, { role: 'model', type: 'audio', content: audioBase64 }]);
         playAudio(audioBase64);
      }
    } catch (e: any) {
      console.error(e);
      const errorMsg = `⚠️ Something went wrong: ${e.message || "I'm having trouble connecting right now."}`;
      setMessages(prev => [...prev, { role: 'model', type: 'text', content: errorMsg }]);
    } finally {
      if (!currentFile) setLoading(false);
    }
  };

  const playAudio = async (base64: string) => {
    if (!audioContextRef.current) audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({sampleRate: 24000});
    const ctx = audioContextRef.current;
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) bytes[i] = binaryString.charCodeAt(i);
    const dataInt16 = new Int16Array(bytes.buffer);
    const buffer = ctx.createBuffer(1, dataInt16.length, 24000);
    const channelData = buffer.getChannelData(0);
    for (let i = 0; i < dataInt16.length; i++) channelData[i] = dataInt16[i] / 32768.0;
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    source.start(0);
  };

  const renderMessageContent = (msg: ChatMessage) => {
      if (msg.grounding?.preview || msg.grounding?.fileName) {
          return (
              <div className="flex flex-col">
                  {msg.grounding.preview ? (
                      <img src={msg.grounding.preview} alt="Upload" className="max-w-[200px] rounded-lg mb-2" />
                  ) : (
                      <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-lg mb-2 w-fit">
                          <FileText size={20} className="text-gray-500"/>
                          <span className="text-xs font-bold text-gray-700">{msg.grounding.fileName}</span>
                      </div>
                  )}
                  <p>{msg.content}</p>
              </div>
          )
      }
      switch (msg.type) {
          case 'image': return <img src={msg.content} alt="Generated" className="rounded-xl max-w-full h-auto shadow-sm" />;
          case 'video': return <video src={msg.content} controls className="rounded-xl max-w-full shadow-sm" />;
          case 'audio': return (
              <div className="flex items-center gap-3">
                  <button onClick={() => playAudio(msg.content)} className="bg-orange-100 p-2 rounded-full text-orange-600 hover:bg-orange-200">
                      <Volume2 size={24} />
                  </button>
                  <span className="font-bold text-sm text-gray-700">Audio Generated</span>
              </div>
          );
          default: return <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>;
      }
  };

  return (
    <div className="flex flex-col h-full bg-[#FFF5F0] rounded-2xl overflow-hidden shadow-sm border border-orange-50/50">
      
      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        onChange={(e) => {
            if (e.target.files?.[0]) setSelectedFile(e.target.files[0]);
        }}
        accept="image/*,application/pdf,text/plain,text/csv,application/json"
      />

      {/* AI Lab Header */}
      <div className="px-4 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg z-10 shrink-0">
          <div className="flex items-center gap-3">
             <button onClick={() => navigate('/')} className="p-1 hover:bg-white/20 rounded-full md:hidden"><ChevronLeft /></button>
             <div>
                <h1 className="font-black text-xl flex items-center gap-2">
                    <BrainCircuit size={24} className="text-white/90" />
                    Mitra AI Lab
                </h1>
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest opacity-90">
                    <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 bg-green-300 rounded-full animate-pulse"></div> Online</span>
                    <span className="hidden sm:inline">•</span>
                    <span className="hidden sm:inline">Voice Powered</span>
                </div>
             </div>
             <div className="ml-auto flex items-center gap-2">
                 <button onClick={handleSelectKey} className="bg-white/20 p-2 rounded-xl hover:bg-white/30 transition-colors" title="Select API Key">
                     <Key size={18} />
                 </button>
             </div>
          </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-[#FFF5F0] to-white">
        <div className="max-w-4xl mx-auto w-full space-y-4">
            {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center py-10 space-y-8 animate-in fade-in zoom-in duration-500">
                    {/* Hero Icon */}
                    <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-tr from-orange-300 to-pink-300 rounded-[2rem] opacity-30 blur-2xl animate-pulse"></div>
                        <div className="bg-white p-6 rounded-[2.5rem] shadow-xl shadow-orange-100/50 relative z-10 border border-white/50">
                            <img src="https://api.dicebear.com/7.x/bottts/svg?seed=Mitra" alt="Mitra" className="w-24 h-24" />
                        </div>
                    </div>
                    
                    <div className="text-center space-y-2 max-w-md">
                        <h3 className="text-2xl font-black text-gray-800 tracking-tight">Namaste! I'm Mitra.</h3>
                        <p className="text-gray-500 font-medium">Your creative AI companion. <br/>What shall we create today?</p>
                    </div>

                    {/* Suggestion Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg px-4">
                        <button 
                            onClick={() => { setMode('chat'); handleSend("Explain Quantum Physics to a 5 year old."); }}
                            className="bg-white p-4 rounded-2xl shadow-sm hover:shadow-lg border border-orange-50 hover:border-orange-200 transition-all text-left group active:scale-95 flex items-center gap-3"
                        >
                            <div className="bg-blue-100 w-10 h-10 rounded-full flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform shrink-0">
                                <Zap size={18} />
                            </div>
                            <div>
                                <span className="font-bold text-gray-700 text-sm block">Quantum Physics?</span>
                                <p className="text-[10px] text-gray-400">Ask a question</p>
                            </div>
                        </button>

                        <button 
                            onClick={() => { setMode('generate_image'); handleSend("A futuristic city with neon lights and flying cars, cyberpunk style, highly detailed"); }}
                            className="bg-white p-4 rounded-2xl shadow-sm hover:shadow-lg border border-orange-50 hover:border-orange-200 transition-all text-left group active:scale-95 flex items-center gap-3"
                        >
                            <div className="bg-purple-100 w-10 h-10 rounded-full flex items-center justify-center text-purple-600 group-hover:scale-110 transition-transform shrink-0">
                                <ImageIcon size={18} />
                            </div>
                            <div>
                                <span className="font-bold text-gray-700 text-sm block">Futuristic City</span>
                                <p className="text-[10px] text-gray-400">Generate image</p>
                            </div>
                        </button>

                        <button 
                            onClick={() => { setMode('tts'); handleSend("Two roads diverged in a yellow wood, And sorry I could not travel both And be one traveler, long I stood..."); }}
                            className="bg-white p-4 rounded-2xl shadow-sm hover:shadow-lg border border-orange-50 hover:border-orange-200 transition-all text-left group active:scale-95 flex items-center gap-3"
                        >
                            <div className="bg-green-100 w-10 h-10 rounded-full flex items-center justify-center text-green-600 group-hover:scale-110 transition-transform shrink-0">
                                <Volume2 size={18} />
                            </div>
                            <div>
                                <span className="font-bold text-gray-700 text-sm block">Poem to Speech</span>
                                <p className="text-[10px] text-gray-400">Listen to audio</p>
                            </div>
                        </button>

                        <button 
                            onClick={() => { setMode('generate_video'); handleSend("A majestic dragon flying over a medieval castle, cinematic lighting, 4k"); }}
                            className="bg-white p-4 rounded-2xl shadow-sm hover:shadow-lg border border-orange-50 hover:border-orange-200 transition-all text-left group active:scale-95 flex items-center gap-3"
                        >
                            <div className="bg-red-100 w-10 h-10 rounded-full flex items-center justify-center text-red-600 group-hover:scale-110 transition-transform shrink-0">
                                <Video size={18} />
                            </div>
                            <div>
                                <span className="font-bold text-gray-700 text-sm block">Dragon Video</span>
                                <p className="text-[10px] text-gray-400">Create video</p>
                            </div>
                        </button>
                    </div>
                </div>
            )}

            {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2`}>
                    {m.role === 'model' && (
                        <div className="w-8 h-8 rounded-full bg-white border border-gray-100 flex items-center justify-center mr-2 shadow-sm shrink-0 mt-2">
                            <Sparkles size={14} className="text-orange-500" />
                        </div>
                    )}
                    <div className={`max-w-[85%] md:max-w-[70%] p-4 rounded-2xl text-sm shadow-sm leading-relaxed ${
                        m.role === 'user' 
                        ? 'bg-orange-500 text-white rounded-tr-sm' 
                        : 'bg-white text-gray-800 border border-gray-100 rounded-tl-sm'
                    }`}>
                        {renderMessageContent(m)}
                    </div>
                </div>
            ))}
            
            {(loading || isTranscribing) && (
                <div className="flex justify-start items-center gap-2 ml-10">
                    <div className="bg-white px-4 py-2 rounded-full border border-orange-100 flex items-center gap-2 shadow-sm">
                    <div className="flex gap-1">
                        <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce delay-75"></div>
                        <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce delay-150"></div>
                    </div>
                    <span className="text-xs font-bold text-gray-500">{isTranscribing ? "Listening..." : "Thinking..."}</span>
                    </div>
                </div>
            )}
            <div ref={chatEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="bg-white/80 backdrop-blur-md p-4 shadow-[0_-5px_30px_rgba(0,0,0,0.05)] border-t border-white/50 shrink-0">
        <div className="max-w-4xl mx-auto w-full">
            {/* File Preview Card */}
            {selectedFile && (
            <div className="flex items-center gap-3 bg-white p-2 rounded-xl border border-gray-100 mb-2 w-fit shadow-sm animate-in slide-in-from-bottom-2 relative z-20">
                {selectedFile.type.startsWith('image/') ? (
                    <img src={URL.createObjectURL(selectedFile)} alt="Preview" className="w-10 h-10 rounded-lg object-cover bg-gray-100" />
                ) : (
                    <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center text-red-500">
                        <FileText size={20} />
                    </div>
                )}
                <div className="flex flex-col">
                    <span className="text-xs font-bold text-gray-700 max-w-[150px] truncate">{selectedFile.name}</span>
                    <span className="text-[10px] text-gray-400 font-medium">{(selectedFile.size / 1024).toFixed(1)} KB</span>
                </div>
                <button onClick={() => setSelectedFile(null)} className="p-1 hover:bg-gray-100 rounded-full text-gray-400 hover:text-red-500 transition-colors">
                    <X size={16} />
                </button>
            </div>
            )}

            {/* Context Bar */}
            <div className="flex gap-2 mb-3 overflow-x-auto pb-1 no-scrollbar justify-center">
                <button onClick={() => setMode('chat')} className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${mode === 'chat' ? 'bg-orange-500 text-white shadow-md shadow-orange-200' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                    <MessageSquare size={12} /> Chat
                </button>
                <button onClick={() => setMode('generate_image')} className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${mode === 'generate_image' ? 'bg-purple-500 text-white shadow-md shadow-purple-200' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                    <ImageIcon size={12} /> Visual
                </button>
                <button onClick={() => setMode('tts')} className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${mode === 'tts' ? 'bg-blue-500 text-white shadow-md shadow-blue-200' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                    <Volume2 size={12} /> Speak
                </button>
                <button onClick={() => setMode('generate_video')} className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${mode === 'generate_video' ? 'bg-red-500 text-white shadow-md shadow-red-200' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                    <Video size={12} /> Video
                </button>
            </div>

            <div className="relative group z-20">
                {/* Input Glow */}
                <div className="absolute -inset-0.5 bg-gradient-to-r from-orange-300 to-pink-300 rounded-3xl blur opacity-0 group-hover:opacity-30 group-focus-within:opacity-50 transition-opacity duration-500"></div>
                
                <input 
                    type="text" 
                    value={input} 
                    onChange={(e) => setInput(e.target.value)} 
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    placeholder={isRecording ? "Listening..." : mode === 'generate_image' ? "Describe image to generate..." : "Ask Mitra anything..."}
                    disabled={isRecording || isTranscribing}
                    className="w-full relative bg-white/80 border-2 border-orange-50 rounded-3xl pl-24 pr-12 py-4 font-medium text-gray-700 placeholder-gray-400 transition-all duration-300 focus:bg-white focus:border-orange-300 focus:ring-4 focus:ring-orange-100 focus:shadow-xl focus:shadow-orange-100/50 hover:border-orange-200 hover:shadow-md hover:bg-white"
                />
                
                {/* Left Icons (Attach & Mic) */}
                <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-2 z-10">
                    <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="p-2 text-gray-400 hover:text-orange-500 hover:bg-orange-50 rounded-xl transition-all"
                        title="Attach file (Image/PDF)"
                    >
                        <Paperclip size={20} />
                    </button>
                    <button 
                        onClick={handleMicToggle}
                        className={`p-2 rounded-xl transition-all ${isRecording ? 'bg-red-500 text-white animate-pulse shadow-lg shadow-red-300' : 'text-gray-400 hover:text-orange-500 hover:bg-orange-50'}`}
                    >
                        {isRecording ? <StopCircle size={20} /> : <Mic size={20} />}
                    </button>
                </div>

                {/* Right Icon (Send) */}
                <button 
                    onClick={() => handleSend()}
                    disabled={!input.trim() && !selectedFile}
                    className={`absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-xl transition-all z-10 ${input.trim() || selectedFile ? 'bg-gradient-to-tr from-orange-500 to-pink-500 text-white shadow-lg shadow-orange-300 transform hover:scale-105 active:scale-95' : 'bg-gray-200 text-gray-400'}`}
                >
                    <Send size={18} />
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default GeminiTools;
