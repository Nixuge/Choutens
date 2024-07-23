import { defineAll } from './utils/defineFunctions';
defineAll();

import { test } from 'vitest'
import AniwaveModule from "../src/aniwave/aniwave";

import { log, logEnabled } from "./utils/log"
logEnabled(true)

const source = new AniwaveModule();

test("provides discover", async () => {
  log((await source.discover())[0].data[0])
})

test("provides search", async () => {
  log((await source.search("One piece", 1)))
})

test("provides media info", async () => {
  log((await source.info("/watch/one-piece.ov8")))
})

test("provides media list", async () => {
  log((await source.media("/watch/kami-no-tou-2nd-season.7j281"))[0].pagination[0].items)
})

test("provides sources", async () => {
  log((await source.sources("Hj6fCM4v,Hj6fCM0m,Hj6fAsgj | sub"))[0].sources)
})

test("provides sources", async () => {
  log((await source.streams("GDuWDcIhnw==")))
})

