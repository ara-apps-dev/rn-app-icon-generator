![Circle Mask Example](https://raw.githubusercontent.com/ara-apps-dev/rn-app-icon-generator/main/assets/banner.png)

<p>
  <!-- left -->
   <!-- Project-specific badges -->
  <a href="https://www.npmjs.com/package/rn-app-icon-generator">
    <img src="https://img.shields.io/npm/v/rn-app-icon-generator.svg?style=flat&color=cb3837&logo=npm" alt="npm version">
  </a>
  <a href="https://github.com/ara-apps-dev/rn-app-icon-generator">
    <img src="https://img.shields.io/github/stars/ara-apps-dev/rn-app-icon-generator?style=flat&logo=github" alt="GitHub stars">
  </a>

  <!-- right -->
  <span>    
    <a  href="https://github.com/ara-apps-dev/rn-app-icon-generator/issues">
      <img src="https://img.shields.io/github/issues/ara-apps-dev/rn-app-icon-generator?style=flat" alt="GitHub issues" align="right">
    </a>
  </span>
</p>

# 🚀 React Native App Icon Generator

A lightweight and hassle-free CLI tool to **generate iOS and Android app icons** in your React Native project from a **single 1024x1024 PNG image** — no config, no headache!

---

## ✨ Features

✅ One command to generate all required icons  
✅ No manual image resizing needed  
✅ Automatically finds your `app_icon.png`  
✅ Replaces icons in the correct native folders  
✅ CLI options for background, platform, output dir  
✅ Supports adaptive Android icons  
✅ Works with any React Native structure  
✅ Interactive mode if no arguments are provided

---

## 🔧 How to Use

### 1️⃣ Option 1: Let It Find `app_icon.png` Automatically

Place a high-resolution **`1024x1024`** PNG named **`app_icon.png`** anywhere in your project.

📁 Example:

```
your-project/
├── src/
│ └── assets/
│ └── app_icon.png
```

Then run:

```bash
npx rn-app-icon-generator
```

---

### 2️⃣ Option 2: Provide Icon Path Manually

You can specify your own icon path:

```bash
npx rn-app-icon-generator ./assets/logo.png
```

---

### 3️⃣ Use Additional CLI Options

```bash
npx rn-app-icon-generator ./assets/your_icon_name.png \
  --background "#ffffff" \
  --platform all \
  --output ./custom-icons \
  --mask ./assets/masks/circle-mask.png
```

---

## ⚙️ CLI Options

| Option         | Description                                                        |
| -------------- | ------------------------------------------------------------------ |
| `--background` | Background color (hex format). Default: `#ffffff`                  |
| `--platform`   | Platform to generate: `android`, `ios`, or `all`. Default: `all`   |
| `--output`     | Optional output directory (useful for preview/testing)             |
| `--mask`       | Optional mask file (PNG/SVG) for Android adaptive icons foreground |

> 💡 If no arguments are provided, the tool enters interactive mode.

---

## 🧱 Mask Support (for Adaptive Android Icons)

The `--mask` option allows shaping the foreground icon for Android adaptive icons.

✅ Supported Mask Formats:

- `.png` — black & transparent areas (alpha mask)
- `.svg` — vector path (e.g., circle, rounded square)

## 🖼️ How It Works:

- The mask is applied to the foreground icon (`ic_launcher_foreground.png`)
- Using alpha masking or SVG shape with `sharp.composite(..., blend: "dest-in")`
- This creates a custom-shaped icon for modern Android launchers

## 📐 Example Usage:

```
npx rn-app-icon-generator ./assets/logo.png \
  --mask ./assets/masks/circle-mask.svg
```

## 🎨 PNG Mask Example

A 1024x1024 PNG with:

- **White or opaque** = visible area
- **Black or transparent** = cropped area

## 📁 Example:

```
./assets/masks/circle-mask.png
```

##🧭 SVG Mask Example
Example `circle-mask.svg`:

[Download SVG](https://raw.githubusercontent.com/ara-apps-dev/rn-app-icon-generator/main/assets/circle.svg)

<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
<rect width="100%" height="100%" fill="#dfdfdf"/>
<circle cx="50" cy="50" r="40" fill="white"/>
</svg>

You can also use:

- Rounded rectangles
- Star shapes
- Any SVG path

---

## 📂 Output Paths

| Platform             | Path Example                                                                    |
| -------------------- | ------------------------------------------------------------------------------- |
| **Android**          | `android/app/src/main/res/mipmap-*/ic_launcher.png` and `ic_launcher_round.png` |
| **Android Adaptive** | `mipmap-*/ic_launcher_foreground.png`, plus `ic_launcher.xml` & `colors.xml`    |
| **iOS**              | `ios/YourApp/Images.xcassets/AppIcon.appiconset/` with `Contents.json`          |

---

## 📦 Optional: Local Installation

Install as a dev dependency:

```bash
npm install rn-app-icon-generator --save-dev
```

Run with:

```bash
npx rn-app-icon-generator
```

---

## 🧠 Pro Tips

- ✅ PNG **must be 1024x1024** for best results (no SVG support).
- 🧼 Use solid backgrounds unless transparency is intentional.
- 📱 Make sure iOS folder has a valid \`.xcodeproj\` file.
- 🧪 Works on both macOS, Linux, and Windows.

---

## 💻 Example Script (CI/CD)

```bash
npx rn-app-icon-generator ./branding/icon.png --background "#000000" --platform all
```

Add to your `package.json` scripts:

```json
"scripts": {
"generate:icons": "rn-app-icon-generator ./assets/icon.png --background '#fff'"
}
```

---

## 📄 License

Licensed under the **MIT License**.

---

> Created by [Ara Apps Dev](https://github.com/ara-apps-dev)
