import { makeRetailProvider } from "@/lib/scrapers/_retail";

export const scghomeProvider = makeRetailProvider({
  key: "scghome",
  ttlSec: 60 * 60 * 24,
  urlTemplate: "https://www.scghome.com/search?keyword={q}",
  productCardSelector: ".product-item, .product-card, [data-product]",
  priceSelector: ".price, .product-price, .price-display",
});
