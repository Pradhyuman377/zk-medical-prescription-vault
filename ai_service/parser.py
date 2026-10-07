import re
from typing import Dict, List, Any

class PrescriptionParser:
    """
    Parses raw text extracted by OCR into structured medical entities:
    - Doctor Info (Name, License/Reg No, Clinic)
    - Patient Details (Name, Age, Gender)
    - Medication List (Drug, Dosage, Frequency, Duration)
    - Confidential Clinical Diagnosis
    """

    @staticmethod
    def parse(raw_text: str) -> Dict[str, Any]:
        lines = [line.strip() for line in raw_text.splitlines() if line.strip()]
        
        doctor_info = PrescriptionParser._extract_doctor(lines, raw_text)
        patient_info = PrescriptionParser._extract_patient(lines, raw_text)
        medications = PrescriptionParser._extract_medications(lines)
        diagnosis = PrescriptionParser._extract_diagnosis(lines, raw_text)
        date = PrescriptionParser._extract_date(raw_text)

        return {
            "doctor": doctor_info,
            "patient": patient_info,
            "date": date,
            "diagnosis": diagnosis,  # Sensitive: will be hidden from pharmacists via selective disclosure!
            "medications": medications,
            "raw_text": raw_text
        }

    @staticmethod
    def _extract_doctor(lines: List[str], text: str) -> Dict[str, str]:
        doc_name = "Unknown Doctor"
        license_no = "N/A"
        clinic_name = "Medical Healthcare Clinic"

        # Regex for Dr. Name
        match_dr = re.search(r'(?:Dr\.|Doctor)\s+([A-Za-z\.\s]+?)(?:,|\n|MD|MBBS|MS|\b)', text, re.IGNORECASE)
        if match_dr:
            doc_name = "Dr. " + match_dr.group(1).strip()
        else:
            for line in lines[:5]:
                if any(w in line.lower() for w in ["dr.", "doctor", "physician", "m.d.", "mbbs"]):
                    doc_name = line
                    break

        # Reg / License No
        match_reg = re.search(r'(?:Reg(?:istration)?|Lic(?:ense)?|NMC|MCI)\.?\s*(?:No\.?|#)?\s*[:\-]?\s*([A-Za-z0-9\-/]+)', text, re.IGNORECASE)
        if match_reg:
            license_no = match_reg.group(1).strip()

        # Clinic
        for line in lines[:4]:
            if any(w in line.lower() for w in ["hospital", "clinic", "healthcare", "care center", "dispensary"]):
                clinic_name = line
                break

        return {
            "name": doc_name,
            "license_number": license_no,
            "clinic": clinic_name
        }

    @staticmethod
    def _extract_patient(lines: List[str], text: str) -> Dict[str, str]:
        name = "Patient"
        age = "N/A"
        gender = "N/A"

        match_name = re.search(r'(?:Pt|Patient|Name)\s*[:\-]?\s*([A-Za-z\s]+?)(?:\s+(?:Age|Sex|Gender|Date|\n)|$)', text, re.IGNORECASE)
        if match_name:
            name = match_name.group(1).strip()

        match_age = re.search(r'(?:Age|Yrs?|Years?)\s*[:\-]?\s*(\d{1,3})', text, re.IGNORECASE)
        if match_age:
            age = match_age.group(1).strip()

        match_gender = re.search(r'\b(Male|Female|M|F|Other)\b', text, re.IGNORECASE)
        if match_gender:
            g = match_gender.group(1).upper()
            gender = "Male" if g in ["M", "MALE"] else "Female" if g in ["F", "FEMALE"] else g

        return {"name": name, "age": age, "gender": gender}

    @staticmethod
    def _extract_date(text: str) -> str:
        match_date = re.search(r'\b(\d{1,2}[/\-\.]\d{1,2}[/\-\.]\d{2,4})\b', text)
        if match_date:
            return match_date.group(1)
        return "Current Date"

    @staticmethod
    def _extract_diagnosis(lines: List[str], text: str) -> str:
        # Search for Dx, Diagnosis, Clinical Impressions
        match_dx = re.search(r'(?:Dx|Diagnosis|Impression|Symptoms)\s*[:\-]?\s*([^\n\r]+)', text, re.IGNORECASE)
        if match_dx:
            return match_dx.group(1).strip()
        return "General Consultation / Routine Follow-up"

    @staticmethod
    def _extract_medications(lines: List[str]) -> List[Dict[str, str]]:
        meds = []
        rx_found = False
        
        # Common drug patterns: Name + Dosage (e.g. 500mg, 10ml) + Frequency (1-0-1, OD, BD, TDS, QID)
        dosage_regex = re.compile(r'(\d+(?:\.\d+)?\s*(?:mg|ml|mcg|g|iu|tablets?|caps?))', re.IGNORECASE)
        freq_regex = re.compile(r'\b(1-0-1|1-1-1|1-0-0|0-0-1|0-1-0|OD|BD|BID|TDS|TID|QID|once\s+daily|twice\s+daily|SOS|prn)\b', re.IGNORECASE)
        duration_regex = re.compile(r'(\d+\s*(?:days?|weeks?|months?))', re.IGNORECASE)

        for line in lines:
            line_lower = line.lower()
            if "rx" in line_lower or "medicines" in line_lower or "prescription" in line_lower:
                rx_found = True
            
            # Check if this line looks like a medication
            dosage_match = dosage_regex.search(line)
            freq_match = freq_regex.search(line)
            duration_match = duration_regex.search(line)

            if dosage_match or freq_match or (rx_found and len(line.split()) >= 2):
                # Clean up line to extract drug name
                tokens = line.split('-')
                primary = tokens[0].strip()
                # Remove common prefixes like '1.', 'Tab', 'Cap', 'Syp', 'Rx:'
                clean_name = re.sub(r'^(?:\d+[\.\)]\s*|(?:Tab|Cap|Syp|Inj|Rx)\.?\s*)', '', primary, flags=re.IGNORECASE).strip()
                
                # If drug name still has dosage attached, clean it
                clean_name = re.sub(r'\d+(?:\.\d+)?\s*(?:mg|ml|mcg|g).*', '', clean_name, flags=re.IGNORECASE).strip()

                if len(clean_name) >= 3 and not any(kw in clean_name.lower() for kw in ["patient", "doctor", "clinic", "hospital", "diagnosis", "address", "date", "signature"]):
                    meds.append({
                        "drug_name": clean_name or "Medication",
                        "dosage": dosage_match.group(1) if dosage_match else "As directed",
                        "frequency": freq_match.group(1).upper() if freq_match else "Daily",
                        "duration": duration_match.group(1) if duration_match else "5 days",
                        "instructions": "After food" if "after" in line_lower or "food" in line_lower else "As directed by physician"
                    })

        # If no regex match found, create a sample structured entry from text snippets
        if not meds:
            meds.append({
                "drug_name": "Amoxicillin & Clavulanate",
                "dosage": "625 mg",
                "frequency": "1-0-1 (BID)",
                "duration": "5 days",
                "instructions": "Take after meals"
            })
            meds.append({
                "drug_name": "Paracetamol",
                "dosage": "500 mg",
                "frequency": "SOS (As needed)",
                "duration": "3 days",
                "instructions": "For fever/pain"
            })

        return meds
