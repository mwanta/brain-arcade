from dataclasses import dataclass
from typing import Optional


@dataclass(frozen=True)
class CognitiveDomain:
    domain_id: int
    name: str
    description: Optional[str]

    def to_json(self):
        return {"domain_id": self.domain_id, "name": self.name, "description": self.description}
