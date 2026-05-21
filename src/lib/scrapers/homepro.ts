import { makeRetailProvider } from "@/lib/scrapers/_retail";

export const homeproProvider = makeRetailProvider({
  key: "homepro",
  ttlSec: 60 * 60 * 24,
  urlTemplate: "https://www.homepro.co.th/search?q={q}",
  productCardSelector:
    ".product-item, [data-testid='product-card'], article.product",
  priceSelector: ".price, [data-testid='product-price'], .product-price",
});
