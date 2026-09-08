export interface PrayerTimesApiResponse {
  code: number;
  status: string;
  data: PrayerTimesData;
}

export interface PrayerTimesData {
  timings: PrayerTimings;
  date: PrayerDate;
  meta: PrayerMeta;
}

export interface PrayerTimings {
  Fajr: string;
  Sunrise: string;
  Dhuhr: string;
  Asr: string;
  Maghrib: string;
  Isha: string;
  Imsak?: string;
  Midnight?: string;
  Sunset?: string;
  Firstthird?: string;
  Lastthird?: string;
}

export interface PrayerDate {
  readable: string;
  timestamp: string;
  hijri: {
    date: string;
    day: string;
    year: string;
    month: {
      number: number;
      en: string;
      ar: string;
    };
    weekday: {
      en: string;
      ar: string;
    };
  };
  gregorian: {
    date: string;
    day: string;
    year: string;
    month: {
      number: number;
      en: string;
    };
    weekday: {
      en: string;
    };
  };
}

export interface PrayerMeta {
  timezone: string;
  method: {
    id: number;
    name: string;
  };
}

export interface PrayerLocation {
  id: string;
  label: string;
  city: string;
  country: string;
  method: number;
}

export interface PrayerCoordinates {
  label: string;
  latitude: number;
  longitude: number;
  method?: number;
}

export interface PrayerDisplayItem {
  key: keyof PrayerTimings;
  name: string;
  time: string;
  isNext: boolean;
}
