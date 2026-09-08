export interface AzkarApiResponse<T> {
  code: number;
  status: string;
  data: T;
}

export interface AzkarCategory {
  number: string;
  en: string;
  ar: string;
  count: number;
}

export interface AzkarCategoriesData {
  total_categories: number;
  shortcuts: string[];
  categories: AzkarCategory[];
}

export interface ZikrContent {
  body: string;
  text: string;
}

export interface ZikrItem {
  number: string;
  category: AzkarCategory;
  en: ZikrContent;
  ar: ZikrContent;
}

export interface AzkarCategoryDetailsData {
  shortcut?: string;
  label?: string;
  category?: AzkarCategory;
  count: number;
  duas: ZikrItem[];
}

export interface AzkarShortcutOption {
  label: string;
  value: string;
  description: string;
}
