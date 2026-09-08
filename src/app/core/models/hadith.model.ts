export interface HadithBookOption {
  label: string;
  edition: string;
  description: string;
}

export interface HadithEditionResponse {
  metadata: HadithMetadata;
  hadiths: HadithItem[];
}

export interface HadithMetadata {
  name: string;
  section?: Record<string, string>;
  sections?: Record<string, string>;
  section_detail?: Record<string, HadithSectionDetail>;
  section_details?: Record<string, HadithSectionDetail>;
}

export interface HadithSectionDetail {
  hadithnumber_first: number;
  hadithnumber_last: number;
  arabicnumber_first?: number;
  arabicnumber_last?: number;
}

export interface HadithItem {
  hadithnumber: number | string;
  arabicnumber?: number | string;
  text: string;
  grades?: HadithGrade[];
  reference?: HadithReference;
}

export interface HadithGrade {
  name: string;
  grade: string;
}

export interface HadithReference {
  book?: number | string;
  hadith?: number | string;
}
