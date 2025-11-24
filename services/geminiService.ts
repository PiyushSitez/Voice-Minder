
import { GoogleGenAI, Modality } from "@google/genai";
import { VOICE_OPTIONS } from "../constants";

// Helper to check if API Key exists
export const hasApiKey = (): boolean => {
    return !!process.env.API_KEY && process.env.API_KEY !== "";
};

const getClient = () => {
  if (!process.env.API_KEY) {
    console.warn("API_KEY not found. Using Native TTS fallback.");
    return null;
  }
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

// Optimization: Lazy singleton AudioContext
let audioContext: AudioContext | null = null;
const getAudioContext = () => {
    if (!audioContext) {
        audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    }
    return audioContext;
}

// --- GEMINI AI SPEECH ---
export const generateSpeech = async (text: string, mood: 'calm' | 'urgent' | 'cheerful', voiceId?: string): Promise<string | null> => {
  const client = getClient();
  if (!client) return null; // Logic in Dashboard handles fallback if this returns null

  try {
    const model = "gemini-2.5-flash-preview-tts";
    let voiceName = 'Kore'; 
    
    if (voiceId) {
        const selectedOption = VOICE_OPTIONS.find(v => v.id === voiceId);
        if (selectedOption) {
            voiceName = (selectedOption as any).realId || selectedOption.id;
        } else {
            voiceName = voiceId;
        }
    } else {
        if (mood === 'urgent') voiceName = 'Fenrir';
        if (mood === 'cheerful') voiceName = 'Puck';
    }

    const response = await client.models.generateContent({
      model: model,
      contents: [{ parts: [{ text: text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voiceName },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (base64Audio) {
      return `data:audio/pcm;base64,${base64Audio}`; 
    }
    return null;
  } catch (e) {
    console.error("Gemini TTS Error:", e);
    return null;
  }
};

// --- BROWSER NATIVE SPEECH (FREE FALLBACK) ---
export const speakNative = (text: string, mood: 'calm' | 'urgent' | 'cheerful', speed: number = 1.0): Promise<void> => {
    return new Promise((resolve, reject) => {
        if (!('speechSynthesis' in window)) {
            alert("Sorry, your browser doesn't support Text-to-Speech.");
            resolve();
            return;
        }

        // Cancel existing speech
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = speed;
        
        // Simple logic to adjust pitch based on mood
        if (mood === 'urgent') {
            utterance.pitch = 1.2;
            utterance.rate = Math.min(speed * 1.2, 2.0); // Speak faster
        } else if (mood === 'calm') {
            utterance.pitch = 0.9;
            utterance.rate = Math.max(speed * 0.9, 0.5); // Speak slower
        } else {
            utterance.pitch = 1.1; // Cheerful
        }

        // Try to select a better voice if available
        const voices = window.speechSynthesis.getVoices();
        // Prefer Google voices or natural sounding ones
        const preferredVoice = voices.find(v => v.name.includes('Google') || v.name.includes('Natural')) || voices[0];
        if (preferredVoice) utterance.voice = preferredVoice;

        utterance.onend = () => {
            resolve();
        };

        utterance.onerror = (e) => {
            console.error("Native TTS Error", e);
            resolve(); // Resolve anyway to not break loop
        };

        window.speechSynthesis.speak(utterance);
    });
};

export const stopNativeSpeech = () => {
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
    }
};

// Helper to decode base64 PCM to AudioBuffer
export const playAudioFromBase64 = async (base64Data: string, speed: number = 1.0, loop: boolean = false) => {
    try {
        const cleanBase64 = base64Data.replace('data:audio/pcm;base64,', '');
        const binaryString = atob(cleanBase64);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }

        const ctx = getAudioContext();
        if(ctx.state === 'suspended') {
            await ctx.resume();
        }

        const int16Data = new Int16Array(bytes.buffer);
        const float32Data = new Float32Array(int16Data.length);
        
        for(let i=0; i<int16Data.length; i++) {
            float32Data[i] = int16Data[i] / 32768.0;
        }

        const buffer = ctx.createBuffer(1, float32Data.length, 24000);
        buffer.getChannelData(0).set(float32Data);

        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.playbackRate.value = speed;
        source.loop = loop; 
        source.connect(ctx.destination);
        source.start(0);
        
        return { 
            source, 
            context: ctx,
            duration: buffer.duration 
        };

    } catch (e) {
        console.error("Audio Playback Error", e);
        return null;
    }
}
