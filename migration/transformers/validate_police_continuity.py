#!/usr/bin/env python3
"""
Police Book (Livre de Police) Integrity Continuity Validator
Verifies legal compliance before loading into the new ERP Bijoux PostgreSQL ledger:
- Chronological and sequential numbering integrity (no missing entries)
- Precious metal fineness standardization (750, 375, 925, 950, 999)
- Identity verification completeness for second-hand purchases (CGI art. 537 & 538)
"""

import sys
import logging
from typing import List, Dict

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("police-validator")

STANDARD_ALLOYS = {
    "18K": 750, "750": 750, "OR 750": 750, "OR 18 CARATS": 750,
    "9K": 375, "375": 375, "OR 375": 375, "OR 9 CARATS": 375,
    "14K": 585, "585": 585,
    "ARGENT": 925, "AG925": 925, "925": 925,
    "PLATINE": 950, "PT950": 950,
    "OR FIN": 999, "999.9": 999
}

def normalize_metal_title(raw_metal_str: str) -> int:
    clean = str(raw_metal_str).strip().upper()
    for key, value in STANDARD_ALLOYS.items():
        if key in clean:
            return value
    return 0

def check_sequential_continuity(numbers: List[int]) -> List[int]:
    """Finds missing sequential numbers in police register"""
    if not numbers:
        return []
    sorted_nums = sorted(set(numbers))
    start_num, end_num = sorted_nums[0], sorted_nums[-1]
    expected_set = set(range(start_num, end_num + 1))
    missing = sorted(list(expected_set - set(sorted_nums)))
    return missing

def validate_police_records(records: List[Dict]) -> Dict:
    logger.info(f"Validating {len(records)} police book records from Odeis legacy...")
    
    missing_ids = []
    anomalies = []
    total_gross_weight = 0.0
    total_entries = len(records)
    numbers = []

    for r in records:
        num = r.get("numero_ordre")
        if num is not None:
            numbers.append(int(num))
        
        weight = float(r.get("poids_brut_entree", 0.0))
        total_gross_weight += weight
        
        # Check alloy title
        title = normalize_metal_title(r.get("nature_matiere", ""))
        if title == 0:
            anomalies.append({
                "numero_ordre": num,
                "error": f"Titre de métal non reconnu: '{r.get('nature_matiere')}'"
            })
            
        # If entry is an acquisition from private individual, KYC ID is legally mandatory
        if r.get("provenance_type") == "PARTICULIER":
            if not r.get("piece_identite_numero"):
                anomalies.append({
                    "numero_ordre": num,
                    "error": "Achat or particulier sans numéro de pièce d'identité (Non conforme CGI art. 537)"
                })

    missing_nums = check_sequential_continuity(numbers)
    
    summary = {
        "total_records": total_entries,
        "first_police_number": min(numbers) if numbers else None,
        "last_police_number": max(numbers) if numbers else None,
        "missing_sequential_count": len(missing_nums),
        "missing_numbers_sample": missing_nums[:20],
        "total_gross_weight_grams": round(total_gross_weight, 3),
        "anomalies_count": len(anomalies),
        "anomalies_sample": anomalies[:10],
        "is_ready_for_migration": len(missing_nums) == 0 and len(anomalies) == 0
    }
    
    logger.info("Validation complete.")
    logger.info(f"Missing sequence gap: {summary['missing_sequential_count']}")
    logger.info(f"Anomalies detected: {summary['anomalies_count']}")
    logger.info(f"Total gross weight tracked: {summary['total_gross_weight_grams']} g")
    return summary

if __name__ == "__main__":
    # Test sample simulation
    sample_data = [
        {"numero_ordre": 1001, "nature_matiere": "OR 750 JAUNE", "poids_brut_entree": 4.520, "provenance_type": "FOURNISSEUR"},
        {"numero_ordre": 1002, "nature_matiere": "OR 18K", "poids_brut_entree": 8.110, "provenance_type": "PARTICULIER", "piece_identite_numero": "12AB34567"},
        {"numero_ordre": 1003, "nature_matiere": "ARGENT 925", "poids_brut_entree": 22.300, "provenance_type": "FOURNISSEUR"}
    ]
    res = validate_police_records(sample_data)
    print("\n--- Summary Report ---")
    print(res)
