
import { GoogleGenAI, Modality } from "@google/genai";
import { User } from "../types";

const decode = (base64: string) => {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
};

const decodeAudioData = async (
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> => {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
};

export const speakText = async (text: string, language: string = 'en') => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
    const voiceMap = {
      en: 'Puck',
      hi: 'Kore',
      ta: 'Kore'
    };
    
    const prompt = language === 'en' ? text : `Speak this in ${language === 'hi' ? 'Hindi' : 'Tamil'}: ${text}`;
    
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: (voiceMap as any)[language] || 'Puck' },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) return;

    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    const audioBuffer = await decodeAudioData(decode(base64Audio), audioCtx, 24000, 1);
    const source = audioCtx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioCtx.destination);
    source.start();
  } catch (err) {
    console.error("Gemini TTS Error:", err);
  }
};

export const explainConcept = async (concept: string, language: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Explain this concept to a 10 year old rural Indian student in simple ${language}: ${concept}`,
  });
  return response.text;
};

export const getCompanionTip = async (user: User, language: string, context: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `You are 'Mitra', a friendly AI companion for a rural Indian student named ${user.name} (Level ${user.level}). Give a very short (max 15 words) encouragement or tip about ${context}. Reply in ${language}. Keep it fun and use simple words.`,
  });
  return response.text || "Keep learning!";
};
