export function grabSetCookieValues(headers: Record<string, string>): {[name: string]: string} {
    const setCookieHeaderName = Object.keys(headers).find(key => key.toLowerCase() === "set-cookie")!;
    const cookie = headers[setCookieHeaderName];
    const splitted = cookie.split(",")
    const result = {}
    for (let part of splitted) {
        part = part.trim();
        part = part.split(";")[0]
        const [key, value] = part.split("=")
        // @ts-ignore
        result[key] = value
    }

    return result;
}