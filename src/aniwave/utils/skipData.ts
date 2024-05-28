import { SkipData } from "../../types";

export function parseSkipData(data: string): SkipData[] {
    if (data) {
        const parsedData = JSON.parse(data);        
        return [
            {
                start: parsedData["intro"][0],
                end: parsedData["intro"][1],
                title: "Skip opening"
            },
            {
                start: parsedData["outro"][0],
                end: parsedData["outro"][1],
                title: "Skip ending"
            }
        ]
    }
    return [];
}
