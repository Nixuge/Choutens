import { load } from "cheerio";
import { MediaList } from "../../types";
import { AJAX_BASENAME } from "../utils/variables";
import { getVrf } from "../utils/urlGrabber";

export async function grabMediaList(
  baseName: string,
  _url: string,
): Promise<MediaList[]> {
  // Depending on where we come from, url may or may not have /watch/ in it.
  const watch = _url.startsWith("/watch/") ? "" : "/watch/";
  const fullUrl = `${baseName}${watch}${_url}`;
  const html = await request(fullUrl, "GET");

  if (html.body.includes("<title>WAF</title>")) {
    console.error(
      "Seems like you're getting captcha'd. Unfortunately I can't do much about it. Retry later/change your ip.",
    );
    return [];
  }

  const $ = load(html.body);

  const data_id = $("div#watch-main").attr("data-id");

  const url = `${AJAX_BASENAME}/episode/list/${data_id}?vrf=${getVrf(data_id ?? "")}`;
  console.log("url: " + url);

  let episodesHtml;
  try {
    episodesHtml = JSON.parse(
      (await request(url, "GET", { "x-requested-with": "XMLHttpRequest" }))
        .body,
    )["result"];
  } catch (e) {
    console.error("If you see this, there's an issue.");
    return [];
  }
  const $$ = load(episodesHtml);

  // Note:
  // This *technically* isn't always correct, eg if a sub has 12 eps and a dub only 2, it'll always show 1-12 even for the dub variant.
  // However, the amount of logic required to avoid this thing is way greater than any benefit, for now it's staying as is
  // const episodeCounts = $$(".dropdown.filter.range .dropdown-menu .dropdown-item");
  // const firstEpisode = parseInt(episodeCounts.first().text().split("-")[0]);
  // const lastEpisode = parseInt(episodeCounts.last().text().split("-")[1]);
  // const allEpisodes = `${firstEpisode}-${lastEpisode}`;
  // This doesn't seem to be required in Chouten. The app seems to do this automatically.

  var answer: MediaList[] = [];

  const epRange = $$(".ep-range > li");

  epRange.map((_, li) => {
    const inScraper = $$(li);
    // data ids needed for next step
    const dataIds = inScraper.find("a").attr("data-ids")!;
    // episode number
    const episodeNum = parseInt(inScraper.find("a").attr("data-num")!);
    // episode title
    const titleDiv = inScraper.find("a").find("span.d-title");
    const episodeTitle = titleDiv.text() ?? undefined;

    // the "title" attribute on the lis has all the properties to grab sub/dub/softsub
    //let episodeReleaseDate: string | undefined = undefined;
    let variantReleaseDates:
      | string
      | IterableIterator<RegExpMatchArray>
      | undefined = inScraper.attr("title");
    variantReleaseDates = variantReleaseDates?.matchAll(
      /- ([a-zA-Z]*?): ([0-9]{4}\/[0-9]{2}\/[0-9]{2} [0-9]{2}:[0-9]{2} .*?) /g,
    )!;

    for (let match of variantReleaseDates) {
      const variantType = match[1];
      if (variantType == "Release") {
        //episodeReleaseDate = match[2]; // SHOULD work (should)
        continue;
      }

      // console.log(episodeTitle)

      // Never happens, but makes the compiler happy
      // if (answer.pagination == undefined)
      //   answer.pagination = [];

      // edit: not sure anymore if this is rigth for Chouten's module structure,
      // as rn this separates sub/softsub/dub in sub categories
      // get playlist group for variantType
      let playlistGroup: MediaList | undefined = undefined;
      var playlistGroups = answer.filter(
        (variant) => variant.title == variantType,
      );
      if (playlistGroups.length == 0) {
        var mediaList = {
          title: variantType,
          pagination: [
            {
              id: variantType.toLowerCase() + "_id_at_sub",
              title: variantType,
              items: [],
            },
          ],
        } satisfies MediaList;

        playlistGroups.push(mediaList);
        playlistGroup = playlistGroups[0];
        answer.push(mediaList);
      } else {
        playlistGroup = playlistGroups[0];
      }
      playlistGroup?.pagination[0].items.push({
        url: dataIds + " | " + variantType.toLowerCase(), // kinda dirty but idk how else to pass data through to the next step,
        number: episodeNum,
        title: episodeTitle,
        // TODO: See if image & description are available somewhere
      });
      // console.log(`${playlistGroup}`);
    }
  });
  // console.log(`${answer[0]}`);
  return answer;
}
