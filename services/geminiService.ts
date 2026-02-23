import { GoogleGenAI, Modality, Type, ThinkingLevel } from "@google/genai";
import { GeminiModel } from '../types';
import { GEMINI_API_KEY } from '../constants';

const getClient = () => {
  const apiKey = process.env.API_KEY || GEMINI_API_KEY;
  if (!apiKey) console.warn("Gemini API Key is missing.");
  return new GoogleGenAI({ apiKey });
};

// --- RETRY LOGIC ---

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const withRetry = async <T>(fn: () => Promise<T>, retries = 3, baseDelay = 2000): Promise<T> => {
  try {
    return await fn();
  } catch (error: any) {
    const isQuotaError = error?.status === 429 || 
                         error?.code === 429 || 
                         error?.message?.includes('429') || 
                         error?.message?.toLowerCase().includes('quota') ||
                         error?.message?.toLowerCase().includes('resource_exhausted');

    const isPermissionError = error?.status === 403 || error?.message?.includes('403') || error?.message?.includes('permission');

    if (isPermissionError) {
        throw new Error("Permission denied. Check API Key restrictions or model availability.");
    }

    if (retries > 0 && isQuotaError) {
      console.warn(`Attempt failed (${error?.message}). Retrying in ${baseDelay}ms... (${retries} attempts left)`);
      await wait(baseDelay);
      return withRetry(fn, retries - 1, baseDelay * 2);
    }
    throw error;
  }
};

// --- CHAT & TEXT ---

export const getChatResponse = async (
  history: any[],
  message: string | any[],
  model: string = 'gemini-2.5-flash-lite-latest', 
  useThinking: boolean = false,
  useSearch: boolean = false,
  useMaps: boolean = false
) => {
  return withRetry(async () => {
    const ai = getClient();
    
    let selectedModel = model;
    if (useThinking) selectedModel = 'gemini-3.1-pro-preview';
    else if (useSearch) selectedModel = 'gemini-3-flash-preview';
    else if (useMaps) selectedModel = 'gemini-2.5-flash';

    const config: any = {
      systemInstruction: "You are a helpful, patient, and encouraging tutor for a rural student in India. Keep answers simple, use analogies, and be culturally relevant."
    };

    if (useThinking) {
      config.thinkingConfig = { thinkingLevel: ThinkingLevel.HIGH }; 
    }

    if (useSearch) {
      config.tools = [{ googleSearch: {} }];
    }

    if (useMaps) {
      config.tools = [{ googleMaps: {} }];
      config.toolConfig = {
        retrievalConfig: {
          latLng: {
            latitude: 20.5937,
            longitude: 78.9629
          }
        }
      };
    }

    const contents = [...history];
    if (Array.isArray(message)) {
        contents.push({ role: 'user', parts: message });
    } else {
        contents.push({ role: 'user', parts: [{ text: message }] });
    }

    const response = await ai.models.generateContent({
      model: selectedModel,
      contents: contents as any,
      config,
    });
    
    const text = response.text || '';
    const grounding = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    
    return { text, grounding };
  });
};

export const getFastDefinition = async (term: string) => {
  return withRetry(async () => {
    const ai = getClient();
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-lite-latest',
      contents: `Define "${term}" simply for a student in one sentence.`,
    });
    return response.text;
  });
};

// --- IMAGES ---

export const generateImage = async (prompt: string, size: string = '1K', aspectRatio: string = '1:1', usePro: boolean = false) => {
  return withRetry(async () => {
    const ai = getClient();
    const model = usePro ? 'gemini-3-pro-image-preview' : 'gemini-2.5-flash-image';
    
    const config: any = {
      imageConfig: {
        aspectRatio: aspectRatio as any
      }
    };

    if (usePro) {
      config.imageConfig.imageSize = size;
    }

    const response = await ai.models.generateContent({
      model,
      contents: { parts: [{ text: prompt }] },
      config
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    throw new Error("No image generated");
  });
};

export const editImage = async (base64Image: string, prompt: string) => {
  return withRetry(async () => {
    const ai = getClient();
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: base64Image.includes(',') ? base64Image.split(',')[1] : base64Image
            }
          },
          { text: prompt }
        ]
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    throw new Error("No image edited");
  });
};

export const analyzeMedia = async (base64Data: string, mimeType: string, prompt: string) => {
    return withRetry(async () => {
        const ai = getClient();
        const parts: any[] = [];
        const cleanBase64 = base64Data.includes(',') ? base64Data.split(',')[1] : base64Data;

        parts.push({
            inlineData: {
                mimeType: mimeType,
                data: cleanBase64
            }
        });
        parts.push({ text: prompt });

        const response = await ai.models.generateContent({
          model: 'gemini-3.1-pro-preview', 
          contents: { parts }
        });
        return response.text;
    });
};


// --- AUDIO ---

export const generateSpeech = async (text: string) => {
  return withRetry(async () => {
    const ai = getClient();
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-preview-tts',
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    });

    const parts = response.candidates?.[0]?.content?.parts;
    if (parts) {
        for (const part of parts) {
          if (part.inlineData?.data) {
              return part.inlineData.data;
          }
        }
    }
    throw new Error("No audio generated");
  });
};

export const transcribeAudio = async (base64Audio: string, mimeType: string = 'audio/wav') => {
    return withRetry(async () => {
        const ai = getClient();
        const cleanBase64 = base64Audio.includes(',') ? base64Audio.split(',')[1] : base64Audio;
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: {
                parts: [
                    {
                        inlineData: {
                            mimeType: mimeType,
                            data: cleanBase64
                        }
                    },
                    { text: "Transcribe this audio exactly." }
                ]
            }
        });
        return response.text;
    });
};

// --- VIDEO ---

export const generateVideo = async (prompt: string, ratio: '16:9' | '9:16', base64Image?: string, mimeType?: string) => {
  const ai = getClient();
  
  let operation = await withRetry(async () => {
      const config: any = {
        numberOfVideos: 1,
        resolution: '720p',
        aspectRatio: ratio
      };

      const request: any = {
        model: 'veo-3.1-fast-generate-preview',
        prompt: prompt,
        config
      };

      if (base64Image) {
        request.image = {
          imageBytes: base64Image.includes(',') ? base64Image.split(',')[1] : base64Image,
          mimeType: mimeType || 'image/jpeg'
        };
      }

      return await ai.models.generateVideos(request);
  });

  while (!operation.done) {
    await new Promise(resolve => setTimeout(resolve, 10000));
    operation = await ai.operations.getVideosOperation({operation: operation});
  }

  const videoUri = operation.response?.generatedVideos?.[0]?.video?.uri;
  if (!videoUri) throw new Error("Video generation failed");
  return videoUri;
};

// --- LIVE API ---

export const connectLiveSession = async (
  onOpen: () => void,
  onMessage: (message: any) => void,
  onClose: () => void,
  onError: (error: any) => void
) => {
  const ai = getClient();
  const session = await ai.live.connect({
    model: "gemini-2.5-flash-native-audio-preview-09-2025",
    callbacks: {
      onopen: onOpen,
      onmessage: onMessage,
      onclose: onClose,
      onerror: onError,
    },
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: { prebuiltVoiceConfig: { voiceName: "Zephyr" } },
      },
      systemInstruction: "You are Mitra, a friendly AI tutor for students in rural India. You are having a real-time voice conversation. Keep your responses concise, helpful, and encouraging.",
    },
  });
  return session;
};
