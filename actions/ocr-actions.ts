"use server";

import { getCurrentUser } from "@/lib/auth";
import { processImageOCR, type OCRResult } from "@/lib/ocr/vision-client";

/**
 * Process a screenshot file and extract text using OCR
 * File is processed in-memory and never stored
 */
export async function processScreenshotOCR(file: File): Promise<OCRResult> {
  // Verify user is authenticated
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Unauthorized");
  }

  // Validate file type
  const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
  if (!allowedTypes.includes(file.type)) {
    throw new Error(
      `Invalid file type. Allowed types: ${allowedTypes.join(", ")}`
    );
  }

  // Validate file size (max 10MB)
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    throw new Error(`File size exceeds maximum of ${maxSize / 1024 / 1024}MB`);
  }

  try {
    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Process OCR
    const result = await processImageOCR(buffer);

    return result;
  } catch (error) {
    console.error("OCR processing error:", error);
    throw new Error(
      `Failed to process screenshot: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}


