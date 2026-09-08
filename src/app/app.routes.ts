import { Routes } from '@angular/router';

import { Home } from './features/home/pages/home/home';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full',
  },
  {
    path: 'home',
    component: Home,
    title: 'الرئيسية | قُرب',
    data: {
      description:
        'قُرب تطبيق إسلامي عربي يجمع القرآن الكريم، مواقيت الصلاة، الأذكار، والأحاديث النبوية في تجربة هادئة ومنظمة.',
    },
  },
  {
    path: 'quran',
    loadComponent: () =>
      import('./features/quran/pages/quran-list/quran-list').then((m) => m.QuranList),
    title: 'القرآن الكريم | قُرب',
    data: {
      description: 'تصفح سور القرآن الكريم كاملة بواجهة قراءة عربية واضحة ومريحة.',
    },
  },
  {
    path: 'quran/:surahNumber',
    loadComponent: () =>
      import('./features/quran/pages/surah-details/surah-details').then((m) => m.SurahDetails),
    title: 'قراءة السورة | قُرب',
    data: {
      description: 'اقرأ السورة بواجهة هادئة وخط واضح، مع إمكانية حفظ السور والآيات في المفضلة.',
    },
  },
  {
    path: 'prayer-times',
    loadComponent: () =>
      import('./features/prayer-times/pages/prayer-times/prayer-times').then((m) => m.PrayerTimes),
    title: 'مواقيت الصلاة | قُرب',
    data: {
      description:
        'تابع مواقيت الصلاة اليومية حسب المدينة أو الموقع الحالي مع تمييز الصلاة القادمة.',
    },
  },
  {
    path: 'azkar',
    loadComponent: () =>
      import('./features/azkar/pages/azkar-list/azkar-list').then((m) => m.AzkarList),
    title: 'الأذكار والأدعية | قُرب',
    data: {
      description: 'تصفح أذكار الصباح والمساء والنوم والسفر وغيرها مع البحث والنسخ وعداد التكرار.',
    },
  },
  {
    path: 'hadith',
    loadComponent: () =>
      import('./features/hadith/pages/hadith-list/hadith-list').then((m) => m.HadithList),
    title: 'الأحاديث النبوية | قُرب',
    data: {
      description: 'تصفح كتب الحديث النبوي والبحث داخل الأحاديث مع حفظ ونسخ ما تحتاج الرجوع إليه.',
    },
  },
  {
    path: 'favorites',
    loadComponent: () =>
      import('./features/favorites/pages/favorites-list/favorites-list').then(
        (m) => m.FavoritesList,
      ),
    title: 'المفضلة | قُرب',
    data: {
      description: 'صفحة المفضلة داخل قُرب لحفظ الآيات والأذكار والأحاديث والرجوع إليها بسهولة.',
    },
  },
  {
    path: '**',
    redirectTo: 'home',
  },
];
