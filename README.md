# Qurb | قُرب

<p align="center">
  <strong>Qurb</strong> is a modern Arabic Islamic Progressive Web App that brings Quran reading, prayer times, azkar, hadith, daily wird tracking, and personal favorites into one calm, responsive, RTL-first experience.
</p>

<p align="center">
  <a href="https://qurb-islamic.vercel.app/home">Live Demo</a>
  ·
  <a href="https://github.com/MahmoudMo99/qurb">GitHub Repository</a>
</p>

---

## Overview

**Qurb | قُرب** is an Arabic-first Islamic web application built with **Angular 22**, designed to provide a focused and accessible experience for everyday Islamic activities.

The application combines Quran reading, prayer times, azkar, selected hadith collections, daily wird tracking, and personal favorites within a consistent, responsive interface.

Built using standalone Angular components, lazy-loaded routes, Angular Signals, RxJS, and reusable UI components, Qurb follows a modern frontend architecture with browser-based persistence.

As an installable **Progressive Web App (PWA)**, Qurb also supports offline Quran reading through locally bundled Quranic data and Angular Service Worker caching.

**Live Website:** https://qurb-islamic.vercel.app/home

---

## Key Features

### Quran

- Browse and search all Quran surahs by name, translation, or number.
- Filter surahs by revelation type (Meccan or Medinan).
- Read Quranic text based on the **Madinah Mushaf (مصحف المدينة النبوية), Hafs narration from Asim (رواية حفص عن عاصم)**.
- Display verses using **KFGQPC Hafs** typography.
- Switch between full-surah and Mushaf page reading.
- Navigate Mushaf pages with dedicated page controls.
- Enable distraction-free focus reading mode.
- Save surahs and individual ayahs to favorites.
- Remember the last-read surah and reading preferences.
- Read the Quran offline after the required resources have been cached.

### Prayer Times

- View daily prayer times for supported cities.
- Use device location with user permission.
- Highlight the upcoming prayer.
- Save selected locations and cache previously loaded responses.

### Azkar

- Browse and search azkar categories and content.
- Copy and save azkar to favorites.
- Track daily repetitions with locally stored counters.
- Use cached responses when available.
- Display meaningful loading and error states.

### Hadith

- Browse selected Arabic hadith collections.
- Search by text, number, reference, or grade.
- View available hadith metadata.
- Copy and save hadiths to favorites.
- Cache previously loaded content.

### Daily Wird

- Track daily Islamic habits and remembrance.
- Use counters and completion-based activities.
- Monitor daily progress and completion targets.
- Save progress locally without authentication.
- Reset daily progress when needed.

### Favorites

- Save surahs, ayahs, azkar, and hadiths.
- Search and filter saved content.
- Copy or remove individual items.
- Manage favorites using browser local storage.

---

## Progressive Web App (PWA)

Qurb can be installed on supported devices and launched in a standalone, app-like window.

### Installation Experience

- Web App Manifest with dedicated app icons and theme.
- Custom installation banner.
- Native installation prompt on supported browsers.
- Platform-specific installation instructions.
- Automatic installation banner hiding in standalone mode.

### Offline Support

Qurb uses **Angular Service Worker** to cache application resources and locally bundled Quran data.

- Offline access to Quran surahs and verses.
- Cached application shell for offline navigation.
- Persistent reading preferences and favorites.
- Cached API responses for selected features when available.

**Note:** Full offline support currently focuses on Quran reading. Features that rely on external APIs may still require an internet connection.

---

## Quran Text & Mushaf

Qurb uses locally bundled Quranic text based on the **Madinah Mushaf**, following the **Hafs narration from Asim**.

The reading interface uses **KFGQPC Hafs** typography and supports both full-surah and Mushaf page-based reading.

Local Quran JSON resources eliminate the need for individual external API requests when opening surahs and enable offline reading through PWA caching.

This implementation does not imply official certification or endorsement by the King Fahd Glorious Quran Printing Complex.

---

## Tech Stack

| Category         | Technology                               |
| ---------------- | ---------------------------------------- |
| Framework        | Angular 22                               |
| Language         | TypeScript                               |
| Styling          | SCSS                                     |
| Architecture     | Standalone Components                    |
| State Management | Angular Signals                          |
| Routing          | Angular Router                           |
| Async & HTTP     | RxJS, Angular HttpClient                 |
| Icons            | Lucide Angular                           |
| Notifications    | ngxpert Hot Toast                        |
| PWA              | Angular Service Worker, Web App Manifest |
| Storage          | Browser Local Storage                    |
| Deployment       | Vercel                                   |

---

## Project Structure

```text
public/
  data/
    quran/
  icons/
  manifest.webmanifest

src/
  app/
    core/
      announcement-bar/
      header/
      footer/
      layout/
      services/
      models/
    features/
      home/
      quran/
      prayer-times/
      azkar/
      hadith/
      daily-wird/
      favorites/
    shared/
      components/
        install-dialog/
        favorite-button/
        page-state/
        scroll-to-top/
        skeleton-card/

ngsw-config.json
```

---

## Data Sources

| Feature      | Source                                        |
| ------------ | --------------------------------------------- |
| Quran        | Local Madinah Mushaf dataset (Hafs narration) |
| Prayer Times | AlAdhan API                                   |
| Azkar        | Islamic App API                               |
| Hadith       | Hadith dataset via jsDelivr                   |

External API responses are cached locally where supported to improve reliability and reduce repeated requests.

---

## Getting Started

### Prerequisites

- Node.js and npm
- Angular CLI 22

### Installation

```bash
git clone https://github.com/MahmoudMo99/qurb.git
cd qurb
npm install
```

### Development

```bash
npm start
```

Open `http://localhost:4200`.

### Production Build

```bash
npm run build
```

Build output:

```text
dist/qurb/browser
```

### Test the PWA Locally

```bash
npm run build
npx serve -s dist/qurb/browser -l 8080
```

Open `http://localhost:8080/home`.

The Service Worker runs in production builds. Allow the application resources to cache before testing offline functionality.

---

## Deployment

Qurb is deployed on **Vercel** with Angular client-side routing support.

Recommended build configuration:

```text
Framework: Angular
Build Command: npm run build
Output Directory: dist/qurb/browser
Install Command: npm install
```

---

## Design & Accessibility

Qurb follows a calm Islamic-inspired design system with deep green, gold accents, warm backgrounds, and an RTL-first layout.

**Typography**

- IBM Plex Sans Arabic for the interface.
- KFGQPC Hafs for Quran reading.
- Amiri Quran as an additional Quranic font fallback.

**User Experience**

- Responsive desktop, tablet, and mobile layouts.
- Reusable UI components and consistent visual hierarchy.
- Loading skeletons, empty states, and error handling.
- Keyboard-friendly interactions and accessible labels.
- Reduced-motion handling where applicable.
- SEO-friendly metadata.

---

## Performance

- Lazy-loaded Angular routes.
- Reactive state management using Angular Signals.
- RxJS request handling and selective `shareReplay` caching.
- Local persistence for user preferences and progress.
- Service Worker caching for application resources and Quran data.
- Optimized production builds with output hashing.

---

## Roadmap

Potential future improvements:

- Audio Quran recitations and tafsir.
- Additional Quran editions.
- Editable daily wird goals and progress history.
- Prayer notifications and daily reminders.
- Dark mode.
- Expanded offline capabilities.
- User accounts and cloud synchronization.
- Dedicated mobile application.

---

## Author

Built with care by **Mahmoud Mohamed**.

- **GitHub:** https://github.com/MahmoudMo99
- **Portfolio:** https://mahmoud-mohamed-portfolio.vercel.app/
- **LinkedIn:** https://www.linkedin.com/in/mahmoud-mo-mahmoud/

---

## License

This repository currently does not include an open-source license.

All rights reserved © 2026 Mahmoud Mohamed.
