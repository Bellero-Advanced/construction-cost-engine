import { makeRetailProvider } from "@/lib/scrapers/_retail";

export const megahomeProvider = makeRetailProvider({
  key: "megahome",
  ttlSec: 60 * 60 * 24,
  urlTemplate: "https://www.megahome.co.th/search?q={q}",
  productCardSelector: ".product-item, .product-card, article.product",
  priceSelector: ".price, .product-price, [itemprop='price']",
});
