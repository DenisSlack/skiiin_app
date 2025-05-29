import Tesseract from "tesseract.js";

export async function extractTextFromImage(imageDataUrl: string): Promise<string> {
  try {
    // Use Tesseract.js for OCR
    const { data: { text } } = await Tesseract.recognize(
      imageDataUrl,
      'eng',
      {
        logger: m => {
          // Optional: log progress
          if (m.status === 'recognizing text') {
            console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`);
          }
        }
      }
    );
    
    return text.trim();
  } catch (error) {
    console.error("OCR Error:", error);
    throw new Error("Failed to extract text from image");
  }
}

export function preprocessImageForOCR(imageDataUrl: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d")!;

      canvas.width = img.width;
      canvas.height = img.height;

      // Draw original image
      ctx.drawImage(img, 0, 0);

      // Get image data for processing
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      // Convert to grayscale and increase contrast
      for (let i = 0; i < data.length; i += 4) {
        const gray = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
        // Increase contrast
        const contrast = gray > 128 ? 255 : 0;
        data[i] = contrast;     // Red
        data[i + 1] = contrast; // Green
        data[i + 2] = contrast; // Blue
        // Alpha remains the same
      }

      // Put processed image data back
      ctx.putImageData(imageData, 0, 0);

      resolve(canvas.toDataURL("image/jpeg", 0.9));
    };
    img.src = imageDataUrl;
  });
}

export function cleanExtractedText(text: string): string {
  return text
    .replace(/[^\w\s,.-]/g, '') // Remove special characters except common punctuation
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .trim();
}
