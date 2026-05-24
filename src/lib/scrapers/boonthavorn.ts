import { makeRetailProvider } from "@/lib/scrapers/_retail";

export const boonthavornProvider = makeRetailProvider({
  key: "boonthavorn",
  ttlSec: 60 * 60 * 24 * 30,
  urlTemplate: "https://www.boonthavorn.com/search?q={q}",
  productCardSelector:
    ".product-item, .product-card, article.product, .item-product",
  priceSelector: ".price, .product-price, [itemprop='price'], .price-box",
});
