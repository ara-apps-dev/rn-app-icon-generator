#!/usr/bin/env node

import fs from "fs-extra";
import path from "path";
import sharp from "sharp";
import chalk from "chalk";
import { fileURLToPath } from "url";
import inquirer from "inquirer";
import ora from "ora";
import imageType from "image-type";

const PADDING_RATIO = 0.8;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const defaultIconFileName = "app_icon.png";
const defaultBackground = "#ffffff";

const androidSizes = {
  "mipmap-mdpi": 48,
  "mipmap-hdpi": 72,
  "mipmap-xhdpi": 96,
  "mipmap-xxhdpi": 144,
  "mipmap-xxxhdpi": 192,
};

const adaptiveIconSizes = {
  "mipmap-mdpi": 108,
  "mipmap-hdpi": 162,
  "mipmap-xhdpi": 216,
  "mipmap-xxhdpi": 324,
  "mipmap-xxxhdpi": 432,
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

function findIconPath(
  startDir = process.cwd(),
  filename = defaultIconFileName
) {
  let result = null;
  function walk(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        walk(fullPath);
        if (result) return;
      } else if (file.toLowerCase() === filename.toLowerCase()) {
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
  const ipadSpecific = [
    { size: 20, scale: 2 },
    { size: 29, scale: 2 },
    { size: 40, scale: 2 },
    { size: 76, scale: 1 },
    { size: 76, scale: 2 },
    { size: 83.5, scale: 2 },
  ];
  return ipadSpecific.find((i) => i.size === size && i.scale === scale)
    ? "ipad"
    : "iphone";
}

const args = process.argv.slice(2);
let iconPath = null,
  background = defaultBackground,
  platform = "all",
  maskPath = null,
  outputDir = null;

for (let i = 0; i < args.length; i++) {
  if (!args[i].startsWith("--") && !iconPath) iconPath = path.resolve(args[i]);
  else if (args[i] === "--background" && args[i + 1]) {
    background = args[++i];
  } else if (args[i] === "--platform" && args[i + 1]) {
    platform = args[++i];
  } else if (args[i] === "--mask" && args[i + 1]) {
    maskPath = path.resolve(args[++i]);
  } else if (args[i] === "--output" && args[i + 1]) {
    outputDir = path.resolve(args[++i]);
  }
}

(async () => {
  console.log(chalk.cyan("\n🚀 React Native App Icon Generator"));

  if (!iconPath) {
    const answers = await inquirer.prompt([
      {
        type: "input",
        name: "iconPath",
        message: "Enter path to PNG icon (default: app_icon.png):",
        default: defaultIconFileName,
      },
      {
        type: "input",
        name: "background",
        message: "Background color:",
        default: defaultBackground,
      },
      {
        type: "list",
        name: "platform",
        message: "Platform to generate:",
        choices: ["android", "ios", "all"],
        default: "all",
      },
    ]);

    const inputPath = answers.iconPath.trim();
    background = answers.background;
    platform = answers.platform;

    const resolvedInput = path.resolve(inputPath);
    if (fs.existsSync(resolvedInput)) {
      iconPath = resolvedInput;
    } else {
      const found = findIconPath();
      if (!found) {
        console.error(
          chalk.red(
            `❌ Could not find ${defaultIconFileName} in your project (including subfolders).`
          )
        );
        process.exit(1);
      }
      console.log(
        chalk.yellow(`🔍 Using automatically detected icon: ${found}`)
      );
      iconPath = found;
    }
  }

  if (!fs.existsSync(iconPath)) {
    console.error(chalk.red(`❌ Icon file not found: ${iconPath}`));
    process.exit(1);
  }

  const iosFolder = findIosFolderName();
  if (!iosFolder && (platform === "ios" || platform === "all")) {
    console.error(chalk.red("❌ Could not find your iOS project folder."));
    process.exit(1);
  }

  console.log(chalk.green(`✅ Icon found: ${iconPath}`));
  if (iosFolder) console.log(chalk.green(`✅ iOS project: ios/${iosFolder}`));
  console.log(chalk.green(`✅ Background color: ${background}`));
  console.log(chalk.green(`✅ Platform: ${platform}`));

  async function generateAndroid(iconPath, background) {
    const spinner = ora("Generating Android icons...").start();
    const androidResPath =
      outputDir || path.resolve("android/app/src/main/res");

    for (const [folder, size] of Object.entries(androidSizes)) {
      const dest = path.join(androidResPath, folder);
      await fs.ensureDir(dest);
      await sharp(iconPath)
        .resize(size, size)
        .flatten({ background })
        .toFile(path.join(dest, "ic_launcher.png"));

      const circleSvg = `<svg width="${size}" height="${size}"><circle cx="${
        size / 2
      }" cy="${size / 2}" r="${size / 2}" fill="white" /></svg>`;
      await sharp(iconPath)
        .resize(size, size)
        .composite([{ input: Buffer.from(circleSvg), blend: "dest-in" }])
        .flatten({ background })
        .toFile(path.join(dest, "ic_launcher_round.png"));
    }

    for (const [folder, size] of Object.entries(adaptiveIconSizes)) {
      const dest = path.join(androidResPath, folder);
      await fs.ensureDir(dest);
      const paddedSize = Math.floor(size * PADDING_RATIO);
      const composite = sharp(iconPath)
        .resize(paddedSize, paddedSize)
        .extend({
          top: Math.floor((size - paddedSize) / 2),
          bottom: Math.ceil((size - paddedSize) / 2),
          left: Math.floor((size - paddedSize) / 2),
          right: Math.ceil((size - paddedSize) / 2),
          background: { r: 0, g: 0, b: 0, alpha: 0 },
        });

      await composite.toFile(path.join(dest, "ic_launcher_foreground.png"));
    }

    const mipmapAnyResPath = path.join(androidResPath, "mipmap-anydpi-v26");
    await fs.ensureDir(mipmapAnyResPath);
    await fs.writeFile(
      path.join(mipmapAnyResPath, "ic_launcher.xml"),
      `<?xml version="1.0" encoding="utf-8"?>\n<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">\n  <background android:drawable="@color/ic_launcher_background" />\n  <foreground android:drawable="@mipmap/ic_launcher_foreground" />\n</adaptive-icon>`
    );

    const colorsPath = path.resolve(
      "android/app/src/main/res/values/colors.xml"
    );
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
    spinner.succeed("Android icons generated.");
  }

  async function generateIos(iconPath, iosFolder, background) {
    const spinner = ora("Generating iOS icons...").start();
    const appIconPath =
      outputDir ||
      path.resolve(`ios/${iosFolder}/Images.xcassets/AppIcon.appiconset`);
    await fs.ensureDir(appIconPath);

    const contents = [];

    for (const item of iosSizes) {
      const size = item.size * item.scale;
      const filename = `icon-${item.size}x${item.size}@${item.scale}x.png`;

      await sharp(iconPath)
        .resize(size, size)
        .flatten({ background })
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
    spinner.succeed("iOS icons generated.");
  }

  if (platform === "android" || platform === "all")
    await generateAndroid(iconPath, background);
  if ((platform === "ios" || platform === "all") && iosFolder)
    await generateIos(iconPath, iosFolder, background);

  console.log(
    chalk.green("\n🎉 All icons have been generated successfully!\n")
  );
})();
