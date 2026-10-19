"""
Drug-Drug Interaction Checker Engine
Comprehensive rule-based knowledge base of common and critical clinical drug interactions.
Prevents adverse drug events (ADEs), fatal polypharmacy combinations, and hospitalizations.
"""

from typing import List, Dict, Any

INTERACTIONS = [
    {"drug_a": "warfarin", "drug_b": "aspirin", "severity": "HIGH", "risk": "Severe synergistic bleeding risk and hemorrhagic stroke."},
    {"drug_a": "warfarin", "drug_b": "ibuprofen", "severity": "HIGH", "risk": "Major gastrointestinal mucosal ulceration and active hemorrhaging."},
    {"drug_a": "metformin", "drug_b": "alcohol", "severity": "HIGH", "risk": "Severe lactic acidosis and acute renal impairment risk."},
    {"drug_a": "ciprofloxacin", "drug_b": "antacid", "severity": "MEDIUM", "risk": "Multivalent cations chelate antibiotic, reducing bioavailability by up to 85%."},
    {"drug_a": "atorvastatin", "drug_b": "clarithromycin", "severity": "HIGH", "risk": "Potent CYP3A4 inhibition elevates statin levels, triggering rhabdomyolysis and renal failure."},
    {"drug_a": "simvastatin", "drug_b": "amlodipine", "severity": "MEDIUM", "risk": "Elevated simvastatin exposure increasing myopathy and muscle toxicity risk."},
    {"drug_a": "sildenafil", "drug_b": "nitroglycerin", "severity": "HIGH", "risk": "Severe precipitous drop in blood pressure resulting in fatal cardiovascular collapse."},
    {"drug_a": "lisinopril", "drug_b": "spironolactone", "severity": "HIGH", "risk": "Synergistic potassium retention causing severe hyperkalemia and cardiac arrest."},
    {"drug_a": "tramadol", "drug_b": "fluoxetine", "severity": "HIGH", "risk": "Precipitates Serotonin Syndrome and dramatically lowers seizure threshold."},
    {"drug_a": "methotrexate", "drug_b": "amoxicillin", "severity": "HIGH", "risk": "Penicillin reduces tubular excretion of methotrexate, inducing pancytopenia."},
    {"drug_a": "digoxin", "drug_b": "amiodarone", "severity": "HIGH", "risk": "Doubles serum digoxin levels, inducing severe bradycardia and fatal dysrhythmias."},
    {"drug_a": "clopidogrel", "drug_b": "omeprazole", "severity": "HIGH", "risk": "Competitive CYP2C19 inhibition prevents active metabolite formation, risking stent thrombosis."},
    {"drug_a": "potassium", "drug_b": "spironolactone", "severity": "HIGH", "risk": "Excessive potassium accumulation inducing lethal ventricular arrhythmias."},
    {"drug_a": "paracetamol", "drug_b": "alcohol", "severity": "HIGH", "risk": "Induction of CYP2E1 increases toxic NAPQI metabolite, risking acute hepatic failure."},
    {"drug_a": "azithromycin", "drug_b": "amiodarone", "severity": "HIGH", "risk": "Additive QT-interval prolongation causing Torsades de Pointes."},
    {"drug_a": "lithium", "drug_b": "ibuprofen", "severity": "HIGH", "risk": "NSAID reduces renal lithium clearance by 20-40%, leading to neurotoxicity."},
    {"drug_a": "levothyroxine", "drug_b": "calcium", "severity": "MEDIUM", "risk": "Calcium carbonate binds levothyroxine in GIT, causing clinical hypothyroidism."},
    {"drug_a": "doxycycline", "drug_b": "antacid", "severity": "MEDIUM", "risk": "Chelation complexes block tetracycline gastrointestinal absorption."},
    {"drug_a": "aceclofenac", "drug_b": "aspirin", "severity": "HIGH", "risk": "Dual COX inhibition severely damages gastric mucosal barrier."},
    {"drug_a": "dolo", "drug_b": "paracetamol", "severity": "HIGH", "risk": "Duplicate therapy (both contain acetaminophen), causing toxic overdose."},
    {"drug_a": "augmentin", "drug_b": "methotrexate", "severity": "HIGH", "risk": "Impaired renal elimination leads to lethal bone marrow suppression."},
    {"drug_a": "budesonide", "drug_b": "ketoconazole", "severity": "MEDIUM", "risk": "Strong CYP3A4 inhibition elevates systemic corticosteroid exposure."},
    {"drug_a": "montelukast", "drug_b": "gemfibrozil", "severity": "MEDIUM", "risk": "CYP2C8 inhibition increases montelukast area-under-curve by 4-fold."},
    {"drug_a": "glimepiride", "drug_b": "ciprofloxacin", "severity": "HIGH", "risk": "Severe refractory hypoglycemia due to altered sulfonylurea clearance."},
    {"drug_a": "metronidazole", "drug_b": "alcohol", "severity": "HIGH", "risk": "Disulfiram-like violent reaction: severe nausea, abdominal cramps, vomiting, and tachycardia."},
    {"drug_a": "propranolol", "drug_b": "salbutamol", "severity": "HIGH", "risk": "Non-selective beta blocker antagonizes beta-2 agonist, inducing acute bronchospasm in asthmatics."},
    {"drug_a": "citalopram", "drug_b": "ondansetron", "severity": "HIGH", "risk": "Combined prolongation of cardiac repolarization (QT interval)."},
    {"drug_a": "theophylline", "drug_b": "ciprofloxacin", "severity": "HIGH", "risk": "CYP1A2 inhibition elevates theophylline concentration to toxic/convulsive levels."},
    {"drug_a": "allopurinol", "drug_b": "azathioprine", "severity": "HIGH", "risk": "Xanthine oxidase inhibition causes fatal azathioprine-induced myelosuppression."},
    {"drug_a": "carbamazepine", "drug_b": "erythromycin", "severity": "HIGH", "risk": "Macrolide blocks carbamazepine hepatic breakdown, causing ataxia and stupor."}
]

def check_interactions(medications: List[Any]) -> List[Dict[str, Any]]:
    """
    Checks all pairwise combinations of prescribed medicines against the clinical interaction database.
    Accepts list of strings or dicts (e.g. [{"drug_name": "Warfarin"}, ...]).
    """
    # Normalize drug names
    drug_names = []
    for item in medications:
        if isinstance(item, str):
            drug_names.append(item.strip().lower())
        elif isinstance(item, dict):
            name = item.get("drug_name") or item.get("name") or ""
            drug_names.append(str(name).strip().lower())

    flagged = []
    seen_pairs = set()

    # Compare all pairwise combinations
    for i in range(len(drug_names)):
        for j in range(i + 1, len(drug_names)):
            d1 = drug_names[i]
            d2 = drug_names[j]

            for entry in INTERACTIONS:
                target_a = entry["drug_a"]
                target_b = entry["drug_b"]

                # Bi-directional substring matching
                match_1 = (target_a in d1 and target_b in d2)
                match_2 = (target_b in d1 and target_a in d2)

                if match_1 or match_2:
                    pair_key = tuple(sorted([target_a, target_b]))
                    if pair_key not in seen_pairs:
                        seen_pairs.add(pair_key)
                        flagged.append({
                            "drug_a": d1.title(),
                            "drug_b": d2.title(),
                            "matched_rule": f"{target_a.title()} + {target_b.title()}",
                            "severity": entry["severity"],
                            "risk": entry["risk"]
                        })

    return flagged
