import os
import json
import re
from typing import Dict, Any, Optional
from dotenv import load_dotenv
from PIL import Image
import io

load_dotenv()

class VLMEngine:
    """
    Multimodal Vision-Language Model (VLM) for Medical Prescription HTR
    Uses Gemini Flash Vision for near-human handwriting recognition & direct structured JSON extraction.
    """

    def __init__(self):
        self.api_key = os.getenv("GEMINI_API_KEY", "").strip()
        self.is_configured = False
        self._init_vlm()

    def _init_vlm(self):
        if self.api_key:
            try:
                import google.generativeai as genai
                genai.configure(api_key=self.api_key)
                # Use gemini-3.8-flash / gemini-flash-latest
                for model_candidate in ["gemini-3.8-flash", "gemini-flash-latest"]:
                    try:
                        self.model = genai.GenerativeModel(model_candidate)
                        self.is_configured = True
                        print(f"[VLM Engine] SUCCESS: Gemini Vision active with model '{model_candidate}'!")
                        break
                    except Exception:
                        continue
            except Exception as e:
                print(f"[VLM Engine] Initialization notice: {e}")
                self.is_configured = False
        else:
            print("[VLM Engine] Notice: No GEMINI_API_KEY provided in ai_service/.env. Active in EasyOCR mode.")

    def extract_with_vision(self, image_bytes: bytes) -> Optional[Dict[str, Any]]:
        if not self.is_configured:
            return None

        try:
            pil_image = Image.open(io.BytesIO(image_bytes))

            prompt = """
You are an expert Clinical Pharmacist and Medical Optical Character Recognition (OCR/HTR) specialist.
Carefully examine this medical prescription slip (including handwritten cursive notes, abbreviations, and clinical stamps).

Extract and structure the data into the following strict JSON schema:
{
  "doctor": {
    "name": "Dr. Full Name (or Doctor name if visible)",
    "license_number": "Registration/License number if visible, or N/A",
    "clinic": "Hospital or Clinic name if visible"
  },
  "patient": {
    "name": "Patient Name if visible, or Patient",
    "age": "Age if visible, or N/A",
    "gender": "Male/Female if visible, or N/A"
  },
  "date": "Prescription date if visible, or Current Date",
  "diagnosis": "Clinical diagnosis, symptoms, or impression (e.g. Acute Bronchitis, Type 2 Diabetes)",
  "medications": [
    {
      "drug_name": "Full drug / brand / chemical name",
      "dosage": "Dosage strength (e.g. 500mg, 625mg, 10ml, etc.)",
      "frequency": "Frequency (e.g. 1-0-1, OD, BD, TDS, Twice Daily, SOS)",
      "duration": "Duration (e.g. 5 days, 1 week, 30 days)",
      "instructions": "Instructions (e.g. After meals, Before breakfast, At bedtime)"
    }
  ],
  "raw_text": "All recognized lines of text from the image, transcribed verbatim."
}

CRITICAL RULES:
1. Return ONLY valid, raw JSON. Do not wrap in markdown ```json or backticks.
2. Read handwriting carefully. Infer correct medical drug spelling using your clinical knowledge.
3. If handwriting is ambiguous, provide the most likely pharmaceutical match.
"""

            response = self.model.generate_content([prompt, pil_image])
            raw_text = response.text.strip()

            # Clean potential markdown wrapping
            if raw_text.startswith("```"):
                raw_text = re.sub(r"^```(?:json)?\s*", "", raw_text)
                raw_text = re.sub(r"\s*```$", "", raw_text)

            parsed_json = json.loads(raw_text)
            print(f"[VLM Engine] Successfully parsed prescription via Gemini Flash Vision: {len(parsed_json.get('medications', []))} medications found.")
            return parsed_json

        except Exception as e:
            print(f"[VLM Engine] Vision inference error: {e}")
            return None
