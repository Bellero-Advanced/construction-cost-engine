import { makeRetailProvider } from "@/lib/scrapers/_retail";

export const thaiwatsaduProvider = makeRetailProvider({
  key: "thaiwatsadu",
  ttlSec: 60 * 60 * 24,
  urlTemplate: "https://www.thaiwatsadu.com/th/search?keyword={q}",
  productCardSelector:
    ".product-item, .product-card, [data-product-sku], article.product",
  priceSelector: ".price, .product-price, .price-now, [itemprop='price']",
});
