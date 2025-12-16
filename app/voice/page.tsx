"use client";

import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useRouter } from "next/navigation";
import { Mic, MicOff, Send, ArrowLeft, Volume2, Copy, Check, ChevronDown, ChevronUp, Brain, Square } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import SpeechRecognition, { useSpeechRecognition } from "react-speech-recognition";
import { useStore } from "@/store/useStore";
import { getLanguageByCode } from "@/lib/languages";
import { useChat } from "@/hooks/useChat";
import { useStreamingTTS } from "@/hooks/useStreamingTTS";

export default function VoicePage() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const currentLanguage = useStore((state) => state.currentLanguage);
  const language = getLanguageByCode(currentLanguage);
  const { transcript, listening, resetTranscript, browserSupportsSpeechRecognition } = useSpeechRecognition();
  const [localText, setLocalText] = useState("");
  const [isManuallyEditing, setIsManuallyEditing] = useState(false);
  const { messages, isLoading, sendMessage } = useChat();
  const { stopStreaming } = useStreamingTTS();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const [isExiting, setIsExiting] = useState(false);
  const [ripples, setRipples] = useState<Array<{ x: number; y: number; id: number }>>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedThinking, setExpandedThinking] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (currentLanguage) {
      i18n.changeLanguage(currentLanguage);
    }
  }, [currentLanguage, i18n]);

  useEffect(() => {
    if (transcript && !isManuallyEditing) {
      setLocalText(transcript);
    }
  }, [transcript, isManuallyEditing]);

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

  const handleMicToggle = () => {
    if (!browserSupportsSpeechRecognition) {
      alert(t('browserNotSupported'));
      return;
    }

    if (listening) {
      SpeechRecognition.stopListening();
    } else {
      resetTranscript();
      setLocalText("");
      SpeechRecognition.startListening({
        continuous: true,
        language: language?.browserCode || "en-IN",
      });
    }
  };

  const handleSend = () => {
    if (localText.trim()) {
      sendMessage(localText);
      setLocalText("");
      resetTranscript();
      if (listening) {
        SpeechRecognition.stopListening();
      }
    }
  };

  const handleCopy = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  const toggleThinking = (id: string) => {
    setExpandedThinking(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
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
    
    // Stop TTS streaming and speech recognition
    stopStreaming();
    if (listening) {
      SpeechRecognition.stopListening();
    }
    
    setIsExiting(true);
    setTimeout(() => {
      router.push("/");
    }, 300);
  };

  return (
    <div className={`fixed inset-0 flex flex-col bg-linear-to-br from-purple-50 via-purple-100 to-purple-50 transition-transform duration-300 ${isExiting ? 'translate-x-full' : 'translate-x-0'}`}>
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="px-2 pt-2 sm:px-3 sm:pt-3">
          <div className="bg-white/60 backdrop-blur-2xl rounded-2xl sm:rounded-3xl border border-white/40 px-3 py-2 sm:px-4 sm:py-3 md:px-6 md:py-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={handleBackClick}
                className="relative p-2 hover:bg-purple-50 rounded-full transition-colors overflow-hidden"
                aria-label="Back to home"
              >
                {ripples.map((ripple) => (
                  <span
                    key={ripple.id}
                    className="absolute rounded-full bg-purple-400/40 animate-ripple pointer-events-none"
                    style={{
                      left: ripple.x,
                      top: ripple.y,
                      width: '20px',
                      height: '20px',
                      transform: 'translate(-50%, -50%)',
                      animation: 'ripple 0.6s ease-out',
                    }}
                  />
                ))}
                <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6 text-purple-700 relative z-10" />
              </button>
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-linear-to-br from-purple-400 to-purple-600 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg">
                <Mic className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
              </div>
              <div className="flex-1">
                <h2 className="text-base sm:text-lg md:text-xl font-bold text-gray-800">{t('speak')}</h2>
                <p className="text-xs text-gray-600 hidden sm:block">{t('speakYourQuestion')}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Messages */}
        <div 
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="flex-1 p-4 overflow-y-auto"
        >
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 px-4">
              <Mic className="w-16 h-16 sm:w-20 sm:h-20 mb-3 sm:mb-4 text-gray-300" />
              <p className="text-lg sm:text-xl font-semibold mb-2">{t('noMessages')}</p>
              <p className="text-xs sm:text-sm max-w-md">{t('pressMic')}</p>
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4 max-w-4xl mx-auto">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex gap-2 sm:gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  {msg.role === "assistant" && (
                    <div className="shrink-0 w-7 h-7 sm:w-10 sm:h-10 rounded-full bg-purple-600 flex items-center justify-center text-white font-bold text-xs sm:text-sm">
                      AI
                    </div>
                  )}
                  <div className="flex flex-col gap-1 max-w-[85%] sm:max-w-[75%]">
                    <div className={`rounded-2xl sm:rounded-3xl px-3 py-2 sm:px-6 sm:py-4 ${
                      msg.role === "user"
                        ? "bg-purple-600 text-white rounded-br-none"
                        : "bg-white border-2 border-gray-200 text-gray-800 rounded-bl-none"
                    }`}>
                      {/* Thinking process (collapsible) - only for assistant */}
                      {msg.role === "assistant" && msg.thinkingText && (
                        <div className="mb-3 border border-purple-200 rounded-lg overflow-hidden bg-purple-50">
                          <button
                            onClick={() => toggleThinking(msg.id)}
                            className="w-full flex items-center justify-between px-3 py-2 hover:bg-purple-100 transition-colors"
                          >
                            <div className="flex items-center gap-2">
                              <Brain className="w-4 h-4 text-purple-600" />
                              <span className="text-xs font-medium text-purple-700">AI Thinking Process</span>
                            </div>
                            {expandedThinking.has(msg.id) ? (
                              <ChevronUp className="w-4 h-4 text-purple-500" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-purple-500" />
                            )}
                          </button>
                          {expandedThinking.has(msg.id) && (
                            <div className="px-2 py-1.5 sm:px-3 sm:py-2 border-t border-purple-200 bg-white max-h-40 sm:max-h-48 overflow-y-auto">
                              <p className="text-xs leading-relaxed text-gray-600 whitespace-pre-wrap">
                                {msg.thinkingText}
                              </p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Text content with markdown rendering */}
                      <div className={`text-sm sm:text-base leading-relaxed ${msg.role === "user" ? "text-white" : "text-gray-800"}`}>
                        <ReactMarkdown 
                          remarkPlugins={[remarkGfm]}
                          components={{
                            // Custom components with explicit styling
                            h1: ({node, ...props}) => <h1 className={`text-xl font-bold mt-4 mb-2 ${msg.role === "user" ? "text-white" : "text-gray-900"}`} {...props} />,
                            h2: ({node, ...props}) => <h2 className={`text-lg font-bold mt-3 mb-2 ${msg.role === "user" ? "text-white" : "text-gray-900"}`} {...props} />,
                            h3: ({node, ...props}) => <h3 className={`text-base font-bold mt-2 mb-1 ${msg.role === "user" ? "text-white" : "text-gray-900"}`} {...props} />,
                            p: ({node, ...props}) => <p className="my-2" {...props} />,
                            strong: ({node, ...props}) => <strong className="font-bold" {...props} />,
                            em: ({node, ...props}) => <em className="italic" {...props} />,
                            a: ({node, ...props}) => <a className={`underline ${msg.role === "user" ? "text-purple-200" : "text-purple-600"} hover:opacity-80`} target="_blank" rel="noopener noreferrer" {...props} />,
                            ul: ({node, ...props}) => <ul className="list-disc pl-5 my-2 space-y-1" {...props} />,
                            ol: ({node, ...props}) => <ol className="list-decimal pl-5 my-2 space-y-1" {...props} />,
                            li: ({node, ...props}) => <li className="my-1" {...props} />,
                            code: ({node, inline, ...props}: any) => 
                              inline 
                                ? <code className="bg-gray-200 text-gray-800 px-1 py-0.5 rounded text-xs" {...props} />
                                : <code className="block bg-gray-800 text-white p-3 rounded my-2 overflow-x-auto" {...props} />,
                            blockquote: ({node, ...props}) => <blockquote className={`border-l-4 pl-4 my-2 italic ${msg.role === "user" ? "border-purple-300" : "border-gray-300"}`} {...props} />,
                          }}
                        >
                          {msg.content}
                        </ReactMarkdown>
                      </div>
                      {msg.audioBase64 && msg.role === "assistant" && (
                        <div className="mt-2 sm:mt-3 flex items-center gap-1.5 sm:gap-2 bg-purple-50 p-2 sm:p-3 rounded-lg sm:rounded-xl">
                          <Volume2 className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600 shrink-0" />
                          <audio controls className="flex-1 h-8 sm:h-10" preload="auto">
                            <source src={`data:audio/mpeg;base64,${msg.audioBase64}`} type="audio/mpeg" />
                          </audio>
                          {msg.isStreaming && (
                            <button
                              onClick={() => stopStreaming()}
                              className="ml-1 sm:ml-2 p-1.5 sm:p-2 bg-red-500 hover:bg-red-600 text-white rounded-md sm:rounded-lg transition-colors flex items-center gap-1"
                              title="Stop audio"
                            >
                              <Square className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            </button>
                          )}
                        </div>
                      )}
                      <div className={`text-xs mt-2 ${msg.role === "user" ? "text-purple-100" : "text-gray-500"}`}>
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </div>
                    
                    {msg.role === "assistant" && (
                      <button
                        onClick={() => handleCopy(msg.content, msg.id)}
                        className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-gray-800 transition-colors px-2 py-1 hover:bg-gray-100 rounded-lg self-start"
                        title={copiedId === msg.id ? "Copied!" : "Copy"}
                      >
                        {copiedId === msg.id ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-green-600" />
                            <span className="text-green-600 font-medium">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                  {msg.role === "user" && (
                    <div className="shrink-0 w-7 h-7 sm:w-10 sm:h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-xs sm:text-sm">
                      You
                    </div>
                  )}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Live Transcription Bar */}
        {(listening || localText) && (
          <div className="mx-2 mb-2 sm:mx-3 bg-purple-50/90 backdrop-blur-sm border border-purple-200 rounded-xl sm:rounded-2xl p-2 sm:p-3">
            <p className="text-xs sm:text-sm text-purple-600 mb-1">Live Transcription:</p>
            <input
              type="text"
              value={localText}
              onChange={(e) => {
                setLocalText(e.target.value);
                setIsManuallyEditing(true);
              }}
              onBlur={() => setIsManuallyEditing(false)}
              placeholder={listening ? "Listening..." : "Type or speak..."}
              className="w-full text-sm sm:text-base text-purple-900 bg-transparent border-none outline-none focus:ring-2 focus:ring-purple-300 rounded px-2 py-1"
            />
          </div>
        )}

        {/* Footer Control Buttons */}
        <div className="px-2 pb-2 sm:px-3 sm:pb-3">
          <div className="bg-white/60 backdrop-blur-2xl rounded-2xl sm:rounded-3xl border border-white/40 px-3 py-2 sm:px-4 sm:py-3 md:px-6 md:py-4">
            <div className="flex gap-2 sm:gap-3">
              <button
                onClick={handleMicToggle}
                disabled={isLoading}
                className={`flex-1 flex items-center justify-center gap-2 sm:gap-3 py-3 sm:py-4 md:py-5 rounded-xl sm:rounded-2xl font-bold text-base sm:text-lg md:text-xl transition-all ${
                  listening
                    ? "bg-red-500 hover:bg-red-600 text-white animate-pulse"
                    : "bg-purple-600 text-white hover:bg-purple-700"
                } disabled:opacity-50 disabled:cursor-not-allowed shadow-lg`}
              >
                {listening ? (
                  <>
                    <MicOff className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8" />
                    <span>{t('stop')}</span>
                  </>
                ) : (
                  <>
                    <Mic className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8" />
                    <span>{t('start')}</span>
                  </>
                )}
              </button>

              {localText && (
                <button
                  onClick={handleSend}
                  disabled={isLoading}
                  className="px-4 sm:px-6 md:px-8 py-3 sm:py-4 md:py-5 bg-linear-to-br from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-xl sm:rounded-2xl transition-all disabled:opacity-50 shadow-lg flex items-center gap-1.5 sm:gap-2"
                >
                  <Send className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8" />
                  <span className="text-base sm:text-lg md:text-xl font-bold hidden sm:inline">Send</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
