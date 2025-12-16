"use client";

import { useEffect, useRef, useState } from "react";
import { User, Bot, Volume2, Copy, Check, ChevronDown, ChevronUp, Brain } from "lucide-react";
import { Message } from "@/hooks/useChat";
import Image from "next/image";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface MessageBubbleProps {
  message: Message;
}

export default function MessageBubble({ message }: MessageBubbleProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const isUser = message.role === "user";
  const [copied, setCopied] = useState(false);
  const [showThinking, setShowThinking] = useState(false);

  useEffect(() => {
    // Auto-play AI audio responses (for non-streaming audio)
    if (!isUser && message.audioBase64 && audioRef.current && !message.isStreaming) {
      audioRef.current.play().catch((error) => {
        console.error("Audio playback error:", error);
      });
    }
  }, [isUser, message.audioBase64, message.isStreaming]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  return (
    <div
      className={`flex gap-2 sm:gap-3 ${isUser ? "justify-end" : "justify-start"} mb-3 sm:mb-4 min-w-0`}
    >
      {/* Avatar */}
      {!isUser && (
        <div className="shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-green-600 flex items-center justify-center shadow-sm">
          <Bot className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
        </div>
      )}

      {/* Message Content */}
      <div className="flex flex-col gap-1 max-w-[85%] sm:max-w-[75%] min-w-0">
        <div
          className={`rounded-xl sm:rounded-2xl px-3 py-2 sm:px-4 sm:py-3 shadow-sm ${
            isUser
              ? "bg-green-600 text-white rounded-br-none"
              : "bg-gray-100 text-gray-800 rounded-bl-none"
          }`}
        >
          {/* Image if present */}
          {message.imageUrl && (
            <div className="mb-2 rounded-lg overflow-hidden">
              <Image
                src={message.imageUrl}
                alt="User uploaded"
                width={200}
                height={200}
                className="w-full h-auto"
              />
            </div>
          )}

          {/* Thinking process (collapsible) - only for assistant */}
          {!isUser && message.thinkingText && (
            <div className="mb-2 sm:mb-3 border border-gray-300 rounded-lg overflow-hidden bg-gray-50 shadow-inner">
              <button
                onClick={() => setShowThinking(!showThinking)}
                className="w-full flex items-center justify-between px-2 py-1.5 sm:px-3 sm:py-2 hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <Brain className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600" />
                  <span className="text-xs font-medium text-gray-700">AI Thinking</span>
                </div>
                {showThinking ? (
                  <ChevronUp className="w-4 h-4 text-gray-500" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                )}
              </button>
              {showThinking && (
                <div className="px-2 py-1.5 sm:px-3 sm:py-2 border-t border-gray-300 bg-white max-h-40 sm:max-h-48 overflow-y-auto">
                  <p className="text-xs leading-relaxed text-gray-600 whitespace-pre-wrap">
                    {message.thinkingText}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Text content with markdown rendering */}
          <div className={`text-xs sm:text-sm leading-relaxed wrap-break-word ${isUser ? "text-white" : "text-gray-800"}`}>
            <ReactMarkdown 
              remarkPlugins={[remarkGfm]}
              components={{
                // Custom components with explicit styling
                h1: ({node, ...props}) => <h1 className={`text-xl font-bold mt-4 mb-2 ${isUser ? "text-white" : "text-gray-900"}`} {...props} />,
                h2: ({node, ...props}) => <h2 className={`text-lg font-bold mt-3 mb-2 ${isUser ? "text-white" : "text-gray-900"}`} {...props} />,
                h3: ({node, ...props}) => <h3 className={`text-base font-bold mt-2 mb-1 ${isUser ? "text-white" : "text-gray-900"}`} {...props} />,
                p: ({node, ...props}) => <p className="my-2" {...props} />,
                strong: ({node, ...props}) => <strong className="font-bold" {...props} />,
                em: ({node, ...props}) => <em className="italic" {...props} />,
                a: ({node, ...props}) => <a className={`underline ${isUser ? "text-green-200" : "text-green-600"} hover:opacity-80`} target="_blank" rel="noopener noreferrer" {...props} />,
                ul: ({node, ...props}) => <ul className="list-disc pl-5 my-2 space-y-1" {...props} />,
                ol: ({node, ...props}) => <ol className="list-decimal pl-5 my-2 space-y-1" {...props} />,
                li: ({node, ...props}) => <li className="my-1" {...props} />,
                code: ({node, inline, ...props}: any) => 
                  inline 
                    ? <code className="bg-gray-200 text-gray-800 px-1 py-0.5 rounded text-xs break-all" {...props} />
                    : <code className="block bg-gray-800 text-white p-2 sm:p-3 rounded my-2 overflow-x-auto text-xs" {...props} />,
                blockquote: ({node, ...props}) => <blockquote className={`border-l-4 pl-4 my-2 italic ${isUser ? "border-green-300" : "border-gray-300"}`} {...props} />,
              }}
            >
              {message.content}
            </ReactMarkdown>
          </div>

          {/* Streaming indicator */}
          {!isUser && message.isStreaming && (
            <div className="mt-1.5 sm:mt-2 flex items-center gap-1.5 sm:gap-2 text-green-600">
              <Volume2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-pulse" />
              <span className="text-xs">Playing audio...</span>
            </div>
          )}

          {/* Audio player for AI responses (fallback for non-streaming) */}
          {!isUser && message.audioBase64 && !message.isStreaming && (
            <div className="mt-1.5 sm:mt-2">
              <audio
                ref={audioRef}
                controls
                className="w-full h-8 sm:h-9 rounded"
                preload="auto"
              >
                <source
                  src={`data:audio/mpeg;base64,${message.audioBase64}`}
                  type="audio/mpeg"
                />
                Your browser does not support audio playback.
              </audio>
            </div>
          )}

          {/* Timestamp */}
          <div
            className={`text-xs mt-1 ${
              isUser ? "text-green-100" : "text-gray-500"
            }`}
          >
            {new Date(message.timestamp).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>
        </div>

        {/* Copy button for assistant messages */}
        {!isUser && (
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-gray-800 transition-colors px-2 py-1 hover:bg-gray-100 rounded-lg self-start"
            title={copied ? "Copied!" : "Copy"}
          >
            {copied ? (
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

      {/* User Avatar */}
      {isUser && (
        <div className="shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gray-600 flex items-center justify-center shadow-sm">
          <User className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
        </div>
      )}
    </div>
  );
}
