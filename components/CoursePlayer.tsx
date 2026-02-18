
import React, { useState, useEffect, useRef } from 'react';
import { Module } from '../types';
import { Play, Pause, Volume2, VolumeX, SkipForward, WifiOff, Music, Video, Maximize2, CheckCircle } from 'lucide-react';
import { addXP } from '../db';
import { useTranslation } from '../contexts/LanguageContext';

interface Props {
  module: Module;
  onComplete: () => void;
  poster?: string;
}

const CoursePlayer: React.FC<Props> = ({ module, onComplete, poster }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isAudioMode, setIsAudioMode] = useState(false);
  const [videoSrc, setVideoSrc] = useState<string>('');
  const [isOfflineSrc, setIsOfflineSrc] = useState(false);
  const [isYoutube, setIsYoutube] = useState(false);
  const { t } = useTranslation();

  // Load Source Logic (YouTube vs Offline Blob vs Online URL)
  useEffect(() => {
    const loadSource = async () => {
      if (module.youtubeVideoId) {
        setIsYoutube(true);
        setVideoSrc('');
        setIsOfflineSrc(false);
      } else if (module.offlineVideoBlob) {
        // Create an Object URL from the stored Blob
        const blobUrl = URL.createObjectURL(module.offlineVideoBlob);
        setVideoSrc(blobUrl);
        setIsOfflineSrc(true);
        setIsYoutube(false);
      } else {
        // Fallback for simulation: Use a sample video if the URL is fake
        const validUrl = module.videoUrl && !module.videoUrl.startsWith('sim_') 
            ? module.videoUrl 
            : 'https://www.w3schools.com/html/mov_bbb.mp4'; // Public sample video for demo
        setVideoSrc(validUrl);
        setIsOfflineSrc(false);
        setIsYoutube(false);
      }
    };
    loadSource();

    return () => {
      // Cleanup Object URL if it was created
      if (isOfflineSrc && videoSrc) {
        URL.revokeObjectURL(videoSrc);
      }
    };
  }, [module]);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const current = videoRef.current.currentTime;
      const total = videoRef.current.duration;
      setProgress((current / total) * 100);
      setDuration(total);
    }
  };

  const handleEnded = async () => {
    setIsPlaying(false);
    // Gamification Hook: 50 XP
    await addXP(50);
    // Show a native toast or just call parent
    onComplete();
  };

  const handleYoutubeComplete = async () => {
    await addXP(50);
    onComplete();
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newProgress = parseFloat(e.target.value);
    if (videoRef.current) {
      const newTime = (newProgress / 100) * videoRef.current.duration;
      videoRef.current.currentTime = newTime;
      setProgress(newProgress);
    }
  };

  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return "00:00";
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  if (isYoutube) {
      return (
          <div className="bg-black rounded-2xl overflow-hidden shadow-xl border border-gray-800 relative group aspect-video">
              <iframe 
                src={`https://www.youtube.com/embed/${module.youtubeVideoId}`} 
                title={module.title}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
              <div className="absolute top-4 right-4 z-20">
                  <button 
                      onClick={handleYoutubeComplete}
                      className="bg-green-600/90 hover:bg-green-700 text-white px-4 py-2 rounded-full font-bold text-xs shadow-lg backdrop-blur-sm transition-all flex items-center gap-2"
                  >
                      Mark Watched <CheckCircle size={14} />
                  </button>
              </div>
          </div>
      );
  }

  return (
    <div className="bg-black rounded-2xl overflow-hidden shadow-xl border border-gray-800 relative group">
      
      {/* Audio Mode Overlay */}
      {isAudioMode && (
        <div className="absolute inset-0 z-10 bg-gray-900 flex flex-col items-center justify-center p-6 text-center">
            <div className="w-24 h-24 bg-gradient-to-tr from-blue-600 to-purple-600 rounded-full flex items-center justify-center mb-4 animate-pulse shadow-lg shadow-blue-900/50">
                <Music size={40} className="text-white" />
            </div>
            <h3 className="text-white font-bold text-lg mb-1">{module.title}</h3>
            <p className="text-gray-400 text-xs uppercase tracking-widest font-bold">Audio Only Mode • Saving Data</p>
        </div>
      )}

      {/* Video Element */}
      <video
        ref={videoRef}
        src={videoSrc}
        poster={poster || "https://picsum.photos/800/450"} // Fallback poster
        className={`w-full aspect-video object-cover ${isAudioMode ? 'invisible h-0' : 'block'}`}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
        playsInline
      />

      {/* Controls Overlay */}
      <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-4 transition-opacity duration-300 ${!isPlaying ? 'opacity-100' : 'opacity-100 md:opacity-0 md:group-hover:opacity-100'} z-20`}>
        
        {/* Progress Bar (Thick for Touch) */}
        <div className="relative w-full h-4 mb-4 group/slider cursor-pointer">
            <div className="absolute top-1.5 left-0 right-0 h-1.5 bg-gray-600 rounded-full overflow-hidden">
                <div 
                    className="h-full bg-blue-500 rounded-full transition-all duration-150"
                    style={{ width: `${progress}%` }}
                ></div>
            </div>
            <input 
                type="range" 
                min="0" 
                max="100" 
                value={progress} 
                onChange={handleSeek}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
        </div>

        {/* Buttons Row */}
        <div className="flex items-center justify-between text-white">
            
            <div className="flex items-center gap-4">
                <button 
                    onClick={togglePlay}
                    className="w-10 h-10 bg-white text-black rounded-full flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-lg shadow-white/20"
                >
                    {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-0.5" />}
                </button>

                <button onClick={() => {
                    if (videoRef.current) {
                         videoRef.current.muted = !isMuted;
                         setIsMuted(!isMuted);
                    }
                }}>
                    {isMuted ? <VolumeX size={20} className="text-gray-400"/> : <Volume2 size={20} />}
                </button>

                <div className="text-xs font-mono font-bold text-gray-300">
                    {formatTime(videoRef.current?.currentTime || 0)} / {formatTime(duration)}
                </div>
            </div>

            <div className="flex items-center gap-3">
                {/* Audio Mode Toggle */}
                <button 
                    onClick={() => setIsAudioMode(!isAudioMode)}
                    className={`flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-colors ${isAudioMode ? 'bg-green-500 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
                >
                    {isAudioMode ? <Video size={12} /> : <Music size={12} />}
                    {isAudioMode ? "Show Video" : "Audio Mode"}
                </button>

                {isOfflineSrc && (
                     <div className="flex items-center gap-1 text-[10px] font-bold text-green-400 bg-green-900/30 px-2 py-1 rounded border border-green-900/50">
                        <WifiOff size={10} /> OFFLINE
                     </div>
                )}
            </div>
        </div>
      </div>
      
      {/* Center Play Button (Only when paused and not audio mode) */}
      {!isPlaying && !isAudioMode && (
          <div 
            className="absolute inset-0 flex items-center justify-center pointer-events-none z-10"
          >
              <div className="w-16 h-16 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center text-white border-2 border-white/20">
                  <Play size={32} fill="currentColor" className="ml-1" />
              </div>
          </div>
      )}

    </div>
  );
};

export default CoursePlayer;
