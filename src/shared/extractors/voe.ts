import { load } from 'cheerio';
import { VideoExtractor } from '../../shared/models/Iextractor';
import { ISource } from '../../shared/models/types';
import { getM3u8Qualities } from '../../shared/utils/m3u8';
import { SubtitleData, SubtitleType } from '../../types';

export class VoeE extends VideoExtractor {
  protected override serverName = 'voe';

  override extract = async (): Promise<ISource> => {
    const html = this.htmlContent;
    const baseDomain = this.referer.split("/").slice(0, 3).join("/")
    
    const videoUrl = html.match(/var sources = {.*?'hls': '(https:\/\/.*?)',/s)![1];

    const $ = load(html);
    const subtitles: SubtitleData[] = $('video#voe-player track[kind="captions"]').map((i, sub) => {
      const subRef = $(sub);
      return {
        url: baseDomain + subRef.attr("src")!,
        language: subRef.attr("label")!,
        type: SubtitleType.VTT,
      } satisfies SubtitleData
    }).get();
        
    const videos = await getM3u8Qualities(videoUrl);
    return {
      subtitles,
      videos,
    }
  };
}
