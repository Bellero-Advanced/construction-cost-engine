import { makeSuggestJspProvider } from "@/lib/scrapers/_suggestJsp";

export const homeproProvider = makeSuggestJspProvider({
  key: "homepro",
  origin: "https://www.homepro.co.th",
  ttlSec: 60 * 60 * 24,
});
