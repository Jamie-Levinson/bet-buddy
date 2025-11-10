#!/usr/bin/env tsx
/**
 * Test script for OCR processing
 * Usage: tsx scripts/test-ocr.ts <path-to-image>
 */

import { config } from "dotenv";
import { readFileSync } from "fs";
import { resolve } from "path";

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), ".env.local") });

import { processImageOCR } from "../lib/ocr/vision-client";

async function main() {
  const imagePath = process.argv[2];

  if (!imagePath) {
    console.error("Usage: tsx scripts/test-ocr.ts <path-to-image>");
    process.exit(1);
  }

  try {
    console.log(`📸 Processing image: ${imagePath}`);
    console.log("⏳ Sending to Google Cloud Vision API...\n");

    const imageBuffer = readFileSync(imagePath);
    const result = await processImageOCR(imageBuffer);

    console.log("✅ OCR Processing Complete!\n");
    console.log("=" .repeat(80));
    console.log("FULL TEXT:");
    console.log("=" .repeat(80));
    console.log(result.text);
    console.log("\n" + "=" .repeat(80));
    console.log(`\nConfidence: ${(result.confidence * 100).toFixed(2)}%`);
    console.log(`Text Blocks Found: ${result.blocks.length}\n`);

    if (result.blocks.length > 0) {
      console.log("=" .repeat(80));
      console.log("TEXT BLOCKS (with positions):");
      console.log("=" .repeat(80));
      result.blocks.slice(0, 20).forEach((block, index) => {
        console.log(`\n[${index + 1}] ${block.text}`);
        if (block.boundingBox) {
          console.log(
            `    Position: (${block.boundingBox.x}, ${block.boundingBox.y}) ` +
            `Size: ${block.boundingBox.width}x${block.boundingBox.height}`
          );
        }
      });
      if (result.blocks.length > 20) {
        console.log(`\n... and ${result.blocks.length - 20} more blocks`);
      }
    }
  } catch (error) {
    console.error("❌ Error processing image:", error);
    if (error instanceof Error) {
      console.error("Error message:", error.message);
    }
    process.exit(1);
  }
}

main();

