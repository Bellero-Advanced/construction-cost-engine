import { makeSuggestJspProvider } from "@/lib/scrapers/_suggestJsp";

export const megahomeProvider = makeSuggestJspProvider({
  key: "megahome",
  origin: "https://www.megahome.co.th",
  ttlSec: 60 * 60 * 24 * 14,
});
