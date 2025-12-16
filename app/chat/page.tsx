"use client";

import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useRouter } from "next/navigation";
import { Send, ArrowLeft, Volume2, VolumeX, Loader2, MessageCircle } from "lucide-react";
import { useStore } from "@/store/useStore";
import { useChat } from "@/hooks/useChat";
import MessageBubble from "@/components/Chat/MessageBubble";

export default function ChatPage() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const currentLanguage = useStore((state) => state.currentLanguage);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const [isExiting, setIsExiting] = useState(false);
  const [isTTSEnabled, setIsTTSEnabled] = useState(true);
  const { messages, isLoading, sendMessage } = useChat(isTTSEnabled);
  const [ripples, setRipples] = useState<Array<{ x: number; y: number; id: number }>>([]);

  useEffect(() => {
    if (currentLanguage) {
      i18n.changeLanguage(currentLanguage);
    }
  }, [currentLanguage, i18n]);

  // Auto-scroll when new messages arrive
  useEffect(() => {
    if (autoScroll && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, autoScroll]);

  // Detect manual scrolling
  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 100;
    setAutoScroll(isAtBottom);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      sendMessage(input);
      setInput("");
    }
  };

  const handleBackClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const newRipple = { x, y, id: Date.now() };
    setRipples([...ripples, newRipple]);
    
    setTimeout(() => {
      setRipples((prev) => prev.filter((r) => r.id !== newRipple.id));
    }, 600);
    
    setIsExiting(true);
    setTimeout(() => {
      router.push("/");
    }, 300);
  };

  return (
    <div className={`fixed inset-0 flex flex-col bg-linear-to-br from-green-50 via-emerald-50 to-teal-50 transition-transform duration-300 ${
      isExiting ? "translate-x-full" : "translate-x-0"
    }`} style={{ height: '100dvh' }}>
      <div className="flex-1 flex flex-col overflow-hidden min-h-0">
        <header className="px-2 pt-2 sm:px-3 sm:pt-3 shrink-0">
          <div className="bg-white/60 backdrop-blur-2xl rounded-2xl sm:rounded-3xl border border-white/40 px-3 py-2 sm:px-4 sm:py-3 md:px-6 md:py-4 shadow-sm">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <button
                onClick={handleBackClick}
                className="relative p-2 hover:bg-green-50 rounded-full transition-colors overflow-hidden shrink-0"
                aria-label="Back to home"
              >
                {ripples.map((ripple) => (
                  <span
                    key={ripple.id}
                    className="absolute rounded-full bg-green-400/40 animate-ripple pointer-events-none"
                    style={{
                      left: ripple.x,
                      top: ripple.y,
                      width: '20px',
                      height: '20px',
                      transform: 'translate(-50%, -50%)',
                    }}
                  />
                ))}
                <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6 text-green-700 relative z-10" />
              </button>
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-linear-to-br from-green-400 to-green-600 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg shrink-0">
                <MessageCircle className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-base sm:text-lg md:text-xl font-bold text-gray-800 truncate">{t('chat')}</h2>
                <p className="text-xs text-gray-600 hidden sm:block truncate">{t('askForAdvice')}</p>
              </div>
              <button
                onClick={() => setIsTTSEnabled(!isTTSEnabled)}
                className={`p-1.5 sm:p-2 md:p-3 rounded-full transition-all shadow-md shrink-0 ${
                  isTTSEnabled 
                    ? "bg-green-500 text-white shadow-green-200" 
                    : "bg-gray-100 text-gray-400"
                }`}
                aria-label={isTTSEnabled ? "Disable voice" : "Enable voice"}
                title={isTTSEnabled ? "Disable voice" : "Enable voice"}
              >
                {isTTSEnabled ? (
                  <Volume2 className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
                ) : (
                  <VolumeX className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
                )}
              </button>
            </div>
          </div>
        </header>

        {/* Messages */}
        <div 
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="flex-1 p-3 sm:p-4 overflow-y-auto overflow-x-hidden min-h-0"
        >
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 px-4">
              <MessageCircle className="w-16 h-16 sm:w-20 sm:h-20 mb-3 sm:mb-4 text-gray-300" />
              <p className="text-lg sm:text-xl font-semibold mb-2">{t('noMessages')}</p>
              <p className="text-xs sm:text-sm max-w-md">{t('askAbout')}</p>
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4 max-w-4xl mx-auto">
              {messages.map((message) => (
                <MessageBubble key={message.id} message={message} />
              ))}
              {isLoading && (
                <div className="flex items-center gap-2 text-sm sm:text-base text-gray-500 justify-center">
                  <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                  <span>{t('preparingAnswer')}</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input - Rounded Style */}
        <div className="px-2 pb-2 sm:px-3 sm:pb-3 shrink-0" style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))' }}>
          <form onSubmit={handleSubmit} className="bg-white/60 backdrop-blur-2xl rounded-2xl sm:rounded-3xl border border-white/40 px-3 py-2 sm:px-4 sm:py-3 md:px-6 md:py-4 shadow-sm">
            <div className="flex gap-2 sm:gap-3 items-center min-w-0">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={t('typeQuestion')}
                disabled={isLoading}
                className="flex-1 min-w-0 px-3 py-2 sm:px-4 sm:py-3 text-sm sm:text-base text-gray-800 placeholder:text-gray-400 bg-gray-50/80 border-2 border-gray-200/50 rounded-xl sm:rounded-2xl focus:outline-none focus:border-green-400 focus:bg-white disabled:bg-gray-100 disabled:cursor-not-allowed transition-all"
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="p-2.5 sm:p-3 md:px-6 md:py-3 bg-linear-to-br from-green-500 to-green-600 text-white rounded-xl sm:rounded-2xl hover:from-green-600 hover:to-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-bold shadow-lg flex items-center gap-1.5 sm:gap-2 shrink-0"
              >
                <Send className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="hidden md:inline">{t('send')}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
