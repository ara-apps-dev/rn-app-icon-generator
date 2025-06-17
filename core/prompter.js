import inquirer from "inquirer";
import path from "path";

/**
 * Prompt the user for required inputs if not provided via arguments.
 * Handles icon path, background color, target platform, mask usage (for Android),
 * and custom output directory.
 */
export async function promptUser({ iconPath, maskPath, outputDir }) {
  const defaultIconFileName = "app_icon.png";
  const defaultBackground = "#ffffff";

  const questions = [];

  // Ask for icon path if not provided
  if (!iconPath) {
    questions.push({
      type: "input",
      name: "iconPath",
      message: "Enter path to PNG icon (default: app_icon.png):",
      default: defaultIconFileName,
    });
  }

  // Ask for background color
  questions.push({
    type: "input",
    name: "background",
    message: "Background color (default: #FFFFFF):",
    default: defaultBackground,
  });

  // Ask which platform to generate icons for
  questions.push({
    type: "list",
    name: "platform",
    message: "Platform to generate:",
    choices: ["android", "ios", "all"],
    default: "all",
  });

  // Prompt for the above base questions
  const answersPlatform = await inquirer.prompt(questions);
  let finalAnswers = { ...answersPlatform };

  // Ask for mask path only if platform is Android or All and maskPath not provided
  if (
    !maskPath &&
    (answersPlatform.platform === "android" ||
      answersPlatform.platform === "all")
  ) {
    const maskAnswers = await inquirer.prompt([
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
        when: (a) => a.useMask,
        validate: (input) =>
          input && input.trim()
            ? true
            : "⚠️  Mask path is required if you choose to use mask.",
      },
    ]);

    // Warn if useMask selected but no maskPath provided
    if (maskAnswers.useMask && !maskAnswers.maskPath?.trim()) {
      console.warn("⚠️  Skipping mask because mask path is empty.");
    }

    finalAnswers = { ...finalAnswers, ...maskAnswers };
  } else {
    console.log("ℹ️  Skipping mask prompt (not needed for iOS-only).");
  }

  // Ask for output directory if not provided
  if (!outputDir) {
    const outputAnswers = await inquirer.prompt([
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
        when: (a) => a.useOutput,
        validate: (input) =>
          input && input.trim()
            ? true
            : "⚠️  Output path is required if you choose to use a custom directory.",
      },
    ]);

    // Warn if output selected but no path entered
    if (outputAnswers.useOutput && !outputAnswers.outputPath?.trim()) {
      console.warn("⚠️  Skipping custom output because path is empty.");
    }

    finalAnswers = { ...finalAnswers, ...outputAnswers };
  }

  // Return resolved and validated paths and values
  return {
    iconPath: finalAnswers.iconPath
      ? path.resolve(finalAnswers.iconPath.trim())
      : iconPath,
    background: finalAnswers.background,
    platform: finalAnswers.platform,
    maskPath: finalAnswers.maskPath
      ? path.resolve(finalAnswers.maskPath.trim())
      : undefined,
    outputDir: finalAnswers.outputPath
      ? path.resolve(finalAnswers.outputPath.trim())
      : outputDir,
  };
}
