#!/usr/bin/env node

// Import necessary modules
import fs from "fs-extra";
import path from "path";
import sharp from "sharp";
import chalk from "chalk";

import { promptUser } from "../core/prompter.js";
import { findIconPath, findIosFolderName } from "../core/path-helper.js";
import { validateImage } from "../core/image-validator.js";
import { generateAndroid } from "../core/android-icon-generator.js";
import { generateIos } from "../core/ios-icon-generator.js";
import { printHeader, printFooter } from "../core/print-header.js";

// Extract CLI arguments
const args = process.argv.slice(2);
let iconPath = null,
  background = "#ffffff",
  platform = "all",
  maskPath = null,
  outputDir = null;

// Parse command line arguments
for (let i = 0; i < args.length; i++) {
  if (!args[i].startsWith("--") && !iconPath) iconPath = path.resolve(args[i]);
  else if (args[i] === "--background" && args[i + 1]) background = args[++i];
  else if (args[i] === "--platform" && args[i + 1]) platform = args[++i];
  else if (args[i] === "--mask" && args[i + 1])
    maskPath = path.resolve(args[++i]);
  else if (args[i] === "--output" && args[i + 1])
    outputDir = path.resolve(args[++i]);
}

(async () => {
  try {
    printHeader(); // Print CLI tool header

    // Validate background color format
    if (!/^#([0-9a-fA-F]{3}){1,2}$/.test(background)) {
      console.error(
        chalk.red(`❌ Invalid background color format: ${background}`)
      );
      process.exit(1);
    }

    // Prompt user for any missing input
    const userInput = await promptUser({ iconPath, maskPath, outputDir });
    iconPath = userInput.iconPath;
    background = userInput.background;
    platform = userInput.platform;
    maskPath = userInput.maskPath;
    outputDir = userInput.outputDir;

    // Verify that the icon file exists
    if (!fs.existsSync(iconPath)) {
      const found = findIconPath(); // Try to find icon automatically
      if (!found) {
        console.error(
          chalk.red(`❌ Could not find app_icon.png in your project.`)
        );
        process.exit(1);
      }
      console.log(
        chalk.yellow(`🔍 Using automatically detected icon: ${found}`)
      );
      iconPath = found;
    }

    // Ensure icon image is valid (square & >=1024px)
    const isValid = await validateImage(iconPath);
    if (!isValid) {
      console.error(
        chalk.red("❌ Image must be square and at least 1024x1024 pixels.")
      );
      process.exit(1);
    }

    // If a mask is provided, validate and process it
    let hasValidMask = false;
    let maskBuffer = null;

    if (maskPath) {
      try {
        const meta = await sharp(maskPath).metadata();
        if ((meta.format === "png" && meta.hasAlpha) || meta.format === "svg") {
          hasValidMask = true;
          console.log(chalk.green(`✅ Using mask: ${maskPath}`));
          maskBuffer = await sharp(maskPath).resize(432, 432).png().toBuffer();
        } else {
          console.warn(
            chalk.yellow(
              "⚠️ Invalid mask format. Must be PNG with alpha or SVG."
            )
          );
        }
      } catch {
        console.warn(chalk.yellow("⚠️ Failed to load mask. Ignoring."));
      }
    }

    // Check for valid iOS folder if needed
    const iosFolder = findIosFolderName();
    if ((platform === "ios" || platform === "all") && !iosFolder) {
      console.error(chalk.red("❌ Could not find your iOS project folder."));
      process.exit(1);
    }

    // Print input summary
    console.log(chalk.green(`✅ Icon found: ${iconPath}`));
    if (iosFolder) console.log(chalk.green(`✅ iOS project: ios/${iosFolder}`));
    console.log(chalk.green(`✅ Background color: ${background}`));
    console.log(chalk.green(`✅ Platform: ${platform}`));

    // Generate Android icons
    if (platform === "android" || platform === "all") {
      await generateAndroid(
        iconPath,
        background,
        hasValidMask,
        maskBuffer,
        outputDir
      );
    }

    // Generate iOS icons
    if ((platform === "ios" || platform === "all") && iosFolder) {
      await generateIos(iconPath, iosFolder, background, outputDir);
    }

    console.log(
      chalk.green("\n🎉 All icons have been generated successfully!\n")
    );

    printFooter(); // Print CLI tool footer
  } catch (err) {
    console.error(chalk.red("❌ Unexpected error:"), err.message);
    process.exit(1);
  }
})();
