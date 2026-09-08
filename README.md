# Qurb | قُرب

<p align="center">
  <strong>قُرب</strong> is a modern Arabic Islamic web application that brings Quran reading, prayer times, azkar, hadith collections, and personal favorites into one calm, responsive, RTL-first experience.
</p>

<p align="center">
  <img alt="Angular" src="https://img.shields.io/badge/Angular-22-DD0031?style=for-the-badge&logo=angular&logoColor=white" />
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-6-3178C6?style=for-the-badge&logo=typescript&logoColor=white" />
  <img alt="SCSS" src="https://img.shields.io/badge/SCSS-Styling-C6538C?style=for-the-badge&logo=sass&logoColor=white" />
  <img alt="RTL" src="https://img.shields.io/badge/RTL-Arabic%20First-0F3D2E?style=for-the-badge" />
</p>

---

## Overview

**Qurb | قُرب** is a single-page Islamic application built with **Angular**, designed especially for Arabic users.

The project focuses on a peaceful reading experience, fast navigation, clear Islamic content organization, and useful daily features such as prayer times, azkar counters, favorites, and daily Islamic content.

The application was rebuilt with a clean architecture, standalone Angular components, lazy-loaded feature pages, Angular Signals, local caching, and a consistent modern UI identity.

---

## Live Demo

Add the deployed project link here after publishing on Vercel.

```text
https://your-project-url.vercel.app
```

---

## Key Features

### Quran

- Browse all Quran surahs.
- Search by Arabic surah name, English name, translation, or surah number.
- Filter surahs by revelation type: Meccan or Medinan.
- Read surah details in a clean Quran-focused layout.
- Save surahs and individual ayahs to favorites.
- Store last-read surah locally.
- Remember reading font-size preference.

### Prayer Times

- View daily prayer times.
- Choose from supported cities.
- Use current location when permission is granted.
- Highlight the upcoming prayer.
- Save the selected location locally.
- Cache prayer-time responses to improve fallback behavior.

### Azkar

- Browse azkar categories.
- Search inside azkar content.
- Copy azkar text.
- Save azkar to favorites.
- Use a daily repeat counter.
- Store counter progress locally per day.
- Cache azkar API data for fallback use.

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
- Remove individual items.
- Clear all favorites.
- Store favorites using browser local storage.

### User Experience

- Fully RTL Arabic interface.
- Responsive layout for desktop, tablet, and mobile.
- Clean Islamic visual identity using dark green and gold.
- Modern reusable components.
- Loading skeletons.
- Empty and error states.
- Toast notifications for user feedback.
- Scroll-to-top interaction.
- SEO-ready titles and meta descriptions.

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
| HTTP             | Angular HttpClient    |
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

The app also uses local caching to keep previously loaded content available when a network request fails.

---

## Local Storage Usage

Qurb uses browser local storage to improve the user experience.

Stored data includes:

- Favorite items.
- Last-read surah.
- Reading font-size preference.
- Selected prayer location.
- Current-location coordinates, when allowed by the user.
- Daily azkar counters.
- Cached Quran, Azkar, Hadith, and Prayer Times responses.

No backend or user account is required for these local features.

---

## Getting Started

### Prerequisites

Make sure you have Node.js and npm installed.

This project was built with:

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

Then open:

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

| Command                | Description                             |
| ---------------------- | --------------------------------------- |
| `npm start`            | Run the development server              |
| `npm run build`        | Build the app for production            |
| `npm run build:prod`   | Build using production configuration    |
| `npm run watch`        | Build in watch mode for development     |
| `npm run format`       | Format source files using Prettier      |
| `npm run format:check` | Check formatting without changing files |

---

## Design System

Qurb uses a calm Islamic visual identity based on:

- Deep green primary color.
- Gold accent color.
- Soft warm background.
- Large Arabic headings.
- Clear Quran-style reading text.
- Rounded cards and buttons.
- Minimal decorative elements.
- RTL-first spacing and alignment.

Main fonts:

- Cairo for UI.
- Amiri Quran for Quranic and Islamic text display.

---

## Performance Notes

The application uses:

- Lazy-loaded routes for feature pages.
- Shared reusable components.
- Local caching for repeated API calls.
- `shareReplay` for selected API request reuse.
- Production output hashing.
- Angular build budgets configured for production.

---

## Accessibility Notes

The interface includes:

- Arabic `lang` and RTL direction.
- Accessible button labels.
- Keyboard-friendly controls.
- Clear visual focus styles.
- Responsive layout for small screens.
- Reduced-motion handling for users who prefer less animation.

---

## Suggested Screenshots

Add screenshots later after deployment:

```text
docs/screenshots/home.png
docs/screenshots/quran.png
docs/screenshots/surah-details.png
docs/screenshots/prayer-times.png
docs/screenshots/azkar.png
docs/screenshots/hadith.png
docs/screenshots/favorites.png
```

Example:

```md
![Qurb Home](docs/screenshots/home.png)
```

---

## Roadmap

Possible future improvements:

- Add audio recitations.
- Add prayer notification reminders.
- Add tafsir support.
- Add multiple Quran editions.
- Add dark mode.
- Add offline-first support using service workers.
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

No license has been specified yet.
