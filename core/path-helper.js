import fs from "fs-extra";
import path from "path";

/**
 * Recursively searches for the specified icon file (default: app_icon.png)
 * starting from the given directory. Returns the absolute path if found.
 */
export function findIconPath(
  startDir = process.cwd(),
  filename = "app_icon.png"
) {
  let result = null;

  function walk(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);

      // Recurse into subdirectories
      if (stat.isDirectory()) {
        walk(fullPath);
        if (result) return; // Stop recursion once found
      }
      // Match filename (case-insensitive)
      else if (file.toLowerCase() === filename.toLowerCase()) {
        result = fullPath;
        return;
      }
    }
  }

  walk(startDir);
  return result;
}

/**
 * Finds the name of the iOS project folder by locating a `.xcodeproj` file
 * inside the `ios/` directory. Returns the project name without extension.
 */
export function findIosFolderName() {
  const iosDir = path.resolve("ios");
  const dirs = fs.existsSync(iosDir) ? fs.readdirSync(iosDir) : [];
  const proj = dirs.find((d) => d.endsWith(".xcodeproj"));
  return proj ? proj.replace(".xcodeproj", "") : null;
}
