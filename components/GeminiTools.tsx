import React, { useState, useRef, useEffect } from 'react';
import { 
  Sparkles, MessageSquare, Image as ImageIcon, Video, Mic, 
  Search, Volume2, Edit, Zap, BrainCircuit, Loader2, Play, Paperclip, X, Settings2, Send, StopCircle, ChevronLeft, PenTool, FileText, Key, Check, Info
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
  
  // API Key Management UI State
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [tempKey, setTempKey] = useState(localStorage.getItem('custom_gemini_key') || '');
  
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
     // Check for custom key first
     if (localStorage.getItem('custom_gemini_key')) return true;

     // @ts-ignore
     if (window.aistudio && !await window.aistudio.hasSelectedApiKey()) {
        // @ts-ignore
        await window.aistudio.openSelectKey();
        return true;
     }
     return true;
  }

  const saveCustomKey = () => {
      const trimmedKey = tempKey.trim();
      if (trimmedKey) {
          localStorage.setItem('custom_gemini_key', trimmedKey);
      } else {
          localStorage.removeItem('custom_gemini_key');
      }
      setShowKeyModal(false);
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
                    } catch (err: any) {
                        setMessages(prev => [...prev, { role: 'model', type: 'text', content: `⚠️ Listening failed: ${err.message || "Please try speaking again."}` }]);
                    } finally {
                        setIsTranscribing(false);
                    }
                };
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.start();
            setIsRecording(true);
        } catch (err) {
            alert("Could not access microphone. Please check your browser permissions.");
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
      await checkApiKey();

      if (currentFile) {
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
             setMessages(prev => [...prev, { role: 'model', type: 'text', content: `⚠️ Analysis failed: ${e.message || "I had trouble reading that file."}` }]);
          }
          setLoading(false);
        };
        return;
      }

      if (mode === 'chat') {
        const history = messages.filter(m => m.type === 'text').map(m => ({ role: m.role, parts: [{ text: m.content }] }));
        // Using 'gemini-flash-latest' for the best balance of speed and permission reliability
        const res = await GeminiService.getChatResponse(history, currentInput, 'gemini-flash-latest', useThinking, useSearch);
        
        setMessages(prev => [...prev, { 
            role: 'model', 
            type: 'text', 
            content: res.text || "I'm here, but I didn't get a proper response. Please try again.", 
            grounding: res.grounding 
        }]);
      }
      else if (mode === 'generate_image') {
        const img = await GeminiService.generateImage(currentInput, imgSize, imgRatio);
        setMessages(prev => [...prev, { role: 'model', type: 'image', content: img }]);
      }
      else if (mode === 'generate_video') {
        const uri = await GeminiService.generateVideo(currentInput, videoRatio);
        const finalUrl = `${uri}&key=${localStorage.getItem('custom_gemini_key') || GEMINI_API_KEY}`;
        setMessages(prev => [...prev, { role: 'model', type: 'video', content: finalUrl }]);
      }
      else if (mode === 'tts') {
         const audioBase64 = await GeminiService.generateSpeech(currentInput);
         setMessages(prev => [...prev, { role: 'model', type: 'audio', content: audioBase64 }]);
         playAudio(audioBase64);
      }
    } catch (e: any) {
      console.error("GeminiTools API Error:", e);
      let errorMsg = `⚠️ Mitra is having a small technical issue: ${e.message || "Please check your connection."}`;
      
      if (e.message?.includes('403') || e.status === 403) {
          errorMsg = "⚠️ Permission Denied (403). Your API Key might not have access to this feature, or the Generative Language API is disabled in your project. Click the 'Key' icon to check settings.";
      } else if (e.message?.includes('429') || e.status === 429) {
          errorMsg = "⚠️ Too many requests! Please wait a few moments and I'll be ready again.";
      }
      
      setMessages(prev => [...prev, { role: 'model', type: 'text', content: errorMsg }]);
    } finally {
      if (!currentFile) setLoading(false);
    }
  };

  const playAudio = async (base64: string) => {
    try {
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
    } catch (err) {
        console.error("Audio playback error:", err);
    }
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
                  <span className="font-bold text-sm text-gray-700">Listen to Mitra</span>
              </div>
          );
          default: return <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>;
      }
  };

  return (
    <div className="flex flex-col h-full bg-[#FFF5F0]">
      
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        onChange={(e) => {
            if (e.target.files?.[0]) setSelectedFile(e.target.files[0]);
        }}
        accept="image/*,application/pdf,text/plain,text/csv,application/json"
      />

      <div className="px-4 pt-2 pb-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-b-3xl shadow-lg z-10 shrink-0">
          <div className="flex items-center gap-3 mb-2">
             <button onClick={() => navigate('/')} className="p-1 hover:bg-white/20 rounded-full"><ChevronLeft /></button>
             <div>
                <h1 className="font-black text-xl">Mitra AI Lab</h1>
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest opacity-90">
                    <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 bg-green-300 rounded-full animate-pulse"></div> Free Tier Optimized</span>
                    <span>•</span>
                    <span>Hinglish Tutor</span>
                </div>
             </div>
             <div className="ml-auto flex items-center gap-2">
                 <button onClick={() => setShowKeyModal(true)} className={`p-2 rounded-xl transition-all ${localStorage.getItem('custom_gemini_key') ? 'bg-green-400 scale-105 border-2 border-white/50' : 'bg-white/20 hover:bg-white/30'}`} title="Manage API Key">
                     <Key size={20} />
                 </button>
                 <div className="bg-white/20 p-2 rounded-xl">
                     <BrainCircuit size={20} />
                 </div>
             </div>
          </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full space-y-8 p-6 animate-in fade-in zoom-in duration-500">
                <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-tr from-orange-300 to-pink-300 rounded-[2rem] opacity-30 blur-2xl animate-pulse"></div>
                    <div className="bg-white p-6 rounded-[2.5rem] shadow-xl shadow-orange-100/50 relative z-10 border border-white/50">
                        <img src="https://api.dicebear.com/7.x/bottts/svg?seed=Mitra" alt="Mitra" className="w-24 h-24" />
                    </div>
                </div>
                
                <div className="text-center space-y-2">
                    <h3 className="text-2xl font-black text-gray-800 tracking-tight">Namaste! I'm Mitra.</h3>
                    <p className="text-gray-500 font-medium">Your personal tutor & creative buddy. <br/>How can I help you learn today?</p>
                </div>

                <div className="grid grid-cols-2 gap-3 w-full max-w-sm">
                    <button onClick={() => { setMode('chat'); handleSend("Explain photosynthesis simply"); }} className="bg-white p-4 rounded-2xl shadow-sm hover:shadow-lg border border-orange-50 hover:border-orange-200 transition-all text-left group active:scale-95">
                        <div className="bg-blue-100 w-10 h-10 rounded-full flex items-center justify-center text-blue-600 mb-2 group-hover:scale-110 transition-transform"><MessageSquare size={18} /></div>
                        <span className="font-bold text-gray-700 text-sm">Ask about Photosynthesis</span>
                    </button>
                    <button onClick={() => { setMode('generate_image'); handleSend("Generate an image of a majestic tiger"); }} className="bg-white p-4 rounded-2xl shadow-sm hover:shadow-lg border border-orange-50 hover:border-orange-200 transition-all text-left group active:scale-95">
                        <div className="bg-purple-100 w-10 h-10 rounded-full flex items-center justify-center text-purple-600 mb-2 group-hover:scale-110 transition-transform"><ImageIcon size={18} /></div>
                        <span className="font-bold text-gray-700 text-sm">Image of a Tiger</span>
                    </button>
                     <button onClick={() => { setMode('tts'); handleSend("Create audio for a poem about nature"); }} className="bg-white p-4 rounded-2xl shadow-sm hover:shadow-lg border border-orange-50 hover:border-orange-200 transition-all text-left group active:scale-95">
                        <div className="bg-green-100 w-10 h-10 rounded-full flex items-center justify-center text-green-600 mb-2 group-hover:scale-110 transition-transform"><Volume2 size={18} /></div>
                        <span className="font-bold text-gray-700 text-sm">Audio for a Poem</span>
                    </button>
                     <button onClick={() => { setMode('generate_video'); handleSend("A time-lapse video of a flower blooming"); }} className="bg-white p-4 rounded-2xl shadow-sm hover:shadow-lg border border-orange-50 hover:border-orange-200 transition-all text-left group active:scale-95">
                        <div className="bg-red-100 w-10 h-10 rounded-full flex items-center justify-center text-red-600 mb-2 group-hover:scale-110 transition-transform"><Video size={18} /></div>
                        <span className="font-bold text-gray-700 text-sm">Video of a Flower</span>
                    </button>
                </div>
            </div>
        )}

        {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2`}>
                {m.role === 'model' && (
                    <div className="w-8 h-8 rounded-full bg-white border border-gray-100 flex items-center justify-center mr-2 shadow-sm shrink-0">
                        <Sparkles size={14} className="text-orange-500" />
                    </div>
                )}
                <div className={`max-w-[80%] p-4 rounded-2xl text-sm shadow-sm ${
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
                   <span className="text-xs font-bold text-gray-500">{isTranscribing ? "Listening..." : "Mitra is thinking..."}</span>
                </div>
            </div>
        )}
        <div ref={chatEndRef} />
      </div>

      <div className="bg-white/80 backdrop-blur-md p-4 rounded-t-3xl shadow-[0_-5px_30px_rgba(0,0,0,0.05)] border-t border-white/50 shrink-0">
        
        {selectedFile && (
           <div className="flex items-center gap-3 bg-white p-2 rounded-xl border border-gray-100 mb-2 w-fit shadow-sm animate-in slide-in-from-bottom-2 relative z-20">
               {selectedFile.type.startsWith('image/') ? (
                   <img src={URL.createObjectURL(selectedFile)} alt="Preview" className="w-10 h-10 rounded-lg object-cover bg-gray-100" />
               ) : (
                   <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center text-red-500"><FileText size={20} /></div>
               )}
               <div className="flex flex-col">
                   <span className="text-xs font-bold text-gray-700 max-w-[150px] truncate">{selectedFile.name}</span>
                   <span className="text-[10px] text-gray-400 font-medium">{(selectedFile.size / 1024).toFixed(1)} KB</span>
               </div>
               <button onClick={() => setSelectedFile(null)} className="p-1 hover:bg-gray-100 rounded-full text-gray-400 hover:text-red-500 transition-colors"><X size={16} /></button>
           </div>
        )}

        <div className="flex gap-2 mb-3 overflow-x-auto pb-1 no-scrollbar justify-center">
            <button onClick={() => setMode('chat')} className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${mode === 'chat' ? 'bg-orange-500 text-white shadow-md shadow-orange-200' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}><MessageSquare size={12} /> Chat</button>
            <button onClick={() => setMode('generate_image')} className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${mode === 'generate_image' ? 'bg-purple-500 text-white shadow-md shadow-purple-200' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}><ImageIcon size={12} /> Visual</button>
            <button onClick={() => setMode('tts')} className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${mode === 'tts' ? 'bg-blue-500 text-white shadow-md shadow-blue-200' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}><Volume2 size={12} /> Speak</button>
             <button onClick={() => setMode('generate_video')} className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${mode === 'generate_video' ? 'bg-red-500 text-white shadow-md shadow-red-200' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}><Video size={12} /> Video</button>
        </div>

        <div className="relative group z-20">
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
            
            <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-2 z-10">
                <button onClick={() => fileInputRef.current?.click()} className="p-2 text-gray-400 hover:text-orange-500 hover:bg-orange-50 rounded-xl transition-all" title="Attach file"><Paperclip size={20} /></button>
                <button onClick={handleMicToggle} className={`p-2 rounded-xl transition-all ${isRecording ? 'bg-red-500 text-white animate-pulse shadow-lg shadow-red-300' : 'text-gray-400 hover:text-orange-500 hover:bg-orange-50'}`}>{isRecording ? <StopCircle size={20} /> : <Mic size={20} />}</button>
            </div>

            <button onClick={() => handleSend()} disabled={!input.trim() && !selectedFile} className={`absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-xl transition-all z-10 ${input.trim() || selectedFile ? 'bg-gradient-to-tr from-orange-500 to-pink-500 text-white shadow-lg shadow-orange-300 transform hover:scale-105 active:scale-95' : 'bg-gray-200 text-gray-400'}`}><Send size={18} /></button>
        </div>
      </div>

      {showKeyModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
              <div className="bg-white w-full max-w-sm rounded-[2rem] shadow-2xl overflow-hidden p-6 animate-in zoom-in-95 duration-200 border border-orange-100">
                  <div className="flex justify-between items-center mb-6">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-orange-100 text-orange-600 rounded-xl"><Key size={24} /></div>
                        <h3 className="text-xl font-black text-gray-800 tracking-tight">API Key Settings</h3>
                      </div>
                      <button onClick={() => setShowKeyModal(false)} className="p-2 hover:bg-gray-100 rounded-full text-gray-400"><X size={20} /></button>
                  </div>

                  <div className="space-y-4">
                      <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 flex gap-3">
                          <Info className="text-blue-500 shrink-0" size={20} />
                          <p className="text-xs text-blue-700 leading-relaxed font-medium">If you are seeing 'Permission Denied' errors, please provide your own Gemini API Key from Google AI Studio. This project is optimized for the 'gemini-flash-latest' model.</p>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Personal API Key</label>
                        <input 
                            type="password"
                            value={tempKey}
                            onChange={(e) => setTempKey(e.target.value)}
                            placeholder="AIzaSyB..."
                            className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl px-4 py-3 font-mono text-sm focus:bg-white focus:border-orange-500 outline-none transition-all"
                        />
                      </div>

                      <div className="pt-2">
                        <button onClick={saveCustomKey} className="w-full bg-gradient-to-tr from-orange-500 to-red-500 text-white font-black py-4 rounded-2xl shadow-xl shadow-orange-200 active:scale-95 transition-all flex items-center justify-center gap-2"><Check size={20} /> Apply Key</button>
                        <button onClick={() => { setTempKey(''); localStorage.removeItem('custom_gemini_key'); setShowKeyModal(false); }} className="w-full text-center mt-3 text-xs font-bold text-gray-400 hover:text-red-500 transition-colors">Use Default (Verified) Key</button>
                      </div>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default GeminiTools;