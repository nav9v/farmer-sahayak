"use client";

import { useState, useCallback, useEffect } from "react";
import { useStore } from "@/store/useStore";
import { analyzePlantImage } from "@/actions/analyze-image";
import { getSarvamChatCompletion } from "@/actions/sarvam-chat";
import { getWeather } from "@/actions/weather";
import { useStreamingTTS } from "./useStreamingTTS";
import { saveMessage, loadSessionMessages } from "@/actions/chat-storage";

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  thinkingText?: string;
  audioBase64?: string;
  imageUrl?: string;
  timestamp: Date;
  isStreaming?: boolean;
}

// Utility to parse thinking text and answer from Sarvam response
function parseThinkingAndAnswer(text: string): { thinking: string; answer: string } {
  // Sarvam-M returns thinking in <think>...</think> tags
  // Handle both complete and incomplete thinking tags
  
  // Extract complete thinking content
  const completeThinkRegex = /<think>([\s\S]*?)<\/think>/gi;
  let thinkingParts: string[] = [];
  let match;
  
  while ((match = completeThinkRegex.exec(text)) !== null) {
    thinkingParts.push(match[1].trim());
  }
  
  // Remove complete thinking tags from answer
  let answer = text.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
  
  // If there's an incomplete <think> tag, extract it and remove from answer
  const incompleteThinkMatch = answer.match(/<think>([\s\S]*)$/i);
  if (incompleteThinkMatch) {
    thinkingParts.push(incompleteThinkMatch[1].trim());
    answer = answer.replace(/<think>[\s\S]*$/i, '').trim();
  }
  
  const thinking = thinkingParts.join('\n\n');
  
  return { thinking, answer };
}

export function useChat(ttsEnabled: boolean = true) {
  const [isLoading, setIsLoading] = useState(false);
  const { 
    sessionId, 
    currentLanguage, 
    lat, 
    lon, 
    addMessage: addToStore, 
    updateMessage: updateInStore,
    getSessionMessages,
    setMessages,
    messagesLoaded,
    setMessagesLoaded
  } = useStore();
  const { streamTTS } = useStreamingTTS();

  // Load messages from database on mount (only once per session)
  useEffect(() => {
    if (!messagesLoaded) {
      loadSessionMessages(sessionId).then((result) => {
        if (result.success && result.messages.length > 0) {
          const dbMessages = result.messages.map((msg) => ({
            id: msg.id,
            sessionId: msg.sessionId,
            role: msg.role as "user" | "assistant",
            content: msg.content,
            thinkingText: msg.thinkingText || undefined,
            audioBase64: msg.audioBase64 || undefined,
            imageUrl: msg.imageUrl || undefined,
            timestamp: new Date(msg.timestamp),
          }));
          setMessages(dbMessages);
        }
        setMessagesLoaded(true);
      });
    }
  }, [sessionId, messagesLoaded, setMessages, setMessagesLoaded]);

  // Get messages from Zustand store for current session (in-memory, fast)
  const messages = getSessionMessages(sessionId);

  const addMessage = useCallback((message: Omit<Message, "id" | "timestamp" | "sessionId">) => {
    return addToStore(message);
  }, [addToStore]);

  const sendMessage = useCallback(
    async (text: string, imageBase64?: string) => {
      if (!text.trim() && !imageBase64) return;

      setIsLoading(true);

      try {
        // Add user message
        const userMessage = addMessage({
          role: "user",
          content: text,
          imageUrl: imageBase64 ? `data:image/jpeg;base64,${imageBase64}` : undefined,
        });

        // Build context
        let context: { weather?: string; plantHealth?: string } = {};

        // Get weather if location is available
        if (lat && lon) {
          const weatherResult = await getWeather(lat, lon, currentLanguage.split("-")[0]);
          if (weatherResult.success) {
            context.weather = weatherResult.formatted;
          }
        }

        // Analyze image if provided
        if (imageBase64) {
          const analysisResult = await analyzePlantImage(imageBase64);
          if (analysisResult.success && analysisResult.data) {
            const { disease, probability, treatment, symptoms, prevention } = analysisResult.data;
            context.plantHealth = `Detected: ${disease} (${(probability * 100).toFixed(1)}% confidence). ${
              treatment ? `Treatment: ${treatment}.` : ""
            } ${symptoms ? `Symptoms: ${symptoms}.` : ""} ${prevention ? `Prevention: ${prevention}.` : ""}`;
          }
        }

        // Build conversation history (exclude system messages, keep last 5 messages)
        let conversationMessages = messages.slice(-5).map((msg) => ({
          role: msg.role as "user" | "assistant",
          content: msg.content,
        }));

        // Ensure first message is from user (Sarvam requirement)
        if (conversationMessages.length > 0 && conversationMessages[0].role !== "user") {
          conversationMessages = conversationMessages.slice(1);
        }

        // Add current user message
        conversationMessages.push({
          role: "user",
          content: text,
        });

        // Get AI response
        const chatResult = await getSarvamChatCompletion({
          messages: conversationMessages,
          language: currentLanguage,
          context,
        });

        if (!chatResult.success || !chatResult.data) {
          throw new Error(chatResult.error || "Failed to get response");
        }

        const fullResponse = chatResult.data.content;
        const { thinking, answer } = parseThinkingAndAnswer(fullResponse);

        // Add assistant message (will stream audio in real-time if enabled)
        const assistantMessage = addMessage({
          role: "assistant",
          content: answer,  // Only clean answer without thinking tags
          thinkingText: thinking || undefined,  // Store thinking separately for dropdown
          isStreaming: ttsEnabled,
        });

        // Stream TTS audio in real-time only if enabled (ONLY the answer, not thinking)
        if (ttsEnabled) {
          streamTTS(answer, {
            language: currentLanguage,
            onComplete: () => {
              // Mark streaming as complete in Zustand store
              updateInStore(assistantMessage.id, { isStreaming: false });
            },
            onError: (error) => {
              console.error("Streaming TTS error:", error);
              updateInStore(assistantMessage.id, { isStreaming: false });
            },
          });
        }

        // Save both messages to database (async, non-blocking)
        Promise.all([
          saveMessage({
            sessionId,
            role: userMessage.role,
            content: userMessage.content,
            imageUrl: userMessage.imageUrl,
          }),
          saveMessage({
            sessionId,
            role: assistantMessage.role,
            content: assistantMessage.content,
            thinkingText: assistantMessage.thinkingText,
          }),
        ]).catch((error) => {
          console.error("Failed to save messages to database:", error);
          // Continue even if DB save fails - messages are in Zustand
        });
      } catch (error) {
        console.error("Chat error:", error);
        addMessage({
          role: "assistant",
          content: "I'm sorry, I encountered an error. Please try again.",
        });
      } finally {
        setIsLoading(false);
      }
    },
    [messages, addMessage, currentLanguage, lat, lon, sessionId, ttsEnabled, streamTTS, updateInStore]
  );

  return {
    messages,
    isLoading,
    sendMessage,
  };
}
