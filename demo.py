#!/usr/bin/env python3
"""
Quick Demo Script for Construction Cost Engine
รันไฟล์นี้เพื่อดูตัวอย่างการใช้งานระบบแบบรวดเร็ว
"""

from showcase_data import (
    MATERIALS, SOURCES, PROVINCES, BASE_PRICES, TRENDS, MONTH_LABELS,
    calc_wall_tile, calc_concrete
)

def print_header(title):
    print("\n" + "="*70)
    print(f" {title}")
    print("="*70)

def main():
    print_header("🏗️  CONSTRUCTION COST ENGINE - QUICK DEMO")

    # 1. Data Overview
    print_header("📦 1. DATA OVERVIEW")
    print(f"\n✓ Materials: {len(MATERIALS)} items")
    print(f"✓ Sources: {len(SOURCES)} providers")
    print(f"✓ Provinces: {len(PROVINCES)} locations")

    # 2. Sample Materials
    print_header("🧱 2. SAMPLE MATERIALS")
    for mat_id in ['TILE_001', 'CEMENT_001', 'REBAR_DB12']:
        mat = MATERIALS[mat_id]
        price = BASE_PRICES.get(mat_id, 0)
        print(f"\n{mat['id']}")
        print(f"  Name: {mat['name']}")
        print(f"  Unit: {mat['unit']}")
        print(f"  Price: {price:,.2f} THB (Bangkok, TPSO)")

    # 3. Data Sources
    print_header("📊 3. DATA SOURCES")
    print("\nGovernment (3):")
    for key in ['tpso', 'cgd']:
        src = SOURCES[key]
        print(f"  • {src['name']}")

    print("\nRetail (4 shown):")
    for key in ['homepro', 'globalhouse', 'thaiwatsadu', 'bnb']:
        src = SOURCES[key]
        print(f"  • {src['name']} (mult: {src['mult']})")

    # 4. Calculator Demo: Wall Tile
    print_header("🧮 4. CALCULATOR DEMO: WALL TILE")
    area = 25.5
    result = calc_wall_tile(
        area=area,
        tile_price=BASE_PRICES['TILE_001'],
        adhesive_price=BASE_PRICES['ADHESIVE_001'],
        grout_price=BASE_PRICES['GROUT_001']
    )

    print(f"\nJob: {result['work_name']}")
    print(f"Area: {result['area']} ตร.ม.")
    print(f"\nBill of Materials:")
    for item in result['items']:
        print(f"  • {item['name']}: {item['qty']:.2f} {item['unit']} "
              f"@ {item['price']:.2f} = {item['total']:.2f} THB")

    print(f"\n💰 Total Cost: {result['total']:,.2f} THB")
    print(f"📊 Unit Cost: {result['unit_cost']:.2f} {result['unit_label']}")

    # 5. Calculator Demo: Concrete
    print_header("🧮 5. CALCULATOR DEMO: CONCRETE")
    volume = 2.5
    result = calc_concrete(
        volume=volume,
        cement_price=BASE_PRICES['CEMENT_001'],
        sand_price=BASE_PRICES['SAND_001'],
        rock_price=BASE_PRICES['ROCK_001']
    )

    print(f"\nJob: {result['work_name']}")
    print(f"Volume: {result['volume']} ลบ.ม.")
    print(f"\nBill of Materials:")
    for item in result['items']:
        print(f"  • {item['name']}: {item['qty']:.2f} {item['unit']} "
              f"@ {item['price']:.2f} = {item['total']:.2f} THB")

    print(f"\n💰 Total Cost: {result['total']:,.2f} THB")
    print(f"📊 Unit Cost: {result['unit_cost']:.2f} {result['unit_label']}")

    # 6. Price Trends
    print_header("📈 6. PRICE TRENDS (11 MONTHS)")
    print(f"\nCement (CEMENT_001):")
    print(f"  Start: {TRENDS['CEMENT_001'][0]} THB ({MONTH_LABELS[0]})")
    print(f"  End:   {TRENDS['CEMENT_001'][-1]} THB ({MONTH_LABELS[-1]})")
    change = TRENDS['CEMENT_001'][-1] - TRENDS['CEMENT_001'][0]
    pct = (change / TRENDS['CEMENT_001'][0]) * 100
    print(f"  Change: {change:+.2f} THB ({pct:+.1f}%)")

    print(f"\nRebar DB12 (REBAR_DB12):")
    print(f"  Start: {TRENDS['REBAR_DB12'][0]:,} THB ({MONTH_LABELS[0]})")
    print(f"  End:   {TRENDS['REBAR_DB12'][-1]:,} THB ({MONTH_LABELS[-1]})")
    change = TRENDS['REBAR_DB12'][-1] - TRENDS['REBAR_DB12'][0]
    pct = (change / TRENDS['REBAR_DB12'][0]) * 100
    print(f"  Change: {change:+,.0f} THB ({pct:+.1f}%)")

    # Summary
    print_header("✅ DEMO COMPLETE")
    print("\n🎯 Next Steps:")
    print("  1. Run full showcase: jupyter notebook showcase_complete.ipynb")
    print("  2. Explore data: python3 -i showcase_data.py")
    print("  3. Run web app: npm install && npm run dev")
    print("\n📚 Documentation: SHOWCASE_README.md")
    print("="*70 + "\n")

if __name__ == "__main__":
    main()
