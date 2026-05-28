# Scraper Experiments

> One row per source × method × outcome. Append-only.

| Date | Source | Method | Outcome | Notes |
|---|---|---|---|---|
| 2026-05-20 | TPSO | unpdf on `uploads.tpso.go.th/*.pdf` | ✓ live | regex extracts CMI index + YoY/MoM% |
| 2026-05-20 | CGD | data.go.th CKAN auto-discovery | manual | PDFs available but parser not wired |
| 2026-05-20 | DIT | moc-price.moc.go.th JSON API | blocked | egress blocked from Workers; manual upload only |
| 2026-05-20 | HomePro | `/service/search/suggest.jsp` | ✓ live | 9/9 materials |
| 2026-05-20 | MegaHome | `/service/search/suggest.jsp` | partial | 3/5 materials |
| 2026-05-20 | Boonthavorn | Magento GraphQL | ✓ live | |
| 2026-05-20 | GH/TW/BnB/SCG/Dohome | ScrapingBee → CF BR | pending | needs `SCRAPINGBEE_API_KEY` |
