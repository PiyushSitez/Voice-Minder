
import { GoogleGenAI, Modality } from "@google/genai";
import { VOICE_OPTIONS } from "../constants";

// Helper to check if API Key exists
export const hasApiKey = (): boolean => {
    return !!process.env.API_KEY && process.env.API_KEY !== "";
};

const getClient = () => {
  if (!process.env.API_KEY) {
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

// --- GEMINI AI SPEECH (Kept as fallback, but primary is now Native for "No API" feel) ---
export const generateSpeech = async (text: string, mood: 'calm' | 'urgent' | 'cheerful', voiceId?: string): Promise<string | null> => {
  const client = getClient();
  if (!client) return null; 

  try {
    const model = "gemini-2.5-flash-preview-tts";
    // Force simple names for Gemini
    let voiceName = 'Kore'; 
    if (voiceId?.includes('Male')) voiceName = 'Puck'; 

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

// --- BROWSER NATIVE SPEECH (STRICTLY INDIAN VOICES) ---
export const speakNative = (text: string, mood: 'calm' | 'urgent' | 'cheerful', speed: number = 1.0, voiceId?: string, volume: number = 1.0): Promise<void> => {
    return new Promise((resolve, reject) => {
        if (!('speechSynthesis' in window)) {
            alert("Sorry, your browser doesn't support Text-to-Speech.");
            resolve();
            return;
        }

        // Cancel existing speech
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.volume = volume;
        
        // Adjust Rate & Pitch based on Mood
        if (mood === 'urgent') {
            utterance.pitch = 1.2;
            utterance.rate = Math.min(speed * 1.2, 2.0); 
        } else if (mood === 'calm') {
            utterance.pitch = 0.9;
            utterance.rate = Math.max(speed * 0.9, 0.5); 
        } else {
            utterance.pitch = 1.0; 
            utterance.rate = speed;
        }

        // Ensure voices are loaded
        let voices = window.speechSynthesis.getVoices();
        
        if (voices.length === 0) {
            setTimeout(() => {
                voices = window.speechSynthesis.getVoices();
                setVoiceAndSpeak();
            }, 100);
        } else {
            setVoiceAndSpeak();
        }

        function setVoiceAndSpeak() {
            let targetVoice = null;
            
            // Determine requested gender from the simplified ID
            const wantMale = voiceId?.includes('Male');

            // 1. FILTER FOR INDIAN ACCENTS (English India or Hindi India)
            // Browsers label them as 'en-IN', 'hi-IN', 'English (India)', 'Hindi (India)'
            const indianVoices = voices.filter(v => 
                v.lang === 'en-IN' || 
                v.lang === 'hi-IN' || 
                v.lang.includes('IN') || 
                v.name.includes('India') || 
                v.name.includes('Hindi')
            );

            if (indianVoices.length > 0) {
                // 2. FIND GENDER MATCH WITHIN INDIAN VOICES
                if (wantMale) {
                    // Try to find known male names or "Male" keyword
                    targetVoice = indianVoices.find(v => 
                        v.name.toLowerCase().includes('male') || 
                        v.name.includes('Ravi') || 
                        v.name.includes('Rishi') || 
                        v.name.includes('Ashok') || 
                        v.name.includes('Prabhat')
                    );
                    // If no explicit male, verify if we accidentally picked a known female one, if so, pick another
                    if (!targetVoice) {
                         const knownFemales = ['Heera', 'Kalpana', 'Lekha', 'Sangeeta', 'Veena', 'Zira', 'Female'];
                         targetVoice = indianVoices.find(v => !knownFemales.some(f => v.name.includes(f)));
                    }
                } else {
                    // Want Female
                    targetVoice = indianVoices.find(v => 
                        v.name.toLowerCase().includes('female') || 
                        v.name.includes('Heera') || 
                        v.name.includes('Kalpana') || 
                        v.name.includes('Lekha') || 
                        v.name.includes('Sangeeta') ||
                        v.name.includes('Veena') || 
                        v.name.includes('Google') // 'Google Hindi' is female usually
                    );
                }
            }

            // 3. Fallback: If no Indian specific found, use any voice matching gender
            if (!targetVoice) {
                if (wantMale) {
                     targetVoice = voices.find(v => v.name.toLowerCase().includes('male'));
                } else {
                     targetVoice = voices.find(v => v.name.toLowerCase().includes('female'));
                }
            }
            
            // 4. Ultimate Fallback
            if (!targetVoice) {
                 targetVoice = voices.find(v => v.default) || voices[0];
            }

            if (targetVoice) {
                utterance.voice = targetVoice;
                // console.log("Speaking with:", targetVoice.name);
            }

            utterance.onend = () => resolve();
            utterance.onerror = (e) => {
                console.error("Native TTS Error", e);
                resolve();
            };

            window.speechSynthesis.speak(utterance);
        }
    });
};

export const stopNativeSpeech = () => {
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
    }
};

// Helper to decode base64 PCM to AudioBuffer
export const playAudioFromBase64 = async (base64Data: string, speed: number = 1.0, loop: boolean = false, volume: number = 1.0) => {
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
        const gainNode = ctx.createGain();

        source.buffer = buffer;
        source.playbackRate.value = speed;
        source.loop = loop; 
        gainNode.gain.value = volume;

        source.connect(gainNode);
        gainNode.connect(ctx.destination);
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
