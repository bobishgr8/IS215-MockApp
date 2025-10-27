from donation_matching_agent.models import *
from donation_matching_agent.prompts import get_donation_matching_agent_instruction
from google.adk.agents.llm_agent import Agent


# Tool functions to fetch data
def get_beneficiary_profiles() -> list[BeneficiaryProfile]:
    """Fetch all beneficiary profiles from mock data"""
    from mock_data.beneficiary_profiles import BENEFICIARY_PROFILES
    return [BeneficiaryProfile(**profile) for profile in BENEFICIARY_PROFILES]


def get_donations() -> list[Donation]:
    """Fetch all available donations from mock data"""
    from mock_data.donations import DONATIONS
    return [Donation(**donation) for donation in DONATIONS]


def get_active_needs() -> list[Need]:
    """Fetch all active needs from beneficiaries"""
    # This would typically come from a database, but for now we'll generate based on beneficiary profiles
    from mock_data.beneficiary_profiles import ACTIVE_NEEDS
    return [Need(**need) for need in ACTIVE_NEEDS]


# Agent with matching tools and ultra-simple structured output (completely flat - no nested objects)
root_agent = Agent(
    model='gemini-2.5-flash',
    name='donation_matching_agent',
    description='An intelligent agent that matches food donations with beneficiary needs based on location, urgency, storage requirements, and expiry dates.',
    instruction=get_donation_matching_agent_instruction(),
    tools=[get_beneficiary_profiles, get_donations, get_active_needs],
    output_schema=MatchBatch
)
