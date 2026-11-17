from dataclasses import dataclass
from typing import Optional


@dataclass(frozen=True)
class SettingType:
    setting_type_id: int
    name: str
    unit: Optional[str]
    description: Optional[str]

    def to_json(self):
        return {
            "setting_type_id": self.setting_type_id,
            "name": self.name,
            "unit": self.unit,
            "description": self.description,
        }
