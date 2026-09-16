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
    title: 'قُرب Qurb | القرآن الكريم والأذكار ومواقيت الصلاة',
    data: {
      description:
        'قُرب Qurb تطبيق إسلامي عربي يجمع القرآن الكريم، وردي اليومي، مواقيت الصلاة، الأذكار، الأدعية، والأحاديث النبوية في تجربة هادئة ومنظمة.',
    },
  },
  {
    path: 'quran',
    loadComponent: () =>
      import('./features/quran/pages/quran-list/quran-list').then((m) => m.QuranList),
    title: 'القرآن الكريم | قُرب Qurb',
    data: {
      description:
        'اقرأ القرآن الكريم داخل قُرب Qurb، وتصفح السور، وابحث بالاسم أو رقم السورة، مع وضع المصحف ووضع التركيز للقراءة الهادئة.',
    },
  },
  {
    path: 'quran/:surahNumber',
    loadComponent: () =>
      import('./features/quran/pages/surah-details/surah-details').then((m) => m.SurahDetails),
    title: 'قراءة السورة | قُرب Qurb',
    data: {
      description:
        'اقرأ سور القرآن الكريم في قُرب Qurb بواجهة عربية هادئة، مع وضع المصحف، وضع التركيز، وحفظ السور والآيات في المفضلة.',
    },
  },
  {
    path: 'prayer-times',
    loadComponent: () =>
      import('./features/prayer-times/pages/prayer-times/prayer-times').then((m) => m.PrayerTimes),
    title: 'مواقيت الصلاة | قُرب Qurb',
    data: {
      description:
        'تابع مواقيت الصلاة اليومية داخل قُرب Qurb حسب المدينة أو الموقع الحالي، مع تمييز الصلاة القادمة في واجهة واضحة.',
    },
  },
  {
    path: 'azkar',
    loadComponent: () =>
      import('./features/azkar/pages/azkar-list/azkar-list').then((m) => m.AzkarList),
    title: 'الأذكار والأدعية | قُرب Qurb',
    data: {
      description:
        'تصفح الأذكار والأدعية داخل قُرب Qurb، مثل أذكار الصباح والمساء والنوم والسفر، مع البحث والنسخ وعداد التكرار.',
    },
  },
  {
    path: 'hadith',
    loadComponent: () =>
      import('./features/hadith/pages/hadith-list/hadith-list').then((m) => m.HadithList),
    title: 'الأحاديث النبوية | قُرب Qurb',
    data: {
      description:
        'تصفح كتب الحديث النبوي داخل قُرب Qurb، وابحث داخل الأحاديث، وانسخ واحفظ ما تحتاج الرجوع إليه بسهولة.',
    },
  },
  {
    path: 'daily-wird',
    loadComponent: () =>
      import('./features/daily-wird/pages/daily-wird/daily-wird').then((m) => m.DailyWird),
    title: 'وردي اليومي | قُرب Qurb',
    data: {
      description:
        'تابع وردك اليومي داخل قُرب Qurb من التسبيح، التحميد، التكبير، الاستغفار، الصلاة على النبي، قراءة القرآن، وأذكار الصباح والمساء.',
    },
  },
  {
    path: 'favorites',
    loadComponent: () =>
      import('./features/favorites/pages/favorites-list/favorites-list').then(
        (m) => m.FavoritesList,
      ),
    title: 'المفضلة | قُرب Qurb',
    data: {
      description:
        'صفحة المفضلة داخل قُرب Qurb لحفظ الآيات والأذكار والأحاديث والرجوع إليها بسهولة على نفس الجهاز.',
      robots: 'noindex, follow',
    },
  },
  {
    path: '**',
    redirectTo: 'home',
  },
];
