import React, { useEffect, useState, useRef } from 'react';
import { Mic, MicOff, Volume2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface VoiceControlProps {
  onCommand?: (command: string) => void;
}

const VoiceControl: React.FC<VoiceControlProps> = ({ onCommand }) => {
  const [isListening, setIsListening] = useState(false);
  const [lastCommand, setLastCommand] = useState('');
  const recognitionRef = useRef<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[event.results.length - 1][0].transcript.trim().toLowerCase();
        setLastCommand(transcript);
        processCommand(transcript);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        if (event.error === 'not-allowed') {
            setIsListening(false);
        }
      };
      
      recognitionRef.current.onend = () => {
          if (isListening) {
              recognitionRef.current.start();
          }
      };
    } else {
      console.warn('Speech recognition not supported in this browser.');
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [isListening]);

  const processCommand = (command: string) => {
    console.log('Voice Command:', command);
    
    // Wake word: "Hey Mitra" or "Mitra"
    if (command.includes('mitra') || command.includes('hey mitra')) {
        speak("Yes, I'm listening.");
        // Strip wake word for further processing if needed, or just acknowledge
        return;
    }

    // Navigation Commands
    if (command.includes('go to home') || command.includes('open home')) {
        navigate('/');
        speak("Opening Home.");
    } else if (command.includes('go to courses') || command.includes('open courses')) {
        navigate('/courses');
        speak("Opening Courses.");
    } else if (command.includes('go to profile') || command.includes('open profile')) {
        navigate('/profile');
        speak("Opening Profile.");
    } else if (command.includes('go to ai lab') || command.includes('open ai lab')) {
        navigate('/ai-tools');
        speak("Opening AI Lab.");
    } else if (command.includes('go to analytics') || command.includes('open analytics')) {
        navigate('/analytics');
        speak("Opening Analytics.");
    } 
    
    // Action Commands
    else if (command.includes('search for')) {
        const query = command.split('search for')[1].trim();
        if (query) {
            navigate('/ai-tools');
            // Ideally pass query to AI tools, for now just navigate
            speak(`Searching for ${query} in AI Lab.`);
        }
    }

    if (onCommand) {
        onCommand(command);
    }
  };

  const speak = (text: string) => {
    const utterance = new SpeechSynthesisUtterance(text);
    window.speechSynthesis.speak(utterance);
  };

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      recognitionRef.current?.start();
      setIsListening(true);
      speak("Voice control activated. Say 'Hey Mitra' to start.");
    }
  };

  if (!recognitionRef.current) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        onClick={toggleListening}
        className={`p-4 rounded-full shadow-lg transition-all ${
          isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-blue-600 text-white hover:bg-blue-700'
        }`}
        title={isListening ? "Stop Listening" : "Start Voice Control"}
      >
        {isListening ? <MicOff size={24} /> : <Mic size={24} />}
      </button>
      {isListening && lastCommand && (
          <div className="absolute bottom-16 right-0 bg-black/80 text-white px-3 py-1 rounded-lg text-xs whitespace-nowrap">
              {lastCommand}
          </div>
      )}
    </div>
  );
};

export default VoiceControl;
