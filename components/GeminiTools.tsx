import React, { useState, useRef, useEffect } from 'react';
import { 
  Sparkles, MessageSquare, Image as ImageIcon, Video, Mic, 
  Search, Volume2, Edit, Zap, BrainCircuit, Loader2, Play 
} from 'lucide-react';
import * as GeminiService from '../services/geminiService';
import { GeminiModel } from '../types';

const GeminiTools: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'chat' | 'visual' | 'voice'>('chat');
  
  // State
  const [messages, setMessages] = useState<{role: string, text: string}[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<string | null>(null);
  const [groundingLinks, setGroundingLinks] = useState<any[]>([]);
  
  // Settings
  const [useSearch, setUseSearch] = useState(false);
  const [useThinking, setUseThinking] = useState(false);
  const [videoRatio, setVideoRatio] = useState<'16:9'|'9:16'>('16:9');
  const [imgSize, setImgSize] = useState('1K');
  const [imgRatio, setImgRatio] = useState('1:1');
  
  // Refs for media
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Audio Context
  const audioContextRef = useRef<AudioContext | null>(null);

  const checkApiKey = async () => {
     // @ts-ignore
     if (window.aistudio && !await window.aistudio.hasSelectedApiKey()) {
        // @ts-ignore
        await window.aistudio.openSelectKey();
        // Just force a re-render or let the service handle the new key on next call
        return true;
     }
     return true;
  }

  const handleSend = async () => {
    if (!input.trim() && !selectedFile) return;
    setLoading(true);
    setGeneratedContent(null);
    setGroundingLinks([]);
    
    try {
      if (activeTab === 'chat') {
        const history = messages.map(m => ({ role: m.role, parts: [{ text: m.text }] }));
        
        let responseText = '';
        if (useThinking) {
             const res = await GeminiService.getChatResponse(history, input, GeminiModel.PRO_3, true, false);
             responseText = res.text || '';
        } else if (useSearch) {
             const res = await GeminiService.getChatResponse(history, input, GeminiModel.FLASH_3, false, true);
             responseText = res.text || '';
             // @ts-ignore
             if (res.grounding) setGroundingLinks(res.grounding);
        } else {
             // Default Chat
             const res = await GeminiService.getChatResponse(history, input, GeminiModel.PRO_3);
             responseText = res.text || '';
        }

        setMessages([...messages, { role: 'user', text: input }, { role: 'model', text: responseText }]);
        setInput('');
      }
      
      else if (activeTab === 'visual') {
        await checkApiKey();

        if (selectedFile) {
          // Edit or Analyze
          const reader = new FileReader();
          reader.readAsDataURL(selectedFile);
          reader.onload = async () => {
            const base64 = reader.result as string;
            if (input.toLowerCase().includes('analyze') || input.toLowerCase().includes('what is')) {
               const res = await GeminiService.analyzeImage(base64, input || "Describe this image.");
               setGeneratedContent(res);
            } else {
               const res = await GeminiService.editImage(base64, input || "Enhance image");
               setGeneratedContent(res); // Is URL
            }
          };
        } else {
          // Generate
          if (input.toLowerCase().includes('video')) {
             const uri = await GeminiService.generateVideo(input, videoRatio);
             // Fetch with key to display - simplified for demo, we just show the link logic
             const finalUrl = `${uri}&key=${process.env.API_KEY}`;
             setGeneratedContent(finalUrl); 
          } else {
             const img = await GeminiService.generateImage(input, imgSize, imgRatio);
             setGeneratedContent(img);
          }
        }
      } 
      
      else if (activeTab === 'voice') {
          // Text to Speech or Fast Definition
          if (input.startsWith("Define")) {
             const res = await GeminiService.getFastDefinition(input.replace("Define", ""));
             setMessages([...messages, { role: 'user', text: input }, { role: 'model', text: res }]);
          } else {
             // TTS
             const audioBase64 = await GeminiService.generateSpeech(input);
             playAudio(audioBase64);
          }
      }

    } catch (e) {
      console.error(e);
      setMessages([...messages, { role: 'user', text: input }, { role: 'model', text: "Error: " + (e as Error).message }]);
    } finally {
      setLoading(false);
      setSelectedFile(null);
    }
  };

  const playAudio = async (base64: string) => {
    if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({sampleRate: 24000});
    }
    const ctx = audioContextRef.current;
    
    // Decode manual
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

  return (
    <div className="flex flex-col h-full">
      {/* Tabs */}
      <div className="flex border-b bg-white">
        <button onClick={() => setActiveTab('chat')} className={`flex-1 py-3 text-sm font-medium flex justify-center items-center ${activeTab === 'chat' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}>
          <MessageSquare size={16} className="mr-2" /> Tutor
        </button>
        <button onClick={() => setActiveTab('visual')} className={`flex-1 py-3 text-sm font-medium flex justify-center items-center ${activeTab === 'visual' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}>
          <ImageIcon size={16} className="mr-2" /> Visuals
        </button>
        <button onClick={() => setActiveTab('voice')} className={`flex-1 py-3 text-sm font-medium flex justify-center items-center ${activeTab === 'voice' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}>
          <Volume2 size={16} className="mr-2" /> Voice
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        
        {/* Chat History */}
        {activeTab === 'chat' && (
           <div className="space-y-4">
             {messages.length === 0 && (
                <div className="text-center text-gray-400 mt-10">
                   <BrainCircuit size={48} className="mx-auto mb-2 opacity-50" />
                   <p>Ask me anything! I am your AI Tutor.</p>
                </div>
             )}
             {messages.map((m, i) => (
               <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                 <div className={`max-w-[80%] p-3 rounded-lg text-sm ${m.role === 'user' ? 'bg-blue-600 text-white rounded-br-none' : 'bg-white border text-gray-800 rounded-bl-none'}`}>
                   {m.text}
                 </div>
               </div>
             ))}
             {groundingLinks.length > 0 && (
                 <div className="bg-blue-50 p-2 rounded text-xs border border-blue-100">
                    <strong className="block mb-1 text-blue-700">Sources:</strong>
                    {groundingLinks.map((chunk, i) => (
                        <div key={i} className="mb-1">
                           {chunk.web?.uri && <a href={chunk.web.uri} target="_blank" className="text-blue-500 underline truncate block">{chunk.web.title || chunk.web.uri}</a>}
                        </div>
                    ))}
                 </div>
             )}
           </div>
        )}

        {/* Visual Generation Output */}
        {activeTab === 'visual' && generatedContent && (
            <div className="border rounded-lg overflow-hidden bg-black flex justify-center items-center min-h-[200px] relative">
               {generatedContent.includes('video') ? (
                  <video src={generatedContent} controls className="w-full max-h-[400px]" />
               ) : generatedContent.startsWith('data:image') ? (
                  <img src={generatedContent} alt="Generated" className="w-full h-auto" />
               ) : (
                  <div className="p-4 bg-white text-black w-full">{generatedContent}</div>
               )}
            </div>
        )}

        {loading && (
          <div className="flex justify-center py-4">
            <Loader2 className="animate-spin text-blue-600" />
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-gray-200">
        
        {/* Controls based on tab */}
        <div className="flex gap-2 mb-2 overflow-x-auto pb-1 hide-scrollbar">
           {activeTab === 'chat' && (
              <>
                <button onClick={() => setUseThinking(!useThinking)} className={`text-xs px-2 py-1 rounded border flex items-center ${useThinking ? 'bg-purple-100 border-purple-300 text-purple-700' : 'bg-gray-50 border-gray-200'}`}>
                    <BrainCircuit size={12} className="mr-1" /> Deep Think
                </button>
                <button onClick={() => setUseSearch(!useSearch)} className={`text-xs px-2 py-1 rounded border flex items-center ${useSearch ? 'bg-green-100 border-green-300 text-green-700' : 'bg-gray-50 border-gray-200'}`}>
                    <Search size={12} className="mr-1" /> Web Search
                </button>
              </>
           )}
           {activeTab === 'visual' && (
              <>
                 <select className="text-xs border rounded p-1 bg-gray-50" value={videoRatio} onChange={(e) => setVideoRatio(e.target.value as any)}>
                    <option value="16:9">Video 16:9</option>
                    <option value="9:16">Video 9:16</option>
                 </select>
                 <select className="text-xs border rounded p-1 bg-gray-50" value={imgSize} onChange={(e) => setImgSize(e.target.value)}>
                    <option value="1K">Img 1K</option>
                    <option value="2K">Img 2K</option>
                    <option value="4K">Img 4K</option>
                 </select>
                 <select className="text-xs border rounded p-1 bg-gray-50" value={imgRatio} onChange={(e) => setImgRatio(e.target.value)}>
                    <option value="1:1">1:1</option>
                    <option value="16:9">16:9</option>
                    <option value="4:3">4:3</option>
                 </select>
              </>
           )}
        </div>

        <div className="flex items-center gap-2">
           {activeTab === 'visual' && (
             <button onClick={() => fileInputRef.current?.click()} className="p-2 text-gray-500 hover:text-blue-600">
               <ImageIcon size={20} />
               <input type="file" ref={fileInputRef} className="hidden" onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} />
             </button>
           )}
           {selectedFile && <div className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded truncate max-w-[80px]">{selectedFile.name}</div>}
           
           <input 
             type="text" 
             value={input} 
             onChange={(e) => setInput(e.target.value)} 
             placeholder={activeTab === 'chat' ? "Ask a question..." : activeTab === 'visual' ? "Describe image or video..." : "Text to speak or 'Define X'..."}
             className="flex-1 border border-gray-300 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
           />
           <button onClick={handleSend} disabled={loading} className="bg-blue-600 text-white p-2 rounded-full disabled:opacity-50">
             {loading ? <Loader2 size={20} className="animate-spin" /> : <Zap size={20} />}
           </button>
        </div>
      </div>
    </div>
  );
};

export default GeminiTools;