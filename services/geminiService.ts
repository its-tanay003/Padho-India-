import { GoogleGenAI, Modality, Type } from "@google/genai";
import { GeminiModel } from '../types';

// Helper to get client. Re-creates if key changes (e.g. via window.aistudio).
const getClient = async () => {
  // Check for selected key from Veo/Pro flow
  let apiKey = process.env.API_KEY;
  
  // @ts-ignore
  if (window.aistudio && await window.aistudio.hasSelectedApiKey()) {
      // @ts-ignore
      // The actual key is injected into the environment by the internal platform when selected
  }
  
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
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

    if (retries > 0 && isQuotaError) {
      console.warn(`Quota exceeded. Retrying in ${baseDelay}ms... (${retries} attempts left)`);
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
  model: string = GeminiModel.PRO_3,
  useThinking: boolean = false,
  useSearch: boolean = false
) => {
  return withRetry(async () => {
    const ai = await getClient();
    
    const config: any = {
      systemInstruction: "You are a helpful, patient, and encouraging tutor for a rural student in India. Keep answers simple, use analogies, and be culturally relevant."
    };

    if (useThinking) {
      config.thinkingConfig = { thinkingBudget: 32768 };
    }

    if (useSearch) {
      config.tools = [{ googleSearch: {} }];
    }

    const chat = ai.chats.create({
      model: model,
      config,
      history: history as any,
    });

    const result = await chat.sendMessage({ message });
    
    let text = result.text;
    const grounding = result.candidates?.[0]?.groundingMetadata?.groundingChunks;
    
    return { text, grounding };
  });
};

export const getFastDefinition = async (term: string) => {
  return withRetry(async () => {
    const ai = await getClient();
    const response = await ai.models.generateContent({
      model: GeminiModel.FLASH_LITE,
      contents: `Define "${term}" simply for a student in one sentence.`,
    });
    return response.text;
  });
};

// --- IMAGES ---

export const generateImage = async (prompt: string, size: string = '1K', aspectRatio: string = '1:1') => {
  return withRetry(async () => {
    const ai = await getClient();
    // Using Pro Image model requires user key selection generally, handled by getClient logic context
    const response = await ai.models.generateContent({
      model: GeminiModel.IMAGE_PRO,
      contents: { parts: [{ text: prompt }] },
      config: {
        imageConfig: {
          imageSize: size as any,
          aspectRatio: aspectRatio as any
        }
      }
    });

    // Extract image
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
    const ai = await getClient();
    const response = await ai.models.generateContent({
      model: GeminiModel.IMAGE_FLASH,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/jpeg', // Assuming jpeg for simplicity, or detect
              data: base64Image.split(',')[1] // remove prefix
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

export const analyzeImage = async (base64Image: string, prompt: string) => {
    return withRetry(async () => {
        const ai = await getClient();
        const response = await ai.models.generateContent({
          model: GeminiModel.PRO_3,
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
        return response.text;
    });
};


// --- AUDIO ---

export const generateSpeech = async (text: string) => {
  return withRetry(async () => {
    const ai = await getClient();
    try {
        const response = await ai.models.generateContent({
          model: GeminiModel.TTS,
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
            // Look for audio part
            for (const part of parts) {
              if (part.inlineData?.data) {
                  return part.inlineData.data;
              }
            }
            
            // Look for text part (refusal or error)
            const textPart = parts.find(p => p.text);
            if (textPart) {
                console.warn("TTS returned text:", textPart.text);
                throw new Error(textPart.text);
            }
        }

        throw new Error("No audio generated");
    } catch (e: any) {
        console.error("TTS Error", e);
        throw e; // Rethrow so withRetry can catch it
    }
  });
};

export const transcribeAudio = async (base64Audio: string) => {
    return withRetry(async () => {
        const ai = await getClient();
        const response = await ai.models.generateContent({
            model: GeminiModel.FLASH_3,
            contents: {
                parts: [
                    {
                        inlineData: {
                            mimeType: 'audio/wav', // Assuming wav input from recorder
                            data: base64Audio.split(',')[1]
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
  const ai = await getClient();
  
  // Veo requires polling
  let operation = await withRetry(async () => {
      return await ai.models.generateVideos({
        model: GeminiModel.VEO_FAST,
        prompt: prompt,
        config: {
          numberOfVideos: 1,
          resolution: '720p',
          aspectRatio: ratio
        }
      });
  });

  // Simple polling logic
  while (!operation.done) {
    await new Promise(resolve => setTimeout(resolve, 5000));
    try {
        operation = await ai.operations.getVideosOperation({operation: operation});
    } catch (e: any) {
        // If polling hits quota, wait and continue instead of failing immediately
        if (e?.status === 429) {
            console.warn("Quota exceeded during polling. Retrying in 5s...");
            await new Promise(resolve => setTimeout(resolve, 5000));
            continue;
        }
        throw e;
    }
  }

  const videoUri = operation.response?.generatedVideos?.[0]?.video?.uri;
  if (!videoUri) throw new Error("Video generation failed");
  
  // In a real app we would fetch the bytes. Here we return the URI. 
  // The component will need to fetch it with the key.
  return videoUri;
};