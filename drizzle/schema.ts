import { pgTable, text, timestamp, uuid, real } from "drizzle-orm/pg-core";

export const chats = pgTable("chats", {
  id: uuid("id").primaryKey().defaultRandom(),
  sessionId: text("session_id").notNull(),
  role: text("role", { enum: ["user", "assistant"] }).notNull(),
  content: text("content").notNull(),
  thinkingText: text("thinking_text"),
  audioBase64: text("audio_base64"),
  imageUrl: text("image_url"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export const userSettings = pgTable("user_settings", {
  sessionId: text("session_id").primaryKey(),
  language: text("language").notNull().default("en-IN"),
  lat: text("lat"),
  lon: text("lon"),
});

export const plantAnalysisHistory = pgTable("plant_analysis_history", {
  id: uuid("id").primaryKey().defaultRandom(),
  sessionId: text("session_id").notNull(),
  imageUrl: text("image_url").notNull(),
  plantName: text("plant_name"),
  plantDescription: text("plant_description"),
  plantProbability: real("plant_probability"),
  disease: text("disease").notNull(),
  probability: real("probability").notNull(),
  symptoms: text("symptoms"),
  treatment: text("treatment"),
  prevention: text("prevention"),
  isHealthy: text("is_healthy").notNull(), // stored as 'true' or 'false'
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});
