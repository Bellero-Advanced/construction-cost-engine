"""
Construction Cost Engine - Data Export Script
สคริปต์สำหรับแปลงข้อมูล TypeScript เป็น Python dict/JSON
"""

# ==================== MATERIALS ====================
MATERIALS = {
    "TILE_001": {
        "id": "TILE_001",
        "name": "กระเบื้องเซรามิค ปูพื้น 12x12 นิ้ว",
        "unit": "ตร.ม.",
        "cat": "กระเบื้อง",
        "spec": "เกรด A สีพื้น",
        "cons": 1.05
    },
    "TILE_002": {
        "id": "TILE_002",
        "name": "กระเบื้องเซรามิค ปูผนัง 8x10 นิ้ว",
        "unit": "ตร.ม.",
        "cat": "กระเบื้อง",
        "spec": "เกรด A สีขาว",
        "cons": 1.05
    },
    "ADHESIVE_001": {
        "id": "ADHESIVE_001",
        "name": "ปูนกาวซีเมนต์ ติดกระเบื้อง",
        "unit": "ถุง 20 กก.",
        "cat": "ปูนกาว",
        "cons": 0.25
    },
    "GROUT_001": {
        "id": "GROUT_001",
        "name": "ปูนยาแนวกระเบื้อง",
        "unit": "ถุง 1 กก.",
        "cat": "ปูนยาแนว",
        "cons": 0.3
    },
    "CEMENT_001": {
        "id": "CEMENT_001",
        "name": "ปูนซีเมนต์ปอร์ตแลนด์ Type I",
        "unit": "ถุง 50 กก.",
        "cat": "ปูนซีเมนต์",
        "cons": 7.0
    },
    "SAND_001": {
        "id": "SAND_001",
        "name": "ทรายหยาบ (ทรายแม่น้ำ)",
        "unit": "ลบ.ม.",
        "cat": "ทราย",
        "cons": 0.5
    },
    "ROCK_001": {
        "id": "ROCK_001",
        "name": "หินเบอร์ 1-2 (หินคลุก)",
        "unit": "ลบ.ม.",
        "cat": "หิน",
        "cons": 1.0
    },
    "REBAR_DB12": {
        "id": "REBAR_DB12",
        "name": "เหล็กข้ออ้อย DB12 (SD40)",
        "unit": "ตัน",
        "cat": "เหล็กเสริม",
        "wpm": 0.888  # kg per meter
    },
    "REBAR_DB16": {
        "id": "REBAR_DB16",
        "name": "เหล็กข้ออ้อย DB16 (SD40)",
        "unit": "ตัน",
        "cat": "เหล็กเสริม",
        "wpm": 1.578
    },
}

# ==================== SOURCES ====================
SOURCES = {
    "tpso": {
        "key": "tpso",
        "name": "TPSO (สนค.)",
        "type": "Government",
        "color": "#1a3556",
        "mult": 1.0,
        "url": "https://index.tpso.go.th"
    },
    "cgd": {
        "key": "cgd",
        "name": "CGD (กรมบัญชีกลาง)",
        "type": "Government",
        "color": "#b94d2c",
        "mult": 0.97,
        "url": "https://www.cgd.go.th"
    },
    "homepro": {
        "key": "homepro",
        "name": "HomePro",
        "type": "Modern Trade",
        "color": "#e30613",
        "mult": 1.08,
        "url": "https://www.homepro.co.th"
    },
    "globalhouse": {
        "key": "globalhouse",
        "name": "Global House",
        "type": "Modern Trade",
        "color": "#f37021",
        "mult": 0.95,
        "url": "https://www.globalhouse.co.th"
    },
    "thaiwatsadu": {
        "key": "thaiwatsadu",
        "name": "Thai Watsadu",
        "type": "Modern Trade",
        "color": "#009a3d",
        "mult": 1.02,
        "url": "https://www.thaiwatsadu.com"
    },
    "bnb": {
        "key": "bnb",
        "name": "BnB Home",
        "type": "Modern Trade",
        "color": "#003a70",
        "mult": 1.05,
        "url": "https://www.bnbhome.com"
    }
}

# ==================== PROVINCES ====================
PROVINCES = [
    {"id": 10, "name": "ส่วนกลาง (กทม./ปริมณฑล)", "region": "กลาง"},
    {"id": 50, "name": "เชียงใหม่", "region": "เหนือ"},
    {"id": 30, "name": "นครราชสีมา", "region": "ตะวันออกเฉียงเหนือ"},
    {"id": 40, "name": "ขอนแก่น", "region": "ตะวันออกเฉียงเหนือ"},
    {"id": 20, "name": "ชลบุรี", "region": "ตะวันออก"},
    {"id": 70, "name": "ราชบุรี", "region": "ตะวันตก"},
    {"id": 80, "name": "นครศรีธรรมราช", "region": "ใต้"},
    {"id": 90, "name": "สงขลา", "region": "ใต้"},
]

# ==================== MOCK PRICES ====================
# Base prices in THB (Bangkok, TPSO)
BASE_PRICES = {
    "TILE_001": 215,
    "TILE_002": 195,
    "ADHESIVE_001": 165,
    "GROUT_001": 38,
    "CEMENT_001": 179.45,
    "SAND_001": 480,
    "ROCK_001": 520,
    "REBAR_DB12": 21650,
    "REBAR_DB16": 21500,
}

# Historical trend (11 months)
TRENDS = {
    "CEMENT_001": [171, 171, 172, 173, 173, 174, 174, 175, 175, 179.45, 179.45],
    "TILE_001": [210, 210, 212, 213, 213, 214, 214, 215, 215, 215, 215],
    "REBAR_DB12": [21950, 21900, 21850, 21800, 21750, 21750, 21700, 21700, 21680, 21650, 21650],
}

MONTH_LABELS = [
    "ส.ค.68", "ก.ย.68", "ต.ค.68", "พ.ย.68", "ธ.ค.68", 
    "ม.ค.69", "ก.พ.69", "มี.ค.69", "เม.ย.69", "21 พ.ค.69", "24 พ.ค.69"
]

# ==================== CALCULATORS ====================
def calc_wall_tile(area: float, tile_price: float, adhesive_price: float, 
                   grout_price: float) -> dict:
    """
    คำนวณต้นทุนงานกระเบื้อง
    
    Args:
        area: พื้นที่ (ตร.ม.)
        tile_price: ราคากระเบื้อง (บาท/ตร.ม.)
        adhesive_price: ราคาปูนกาว (บาท/ถุง 20กก)
        grout_price: ราคาปูนยาแนว (บาท/ถุง 1กก)
    
    Returns:
        dict: ผลการคำนวณ
    """
    tile_qty = area * 1.05  # waste factor
    adhesive_qty = area * 0.25
    grout_qty = area * 0.3
    
    tile_cost = tile_qty * tile_price
    adhesive_cost = adhesive_qty * adhesive_price
    grout_cost = grout_qty * grout_price
    
    total = tile_cost + adhesive_cost + grout_cost
    
    return {
        "work_name": "งานผนัง-กระเบื้อง",
        "items": [
            {"name": "กระเบื้อง", "qty": tile_qty, "unit": "ตร.ม.", "price": tile_price, "total": tile_cost},
            {"name": "ปูนกาว", "qty": adhesive_qty, "unit": "ถุง", "price": adhesive_price, "total": adhesive_cost},
            {"name": "ปูนยาแนว", "qty": grout_qty, "unit": "ถุง", "price": grout_price, "total": grout_cost},
        ],
        "total": total,
        "unit_cost": total / area if area > 0 else 0,
        "unit_label": "บาท/ตร.ม.",
        "area": area
    }

def calc_concrete(volume: float, cement_price: float, sand_price: float, 
                  rock_price: float) -> dict:
    """
    คำนวณต้นทุนงานคอนกรีต
    
    Args:
        volume: ปริมาตร (ลบ.ม.)
        cement_price: ราคาปูนซีเมนต์ (บาท/ถุง 50กก)
        sand_price: ราคาทราย (บาท/ลบ.ม.)
        rock_price: ราคาหิน (บาท/ลบ.ม.)
    
    Returns:
        dict: ผลการคำนวณ
    """
    cement_qty = volume * 7.0  # bags
    sand_qty = volume * 0.5
    rock_qty = volume * 1.0
    
    cement_cost = cement_qty * cement_price
    sand_cost = sand_qty * sand_price
    rock_cost = rock_qty * rock_price
    
    total = cement_cost + sand_cost + rock_cost
    
    return {
        "work_name": "งานเสา-คาน คอนกรีต",
        "items": [
            {"name": "ปูนซีเมนต์", "qty": cement_qty, "unit": "ถุง", "price": cement_price, "total": cement_cost},
            {"name": "ทราย", "qty": sand_qty, "unit": "ลบ.ม.", "price": sand_price, "total": sand_cost},
            {"name": "หิน", "qty": rock_qty, "unit": "ลบ.ม.", "price": rock_price, "total": rock_cost},
        ],
        "total": total,
        "unit_cost": total / volume if volume > 0 else 0,
        "unit_label": "บาท/ลบ.ม.",
        "volume": volume
    }

if __name__ == "__main__":
    print("✅ Data module loaded successfully!")
    print(f"   - {len(MATERIALS)} materials")
    print(f"   - {len(SOURCES)} sources")
    print(f"   - {len(PROVINCES)} provinces")
