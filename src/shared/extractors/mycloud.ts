import { VideoExtractor } from "../models/Iextractor";
import { ISource } from "../models/types";
import { getM3u8Qualities } from "../utils/m3u8";
import { IRawTrackMedia, parseSubtitles } from "../utils/subtitles";
import { b64encode, b64decode } from "../utils/b64";
import { rc4Cypher } from "../utils/aniwave/rc4";

interface IMediaInfo {
  status: number;
  result: {
    sources: Object[];
    tracks: IRawTrackMedia[];
  };
}

interface ParsedKeys {
  encrypt: string[],
  decrypt: string[]
}

async function grabKeysFromGithub(url: string) {
  const resp = await request(url, "GET").then(r => r.body)
  const rawKeysHtml = resp.match(/"rawLines":\["(.+?)"],"styling/)![1];

  return JSON.parse(rawKeysHtml.replaceAll("\\", ""));
}

function encodeElement(input: string, key: string) {
  input = encodeURIComponent(input);
  const e = rc4Cypher(key, input);
  const out = b64encode(e).replace(/\//g, "_").replace(/\+/g, '-');
  return out;
}

function decodeResult(input: string, key: string) {
  const i = b64decode((input).replace(/_/g, "/").replace(/-/g, "+"));
  let e = rc4Cypher(key, i);
  e = decodeURIComponent(e);
  return e;
}

async function getUrl(fullUrl: string, keys: ParsedKeys) {
  let videoId = fullUrl.split("/e/")[1].split("?")[0];
    
  const urlEnd = "?" + fullUrl.split("?").pop();

  let encodedVideoId = encodeElement(videoId, keys.encrypt[1]);
  let h = encodeElement(videoId, keys.encrypt[2]);
  let mediainfo_url = `https://vid2v11.site/mediainfo/${encodedVideoId}${urlEnd}&ads=0&h=${encodeURIComponent(h)}`;
  
  return mediainfo_url;
}

async function attemptDecodingKeys(url: string, keys: ParsedKeys) {
  const sourcesUrl = await getUrl(`${url}&autostart=true`, keys);

  let sourcesRes: IMediaInfo = await request(
    sourcesUrl,
    "GET",
    {Referer: url}
  ).then(resp => resp.json())
  
  // Basically, when the url is invalid, result is set to "404" instead of the normal object
  // with sources & tracks.
  if (sourcesRes.result as unknown as number != 404) {
      return sourcesRes;
  }

  throw Error("Couldn't get source.")
}

async function attemptDecodingSelenium(url: string) {
  const mediaInfo = await request(
    "https://anithunder.vercel.app/api/mcloud",
    "POST",
    { "Content-Type": "application/json" },
    JSON.stringify({ url: url }),
  ).then(resp => resp.json());

  return mediaInfo;
}

// Note: this is named mycloud but works for both mycloud & vidplay
export class MyCloudE extends VideoExtractor {
  protected override serverName = "mycloud";

  override extract = async (): Promise<ISource> => {
    const url = this.referer;

    // Note:
    // Server side is handling more things than previously.
    // If I want to reverse to how it was done before, check commit before (including) this one:
    // https://github.com/Nixuge/mochis/commit/ce615f9ff486ec82b01dcdcb8e6d08a987871d8d

    let keys: ParsedKeys;
    try {
      keys = await grabKeysFromGithub("https://github.com/Ciarands/vidsrc-keys/blob/main/keys.json");
    } catch(e) {
      throw Error("Couldn't get keys to decrypt url " + this.referer);
    }

    let mediaInfo: IMediaInfo;
    try {
      console.log("attempting extraction using keys");
      mediaInfo = await attemptDecodingKeys(url, keys);
    } catch(e) {
      // Note: this isn't really that useful anymore since we rely on keys to decrypt
      console.log("attempting extraction using a browser");
      mediaInfo = await attemptDecodingSelenium(url);
      // If this fails again, just let it throw an error...
    }


    console.log("Successfully got mediaInfo. Now attempting to decrypt result.");
    try {
      mediaInfo.result = JSON.parse(decodeResult(mediaInfo.result as unknown as string, keys.decrypt[1]));
    } catch(e) {
      throw Error("Couldn't get mediaInfo. This is usually due to outdated keys. Please try another server for now.");
    }
    console.log("Successfully decrypted result !");

    const sourcesJson = mediaInfo.result.sources;

    // @ts-ignore fuck u json
    const videos = await getM3u8Qualities(sourcesJson[0]["file"]);

    const subtitles = parseSubtitles(mediaInfo.result.tracks);

    return {
      videos: videos,
      subtitles: subtitles,
    } satisfies ISource;
  };
}
