#!/usr/bin/env node

import fs from "fs-extra";
import path from "path";
import sharp from "sharp";
import chalk from "chalk";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log(chalk.green("Running rn-app-icon-generator CLI..."));

const defaultIconFileName = "app_icon.png";

const androidSizes = {
  "mipmap-mdpi": 48,
  "mipmap-hdpi": 72,
  "mipmap-xhdpi": 96,
  "mipmap-xxhdpi": 144,
  "mipmap-xxxhdpi": 192,
};

const iosSizes = [
  { size: 20, scale: 2 },
  { size: 20, scale: 3 },
  { size: 29, scale: 2 },
  { size: 29, scale: 3 },
  { size: 40, scale: 2 },
  { size: 40, scale: 3 },
  { size: 60, scale: 2 },
  { size: 60, scale: 3 },
  { size: 76, scale: 1 },
  { size: 76, scale: 2 },
  { size: 83.5, scale: 2 },
  { size: 1024, scale: 1 },
];

function findIconPath(startDir = process.cwd()) {
  let result = null;
  function walk(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        walk(fullPath);
      } else if (file === defaultIconFileName) {
        result = fullPath;
        return;
      }
    }
  }
  walk(startDir);
  return result;
}

function findIosFolderName() {
  const iosDir = path.resolve("ios");
  const dirs = fs.existsSync(iosDir) ? fs.readdirSync(iosDir) : [];
  const proj = dirs.find((d) => d.endsWith(".xcodeproj"));
  return proj ? proj.replace(".xcodeproj", "") : null;
}

function getIdiom(size, scale) {
  if (size === 1024 && scale === 1) return "ios-marketing";
  if (size >= 76) return "ipad";
  return "iphone";
}

async function generateAndroid(iconPath) {
  console.log(chalk.green("📱 Generating Android icons..."));
  const androidResPath = path.resolve("android/app/src/main/res");

  for (const [folder, size] of Object.entries(androidSizes)) {
    const dest = path.join(androidResPath, folder);
    await fs.ensureDir(dest);

    // Default launcher icon
    await sharp(iconPath)
      .resize(size, size)
      .flatten({ background: "#ffffff" })
      .toFile(path.join(dest, "ic_launcher.png"));

    // Round launcher icon
    await sharp(iconPath)
      .resize(size, size)
      .flatten({ background: "#ffffff" })
      .toFile(path.join(dest, "ic_launcher_round.png"));
  }
}

async function generateIos(iconPath, iosFolder) {
  console.log(chalk.green("🍎 Generating iOS icons..."));
  const appIconPath = path.resolve(
    `ios/${iosFolder}/Images.xcassets/AppIcon.appiconset`
  );
  await fs.ensureDir(appIconPath);

  const contents = [];

  for (const item of iosSizes) {
    const size = item.size * item.scale;
    const filename = `icon-${item.size}x${item.size}@${item.scale}x.png`;

    await sharp(iconPath)
      .resize(size, size)
      .flatten({ background: "#ffffff" })
      .toFile(path.join(appIconPath, filename));

    contents.push({
      size: `${item.size}x${item.size}`,
      idiom: getIdiom(item.size, item.scale),
      filename,
      scale: `${item.scale}x`,
    });
  }

  const json = {
    images: contents,
    info: { version: 1, author: "xcode" },
  };

  await fs.writeJson(path.join(appIconPath, "Contents.json"), json, {
    spaces: 2,
  });
}

(async () => {
  console.log(chalk.cyan("\n🚀 React Native App Icon Generator"));

  const iconArg = process.argv[2];
  let iconPath = iconArg ? path.resolve(iconArg) : findIconPath();

  if (!iconPath || !fs.existsSync(iconPath)) {
    console.error(
      chalk.red(
        `❌ Icon not found. Please place '${defaultIconFileName}' in your project or provide path:`
      )
    );
    console.log(chalk.yellow(`\nUsage:`));
    console.log(
      chalk.white(`  rn-app-icon-generator`) +
        `          ← auto detect ${defaultIconFileName}`
    );
    console.log(
      chalk.white(`  rn-app-icon-generator path/to/icon.png`) +
        ` ← use custom icon`
    );
    process.exit(1);
  }

  const iosFolder = findIosFolderName();
  if (!iosFolder) {
    console.error(chalk.red("❌ Could not find your iOS project folder."));
    process.exit(1);
  }

  console.log(chalk.green(`✅ Icon found: ${iconPath}`));
  console.log(chalk.green(`✅ iOS project: ios/${iosFolder}\n`));

  await generateAndroid(iconPath);
  await generateIos(iconPath, iosFolder);

  console.log(
    chalk.green("\n🎉 All icons have been generated for Android and iOS!\n")
  );
})();
