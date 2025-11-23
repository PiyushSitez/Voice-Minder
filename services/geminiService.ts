
import { GoogleGenAI, Modality } from "@google/genai";
import { VOICE_OPTIONS } from "../constants";

// We assume API Key is available. In a real app, this should be proxying through a backend
// or using the proper user-provided key flow if it was a tool. 
// Since the prompt doesn't specify where the key comes from for the *app owner's* AI features,
// We will check process.env.API_KEY.
// If not present, we will simulate a failure or use a mock for UI demonstration.

const getClient = () => {
  if (!process.env.API_KEY) {
    console.warn("API_KEY not found in environment.");
    return null;
  }
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

export const generateSpeech = async (text: string, mood: 'calm' | 'urgent' | 'cheerful', voiceId?: string): Promise<string | null> => {
  const client = getClient();
  if (!client) return null;

  try {
    // Gemini 2.5 Flash TTS Preview
    const model = "gemini-2.5-flash-preview-tts";
    
    let voiceName = 'Kore'; // Default/Calm
    
    // If specific voice ID is provided, check if it is a real one or an alias
    if (voiceId) {
        const selectedOption = VOICE_OPTIONS.find(v => v.id === voiceId);
        // If it's an alias (has realId), use that. Otherwise use id.
        if (selectedOption) {
            voiceName = (selectedOption as any).realId || selectedOption.id;
        } else {
            voiceName = voiceId;
        }
    } else {
        // Fallback to mood logic
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
      return `data:audio/pcm;base64,${base64Audio}`; // Note: Raw PCM needs decoding usually, but for simplicity in this specific constraint environment we might need wav. 
      // The Gemini API returns raw PCM. Browsers can't play raw PCM directly in an <audio> tag src.
      // We need to decode it. For this specific generated code, I will include the decoder helper in the component.
    }
    return null;
  } catch (e) {
    console.error("TTS Error:", e);
    return null;
  }
};

// Helper to decode base64 PCM to AudioBuffer (for playback in browser)
export const playAudioFromBase64 = async (base64Data: string, speed: number = 1.0, loop: boolean = false) => {
    try {
        // Remove header if present for pure decoding
        const cleanBase64 = base64Data.replace('data:audio/pcm;base64,', '');
        const binaryString = atob(cleanBase64);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }

        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        const int16Data = new Int16Array(bytes.buffer);
        const float32Data = new Float32Array(int16Data.length);
        
        // Convert PCM16 to Float32
        for(let i=0; i<int16Data.length; i++) {
            float32Data[i] = int16Data[i] / 32768.0;
        }

        const buffer = audioContext.createBuffer(1, float32Data.length, 24000);
        buffer.getChannelData(0).set(float32Data);

        const source = audioContext.createBufferSource();
        source.buffer = buffer;
        source.playbackRate.value = speed;
        source.loop = loop; // Respect loop setting
        source.connect(audioContext.destination);
        source.start(0);
        
        // If looping, stop after reasonable time (e.g. 15s) so it doesn't go forever in this demo
        // For the new infinite loop logic in Dashboard, we might pass loop=false here and handle looping externally.
        if(loop) {
            setTimeout(() => {
                source.stop();
            }, 15000);
        }
        
        // Return controls so we can stop it programmatically
        return { 
            source, 
            context: audioContext,
            duration: buffer.duration 
        };

    } catch (e) {
        console.error("Audio Playback Error", e);
        // alert("Could not play audio. Ensure API Key is set and browser allows audio.");
        return null;
    }
}
