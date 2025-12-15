import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface ChatMessage {
  id: string;
  sessionId: string;
  role: "user" | "assistant";
  content: string;
  thinkingText?: string;
  audioBase64?: string;
  imageUrl?: string;
  timestamp: Date;
  isStreaming?: boolean;
}

interface AppState {
  sessionId: string;
  currentLanguage: string;
  audioEnabled: boolean;
  lat: string | null;
  lon: string | null;
  languageSelected: boolean;
  messages: ChatMessage[];
  messagesLoaded: boolean;
  setSessionId: (id: string) => void;
  setLanguage: (lang: string) => void;
  setAudioEnabled: (enabled: boolean) => void;
  setLocation: (lat: string, lon: string) => void;
  addMessage: (message: Omit<ChatMessage, "id" | "timestamp" | "sessionId">) => ChatMessage;
  updateMessage: (id: string, updates: Partial<ChatMessage>) => void;
  getSessionMessages: (sessionId: string) => ChatMessage[];
  setMessages: (messages: ChatMessage[]) => void;
  setMessagesLoaded: (loaded: boolean) => void;
  clearMessages: () => void;
}

// Generate UUID v4
function generateUUID(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      sessionId: generateUUID(),
      currentLanguage: "", // Empty by default to show language selector
      audioEnabled: true,
      lat: null,
      lon: null,
      languageSelected: false,
      messages: [],
      messagesLoaded: false,
      setSessionId: (id) => set({ sessionId: id }),
      setLanguage: (lang) => set({ currentLanguage: lang, languageSelected: true }),
      setAudioEnabled: (enabled) => set({ audioEnabled: enabled }),
      setLocation: (lat, lon) => set({ lat, lon }),
      addMessage: (message) => {
        const newMessage: ChatMessage = {
          ...message,
          id: Date.now().toString() + Math.random(),
          timestamp: new Date(),
          sessionId: get().sessionId,
        };
        set((state) => ({
          messages: [...state.messages, newMessage],
        }));
        return newMessage;
      },
      updateMessage: (id, updates) => {
        set((state) => ({
          messages: state.messages.map((msg) =>
            msg.id === id ? { ...msg, ...updates } : msg
          ),
        }));
      },
      getSessionMessages: (sessionId) => {
        return get().messages.filter((msg) => msg.sessionId === sessionId);
      },
      setMessages: (messages) => set({ messages }),
      setMessagesLoaded: (loaded) => set({ messagesLoaded: loaded }),
      clearMessages: () => set({ messages: [] }),
    }),
    {
      name: "farmer-sahayak-storage",
      partialize: (state) => ({
        // Only persist user settings, NOT messages
        sessionId: state.sessionId,
        currentLanguage: state.currentLanguage,
        audioEnabled: state.audioEnabled,
        lat: state.lat,
        lon: state.lon,
        languageSelected: state.languageSelected,
      }),
    }
  )
);
