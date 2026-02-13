import React, { useState, useRef, useEffect } from 'react';
import { 
  Sparkles, MessageSquare, Image as ImageIcon, Video, Mic, 
  Search, Volume2, Edit, Zap, BrainCircuit, Loader2, Play, Paperclip, X, Settings2, Send
} from 'lucide-react';
import * as GeminiService from '../services/geminiService';
import { GeminiModel } from '../types';

type MessageType = 'text' | 'image' | 'video' | 'audio';
type ToolMode = 'chat' | 'generate_image' | 'generate_video' | 'tts';

interface ChatMessage {
  role: 'user' | 'model';
  type: MessageType;
  content: string;
  grounding?: any;
}

const GeminiTools: React.FC = () => {
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

  const handleSend = async () => {
    if (!input.trim() && !selectedFile) return;
    
    // Add User Message immediately
    setMessages(prev => [...prev, {
        role: 'user',
        type: selectedFile ? 'image' : 'text',
        content: input, 
        grounding: selectedFile ? { preview: URL.createObjectURL(selectedFile) } : undefined
    }]);

    setLoading(true);
    const currentInput = input;
    const currentFile = selectedFile;
    setInput('');
    setSelectedFile(null);
    
    try {
      // 1. IMAGE ANALYSIS / EDITING (If File Present)
      if (currentFile) {
        await checkApiKey();
        const reader = new FileReader();
        reader.readAsDataURL(currentFile);
        reader.onload = async () => {
          const base64 = reader.result as string;
          
          if (mode === 'generate_image') {
             // Edit Mode
             const res = await GeminiService.editImage(base64, currentInput || "Enhance image");
             setMessages(prev => [...prev, { role: 'model', type: 'image', content: res }]);
          } else {
             // Analyze Mode (Default Chat)
             const res = await GeminiService.analyzeImage(base64, currentInput || "Describe this image.");
             setMessages(prev => [...prev, { role: 'model', type: 'text', content: res }]);
          }
          setLoading(false);
        };
        return; // Async handled in onload
      }

      // 2. TEXT ONLY TOOLS
      if (mode === 'chat') {
        // Ensure API Key is selected for high-tier models
        await checkApiKey();
        
        const history = messages
            .filter(m => m.type === 'text')
            .map(m => ({ role: m.role, parts: [{ text: m.content }] }));
        
        let responseText = '';
        let grounding = undefined;

        if (useThinking) {
             const res = await GeminiService.getChatResponse(history, currentInput, GeminiModel.PRO_3, true, false);
             responseText = res.text || '';
        } else if (useSearch) {
             const res = await GeminiService.getChatResponse(history, currentInput, GeminiModel.FLASH_3, false, true);
             responseText = res.text || '';
             // @ts-ignore
             if (res.grounding) grounding = res.grounding;
        } else {
             const res = await GeminiService.getChatResponse(history, currentInput, GeminiModel.PRO_3);
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
        const finalUrl = `${uri}&key=${process.env.API_KEY}`;
        setMessages(prev => [...prev, { role: 'model', type: 'video', content: finalUrl }]);
      }
      
      else if (mode === 'tts') {
         // Text to Speech
         const audioBase64 = await GeminiService.generateSpeech(currentInput);
         setMessages(prev => [...prev, { role: 'model', type: 'audio', content: audioBase64 }]);
         playAudio(audioBase64);
      }

    } catch (e: any) {
      console.error(e);
      // Handle Permission/Auth Errors
      if (e?.status === 403 || e?.code === 403 || e?.message?.includes('403') || e?.message?.includes('PERMISSION_DENIED')) {
          setMessages(prev => [...prev, { role: 'model', type: 'text', content: "⚠️ Access Denied. Please select a valid API Key." }]);
          
          // Trigger key selection if available
          // @ts-ignore
          if (window.aistudio) {
             setTimeout(() => {
                // @ts-ignore
                window.aistudio.openSelectKey();
             }, 1000);
          }
      } else {
          setMessages(prev => [...prev, { role: 'model', type: 'text', content: "Error: " + (e as Error).message }]);
      }
    } finally {
      if (!currentFile) setLoading(false); // If file, loading is handled in reader.onload
    }
  };

  const playAudio = async (base64: string) => {
    if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({sampleRate: 24000});
    }
    const ctx = audioContextRef.current;
    
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    const dataInt16 = new Int16Array(bytes.buffer);
    const buffer = ctx.createBuffer(1, dataInt16.length, 24000);
    const channelData = buffer.getChannelData(0);
    for (let i = 0; i < dataInt16.length; i++) {
        channelData[i] = dataInt16[i] / 32768.0;
    }
    
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    source.start(0);
  };

  const renderMessageContent = (msg: ChatMessage) => {
      if (msg.grounding?.preview) {
          // User uploaded image preview
          return (
              <div className="flex flex-col">
                  <img src={msg.grounding.preview} alt="Upload" className="max-w-[200px] rounded-lg mb-2" />
                  <p>{msg.content}</p>
              </div>
          )
      }

      switch (msg.type) {
          case 'image':
              return <img src={msg.content} alt="Generated" className="rounded-lg max-w-full h-auto" />;
          case 'video':
              return <video src={msg.content} controls className="rounded-lg max-w-full" />;
          case 'audio':
              return (
                  <div className="flex items-center gap-2">
                      <button onClick={() => playAudio(msg.content)} className="bg-blue-100 p-2 rounded-full text-blue-600 hover:bg-blue-200">
                          <Volume2 size={20} />
                      </button>
                      <span>Audio Generated</span>
                  </div>
              );
          default:
              return <p className="whitespace-pre-wrap">{msg.content}</p>;
      }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      
      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <div className="bg-white p-4 rounded-full shadow-sm mb-4">
                    <Sparkles size={32} className="text-blue-500" />
                </div>
                <p className="text-center font-medium">How can I help you today?</p>
                <div className="flex gap-2 mt-4 text-xs">
                    <span className="bg-white px-3 py-1 rounded-full border">Explain Gravity</span>
                    <span className="bg-white px-3 py-1 rounded-full border">Create an image of a cat</span>
                </div>
            </div>
        )}

        {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-3 rounded-2xl shadow-sm ${
                    m.role === 'user' 
                    ? 'bg-blue-600 text-white rounded-br-sm' 
                    : 'bg-white text-gray-800 border border-gray-100 rounded-bl-sm'
                }`}>
                    {renderMessageContent(m)}
                    
                    {/* Citations */}
                    {m.grounding && Array.isArray(m.grounding) && (
                        <div className="mt-2 pt-2 border-t border-gray-100 text-xs">
                            <strong className="block mb-1 opacity-70">Sources:</strong>
                            <div className="flex flex-wrap gap-2">
                            {m.grounding.map((chunk: any, idx: number) => (
                                chunk.web?.uri && (
                                    <a key={idx} href={chunk.web.uri} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline bg-blue-50 px-2 py-0.5 rounded">
                                        {chunk.web.title || "Source"}
                                    </a>
                                )
                            ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        ))}
        
        {loading && (
            <div className="flex justify-start">
                <div className="bg-white p-3 rounded-2xl rounded-bl-sm border border-gray-100">
                    <Loader2 size={20} className="animate-spin text-blue-500" />
                </div>
            </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input Area */}
      <div className="bg-white border-t border-gray-200 p-3 shadow-lg z-10">
        
        {/* Selected File Preview */}
        {selectedFile && (
            <div className="flex items-center gap-2 mb-2 bg-blue-50 p-2 rounded-lg border border-blue-100 w-fit">
                <ImageIcon size={16} className="text-blue-600" />
                <span className="text-xs font-medium text-blue-800 truncate max-w-[150px]">{selectedFile.name}</span>
                <button onClick={() => setSelectedFile(null)} className="text-blue-400 hover:text-blue-600">
                    <X size={14} />
                </button>
            </div>
        )}

        {/* Toolbar */}
        <div className="flex gap-2 mb-2 overflow-x-auto pb-1 hide-scrollbar">
            {/* Mode Selector */}
            <div className="flex bg-gray-100 p-0.5 rounded-lg shrink-0">
                <button onClick={() => setMode('chat')} className={`px-2 py-1 rounded-md text-xs font-medium transition-all flex items-center gap-1 ${mode === 'chat' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'}`}>
                    <MessageSquare size={12} /> Chat
                </button>
                <button onClick={() => setMode('generate_image')} className={`px-2 py-1 rounded-md text-xs font-medium transition-all flex items-center gap-1 ${mode === 'generate_image' ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-500'}`}>
                    <ImageIcon size={12} /> Image
                </button>
                <button onClick={() => setMode('generate_video')} className={`px-2 py-1 rounded-md text-xs font-medium transition-all flex items-center gap-1 ${mode === 'generate_video' ? 'bg-white text-pink-600 shadow-sm' : 'text-gray-500'}`}>
                    <Video size={12} /> Video
                </button>
                <button onClick={() => setMode('tts')} className={`px-2 py-1 rounded-md text-xs font-medium transition-all flex items-center gap-1 ${mode === 'tts' ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-500'}`}>
                    <Volume2 size={12} /> Speak
                </button>
            </div>

            <div className="w-px bg-gray-200 shrink-0 mx-1 h-6 self-center"></div>

            {/* Contextual Settings */}
            {mode === 'chat' && (
                <>
                    <button onClick={() => setUseThinking(!useThinking)} className={`text-xs px-2 py-1 rounded-full border flex items-center shrink-0 ${useThinking ? 'bg-purple-50 border-purple-200 text-purple-700' : 'bg-white border-gray-200 text-gray-500'}`}>
                        <BrainCircuit size={12} className="mr-1" /> Deep Think
                    </button>
                    <button onClick={() => setUseSearch(!useSearch)} className={`text-xs px-2 py-1 rounded-full border flex items-center shrink-0 ${useSearch ? 'bg-green-50 border-green-200 text-green-700' : 'bg-white border-gray-200 text-gray-500'}`}>
                        <Search size={12} className="mr-1" /> Search
                    </button>
                </>
            )}
            
            {mode === 'generate_image' && (
                <>
                    <select className="text-xs border rounded p-1 bg-white" value={imgSize} onChange={(e) => setImgSize(e.target.value)}>
                        <option value="1K">1K</option>
                        <option value="2K">2K</option>
                    </select>
                    <select className="text-xs border rounded p-1 bg-white" value={imgRatio} onChange={(e) => setImgRatio(e.target.value)}>
                        <option value="1:1">1:1</option>
                        <option value="16:9">16:9</option>
                    </select>
                </>
            )}
            
            {mode === 'generate_video' && (
                <select className="text-xs border rounded p-1 bg-white" value={videoRatio} onChange={(e) => setVideoRatio(e.target.value as any)}>
                    <option value="16:9">16:9</option>
                    <option value="9:16">9:16</option>
                </select>
            )}
        </div>

        {/* Input Field Row */}
        <div className="flex items-center gap-2">
            <button 
                onClick={() => fileInputRef.current?.click()} 
                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
            >
                <Paperclip size={20} />
                <input type="file" ref={fileInputRef} className="hidden" onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} />
            </button>
            
            <input 
                type="text" 
                value={input} 
                onChange={(e) => setInput(e.target.value)} 
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder={
                    selectedFile ? (mode === 'generate_image' ? "Describe edits..." : "Ask about this image...") :
                    mode === 'chat' ? "Ask anything..." : 
                    mode === 'generate_image' ? "Describe image to create..." :
                    mode === 'generate_video' ? "Describe video to create..." : 
                    "Text to speak..."
                }
                className="flex-1 bg-gray-100 border-transparent focus:bg-white focus:border-blue-500 border rounded-full px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all"
            />
            
            <button 
                onClick={handleSend} 
                disabled={loading || (!input.trim() && !selectedFile)}
                className={`p-2.5 rounded-full text-white shadow-md transition-all ${loading || (!input.trim() && !selectedFile) ? 'bg-gray-300' : 'bg-blue-600 hover:bg-blue-700 active:scale-95'}`}
            >
                {loading ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
            </button>
        </div>
      </div>
    </div>
  );
};

export default GeminiTools;