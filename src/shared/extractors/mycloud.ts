import { VideoExtractor } from '../models/Iextractor';
import { ISource } from '../models/types';
import { getM3u8Qualities } from '../utils/m3u8';
import { IRawTrackMedia, parseSubtitles } from '../utils/subtitles';

interface IMediaInfo {
  status: number,
  result: {
    sources: Object[],
    tracks: IRawTrackMedia[]
  }
}

// Note: this is named mycloud but works for both mycloud & vidplay
export class MyCloudE extends VideoExtractor {
  protected override serverName = 'mycloud';

  override extract = async (): Promise<ISource> => {
    const url = this.referer;
    
    // Note:
    // Server side is handling more things than previously.
    // If I want to reverse to how it was done before, check commit before (including) this one:
    // https://github.com/Nixuge/mochis/commit/ce615f9ff486ec82b01dcdcb8e6d08a987871d8d
    
    const mediaInfo: IMediaInfo = await request("https://anithunder.vercel.app/api/mcloud", "POST",
      {"Content-Type": "application/json"},
      JSON.stringify({"url": url})
    ).then(req => req.json())
    
    const sourcesJson = mediaInfo.result.sources;
    
    // @ts-ignore fuck u json
    const videos = await getM3u8Qualities(sourcesJson[0]["file"])
    
    const subtitles = parseSubtitles(mediaInfo.result.tracks)

    return {
      videos: videos,
      subtitles: subtitles
    } satisfies ISource
  };
}
