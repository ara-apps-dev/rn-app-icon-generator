// Standard Android legacy icon sizes for different screen densities (in pixels)
export const androidSizes = {
  "mipmap-mdpi": 48,
  "mipmap-hdpi": 72,
  "mipmap-xhdpi": 96,
  "mipmap-xxhdpi": 144,
  "mipmap-xxxhdpi": 192,
};

// Android adaptive icon sizes (foreground/mask) for different densities
export const adaptiveIconSizes = {
  "mipmap-mdpi": 108,
  "mipmap-hdpi": 162,
  "mipmap-xhdpi": 216,
  "mipmap-xxhdpi": 324,
  "mipmap-xxxhdpi": 432,
};

// iOS icon sizes based on Apple's Human Interface Guidelines
// Each object defines the base point size and its scale (e.g., 2x, 3x)
export const iosSizes = [
  { size: 20, scale: 1 }, // Notification icon
  { size: 20, scale: 2 },
  { size: 20, scale: 3 },
  { size: 29, scale: 1 }, // Settings icon
  { size: 29, scale: 2 },
  { size: 29, scale: 3 },
  { size: 40, scale: 1 }, // Spotlight icon
  { size: 40, scale: 2 },
  { size: 40, scale: 3 },
  { size: 60, scale: 2 }, // App icon (iPhone)
  { size: 60, scale: 3 },
  { size: 76, scale: 1 }, // iPad app icon
  { size: 76, scale: 2 },
  { size: 83.5, scale: 2 }, // iPad Pro app icon
  { size: 1024, scale: 1 }, // App Store icon
];
