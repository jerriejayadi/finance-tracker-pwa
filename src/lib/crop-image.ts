/**
 * Crop an image using canvas given crop area from react-easy-crop.
 * Returns a Blob (JPEG) ready for upload.
 */
export async function cropImage(
  imageSrc: string,
  cropArea: { x: number; y: number; width: number; height: number }
): Promise<Blob> {
  const image = await loadImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) throw new Error("Canvas not supported");

  // Output at crop size, max 512px for avatars
  const maxSize = 512;
  const scale = Math.min(maxSize / cropArea.width, maxSize / cropArea.height, 1);
  canvas.width = cropArea.width * scale;
  canvas.height = cropArea.height * scale;

  ctx.drawImage(
    image,
    cropArea.x,
    cropArea.y,
    cropArea.width,
    cropArea.height,
    0,
    0,
    canvas.width,
    canvas.height
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Failed to crop image"));
      },
      "image/jpeg",
      0.9
    );
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}
