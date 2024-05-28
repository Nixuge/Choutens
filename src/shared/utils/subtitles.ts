import { SubtitleData, SubtitleType } from "../../types";

export interface IRawTrackMedia {
    file: string,
    label: string,
    kind: string,
    default?: boolean
}
function isSubtitle(object: any): object is IRawTrackMedia {
    return "kind" in object && object["kind"] == "captions";
}

export function parseSubtitles(tracks: IRawTrackMedia[], type: SubtitleType = SubtitleType.VTT) {
    const subtitles: SubtitleData[] = []
    for (const track of tracks) {
      if (!isSubtitle(track))
        continue;
      subtitles.push({
        url: track.file,
        language: track.label,
        type: type
      } satisfies SubtitleData)
    }
    return subtitles
}