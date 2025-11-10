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


