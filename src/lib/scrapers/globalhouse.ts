import { makeRetailProvider } from "@/lib/scrapers/_retail";

export const globalhouseProvider = makeRetailProvider({
  key: "globalhouse",
  ttlSec: 60 * 60 * 24,
  urlTemplate: "https://www.globalhouse.co.th/search?q={q}",
  productCardSelector:
    ".product-card, .product-item, [data-product-id], li.product",
  priceSelector: ".price, .product-price, .price-amount, [itemprop='price']",
});
