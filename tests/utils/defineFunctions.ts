import { Response } from "../../src/types";

export async function defineAll() {
    defineRequest();
}


async function defineRequest() {
    global.request = async function(url: string, method: "GET" | "POST" | "PUT" | "HEAD" | "DELETE" | "CONNECT" | "OPTIONS" | "PATCH" | "TRACE", headers?: Record<string, string> | undefined, body?: string | undefined) {
        const fetchResp = await fetch(url, {
            method,
            headers,
            body
        })

        return new Response(
            fetchResp.status, 
            await fetchResp.text(), 
            fetchResp.headers.get("content-type")!
        );
    };
}