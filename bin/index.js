#!/usr/bin/env node

const fs = require("fs-extra");
const path = require("path");
const sharp = require("sharp");
const chalk = require("chalk");

const iconFileName = "app_icon.png";

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
      } else if (file === iconFileName) {
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
  const dirs = fs.readdirSync(iosDir);
  const proj = dirs.find((d) => d.endsWith(".xcodeproj"));
  return proj ? proj.replace(".xcodeproj", "") : null;
}

async function generateAndroid(iconPath) {
  console.log(chalk.green("📱 Generating Android icons..."));
  const androidResPath = path.resolve("android/app/src/main/res");

  for (const [folder, size] of Object.entries(androidSizes)) {
    const dest = path.join(androidResPath, folder);
    await fs.ensureDir(dest);
    await sharp(iconPath)
      .resize(size, size)
      .flatten({ background: "#ffffff" })
      .toFile(path.join(dest, "ic_launcher.png"));
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
      idiom: "iphone",
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
  console.log(chalk.yellow(`🔍 Searching for '${iconFileName}'...`));

  const iconPath = findIconPath();
  if (!iconPath) {
    console.error(
      chalk.red(
        `❌ '${iconFileName}' not found. Please place it somewhere in your project.`
      )
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
    chalk.green("\n🎉 All icons have been generated for Android and iOS!")
  );
})();
