"use server";

import { put } from "@vercel/blob";

/**
 * Upload an image to Vercel Blob storage
 * @param base64Data - Base64 encoded image data (without data:image prefix)
 * @param filename - Optional filename (will generate one if not provided)
 * @returns URL of the uploaded image
 */
export async function uploadImageToBlob(
  base64Data: string,
  filename?: string
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    // Convert base64 to Buffer
    const buffer = Buffer.from(base64Data, "base64");
    
    // Generate filename if not provided
    const finalFilename = filename || `plant-${Date.now()}.jpg`;
    
    // Upload to Vercel Blob
    const blob = await put(finalFilename, buffer, {
      access: "public",
      contentType: "image/jpeg",
    });

    return {
      success: true,
      url: blob.url,
    };
  } catch (error) {
    console.error("Blob upload error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to upload image",
    };
  }
}

/**
 * Delete an image from Vercel Blob storage
 * @param url - The blob URL to delete
 */
export async function deleteImageFromBlob(
  url: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { del } = await import("@vercel/blob");
    await del(url);
    return { success: true };
  } catch (error) {
    console.error("Blob deletion error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete image",
    };
  }
}
