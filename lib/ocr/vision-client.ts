import { ImageAnnotatorClient } from "@google-cloud/vision";

export interface TextBlock {
  text: string;
  boundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface OCRResult {
  text: string; // Full text content
  blocks: TextBlock[]; // Individual text blocks with positions
  confidence: number; // Overall confidence score
}

let client: ImageAnnotatorClient | null = null;

/**
 * Initialize Google Cloud Vision API client
 */
function getVisionClient(): ImageAnnotatorClient {
  if (client) {
    return client;
  }

  const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;
  const keyFilename = process.env.GOOGLE_CLOUD_KEY_FILE;

  if (!projectId) {
    throw new Error("GOOGLE_CLOUD_PROJECT_ID environment variable is not set");
  }

  if (!keyFilename) {
    throw new Error("GOOGLE_CLOUD_KEY_FILE environment variable is not set");
  }

  client = new ImageAnnotatorClient({
    projectId,
    keyFilename,
  });

  return client;
}

/**
 * Process an image file and extract text using OCR
 * @param imageBuffer - Image file as Buffer
 * @returns OCR result with text and text blocks
 */
export async function processImageOCR(imageBuffer: Buffer): Promise<OCRResult> {
  const visionClient = getVisionClient();

  try {
    const [result] = await visionClient.textDetection({
      image: { content: imageBuffer },
    });

    const detections = result.textAnnotations || [];
    
    if (detections.length === 0) {
      return {
        text: "",
        blocks: [],
        confidence: 0,
      };
    }

    // First detection is the full text
    const fullText = detections[0].description || "";
    
    // Remaining detections are individual text blocks
    const blocks: TextBlock[] = detections.slice(1).map((detection) => {
      const vertices = detection.boundingPoly?.vertices || [];
      
      // Calculate bounding box
      let minX = Infinity;
      let minY = Infinity;
      let maxX = -Infinity;
      let maxY = -Infinity;

      vertices.forEach((vertex) => {
        if (vertex.x !== undefined && vertex.x !== null && vertex.y !== undefined && vertex.y !== null) {
          minX = Math.min(minX, vertex.x);
          minY = Math.min(minY, vertex.y);
          maxX = Math.max(maxX, vertex.x);
          maxY = Math.max(maxY, vertex.y);
        }
      });

      return {
        text: detection.description || "",
        boundingBox: {
          x: minX !== Infinity ? minX : 0,
          y: minY !== Infinity ? minY : 0,
          width: maxX !== -Infinity && minX !== Infinity ? maxX - minX : 0,
          height: maxY !== -Infinity && minY !== Infinity ? maxY - minY : 0,
        },
      };
    });

    // Calculate average confidence (if available)
    const confidences = detections
      .map((d) => d.confidence)
      .filter((c): c is number => c !== undefined && c !== null);
    const avgConfidence =
      confidences.length > 0
        ? confidences.reduce((a, b) => a + b, 0) / confidences.length
        : 0.9; // Default to 0.9 if confidence not available

    return {
      text: fullText,
      blocks,
      confidence: avgConfidence,
    };
  } catch (error) {
    console.error("OCR processing error:", error);
    throw new Error(
      `Failed to process image with OCR: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}


