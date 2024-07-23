import * as cheerio from "cheerio";
import {
  DiscoverData,
  DiscoverListing,
  DiscoverListings,
  DiscoverTypes,
  Response
} from "../../types";

export class HomeScraper {
  $!: cheerio.Root;
  // page: number;
  baseName: string;

  constructor(baseName: string) {
    this.baseName = baseName;
    // this.page = 1;
  }

  async scrape(): Promise<DiscoverData> {
    const html: Response = await request(`${this.baseName}/home`, "GET")

    if (html.body.includes("WAF") || html.statusCode != 200) {
      // @ts-ignore
      let cookies = await callWebview(`${this.baseName}/home`);
      console.log(JSON.stringify(cookies));
      const html2: Response = await request(`${this.baseName}/home`, "GET")

      this.$ = cheerio.load(html2.body);

      return this.scrapeAll();
    }

    this.$ = cheerio.load(html.body);

    return this.scrapeAll();
  }

  // Note sure if/how I add "Top anime",
  // as it has "Day/Week/Month" selectors
  private scrapeAll(): DiscoverListings[] {
    return [
      this.scrapeHotest(),
      this.scrapeRecentlyUpdated(),
      // Can look at scraping the actual page for subpages on those ones maybe?
      this.scrapeBottomThreeColumns("completed"),
      this.scrapeBottomThreeColumns("new-added"),
      this.scrapeBottomThreeColumns("new-release"),
    ];
  }

  private scrapeHotest(): DiscoverListings {
    const $ = this.$;

    const swiper = $(".swiper-wrapper .swiper-slide.item");
    const hotestItems: DiscoverListing[] = swiper
      .map((_i, anime) => {
        const animeRef = $(anime);
        const title = animeRef.find("h2.title.d-title").text();
        let image: string | null | undefined = animeRef
          .find("div.image > div")
          .attr("style")
          ?.replace("background-image: url('", "")
          .replace("');", "");
        if (image == undefined) {
          // Dirty fix to make TS happy for chouten (not sure if it rly affects it as cant test rn)
          image = null;
        }

        const url = animeRef.find(".info .actions > a").attr("href")!;
        return {
          url: url,
          titles: {
            primary: title,
          },
          poster: image ?? "",
          indicator: "what",
          description: "No.",
        } satisfies DiscoverListing;
      })
      .get();

    return {
      type: DiscoverTypes.CAROUSEL,
      title: "Hotest",
      data: hotestItems,
    } satisfies DiscoverListings;
  }

  private scrapeRecentlyUpdated(): DiscoverListings {
    const $ = this.$;
    // const recentUpdatesSec = $("#recent-update .body .ani.items .item"); // more accurate for home, but doesnt work w subpages
    const recentUpdatesSec = $(".ani.items .item");
    // TODO: MOVE THIS TO SCRAPER/ANIMEITEMSCRAPER & USE THE SAME IN SEARCH() AS THEY'RE SIMILAR
    const recentlyUpdatedItems: DiscoverListing[] = recentUpdatesSec
      .map((_i, anime) => {
        const animeRef = $(anime);
        const titleElem = animeRef.find("a.name.d-title");
        const title = titleElem.text();
        const url = titleElem.attr("href")!;
        let image: string | null | undefined = animeRef
          .find("div.ani.poster > a > img")
          .attr("src");
        if (image == undefined) {
          image = null;
        }
        return {
          url: url,
          titles: { primary: title },
          poster: image ?? "",
          description: "owo?",
          indicator: "yee",
        } satisfies DiscoverListing;
      })
      .get();

    return {
      type: DiscoverTypes.LIST,
      title: "Recently Updated",
      data: recentlyUpdatedItems,
    } satisfies DiscoverListings;
  }

  private scrapeBottomThreeColumns(id: string): DiscoverListings {
    const table = this.$("div.top-tables.mb-3 .body .top-table").filter(
      (_i, _table) => {
        let table = _table as cheerio.TagElement; // Dirty, assume we're a TagElement since we are
        return table.attribs["data-name"] == id;
      },
    )[0];
    const $ = cheerio.load(table);

    const title = $("div.head a.title").contents().first().text();

    const items: DiscoverListing[] = $("div.body div.scaff.items a.item")
      .map((_i, item) => {
        const itemRef = $(item);

        const url = itemRef.attr("href")!;
        let image: string | null | undefined = itemRef
          .find("div.poster span img")
          .attr("src")
          ?.replace("-w100", "-w9999"); // higher quality
        if (image == undefined) {
          image = null;
        }

        const title = itemRef.find("div.info div.name.d-title").text();

        return {
          url: url,
          titles: {
            primary: title,
          },
          poster: image ?? "",
          description: "nu",
          indicator: "??",
        } satisfies DiscoverListing;
      })
      .get();

    const listing = {
      type: DiscoverTypes.GRID_2x,
      title: title,
      data: items,
    } satisfies DiscoverListings;

    return listing;
  }
}
