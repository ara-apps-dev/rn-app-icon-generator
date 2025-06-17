import fs from "fs-extra";
import path from "path";
import sharp from "sharp";
import ora from "ora";

import { iosSizes } from "./specs.js";

// Determine which idioms (iPhone/iPad/Marketing) the icon size applies to
function getIdioms(size, scale) {
  const idioms = [];

  // Special case for App Store (1024x1024)
  if (size === 1024 && scale === 1) return ["ios-marketing"];

  // iPhone icon sizes
  if (
    (size === 20 && (scale === 2 || scale === 3)) ||
    (size === 29 && (scale === 2 || scale === 3)) ||
    (size === 40 && (scale === 2 || scale === 3)) ||
    (size === 60 && (scale === 2 || scale === 3))
  )
    idioms.push("iphone");

  // iPad icon sizes
  if (
    (size === 20 && (scale === 1 || scale === 2)) ||
    (size === 29 && (scale === 1 || scale === 2)) ||
    (size === 40 && (scale === 1 || scale === 2)) ||
    (size === 76 && (scale === 1 || scale === 2)) ||
    (size === 83.5 && scale === 2)
  )
    idioms.push("ipad");

  return idioms;
}

// Generate iOS app icons in all required sizes and generate Contents.json
export async function generateIos(iconPath, iosFolder, background, outputDir) {
  const spinner = ora("⚙️ Generating iOS icons...").start();

  // Define destination folder path
  const appIconPath =
    outputDir ||
    path.resolve(`ios/${iosFolder}/Images.xcassets/AppIcon.appiconset`);
  await fs.ensureDir(appIconPath);

  const contents = [];

  // Loop through all required icon sizes
  for (const item of iosSizes) {
    const idioms = getIdioms(item.size, item.scale);
    const size = item.size * item.scale;
    const filename = `icon-${item.size}x${item.size}@${item.scale}x.png`;

    // Generate resized image with background flattened
    await sharp(iconPath)
      .resize(size, size)
      .flatten({ background })
      .toFile(path.join(appIconPath, filename));

    // Add metadata for Contents.json
    for (const idiom of idioms) {
      contents.push({
        size: `${item.size}x${item.size}`,
        idiom,
        filename,
        scale: `${item.scale}x`,
      });
    }
  }

  // Write the metadata to Contents.json for Xcode
  const json = {
    images: contents,
    info: {
      version: 1,
      author: "xcode",
    },
  };

  await fs.writeJson(path.join(appIconPath, "Contents.json"), json, {
    spaces: 2,
  });

  spinner.succeed(`iOS icons generated at: ${appIconPath}`);
}
