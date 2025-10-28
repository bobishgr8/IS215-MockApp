"""
Mock data for food donations/offers from various donors
Loads data from the shared JSON file at project root
"""

import json
from pathlib import Path

# Get the path to the JSON file at project root
JSON_FILE_PATH = Path(__file__).parent.parent.parent / 'donations.json'

# Load data from JSON file
def load_donations_data():
    with open(JSON_FILE_PATH, 'r') as f:
        data = json.load(f)
    return data

DONATIONS = load_donations_data()
