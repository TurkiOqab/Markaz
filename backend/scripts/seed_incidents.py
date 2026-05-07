"""Seed 10 random incidents within Jazan region (منطقة جازان).

Usage:
    python -m scripts.seed_incidents
"""

import json
import random
from datetime import datetime, timedelta

from app.db import SessionLocal
from app.models import Incident

# Jazan-region cities/districts with approximate centers (lat, lng).
JAZAN_LOCATIONS = [
    ("جازان", "حي الشاطئ", 16.8892, 42.5511),
    ("جازان", "حي الروضة", 16.8930, 42.5470),
    ("صبيا", "حي السلامة", 17.1497, 42.6258),
    ("أبو عريش", "حي العزيزية", 16.9697, 42.8324),
    ("صامطة", "حي النزهة", 16.5969, 42.9456),
    ("الدرب", "حي السوق", 17.7322, 42.2653),
    ("بيش", "حي الجامعة", 17.3789, 42.5886),
    ("العارضة", "وسط البلد", 16.9714, 43.1106),
    ("الحرث", "حي الفيصلية", 16.6336, 43.0228),
    ("الريث", "حي المخواة", 17.2164, 42.9072),
    ("فرسان", "وسط جزيرة فرسان", 16.7050, 42.1156),
    ("ضمد", "وسط ضمد", 17.0456, 42.6883),
]

INCIDENT_TEMPLATES = [
    {
        "type": "حريق",
        "title": "حريق في مبنى سكني",
        "description": "اندلع حريق في الطابق الثاني من المبنى نتيجة تماس كهربائي. تمت السيطرة عليه قبل امتداده.",
        "outcome": "تمت السيطرة، لا إصابات",
        "place_category": "سكني",
        "place_subtype": "فيلا",
        "personnel": 8,
    },
    {
        "type": "حريق",
        "title": "حريق في مستودع",
        "description": "حريق في مستودع تجاري أدى إلى تلف جزئي في البضاعة. تم إخلاء المنطقة المحيطة.",
        "outcome": "تمت السيطرة، خسائر مادية",
        "place_category": "تجاري",
        "place_subtype": "صالات العرض",
        "personnel": 14,
    },
    {
        "type": "حريق",
        "title": "حريق في مركبة",
        "description": "اشتعال محرك مركبة على الطريق العام. لا إصابات.",
        "outcome": "تمت السيطرة، خسائر بسيطة",
        "place_category": "سكني",
        "place_subtype": "أخرى",
        "personnel": 4,
    },
    {
        "type": "إنقاذ",
        "title": "إنقاذ شخص محاصر في مصعد",
        "description": "احتجاز شخصين داخل مصعد بسبب انقطاع التيار. تم إخراجهم بسلام.",
        "outcome": "تم الإنقاذ بنجاح",
        "place_category": "سكني",
        "place_subtype": "شقة",
        "personnel": 5,
    },
    {
        "type": "إنقاذ",
        "title": "إنقاذ من مياه السيول",
        "description": "احتجاز مركبة في مجرى سيل بعد أمطار غزيرة. تم انتشال السائق.",
        "outcome": "تم الإنقاذ، لا وفيات",
        "place_category": "سكني",
        "place_subtype": "أخرى",
        "personnel": 10,
    },
    {
        "type": "إسعاف",
        "title": "إصابة عمالية",
        "description": "إصابة عامل بناء بكسر بعد سقوط من ارتفاع. تم نقله للمستشفى.",
        "outcome": "تم النقل للمستشفى",
        "place_category": "تجاري",
        "place_subtype": "أخرى",
        "personnel": 3,
    },
    {
        "type": "إسعاف",
        "title": "حادث مروري",
        "description": "حادث تصادم بين مركبتين على الطريق السريع، تم إسعاف 3 مصابين.",
        "outcome": "تم نقل المصابين",
        "place_category": "سكني",
        "place_subtype": "أخرى",
        "personnel": 6,
    },
    {
        "type": "إسعاف",
        "title": "حالة اختناق",
        "description": "اختناق ربة منزل بسبب تسرب غاز. تم إنعاشها وإسعافها.",
        "outcome": "حالة مستقرة بعد الإسعاف",
        "place_category": "سكني",
        "place_subtype": "منزل",
        "personnel": 4,
    },
    {
        "type": "أخرى",
        "title": "إخلاء بسبب تسرب كيميائي",
        "description": "تسرب مادة كيميائية في مصنع، تم إخلاء العمال وعزل المنطقة.",
        "outcome": "تمت السيطرة، تم الإخلاء",
        "place_category": "تجاري",
        "place_subtype": "أخرى",
        "personnel": 12,
    },
    {
        "type": "أخرى",
        "title": "بلاغ كاذب",
        "description": "بلاغ عن حريق في مبنى تجاري، تبيّن عدم وجود حادث.",
        "outcome": "بلاغ كاذب",
        "place_category": "تجاري",
        "place_subtype": "صالات العرض",
        "personnel": 4,
    },
]

NATIONALITIES = ["سعودي", "يمني", "مصري", "سوداني", "هندي", "بنغلاديشي"]
RECEIVING_ENTITIES = ["غرفة العمليات", "الاتصال المباشر", "الهلال الأحمر", "الشرطة"]
CONTACT_METHODS = ["هاتف", "حضوري", "خلوي", "لاسلكي"]
WEATHER = [["نهار", "صحو"], ["نهار", "غائم"], ["ليل", "صحو"], ["نهار", "ممطر", "ضباب"]]
SITE_INFO = [["طريق سهل"], ["طريق ضيق", "مكان منخفض"], ["طريق مرصوف بالحجارة"]]
AGENCIES = [
    ["الشرطة", "الهلال الأحمر"],
    ["المرور", "الشرطة"],
    ["الهلال الأحمر", "وزارة الصحة"],
    ["البلدية", "شركة الكهرباء"],
]


def random_offset() -> tuple[float, float]:
    """Tiny random jitter (~ ± 2km) on top of city center."""
    return (random.uniform(-0.02, 0.02), random.uniform(-0.02, 0.02))


def main() -> None:
    with SessionLocal() as session:
        added = 0
        for tmpl in INCIDENT_TEMPLATES:
            city, district, base_lat, base_lng = random.choice(JAZAN_LOCATIONS)
            dlat, dlng = random_offset()
            lat = round(base_lat + dlat, 6)
            lng = round(base_lng + dlng, 6)
            days_ago = random.randint(0, 29)
            hour = random.randint(0, 23)
            minute = random.randint(0, 59)
            occurred = datetime.now() - timedelta(days=days_ago, hours=hour, minutes=minute)
            response_min = random.randint(3, 18)
            duration_min = random.randint(20, 240)
            personnel = tmpl["personnel"]

            details = {
                "receiving_entity": random.choice(RECEIVING_ENTITIES),
                "report_date": occurred.strftime("%Y-%m-%d"),
                "report_time": occurred.strftime("%H:%M"),
                "classification_main": f"{random.randint(1, 9)}",
                "classification_sub": f"{random.randint(10, 99)}",
                "reporter_nationality": random.choice(NATIONALITIES),
                "reporter_age": str(random.randint(20, 65)),
                "reporter_id": str(random.randint(10**9, 10**10 - 1)),
                "reporter_workplace": random.choice(["موظف", "متقاعد", "طالب", "مهندس"]),
                "contact_method": random.choice(CONTACT_METHODS),
                "contact_phone": f"05{random.randint(10000000, 99999999)}",
                "place_category": tmpl["place_category"],
                "place_subtype": tmpl["place_subtype"],
                "location_region": "جازان",
                "location_city": city,
                "location_governorate": city,
                "location_center": district,
                "location_district": district,
                "location_main_street": "الشارع الرئيسي",
                "weather_conditions": random.choice(WEATHER),
                "site_info": random.choice(SITE_INFO),
                "license_status": random.choice(["مرخص", "غير مرخص"]),
                "dispatched_teams": [
                    {
                        "team_type": "فرق إطفاء" if tmpl["type"] == "حريق" else "فرق إنقاذ",
                        "name_code": f"FT-{random.randint(100, 999)}",
                        "departure_time": occurred.strftime("%H:%M"),
                        "arrival_time": (occurred + timedelta(minutes=response_min)).strftime("%H:%M"),
                        "return_time": (occurred + timedelta(minutes=duration_min)).strftime("%H:%M"),
                    }
                ],
                "support_teams": [],
                "participating_agencies": random.choice(AGENCIES),
                "operation_summary": tmpl["outcome"],
            }

            inc = Incident(
                occurred_at=occurred,
                type=tmpl["type"],
                severity="متوسط",
                location=f"{city} - {district}",
                description=tmpl["description"],
                response_minutes=response_min,
                duration_minutes=duration_min,
                personnel_count=personnel,
                vehicles_dispatched=details["dispatched_teams"][0]["name_code"],
                outcome=tmpl["outcome"],
                reporter_name=random.choice(
                    ["أحمد محمد", "سعيد علي", "محمد عبدالله", "علي حسن", "خالد يحيى"]
                ),
                notes=None,
                status="مكتمل" if random.random() > 0.2 else "غير مكتمل",
                details=json.dumps(details, ensure_ascii=False),
                latitude=lat,
                longitude=lng,
            )
            session.add(inc)
            added += 1
        session.commit()
        print(f"Added {added} incidents in Jazan region.")


if __name__ == "__main__":
    main()
