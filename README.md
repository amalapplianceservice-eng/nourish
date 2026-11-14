# Nourish — calorie tracker (MVP)

This repo holds two versions of the app:

- **`web/`: the free web app (PWA).** Open it in Safari on your iPhone, tap Share → **Add to Home Screen**, and it runs full-screen like a normal app. It needs no Apple developer account and no App Store. The details are below.
- **`Nourish/` + `Nourish.xcodeproj`: the native SwiftUI app.** Use it later if you decide to publish on the App Store.

## Web app (free)

**What it does:** the same features as the native app. That means the diary with calorie ring and macros, about 180 built-in foods, and a search of **400k+ branded products from USDA FoodData Central**. It also has AI meal estimates from a description or photo, custom foods and saved meals, progress charts, the goal calculator, and light and dark mode. It keeps working offline once installed.

**Where your data lives:** in the browser on your phone (localStorage). Nothing is sent to any server except when you search USDA or ask the AI. Use **Settings → Export backup** now and then.

**Running it locally**
```bash
cd web && python3 -m http.server 8765
```
Then open http://localhost:8765.

**Hosting it for free:** `.github/workflows/pages.yml` publishes `web/` to GitHub Pages on every push to `main`. The repo must be public to use the free GitHub plan. Your API keys are never part of the code; they only live on your device.

**AI key:** paste an Anthropic API key in Settings. Each estimate costs about a cent, charged to your Anthropic account. The key is stored only in your phone's browser storage.

**USDA key (optional):** branded search works out of the box with a shared demo key, which is rate-limited. Get a free personal key at https://fdc.nal.usda.gov/api-key-signup and paste it in Settings.

---

## Native iOS app

A native SwiftUI iPhone app for logging food quickly:

- **Diary**: daily calorie ring, protein/carbs/fat bars, and Breakfast/Lunch/Dinner/Snacks sections. Swipe left to delete an entry, swipe right to log it again, and tap an entry to edit it. A week strip lets you move between days.
- **Search**: about 170 common foods work offline and load instantly. **Open Food Facts** adds 3M+ branded and packaged products (free, no key needed). Search also shows your Recent foods and My Foods, and the ⊕ button adds a food in one tap.
- **AI Meal**: describe a meal in your own words ("2 eggs, toast with butter, oat latte") or add a photo. Claude splits it into separate foods with portion, calories and macros for each, scaled to the size you describe. You can untick items before logging, and save the whole meal to My Foods so you can log it again in one tap.
- **Create**: add your own foods and recipes. If you leave calories blank, the app works them out from the macros.
- **Progress**: 7-day and 30-day calorie chart against your goal, daily average, logging streak, days on target, macro split and most-logged foods.
- **Onboarding and goals**: a Mifflin–St Jeor calculator suggests calorie and macro targets. Metric and imperial units are both supported, and you can edit the targets anytime.
- Supports light and dark mode, the rounded system font, haptics and SF Symbols. The data is stored on the phone with SwiftData.

Requires iOS 17+ and Xcode 16+.

## 1. Run it on the Simulator

1. Install **Xcode** from the Mac App Store. It's free and about 15 GB.
2. Open Xcode once so it can install its components, then run:
   ```bash
   sudo xcode-select -s /Applications/Xcode.app
   ```
3. Open `Nourish.xcodeproj`, choose an iPhone simulator from the toolbar, and press **⌘R**.

## 2. Install it on your iPhone

1. Plug in your iPhone, or pair it over Wi‑Fi in Xcode → Window → Devices.
2. In Xcode, select the **Nourish** target → **Signing & Capabilities**:
   - **Team**: sign in with your Apple ID. A free account works for personal installs.
   - **Bundle Identifier**: change `com.yourname.nourish` to something unique.
3. Pick your iPhone as the run destination and press **⌘R**.
4. On the phone, go to Settings → General → VPN & Device Management and trust your developer certificate.
   - With a free account the app expires after 7 days. A paid account ($99/yr) removes that limit.

## 3. Turn on AI meal estimates

Create an API key at <https://console.anthropic.com/settings/keys> and paste it into **Settings → AI meal estimates** in the app, or into the AI Meal tab. The key is stored in the iOS Keychain. Each estimate uses `claude-opus-5-5` at low effort and costs roughly a cent.

## 4. Publish on the App Store

1. Join the Apple Developer Program at <https://developer.apple.com/programs/> ($99/year).
2. In **App Store Connect**, create a new app with the same bundle ID.
3. **Before a public launch, move the API key to a server.** The bring-your-own-key setup is fine for personal use, but App Store users won't have Anthropic keys, and a key built into the app can be extracted. Add a small backend (for example a Cloudflare Worker or Vercel function) that holds the key and forwards requests to Anthropic, then point `MealEstimator` at it.
4. Xcode → Product → **Archive** → Distribute App → App Store Connect. Use **TestFlight** to test on your own phone first.
5. Provide screenshots, a privacy policy URL, and privacy "nutrition labels". Meal text and photos are sent to Anthropic when the user taps Estimate. The health and fitness category is already set.

## Project layout

```
Nourish/
  App/NourishApp.swift          app entry, onboarding gate, tabs
  Models/FoodModels.swift       FoodEntry + CustomFood (SwiftData), FoodItem, MealType
  Models/Goals.swift            goal calculator
  Data/FoodDatabase.swift       built-in offline foods + local search
  Services/OpenFoodFactsService.swift
  Services/MealEstimator.swift  Claude API call (structured JSON output)
  Services/KeychainStore.swift
  Components/                   theme, rings, macro bars, image/camera helpers
  Views/                        Today, AddFood (Search/AI/Create), FoodDetail, Progress, Settings, GoalSetup
```

## Next steps

- Barcode scanner (VisionKit `DataScannerViewController` + the Open Food Facts product API)
- Apple Health sync (write dietary energy, read active calories)
- iCloud sync (the SwiftData models already have CloudKit-friendly defaults)
- Weight log with a trend chart, water tracking, and reminder notifications
- Home Screen widget showing calories left
