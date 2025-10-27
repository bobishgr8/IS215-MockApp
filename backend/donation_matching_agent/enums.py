from enum import StrEnum


class Category(StrEnum):
    PRODUCE = "Produce"
    BAKERY = "Bakery"
    CANNED = "Canned"
    DAIRY = "Dairy"
    MEAT = "Meat"
    FROZEN = "Frozen"
    OTHER = "Other"


class Storage(StrEnum):
    AMBIENT = "Ambient"
    CHILLED = "Chilled"
    FROZEN = "Frozen"


class Unit(StrEnum):
    KG = "kg"
    PCS = "pcs"
    CRATES = "crates"


class Urgency(StrEnum):
    LOW = "Low"
    MEDIUM = "Medium"
    HIGH = "High"


class OfferStatus(StrEnum):
    AVAILABLE = "AVAILABLE"
    CLAIMED = "CLAIMED"
    EXPIRED = "EXPIRED"


class MatchStatus(StrEnum):
    PENDING_PICKUP = "PENDING_PICKUP"
    ROUTED = "ROUTED"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"
