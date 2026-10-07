from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, Any, List
import time
import os

from preprocessor import ImagePreprocessor
from ocr_engine import OCREngine
from parser import PrescriptionParser

app = FastAPI(
    title="Zero-Knowledge Prescription Vault - AI/OCR Microservice",
    description="Extracts structured medical entities (Doctor, Diagnosis, Medications) from prescription slips.",
    version="1.0.0"
)

# Enable CORS for local dev
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize engines
ocr_engine = OCREngine()

class HealthResponse(BaseModel):
    status: str
    ocr_backend: str
    timestamp: float

@app.get("/health", response_model=HealthResponse)
def health_check():
    return {
        "status": "healthy",
        "ocr_backend": ocr_engine.backend,
        "timestamp": time.time()
    }

@app.post("/api/ocr/extract")
async def extract_prescription(file: UploadFile = File(...)) -> Dict[str, Any]:
    """
    Accepts an uploaded image file (PNG, JPG, JPEG, WEBP),
    runs OpenCV image preprocessing, applies OCR,
    and returns structured medical entities.
    """
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Uploaded file must be an image.")

    try:
        image_bytes = await file.read()
        start_time = time.time()

        # Step 1: Image Enhancement via OpenCV
        try:
            processed_matrix = ImagePreprocessor.preprocess_image_bytes(image_bytes)
        except Exception as e:
            # Fallback if image decode fails
            processed_matrix = None

        # Step 2: OCR Text Extraction
        raw_text = ocr_engine.extract_text(processed_matrix, image_bytes)

        # Step 3: Entity Recognition & Structured Parsing
        parsed_data = PrescriptionParser.parse(raw_text)
        
        elapsed = round(time.time() - start_time, 3)

        return {
            "success": True,
            "processing_time_sec": elapsed,
            "ocr_backend_used": ocr_engine.backend,
            "filename": file.filename,
            "prescription_data": parsed_data
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"OCR Extraction failed: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
