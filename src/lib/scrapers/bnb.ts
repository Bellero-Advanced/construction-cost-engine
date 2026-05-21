import { makeRetailProvider } from "@/lib/scrapers/_retail";

export const bnbProvider = makeRetailProvider({
  key: "bnb",
  ttlSec: 60 * 60 * 24 * 30,
  urlTemplate: "https://www.bnbhome.com/search?q={q}",
  productCardSelector: ".product-item, .product-card, article.product",
  priceSelector: ".price, .product-price, [itemprop='price']",
});
