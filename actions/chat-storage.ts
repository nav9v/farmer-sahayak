"use server";

import { db } from "@/lib/db";
import { chats } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import { deleteImageFromBlob } from "@/lib/blob-storage";

export interface ChatMessageData {
  sessionId: string;
  role: "user" | "assistant";
  content: string;
  thinkingText?: string;
  audioBase64?: string;
  imageUrl?: string;
}

// Save a single message to database
export async function saveMessage(message: ChatMessageData) {
  try {
    await db.insert(chats).values({
      sessionId: message.sessionId,
      role: message.role,
      content: message.content,
      thinkingText: message.thinkingText,
      audioBase64: message.audioBase64,
      imageUrl: message.imageUrl,
    });
    return { success: true };
  } catch (error) {
    console.error("Error saving message:", error);
    return { success: false, error: String(error) };
  }
}

// Load messages for a session from database
export async function loadSessionMessages(sessionId: string) {
  try {
    const messages = await db
      .select()
      .from(chats)
      .where(eq(chats.sessionId, sessionId))
      .orderBy(chats.timestamp);
    
    return { success: true, messages };
  } catch (error) {
    console.error("Error loading messages:", error);
    return { success: false, error: String(error), messages: [] };
  }
}

// Delete all messages for a session
export async function clearSessionMessages(sessionId: string) {
  try {
    // Get all messages to delete their blob images
    const messages = await db
      .select()
      .from(chats)
      .where(eq(chats.sessionId, sessionId));
    
    // Delete blob images (only if they're blob URLs, not base64)
    await Promise.all(
      messages.map((msg) => {
        if (msg.imageUrl && msg.imageUrl.startsWith("https://") && msg.imageUrl.includes("blob.vercel-storage.com")) {
          return deleteImageFromBlob(msg.imageUrl);
        }
        return Promise.resolve({ success: true });
      })
    );
    
    await db.delete(chats).where(eq(chats.sessionId, sessionId));
    return { success: true };
  } catch (error) {
    console.error("Error clearing messages:", error);
    return { success: false, error: String(error) };
  }
}
