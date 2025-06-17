import fs from "fs";

/**
 * Checks if the current directory is a React Native project
 * by verifying the presence of either 'android' or 'ios' folders.
 */
export function isReactNativeProject() {
  return fs.existsSync("android") || fs.existsSync("ios");
}

/**
 * Checks if the current directory contains an Android project
 * by verifying the presence of the 'android' folder.
 */
export function isAndroidProject() {
  return fs.existsSync("android");
}

/**
 * Checks if the current directory contains an iOS project
 * by verifying the presence of the 'ios' folder.
 */
export function isIOSProject() {
  return fs.existsSync("ios");
}
