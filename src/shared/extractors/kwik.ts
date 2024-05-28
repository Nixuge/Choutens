import { RawVideoExtractor } from '../models/Iextractor';
import { IVideo } from '../models/types';
import { dynamicEval } from '../utils/eval';
// import { baseUrl } from '../../animepahe/utils/constants'; // TODO
const baseUrl = "https://animepahe.com"

export class KwikE extends RawVideoExtractor {
  protected override serverName = 'kwik';

  override extract = async (): Promise<IVideo[]> => {
    const data = await request(this.referer, "GET", {"Referer": baseUrl}).then(resp => resp.body)
    
    const source = dynamicEval(/(eval)(\(f.*?)(\n<\/script>)/s.exec(data)![2].replace('eval', '')).match(
      /https.*?m3u8/
    )[0];
    
    return [{url: source}];
  }
}
