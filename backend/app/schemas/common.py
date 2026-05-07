from typing import Generic, Literal, TypeVar

from pydantic import BaseModel, ConfigDict

MaritalStatus = Literal["أعزب", "متزوج", "مطلق", "أرمل"]
PhysicalAbility = Literal["ممتاز", "جيد جداً", "جيد", "مقبول"]
Shift = Literal["صباحية", "مسائية", "ليلية"]
EquipmentCondition = Literal["ممتاز", "جيد", "متوسط", "تالف"]
# New 10-type taxonomy. The old short labels (إطفاء/إسعاف/سلم/قيادة/إنقاذ)
# remain in the union so existing rows and seed data validate; the UI dropdown
# only offers the new labels via VEHICLE_TYPES on the frontend.
VehicleType = Literal[
    "كوماندر(مزدوجة)",
    "بروبلين",
    "ونش",
    "عربة الانارة",
    "جيب التدخل السريع",
    "اسعاف",
    "شاص الاطفاء في المواقع الجبلية",
    "صهريج",
    "سيارة الأنذار",
    "قارب",
    "سيارة السلالم",
    "عربة الشيول",
    # ----- legacy values, kept for back-compat with existing DB rows -----
    "إطفاء",
    "إسعاف",
    "سلم",
    "قيادة",
    "إنقاذ",
]
VehicleStatus = Literal["في الخدمة", "خارج الخدمة", "صيانة"]
VehicleLine = Literal["الأول", "الثاني"]
MaintenanceStatus = Literal["مكتمل", "قيد التنفيذ", "مجدول", "ملغي"]
InspectionResult = Literal["ناجح", "يحتاج صيانة", "غير صالح"]
RoomType = Literal["غرفة نوم", "مكتب", "قاعة تدريس", "مرفق"]
RoomStatus = Literal["جاهزة", "صيانة"]
IncidentType = Literal["حريق", "إنقاذ", "إسعاف", "أخرى"]
IncidentSeverity = Literal["بسيط", "متوسط", "خطير", "كارثي"]
DrillKind = Literal["زيارة", "فرضية", "جولة ميدانية"]

T = TypeVar("T")


class OrmBase(BaseModel):
    model_config = ConfigDict(from_attributes=True)


class ListResponse(BaseModel, Generic[T]):
    items: list[T]
    total: int
    page: int
    page_size: int
