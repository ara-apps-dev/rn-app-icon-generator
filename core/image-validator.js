import sharp from "sharp";

// Validates that the image is square and at least 1024x1024 pixels
export async function validateImage(path) {
  try {
    const meta = await sharp(path).metadata();
    return (
      meta.width >= 1024 && meta.height >= 1024 && meta.width === meta.height // Must be square
    );
  } catch {
    // If image can't be read or is invalid
    return false;
  }
}
