export async function startCamera(videoElement: HTMLVideoElement): Promise<void> {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ 
      video: { 
        facingMode: "environment", // Use back camera
        width: { ideal: 1920 },
        height: { ideal: 1080 }
      } 
    });
    videoElement.srcObject = stream;
    await videoElement.play();
  } catch (error) {
    console.error("Error starting camera:", error);
    throw new Error("Unable to access camera. Please check permissions.");
  }
}

export function stopCamera(videoElement: HTMLVideoElement): void {
  const stream = videoElement.srcObject as MediaStream;
  if (stream) {
    stream.getTracks().forEach(track => track.stop());
  }
  videoElement.srcObject = null;
}

export function captureImage(videoElement: HTMLVideoElement, canvasElement: HTMLCanvasElement): string {
  const context = canvasElement.getContext("2d");
  if (!context) {
    throw new Error("Unable to get canvas context");
  }

  // Set canvas dimensions to match video
  canvasElement.width = videoElement.videoWidth;
  canvasElement.height = videoElement.videoHeight;

  // Draw video frame to canvas
  context.drawImage(videoElement, 0, 0, canvasElement.width, canvasElement.height);

  // Convert to data URL
  return canvasElement.toDataURL("image/jpeg", 0.8);
}

export function resizeImage(dataUrl: string, maxWidth: number = 800, maxHeight: number = 600): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d")!;

      // Calculate new dimensions
      let { width, height } = img;
      if (width > height) {
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }
      }

      canvas.width = width;
      canvas.height = height;

      // Draw resized image
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL("image/jpeg", 0.8));
    };
    img.src = dataUrl;
  });
}
