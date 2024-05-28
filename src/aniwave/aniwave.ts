import { HomeScraper } from "./scraper/homeScraper";
import { grabMediaList } from "./scraper/mediaList";
import {
  BaseModule,
  InfoData,
  SearchResult,
  VideoContent,
  MediaList,
  Status,
  MediaType,
  MediaSource,
  ModuleSettings,
  ModuleType,
  InputTypes,
  InputSetting,
  ServerList,
  DiscoverData,
  SeasonData,
  ServerData,
  MediaDataType,
  SearchData,
} from "../types";
import { load } from "cheerio";
import { parseSkipData } from "./utils/skipData";
import { decodeVideoSkipData, getVrf } from "./utils/urlGrabber";
import { getVideo } from "./extractor";
import { AJAX_BASENAME } from "./utils/variables";

export default class AniwaveModule extends BaseModule implements VideoContent {
  baseUrl = "https://aniwave.to";

  metadata = {
    id: "aniwave.to",
    name: "Aniwave",
    author: "Nixuge",
    description: "Chouten module for aniwave.to",
    type: ModuleType.Source,
    subtypes: ["Anime"],
    version: "0.0.1",
  };

  settings: ModuleSettings = [
    {
      title: "General",
      settings: [
        {
          id: "Domain",
          label: "Domain",
          placeholder: "https://aniwave.to",
          defaultValue: "https://aniwave.to",
          value: "https://aniwave.to",
        } as InputSetting<InputTypes.URL>,
      ],
    },
  ];

  baseName: string = this.getSettingValue("Domain");

  async discover(): Promise<DiscoverData> {
    return await new HomeScraper(this.baseName).scrape();
  }

  async search(query: string): Promise<SearchResult> {
    const resp = await request(`${this.baseName}/filter?keyword=${encodeURIComponent(query)}`, "GET");
    const $ = load(resp.body);

    const items: SearchData[] = $('#list-items > div.item').map((_i, anime) => {
      const animeRef = $(anime);
      
      const metaRef = animeRef.find('div.b1 > a.name.d-title');
      const url = metaRef.attr('href')?.split('/').pop() ?? '';
      
      const name = metaRef.text();
      const img = animeRef.find('div > a > img').attr('src') ?? '';      
      return {
        url: `/watch/${url}`,
        title: name,
        poster: img,
        indicator: "idk bruh"
      } satisfies SearchData
    }).get();

    return items;
  }

  async info(_url: string): Promise<InfoData> {
    // Depending on where we come from, url may or may not have /watch/ in it.
    const watch = _url.startsWith("/watch/") ? "" : "/watch/";
    const fullUrl = `${this.baseName}/${watch}${_url}`;
    const html = await request(fullUrl, "GET");

    const $ = load(html.body);

    const synopsis = $(".info .synopsis .shorting .content").text();

    const mainTitle = $(".info h1.title.d-title").text(); // have to get that to remove it from altTitles
    const altTitles = $(".info .names.font-italic")
      .text()
      .split("; ")
      .filter((altTitle) => altTitle != mainTitle);
    let altTitle = altTitles.length == 0 ? undefined : altTitles[0];

    // UNTESTED: NOT SURE IF FORCING ALTPOSTER IS GOOD
    let altPoster = $("div#player")
      .attr("style")
      ?.replace("background-image:url('", "")
      .replace("')", "")!;

    // UNTESTED - SEASONS, TO TRY OUT.
    const seasonSlides = $(".seasons.swiper-wrapper .swiper-slide");
    const seasons: SeasonData[] = [];
    if (seasonSlides.length > 0) {
      seasonSlides.map((_i, season) => {
        const seasonRef = $(season);
        const a = seasonRef.find("a");
        const url = a.attr("href")!; // Not sure if this works anymore.
        const name = a.find(".name").text();
        seasons.push({
          url,
          name,
        } satisfies SeasonData);
      });
    }
    // END UNTESTED

    const playlistDetails: InfoData = {
      titles: {
        primary: mainTitle,
        secondary: altTitle,
      },
      altTitles: altTitles,
      description: synopsis,
      poster: altPoster,
      banner: undefined,
      status: Status.UNKNOWN,
      rating: 10.0,
      yearReleased: 2024,
      mediaType: MediaType.EPISODES,
      seasons: seasons,
    };

    return playlistDetails;
  }

  async media(_url: string): Promise<MediaList[]> {
    return await grabMediaList(this.baseName, _url);
  }

  async servers(_url: string): Promise<ServerList[]> {
    const [episodeId, variantType] = _url.split(" | ");

    const html = (
      await request(
        `${AJAX_BASENAME}/server/list/${episodeId}?vrf=${getVrf(episodeId)}`,
        "GET",
      )
    ).json()["result"];

    const $ = load(html);

    // TODO- TEST: I THINK I FUCKED SMTH UP NOT SURE
    const servers: ServerData[] = $(".type")
      .map((_, serverCategory) => {
        const categoryRef = $(serverCategory);
        // const sourceType = categoryRef.find("label").text().trim()
        const sourceType = categoryRef.attr("data-type");
        if (sourceType != variantType) return undefined;

        return categoryRef
          .find("ul")
          .find("li")
          .map((_, server) => {
            const serverRef = $(server);
            const serverName = serverRef.text();
            const linkId = serverRef.attr("data-link-id")!;
            return {
              name: `${serverName}`,
              url: linkId,
            } satisfies ServerData;
          })
          .get();
      })
      .get();

    return [
      {
        title: "Aniwave",
        servers: servers,
      } satisfies ServerList,
    ];
  }

  async sources(_url: string): Promise<MediaSource> {
    const result: any = (
      await request(
        `${AJAX_BASENAME}/server/${_url}?vrf=${getVrf(_url)}`,
        "GET",
      )
    ).json()["result"];
    const url = decodeVideoSkipData(result["url"]);
    let skipData = parseSkipData(decodeVideoSkipData(result["skip_data"]));

    const sourceData = await getVideo(url);
    const videos = sourceData.videos;

    return {
      sources: videos.map((video) => ({
        quality: "p" + video.quality,
        file: video.url,
        type: MediaDataType.HLS,
      })),
      skips: skipData,
      subtitles: sourceData.subtitles ?? [],
      previews: [], // Pretty sure Aniwave doesn't send those.
    } satisfies MediaSource;
  }
}
