# Qurb | قُرب

<p align="center">
  <strong>Qurb</strong> is a modern Arabic Islamic web application that brings Quran reading, prayer times, azkar, hadith collections, and personal favorites into one calm, responsive, RTL-first experience.
</p>

<p align="center">
  <a href="https://qurb-islamic.vercel.app" target="_blank">
    <img alt="Live Demo" src="https://img.shields.io/badge/Live-Demo-0F3D2E?style=for-the-badge&logo=vercel&logoColor=white" />
  </a>
  <img alt="Angular" src="https://img.shields.io/badge/Angular-22-DD0031?style=for-the-badge&logo=angular&logoColor=white" />
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-6-3178C6?style=for-the-badge&logo=typescript&logoColor=white" />
  <img alt="SCSS" src="https://img.shields.io/badge/SCSS-Styling-C6538C?style=for-the-badge&logo=sass&logoColor=white" />
  <img alt="RTL" src="https://img.shields.io/badge/RTL-Arabic%20First-0F3D2E?style=for-the-badge" />
</p>

---

## Live Demo

https://qurb-islamic.vercel.app

---

## Overview

**Qurb | قُرب** is a single-page Islamic web application built with **Angular** for Arabic users.

The application provides a calm and organized experience for reading the Quran, checking prayer times, browsing daily azkar, exploring selected hadith collections, and saving important content to personal favorites.

The project was rebuilt from scratch with a modern front-end structure, standalone Angular components, lazy-loaded routes, Angular Signals, local caching, responsive layouts, and a consistent Arabic RTL user interface.

---

## Key Features

### Quran

- Browse all Quran surahs.
- Search by Arabic surah name, English name, translation, or surah number.
- Filter surahs by revelation type: Meccan or Medinan.
- Read surah details in a clean Quran-focused layout.
- Save surahs and individual ayahs to favorites.
- Store the last-read surah locally.
- Remember the reading font-size preference.

### Prayer Times

- View daily prayer times.
- Choose from supported cities.
- Use current location when permission is granted.
- Highlight the upcoming prayer.
- Save the selected location locally.
- Cache prayer-time responses for fallback use.

### Azkar

- Browse azkar categories.
- Search inside azkar content.
- Copy azkar text.
- Save azkar to favorites.
- Use a daily repeat counter.
- Store daily counter progress locally.
- Cache azkar API responses for fallback use.

### Hadith

- Browse selected Arabic hadith books.
- Search by hadith text, hadith number, reference, or grade.
- View hadith metadata such as book section and grade when available.
- Copy hadith text.
- Save hadiths to favorites.
- Cache hadith book data locally.

### Favorites

- Save Quran surahs, ayahs, azkar, and hadiths.
- Filter favorites by content type.
- Search inside saved items.
- Copy saved text.
- Remove individual saved items.
- Clear all favorites.
- Store favorites using browser local storage.

### User Experience

- Fully RTL Arabic interface.
- Responsive design for desktop, tablet, and mobile.
- Calm Islamic visual identity using deep green and gold.
- Reusable UI components.
- Loading skeletons.
- Empty and error states.
- Toast notifications for user feedback.
- Scroll-to-top interaction.
- SEO-ready page titles and meta descriptions.

---

## Tech Stack

| Category         | Technology            |
| ---------------- | --------------------- |
| Framework        | Angular 22            |
| Language         | TypeScript            |
| Styling          | SCSS                  |
| UI Architecture  | Standalone Components |
| State Management | Angular Signals       |
| Routing          | Angular Router        |
| HTTP Client      | Angular HttpClient    |
| Async Handling   | RxJS                  |
| Icons            | Lucide Angular        |
| Notifications    | ngxpert Hot Toast     |
| Deployment       | Vercel                |
| Storage          | Browser Local Storage |

---

## Project Structure

```text
src/
  app/
    core/
      footer/
      header/
      layout/
      models/
      services/
    features/
      home/
      quran/
      prayer-times/
      azkar/
      hadith/
      favorites/
    shared/
      components/
        favorite-button/
        page-state/
        scroll-to-top/
        skeleton-card/
```

---

## External Data Sources

| Feature      | Source                          |
| ------------ | ------------------------------- |
| Quran        | Al Quran Cloud API              |
| Prayer Times | AlAdhan API                     |
| Azkar        | Islamic App API                 |
| Hadith       | Hadith API dataset via jsDelivr |

The application uses local caching to keep previously loaded content available when a network request fails.

---

## Local Storage Usage

Qurb uses browser local storage to improve the user experience without requiring authentication or a backend.

Stored data includes:

- Favorite items.
- Last-read surah.
- Reading font-size preference.
- Selected prayer location.
- Current-location coordinates when allowed by the user.
- Daily azkar counters.
- Cached Quran, Azkar, Hadith, and Prayer Times responses.

---

## Getting Started

### Prerequisites

Make sure Node.js and npm are installed on your machine.

The project was built using:

```text
Angular CLI 22
Angular 22
TypeScript 6
npm 11
```

### Installation

```bash
npm install
```

### Development Server

```bash
npm start
```

Open the app in the browser:

```text
http://localhost:4200
```

### Production Build

```bash
npm run build
```

The production output is generated in:

```text
dist/qurb/browser
```

---

## Vercel Deployment

Recommended Vercel settings:

```text
Framework Preset: Angular
Build Command: npm run build
Output Directory: dist/qurb/browser
Install Command: npm install
```

The project includes a `vercel.json` file to support Angular client-side routing.

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

---

## Available Scripts

| Command                | Description                              |
| ---------------------- | ---------------------------------------- |
| `npm start`            | Run the development server               |
| `npm run build`        | Build the application for production     |
| `npm run build:prod`   | Build using the production configuration |
| `npm run watch`        | Build in watch mode for development      |
| `npm run format`       | Format source files using Prettier       |
| `npm run format:check` | Check formatting without changing files  |

---

## Design System

Qurb uses a calm Islamic visual identity based on:

- Deep green as the primary color.
- Gold as the accent color.
- Soft warm page backgrounds.
- Large Arabic headings.
- Clear Quran-style reading text.
- Rounded cards and buttons.
- Minimal decorative elements.
- RTL-first spacing and alignment.

Main fonts:

- Cairo for the user interface.
- Amiri Quran for Quranic and Islamic text display.

---

## Performance Notes

The application uses:

- Lazy-loaded feature routes.
- Reusable shared components.
- Local caching for repeated API calls.
- `shareReplay` for selected API request reuse.
- Production output hashing.
- Production build budgets.

---

## Accessibility Notes

The interface includes:

- Arabic `lang` and RTL document direction.
- Accessible button labels.
- Keyboard-friendly controls.
- Clear visual focus styles.
- Responsive layouts for small screens.
- Reduced-motion handling for users who prefer less animation.

---

## Roadmap

Possible future improvements:

- Add audio recitations.
- Add tafsir support.
- Add multiple Quran editions.
- Add prayer notification reminders.
- Add dark mode.
- Add offline-first support.
- Add PWA installation support.
- Add user accounts and cloud sync.
- Add advanced hadith filtering.
- Add daily Islamic reminders.

---

## Author

Built with care by **Mahmoud Mohamed**.

- GitHub: https://github.com/MahmoudMo99
- Portfolio: https://mahmoud-mohamed-portfolio.vercel.app/
- LinkedIn: https://www.linkedin.com/in/mahmoud-mo-mahmoud/

---

## License

This repository currently does not include an open-source license.

All rights reserved © 2026 Mahmoud Mohamed.
