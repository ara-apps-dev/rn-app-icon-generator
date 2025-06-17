#!/usr/bin/env node

import fs from "fs-extra";
import path from "path";
import sharp from "sharp";
import chalk from "chalk";
import inquirer from "inquirer";
import ora from "ora";

const PADDING_RATIO = 0.55;
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
  { size: 20, scale: 1 },
  { size: 20, scale: 2 },
  { size: 20, scale: 3 },
  { size: 29, scale: 1 },
  { size: 29, scale: 2 },
  { size: 29, scale: 3 },
  { size: 40, scale: 1 },
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

function getIdioms(size, scale) {
  const idioms = [];

  if (size === 1024 && scale === 1) return ["ios-marketing"];

  if (
    (size === 20 && (scale === 2 || scale === 3)) ||
    (size === 29 && (scale === 2 || scale === 3)) ||
    (size === 40 && (scale === 2 || scale === 3)) ||
    (size === 60 && (scale === 2 || scale === 3))
  )
    idioms.push("iphone");

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

  if (!/^#([0-9a-fA-F]{3}){1,2}$/.test(background)) {
    console.error(
      chalk.red(`❌ Invalid background color format: ${background}`)
    );
    process.exit(1);
  }

  if (!iconPath) {
    const questions = [
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
    ];

    if (!maskPath) {
      questions.push(
        {
          type: "confirm",
          name: "useMask",
          message: "Do you want to use a custom mask for Android icons?",
          default: false,
        },
        {
          type: "input",
          name: "maskPath",
          message: "Enter path to PNG or SVG mask (with transparency):",
          when: (answers) =>
            answers.useMask &&
            (answers.platform === "android" || answers.platform === "all"),
          validate: (input) =>
            input ? true : "Mask path is required if you choose to use mask.",
        }
      );
    }

    if (!outputDir) {
      questions.push(
        {
          type: "confirm",
          name: "useOutput",
          message: "Do you want to export to a custom output directory?",
          default: false,
        },
        {
          type: "input",
          name: "outputPath",
          message: "Enter output directory path:",
          when: (answers) => answers.useOutput,
        }
      );
    }

    const answers = await inquirer.prompt(questions);

    const inputPath = answers.iconPath.trim();
    background = answers.background;
    platform = answers.platform;

    if (answers.maskPath) maskPath = path.resolve(answers.maskPath);
    if (answers.outputPath) outputDir = path.resolve(answers.outputPath);

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
    const found = findIconPath();
    if (!found) {
      console.error(
        chalk.red(`❌ Could not find ${defaultIconFileName} in your project.`)
      );
      process.exit(1);
    }
    console.log(chalk.yellow(`🔍 Using automatically detected icon: ${found}`));
    iconPath = found;
  }

  let hasValidMask = false;

  let maskBuffer = null;

  if (maskPath) {
    try {
      const meta = await sharp(maskPath).metadata();
      if ((meta.format === "png" && meta.hasAlpha) || meta.format === "svg") {
        hasValidMask = true;
        console.log(chalk.green(`✅ Using mask: ${maskPath}`));
        maskBuffer = await sharp(maskPath).resize(432, 432).png().toBuffer(); // default max size
      } else {
        console.warn(
          chalk.yellow(
            "⚠️ Mask must be a PNG with transparency or an SVG. Ignoring mask."
          )
        );
        maskPath = null;
      }
    } catch (e) {
      console.warn(chalk.yellow(`⚠️ Failed to load mask file. Ignoring mask.`));
      maskPath = null;
    }
  }

  const iosFolder = findIosFolderName();
  if ((platform === "ios" || platform === "all") && !iosFolder) {
    console.error(chalk.red("❌ Could not find your iOS project folder."));
    process.exit(1);
  }

  console.log(chalk.green(`✅ Icon found: ${iconPath}`));
  if (iosFolder) console.log(chalk.green(`✅ iOS project: ios/${iosFolder}`));
  console.log(chalk.green(`✅ Background color: ${background}`));
  console.log(chalk.green(`✅ Platform: ${platform}`));

  if (platform === "android" || platform === "all") {
    const spinner = ora("Generating Android icons...").start();
    const androidResPath =
      outputDir || path.resolve("android", "app", "src", "main", "res");

    try {
      for (const [folder, size] of Object.entries(adaptiveIconSizes)) {
        const outputFolder = path.join(androidResPath, folder);
        fs.ensureDirSync(outputFolder);

        const outputPath = path.join(
          outputFolder,
          "ic_launcher_foreground.png"
        );

        const iconResized = await sharp(iconPath)
          .resize(
            Math.round(size * PADDING_RATIO),
            Math.round(size * PADDING_RATIO)
          )
          .png()
          .toBuffer();

        const offset = Math.round(
          (size - Math.round(size * PADDING_RATIO)) / 2
        );

        let resizedMaskBuffer = null;
        if (hasValidMask && maskBuffer) {
          resizedMaskBuffer = await sharp(maskBuffer)
            .resize(size, size) // resize agar tidak lebih besar dari canvas
            .toBuffer();
        }

        const finalBuffer = await sharp({
          create: {
            width: size,
            height: size,
            channels: 4,
            background,
          },
        })
          .composite([
            {
              input: iconResized,
              top: offset,
              left: offset,
            },
            ...(hasValidMask && resizedMaskBuffer
              ? [{ input: resizedMaskBuffer, blend: "dest-in" }]
              : []),
          ])
          .png()
          .toBuffer();

        await sharp(finalBuffer).toFile(outputPath);
      }

      spinner.succeed("✅ Android adaptive icons generated!");
    } catch (err) {
      spinner.fail("❌ Failed to generate Android icons");
      console.error(err);
    }
  }

  async function generateIos(iconPath, iosFolder, background) {
    const spinner = ora("Generating iOS icons...").start();
    const appIconPath =
      outputDir ||
      path.resolve(`ios/${iosFolder}/Images.xcassets/AppIcon.appiconset`);
    await fs.ensureDir(appIconPath);
    const contents = [];
    for (const item of iosSizes) {
      const idioms = getIdioms(item.size, item.scale);
      const size = item.size * item.scale;
      const filename = `icon-${item.size}x${item.size}@${item.scale}x.png`;
      await sharp(iconPath)
        .resize(size, size)
        .flatten({ background })
        .toFile(path.join(appIconPath, filename));
      for (const idiom of idioms) {
        contents.push({
          size: `${item.size}x${item.size}`,
          idiom,
          filename,
          scale: `${item.scale}x`,
        });
      }
    }
    const json = { images: contents, info: { version: 1, author: "xcode" } };
    await fs.writeJson(path.join(appIconPath, "Contents.json"), json, {
      spaces: 2,
    });
    spinner.succeed(`iOS icons generated at: ${appIconPath}`);
  }

  async function generateAndroid(
    iconPath,
    background,
    hasValidMask,
    maskBuffer
  ) {
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
      const resized = await sharp(iconPath)
        .resize(paddedSize, paddedSize)
        .png()
        .toBuffer();

      const offset = Math.floor((size - paddedSize) / 2);
      const compositeLayers = [
        {
          input: resized,
          top: offset,
          left: offset,
        },
      ];

      if (hasValidMask && maskBuffer) {
        const resizedMaskBuffer = await sharp(maskBuffer)
          .resize(size, size) // fix: samakan dengan canvas
          .toBuffer();

        compositeLayers.push({
          input: resizedMaskBuffer,
          blend: "dest-in",
        });
      }

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

    const anydpi = path.join(androidResPath, "mipmap-anydpi-v26");
    await fs.ensureDir(anydpi);
    await fs.writeFile(
      path.join(anydpi, "ic_launcher.xml"),
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

    spinner.succeed(`Android icons generated at: ${androidResPath}`);
  }

  if (platform === "android" || platform === "all")
    await generateAndroid(iconPath, background, hasValidMask, maskBuffer);
  if ((platform === "ios" || platform === "all") && iosFolder)
    await generateIos(iconPath, iosFolder, background);

  console.log(
    chalk.green("\n🎉 All icons have been generated successfully!\n")
  );
})();
