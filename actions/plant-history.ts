"use server";

import { db } from "@/lib/db";
import { plantAnalysisHistory } from "@/drizzle/schema";
import { desc, eq } from "drizzle-orm";
import { deleteImageFromBlob } from "@/lib/blob-storage";

interface PlantHistoryItem {
  id: string;
  imageUrl: string;
  plantName?: string;
  plantDescription?: string;
  plantProbability?: number;
  disease: string;
  probability: number;
  symptoms?: string;
  treatment?: string;
  prevention?: string;
  isHealthy: boolean;
  timestamp: Date;
}

interface SavePlantAnalysisData {
  sessionId: string;
  imageUrl: string;
  plantName?: string;
  plantDescription?: string;
  plantProbability?: number;
  disease: string;
  probability: number;
  symptoms?: string;
  treatment?: string;
  prevention?: string;
  isHealthy: boolean;
}

export async function savePlantAnalysis(
  data: SavePlantAnalysisData
): Promise<{ success: boolean; error?: string }> {
  try {
    await db.insert(plantAnalysisHistory).values({
      sessionId: data.sessionId,
      imageUrl: data.imageUrl,
      plantName: data.plantName,
      plantDescription: data.plantDescription,
      plantProbability: data.plantProbability,
      disease: data.disease,
      probability: data.probability,
      symptoms: data.symptoms,
      treatment: data.treatment,
      prevention: data.prevention,
      isHealthy: data.isHealthy ? "true" : "false",
    });

    return { success: true };
  } catch (error) {
    console.error("Failed to save plant analysis:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to save analysis",
    };
  }
}

export async function getPlantAnalysisHistory(
  sessionId: string
): Promise<PlantHistoryItem[]> {
  try {
    const history = await db
      .select()
      .from(plantAnalysisHistory)
      .where(eq(plantAnalysisHistory.sessionId, sessionId))
      .orderBy(desc(plantAnalysisHistory.timestamp))
      .limit(20);

    return history.map((item) => ({
      id: item.id,
      imageUrl: item.imageUrl,
      plantName: item.plantName || undefined,
      plantDescription: item.plantDescription || undefined,
      plantProbability: item.plantProbability || undefined,
      disease: item.disease,
      probability: item.probability,
      symptoms: item.symptoms || undefined,
      treatment: item.treatment || undefined,
      prevention: item.prevention || undefined,
      isHealthy: item.isHealthy === "true",
      timestamp: item.timestamp,
    }));
  } catch (error) {
    console.error("Failed to fetch plant analysis history:", error);
    return [];
  }
}

export async function deletePlantAnalysisHistory(
  sessionId: string
): Promise<{ success: boolean }> {
  try {
    // Get all items to delete their blob images
    const items = await db
      .select()
      .from(plantAnalysisHistory)
      .where(eq(plantAnalysisHistory.sessionId, sessionId));
    
    // Delete blob images (only if they're blob URLs, not base64)
    await Promise.all(
      items.map((item) => {
        if (item.imageUrl.startsWith("https://") && item.imageUrl.includes("blob.vercel-storage.com")) {
          return deleteImageFromBlob(item.imageUrl);
        }
        return Promise.resolve({ success: true });
      })
    );
    
    // Delete from database
    await db
      .delete(plantAnalysisHistory)
      .where(eq(plantAnalysisHistory.sessionId, sessionId));
    return { success: true };
  } catch (error) {
    console.error("Failed to delete plant analysis history:", error);
    return { success: false };
  }
}

export async function deleteSinglePlantAnalysis(
  id: string
): Promise<{ success: boolean }> {
  try {
    // Get the item to delete its blob image
    const [item] = await db
      .select()
      .from(plantAnalysisHistory)
      .where(eq(plantAnalysisHistory.id, id))
      .limit(1);
    
    if (item && item.imageUrl.startsWith("https://") && item.imageUrl.includes("blob.vercel-storage.com")) {
      await deleteImageFromBlob(item.imageUrl);
    }
    
    // Delete from database
    await db
      .delete(plantAnalysisHistory)
      .where(eq(plantAnalysisHistory.id, id));
    return { success: true };
  } catch (error) {
    console.error("Failed to delete plant analysis:", error);
    return { success: false };
  }
}
