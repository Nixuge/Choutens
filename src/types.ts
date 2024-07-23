declare global {
  /**
   * Send request to given url, letting the app handle it
   *
   * @param url - The url of the request
   * @param method - The method of the request
   * @param headers - Headers for the request, for example: Cookies or User-Agent
   * @param body - Body of the request in string form
   */
  function request(url: string, method: "GET" | "POST" | "PUT" | "HEAD" | "DELETE" | "CONNECT" | "OPTIONS" | "PATCH" | "TRACE", headers?: Record<string, string>, body?: string): Promise<Response>;
}

export abstract class BaseModule {
  abstract baseUrl: string;

  /**
   * The metadata for this module
   */
  abstract readonly metadata: {
      readonly id: string;
      readonly name: string;
      readonly author: string;
      readonly description?: string;
      readonly type: ModuleType;
      readonly subtypes: string[];
      readonly version: string;
  };

  abstract readonly settings: ModuleSettings;

  /**
   * Update the value of a setting with a given ID
   *
   * @param settingId - The ID of the setting to update
   * @param newValue - The new value for the setting
   */
  updateSettingValue(settingId: string, newValue: any): void {
      // Loop through each group and setting to find the setting with the given id
      this.settings.forEach((group) => {
          const settingToUpdate = group.settings.find((setting) => setting.id === settingId);
          if (settingToUpdate) {
              if (typeof settingToUpdate.value == typeof newValue) {
                  settingToUpdate.value = newValue;
              }
          }
      });
  }

  /**
   * Retrieve the value of a given setting
   *
   * @param settingId The ID of the setting to retrieve
   */
  getSettingValue(settingId: string): any | undefined {
      this.settings.forEach((group) => {
          return group.settings.find((setting) => setting.id === settingId)?.value;
      });
  }

  /**
   * Return search results for a given query.
   *
   * @param query - The search query
   */
  abstract search(query: string, page: number): Promise<SearchResult>;
  /**
   * Returns Infodata for a given url
   *
   * @param url - The url where the info data is found
   */
  abstract info(url: string): Promise<InfoData>;
  /**
   * Returns discover data
   */
  abstract discover(): Promise<DiscoverData>;

  /**
   * Returns the media list of a given url
   *
   * @param url - The url where the media is found
   */
  abstract media(url: string): Promise<MediaList[]>;
}

export type ResponseType = {
  statusCode: number;
  body: string;
  contentType: string;
  headers: Record<string, string>;
};

export class Response {
  statusCode: number;
  body: string;
  contentType: string;
  headers: Record<string, string>;

  constructor(
      statusCode: number,
      body: string,
      contentType: string,
      //headers: Record<string, string>,
  ) {
      this.statusCode = statusCode;
      this.body = body;
      this.contentType = contentType;
      this.headers = {};
  }

  json(): any {
      return JSON.parse(this.body);
  }
}

export type ModuleSettings = SettingsGroup[];

export type SettingsGroup = {
  title: string;
  settings: (SliderSetting | ToggleSetting | InputSetting<InputTypes> | DropdownSetting<number>)[];
};

export type SliderSetting = {
  id: string;
  label: string;
  defaultValue: number;
  minimumValue: number;
  maximumValue: number;
  steps: number;
  value: number;
};

export type ToggleSetting = {
  id: string;
  label: string;
  defaultValue: boolean;
  value: boolean;
};

export enum InputTypes {
  URL,
  TEXT,
  NUMBER,
  PASSWORD,
  EMAIL,
}

export type InputSetting<T extends InputTypes> = {
  id: string;
  label: string;

  // Conditional types for dynamic behavior
  placeholder: string;
  defaultValue: T extends InputTypes.NUMBER ? number : string;
  value: T extends InputTypes.NUMBER ? number : string;

  type: T;
};

export type DropdownSetting<T extends number> = {
  id: string;
  label: string;
  options: T[];
  defaultValue: T;
  value: T;
};

export enum ModuleType {
  Source,
  Meta,
}

export type VideoContent = {
  /**
   * Fetches the sources of a given url
   *
   * @param url - The url where the sources are found
   */
  sources(url: string): Promise<SourceList[]>;

  /**
   * Fetches the streams of a given url
   *
   * @param url - The url where the streams are found
   */
  streams(url: string): Promise<MediaStream>;
};

export type BookContent = {
  /**
   * Fetches the pages of a given url
   *
   * @param url - The url where the pages are found
   */
  pages(url: string): Promise<String[]>;
};

export enum Status {
  COMPLETED,
  CURRENT,
  HIATUS,
  NOT_RELEASED,
  UNKNOWN,
}

export enum MediaType {
  EPISODES,
  CHAPTERS,
  UNKNOWN,
}

export type Titles = {
  primary: string;
  secondary?: string;
};

export type HexColor = `#${string}`;

export type Label = {
  text: string;
  color: HexColor;
};

export type DiscoverListing = {
  url: string;
  titles: Titles;
  poster: string;
  description: string;
  label?: Label;
  indicator: string;
  current?: number;
  total?: number;
};

export enum DiscoverTypes {
  CAROUSEL,
  LIST,
  GRID_2x,
  GRID_3x,
}

export type DiscoverData = DiscoverListings[];

export type DiscoverListings = {
  type: DiscoverTypes;
  title: string;
  data: DiscoverListing[];
};

export type InfoData = {
  titles: Titles;
  altTitles: string[];
  description: string;
  poster: string;
  banner?: string;
  status: Status;
  rating: number;
  yearReleased: number;
  mediaType: MediaType;
  seasons: SeasonData[];
};

export type SeasonData = {
  name: string;
  url: string;
  selected?: boolean;
};

export type MediaList = {
  title: string;
  pagination: MediaPagination[];
};

export type MediaPagination = {
  id: string;
  title?: string;
  items: MediaInfo[];
};

export enum Language {
  "en-US",
  "en-GB",
  "de-DE",
  "fr-FR",
}

export type MediaInfo = {
  url: string;
  number: number;
  thumbnail?: string;
  title?: string;
  description?: string;
  indicator?: string;
};

export type SearchData = {
  url: string;
  titles: Titles;
  poster: string;
  indicator: string;
  current?: number;
  total?: number;
};

export type SearchResultInfo = {
  count?: number;
  pages: number;
  next?: string;
};

export type SearchResult = {
  info: SearchResultInfo;
  results: SearchData[];
};

export type SourceData = {
  name: string;
  url: string;
};

export type SourceList = {
  title: string;
  sources: SourceData[];
};

export enum MediaDataType {
  HLS,
  MP4,
}

export type MediaItem = {
  quality: string;
  file: string;
  type: MediaDataType;
};

export type SkipData = {
  start: number;
  end: number;
  title: string;
};

export enum SubtitleType {
  VTT,
  SRT,
  ASS,
}

export type SubtitleData = {
  url: string;
  language: string;
  type: SubtitleType;
};

/**
*
* @property img: url string to preview img
*/
export type MediaPreview = {
  img: string;
  time: number;
};

export type MediaStream = {
  skips: SkipData[];
  streams: MediaItem[];
  subtitles: SubtitleData[];
  previews: MediaPreview[];
};
