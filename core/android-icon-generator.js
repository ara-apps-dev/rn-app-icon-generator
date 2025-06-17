import fs from "fs-extra";
import path from "path";
import sharp from "sharp";
import ora from "ora";

import { adaptiveIconSizes, androidSizes } from "./specs.js";

const PADDING_RATIO = 0.55; // Determines how much padding is added for adaptive icons

// Main function to generate Android icons
export async function generateAndroid(
  iconPath, // Path to the base icon
  background, // Background color for the icon
  hasValidMask, // Whether a custom mask is provided and valid
  maskBuffer, // Mask image buffer (PNG or SVG)
  outputDir // Optional custom output directory
) {
  const spinner = ora("⚙️ Generating Android icons...").start();
  const androidResPath = outputDir || path.resolve("android/app/src/main/res");

  // Generate standard and round icons for each Android density
  for (const [folder, size] of Object.entries(androidSizes)) {
    const dest = path.join(androidResPath, folder);
    await fs.ensureDir(dest);

    // Generate standard square icon
    await sharp(iconPath)
      .resize(size, size)
      .flatten({ background })
      .toFile(path.join(dest, "ic_launcher.png"));

    // Generate round icon using an SVG circle mask
    const circleSvg = `<svg width="${size}" height="${size}"><circle cx="${
      size / 2
    }" cy="${size / 2}" r="${size / 2}" fill="white" /></svg>`;
    await sharp(iconPath)
      .resize(size, size)
      .composite([{ input: Buffer.from(circleSvg), blend: "dest-in" }])
      .flatten({ background })
      .toFile(path.join(dest, "ic_launcher_round.png"));
  }

  // Generate adaptive foreground icons (used with adaptive backgrounds)
  for (const [folder, size] of Object.entries(adaptiveIconSizes)) {
    const dest = path.join(androidResPath, folder);
    await fs.ensureDir(dest);

    // Resize icon with padding
    const paddedSize = Math.floor(size * PADDING_RATIO);
    const resized = await sharp(iconPath)
      .resize(paddedSize, paddedSize)
      .png()
      .toBuffer();

    const offset = Math.floor((size - paddedSize) / 2);

    // Prepare layers for composite
    const compositeLayers = [
      {
        input: resized,
        top: offset,
        left: offset,
      },
    ];

    // Apply custom mask if provided
    if (hasValidMask && maskBuffer) {
      const resizedMaskBuffer = await sharp(maskBuffer)
        .resize(size, size)
        .toBuffer();

      compositeLayers.push({
        input: resizedMaskBuffer,
        blend: "dest-in",
      });
    }

    // Create adaptive icon foreground file
    const final = await sharp({
      create: {
        width: size,
        height: size,
        channels: 4,
        background,
      },
    })
      .composite(compositeLayers)
      .png()
      .toBuffer();

    await sharp(final).toFile(path.join(dest, "ic_launcher_foreground.png"));
  }

  // Generate XML for adaptive icon configuration
  const anydpi = path.join(androidResPath, "mipmap-anydpi-v26");
  await fs.ensureDir(anydpi);
  await fs.writeFile(
    path.join(anydpi, "ic_launcher.xml"),
    `<?xml version="1.0" encoding="utf-8"?>\n<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">\n  <background android:drawable="@color/ic_launcher_background" />\n  <foreground android:drawable="@mipmap/ic_launcher_foreground" />\n</adaptive-icon>`
  );

  // Inject background color into colors.xml if not yet defined
  const colorsPath = path.resolve("android/app/src/main/res/values/colors.xml");
  if (fs.existsSync(colorsPath)) {
    let content = await fs.readFile(colorsPath, "utf-8");
    if (!content.includes("ic_launcher_background")) {
      content = content.replace(
        /<\/resources>/,
        `  <color name="ic_launcher_background">${background}</color>\n</resources>`
      );
      await fs.writeFile(colorsPath, content);
    }
  }

  // Finish with success message
  spinner.succeed(`Android icons generated at: ${androidResPath}`);
}
