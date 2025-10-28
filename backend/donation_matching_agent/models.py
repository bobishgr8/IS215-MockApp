from typing import Optional

from donation_matching_agent.enums import *
from pydantic import BaseModel, Field


class Location(BaseModel):
    lat: float = Field(..., description="Latitude coordinate")
    lng: float = Field(..., description="Longitude coordinate")


class BeneficiaryProfile(BaseModel):
    id: str = Field(..., description="Unique identifier for the beneficiary")
    name: str = Field(..., description="Name of the beneficiary organization")
    address: str = Field(..., description="Full address of the beneficiary")
    location: Location = Field(..., description="GPS coordinates")
    categories_needed: list[Category] = Field(..., description="Categories of food needed")
    storage_capabilities: list[Storage] = Field(..., description="Storage types available")
    delivery_preferred: bool = Field(default=True, description="Whether delivery is preferred")
    weekly_capacity_kg: float = Field(..., description="Weekly capacity in kilograms")


class Need(BaseModel):
    id: str = Field(..., description="Unique identifier for the need")
    beneficiary_id: str = Field(..., description="ID of the beneficiary")
    category: Category = Field(..., description="Category of food needed")
    min_qty: float = Field(..., description="Minimum quantity needed")
    urgency: Urgency = Field(..., description="Urgency level of the need")
    can_accept: list[Storage] = Field(..., description="Storage types that can be accepted")
    delivery_preferred: bool = Field(default=True, description="Whether delivery is preferred")
    created_at: str = Field(..., description="ISO datetime when need was created")
    lat: float = Field(..., description="Latitude of beneficiary location")
    lng: float = Field(..., description="Longitude of beneficiary location")
    address: str = Field(..., description="Address of beneficiary")


class Donation(BaseModel):
    id: str = Field(..., description="Unique identifier for the donation offer")
    donor_id: str = Field(..., description="ID of the donor")
    donor_name: str = Field(..., description="Name of the donor organization")
    title: str = Field(..., description="Title/description of the donation")
    category: Category = Field(..., description="Category of food")
    quantity: float = Field(..., description="Quantity available")
    unit: Unit = Field(..., description="Unit of measurement")
    storage: Storage = Field(..., description="Storage requirement")
    expiry_date: str = Field(..., description="ISO date string for expiry")
    pickup_start: str = Field(..., description="ISO datetime for pickup window start")
    pickup_end: str = Field(..., description="ISO datetime for pickup window end")
    address: str = Field(..., description="Pickup address")
    location: Location = Field(..., description="GPS coordinates")
    status: OfferStatus = Field(default=OfferStatus.AVAILABLE, description="Status of the offer")
    created_at: str = Field(..., description="ISO datetime when offer was created")

# Simplified output schema for ADK (no enums, no nested objects - completely flat)
class MatchOutput(BaseModel):
    """Ultra-simplified output model for donation-beneficiary matches (ADK-friendly, completely flat)"""
    donation_id: str = Field(..., description="ID of the donation offer")
    need_id: str = Field(..., description="ID of the beneficiary need")
    beneficiary_id: str = Field(..., description="ID of the beneficiary organization")
    match_status: str = Field(..., description="Status: EXCELLENT, GOOD, FAIR, or ACCEPTABLE")
    geographic_proximity_score: float = Field(..., description="Score based on distance between donor and beneficiary (0-100)")
    expiry_urgency_score: float = Field(..., description="Score based on how soon the food expires (0-100)")
    storage_compatibility_score: float = Field(..., description="Score based on storage requirements matching (0-100)")
    category_match_score: float = Field(..., description="Score based on food category matching needs (0-100)")
    overall_match_score: float = Field(..., description="Overall weighted match score (0-100)")
    reasoning: str = Field(..., description="Detailed explanation for the match scores")


class MatchBatch(BaseModel):
    """Ultra-simplified batch of matches for ADK agent output - no nested objects"""
    matches: list[MatchOutput] = Field(..., description="List of matched donations to beneficiary needs")
