import { makeRetailProvider } from "@/lib/scrapers/_retail";

export const dohomeProvider = makeRetailProvider({
  key: "dohome",
  ttlSec: 60 * 60 * 24 * 30,
  urlTemplate: "https://www.dohome.co.th/c/search?q={q}",
  productCardSelector: ".product-item, .product-card, [data-sku]",
  priceSelector: ".price, .product-price, .price-now, [itemprop='price']",
});
