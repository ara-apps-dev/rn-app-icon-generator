# 🚀 rn-app-icon-generator

A lightweight and hassle-free CLI tool to **generate iOS and Android app icons** in your React Native project from a **single 1024x1024 PNG image** — no config, no headache!

---

## ✨ Features

✅ One command to generate both iOS and Android icons  
✅ No manual image resizing needed  
✅ Automatically finds your `app_icon.png` (or specify manually)  
✅ Instantly replaces launcher icons  
✅ Works with any React Native project

---

## 🔧 How to Use

### 1️⃣ Option 1: Let It Find `app_icon.png` Automatically

Place a high-resolution `1024x1024` PNG named **`app_icon.png`** anywhere in your project.

📁 Example:

```
your-project/
├── src/
│   └── assets/
│       └── app_icon.png
```

Then run:

```bash
npx rn-app-icon-generator
```

---

### 2️⃣ Option 2: Provide Icon Path Manually

You can also directly provide a PNG file path (useful if the filename is not `app_icon.png`):

```bash
npx rn-app-icon-generator ./assets/logo.png
```

💡 The tool will:

- Use your provided image path (or auto-discover `app_icon.png`)
- Generate all required Android and iOS icons
- Replace icons in:
  - `android/app/src/main/res`
  - `ios/YourApp/Images.xcassets/AppIcon.appiconset`

---

## 📦 Optional: Local Installation

If you prefer to install locally as a dev tool:

```bash
npm install rn-app-icon-generator --save-dev
```

Then run:

```bash
npx rn-app-icon-generator
```

Or:

```bash
npx rn-app-icon-generator ./assets/logo.png
```

---

## 🧠 Pro Tips

- ✅ Use a non-transparent background (white/brand color) for best results.
- 🧪 Supports both flat and folder-based project structures.
- 📱 iOS project must have a `.xcodeproj` in the `ios/` folder.

---

## 📄 License

Licensed under the **MIT License**.  
Crafted with 💙 for React Native developers.

---

> Created by [Ara Apps Dev](https://github.com/ara-apps-dev) • PRs & stars welcome!
