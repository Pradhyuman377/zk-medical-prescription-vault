from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, Any, List
import time
import os

from preprocessor import ImagePreprocessor
from ocr_engine import OCREngine
from parser import PrescriptionParser
from vlm_engine import VLMEngine
from drug_interactions import check_interactions

app = FastAPI(
    title="Zero-Knowledge Prescription Vault - Multimodal AI/VLM Microservice",
    description="Multimodal Vision-Language Model (Gemini Flash) + EasyOCR for handwritten medical prescription HTR with Drug Interaction Analysis.",
    version="2.1.0"
)

# Hardened CORS: Restrict exclusively to Frontend and Backend origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5000",
        "http://127.0.0.1:5000",
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

# Initialize Vision-Language Model and Local OCR engines
vlm_engine = VLMEngine()
ocr_engine = OCREngine()

class HealthResponse(BaseModel):
    status: str
    vlm_active: bool
    vlm_model: str
    ocr_backend: str
    timestamp: float

class InteractionRequest(BaseModel):
    medications: List[Any]

@app.get("/health", response_model=HealthResponse)
def health_check():
    return {
        "status": "healthy",
        "vlm_active": vlm_engine.is_configured,
        "vlm_model": "gemini-1.5-flash" if vlm_engine.is_configured else "none",
        "ocr_backend": ocr_engine.backend,
        "timestamp": time.time()
    }

@app.post("/api/interactions/check")
def api_check_interactions(req: InteractionRequest):
    """
    TASK 8: Clinical Drug-Drug Interaction Checker.
    Identifies hazardous adverse interactions across prescribed medicines.
    """
    flagged = check_interactions(req.medications)
    return {
        "success": True,
        "medications_analyzed": len(req.medications),
        "flagged_count": len(flagged),
        "interactions": flagged
    }

@app.post("/api/ocr/extract")
async def extract_prescription(file: UploadFile = File(...)) -> Dict[str, Any]:
    """
    Accepts an uploaded prescription image:
    1. If VLM (Gemini Flash) is configured, uses multimodal Vision AI for handwriting extraction.
    2. Fallback to EasyOCR deep learning pipeline (detail=1) + OpenCV image preprocessing + Confidence Scoring.
    """
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Uploaded file must be an image.")

    try:
        image_bytes = await file.read()
        start_time = time.time()

        # Step 1: Multimodal Vision-Language Model (VLM) if configured
        if vlm_engine.is_configured:
            vlm_result = vlm_engine.extract_with_vision(image_bytes)
            if vlm_result and vlm_result.get("medications"):
                # Ensure confidence scores present on medications
                for m in vlm_result.get("medications", []):
                    if "confidence" not in m:
                        m["confidence"] = 0.96
                elapsed = round(time.time() - start_time, 3)
                return {
                    "success": True,
                    "pipeline_used": "Gemini 1.5 Flash Vision (VLM)",
                    "processing_time_sec": elapsed,
                    "filename": file.filename,
                    "prescription_data": vlm_result
                }

        # Step 2: Fallback to EasyOCR + OpenCV preprocessor
        try:
            processed_matrix = ImagePreprocessor.preprocess_image_bytes(image_bytes)
        except Exception:
            processed_matrix = None

        # TASK 9: Detail=1 OCR text extraction with per-segment confidence
        raw_text, segments = ocr_engine.extract_text(processed_matrix, image_bytes)
        parsed_data = PrescriptionParser.parse(raw_text, segments)
        elapsed = round(time.time() - start_time, 3)

        return {
            "success": True,
            "pipeline_used": "EasyOCR (Local Deep Learning)",
            "processing_time_sec": elapsed,
            "filename": file.filename,
            "prescription_data": parsed_data
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prescription extraction failed: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
