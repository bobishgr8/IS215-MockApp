"""
Mock data for beneficiary profiles and their active needs
Loads data from the shared JSON file at project root
"""

import json
from pathlib import Path

# Get the path to the JSON file at project root
JSON_FILE_PATH = Path(__file__).parent.parent.parent / 'beneficiaries.json'

# Load data from JSON file
def load_beneficiaries_data():
    with open(JSON_FILE_PATH, 'r') as f:
        data = json.load(f)
    return data

_data = load_beneficiaries_data()
BENEFICIARY_PROFILES = _data['profiles']
ACTIVE_NEEDS = _data['needs']
