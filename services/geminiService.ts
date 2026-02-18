import { GoogleGenAI, Modality, Type } from "@google/genai";
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
  history: { role: string; parts: { text: string }[] }[],
  message: string,
  model: string = 'gemini-2.5-flash-lite-latest', 
  useThinking: boolean = false,
  useSearch: boolean = false
) => {
  return withRetry(async () => {
    const ai = getClient();
    
    // Default to the most lightweight and stable model
    let selectedModel = model;
    if (useThinking) selectedModel = 'gemini-3-pro-preview';
    else if (useSearch) selectedModel = 'gemini-3-flash-preview';

    const config: any = {
      systemInstruction: "You are a helpful, patient, and encouraging tutor for a rural student in India. Keep answers simple, use analogies, and be culturally relevant."
    };

    if (useThinking) {
      config.thinkingConfig = { thinkingBudget: 1024 }; 
    }

    if (useSearch) {
      config.tools = [{ googleSearch: {} }];
    }

    const response = await ai.models.generateContent({
      model: selectedModel,
      contents: [...history, { role: 'user', parts: [{ text: message }] }] as any,
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

export const generateImage = async (prompt: string, size: string = '1K', aspectRatio: string = '1:1') => {
  return withRetry(async () => {
    const ai = getClient();
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image', // Fixed model name
      contents: { parts: [{ text: prompt }] },
      config: {
        imageConfig: {
          aspectRatio: aspectRatio as any
        }
      }
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
              data: base64Image.split(',')[1]
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
        
        // Ensure clean base64
        const cleanBase64 = base64Data.includes(',') ? base64Data.split(',')[1] : base64Data;

        parts.push({
            inlineData: {
                mimeType: mimeType,
                data: cleanBase64
            }
        });
        parts.push({ text: prompt });

        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash-latest', 
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
            model: 'gemini-2.5-flash-latest',
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

export const generateVideo = async (prompt: string, ratio: '16:9' | '9:16') => {
  const ai = getClient();
  
  let operation = await withRetry(async () => {
      return await ai.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview',
        prompt: prompt,
        config: {
          numberOfVideos: 1,
          resolution: '720p',
          aspectRatio: ratio
        }
      });
  });

  while (!operation.done) {
    await new Promise(resolve => setTimeout(resolve, 10000));
    operation = await ai.operations.getVideosOperation({operation: operation});
  }

  const videoUri = operation.response?.generatedVideos?.[0]?.video?.uri;
  if (!videoUri) throw new Error("Video generation failed");
  return videoUri;
};