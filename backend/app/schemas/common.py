from typing import Generic, Literal, TypeVar

from pydantic import BaseModel, ConfigDict

MaritalStatus = Literal["أعزب", "متزوج", "مطلق", "أرمل"]
PhysicalAbility = Literal["ممتاز", "جيد جداً", "جيد", "مقبول"]
Shift = Literal["صباحية", "مسائية", "ليلية"]
EquipmentCondition = Literal["ممتاز", "جيد", "متوسط", "تالف"]
VehicleType = Literal["إطفاء", "إسعاف", "سلم", "قيادة", "إنقاذ"]
VehicleStatus = Literal["في الخدمة", "خارج الخدمة", "صيانة"]
MaintenanceStatus = Literal["مكتمل", "قيد التنفيذ", "مجدول", "ملغي"]
InspectionResult = Literal["ناجح", "يحتاج صيانة", "غير صالح"]

T = TypeVar("T")


class OrmBase(BaseModel):
    model_config = ConfigDict(from_attributes=True)


class ListResponse(BaseModel, Generic[T]):
    items: list[T]
    total: int
    page: int
    page_size: int
