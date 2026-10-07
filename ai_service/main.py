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

app = FastAPI(
    title="Zero-Knowledge Prescription Vault - Multimodal AI/VLM Microservice",
    description="Multimodal Vision-Language Model (Gemini Flash) + EasyOCR for handwritten medical prescription HTR.",
    version="2.0.0"
)

# Enable CORS for local dev
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
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

@app.get("/health", response_model=HealthResponse)
def health_check():
    return {
        "status": "healthy",
        "vlm_active": vlm_engine.is_configured,
        "vlm_model": "gemini-1.5-flash" if vlm_engine.is_configured else "none",
        "ocr_backend": ocr_engine.backend,
        "timestamp": time.time()
    }

@app.post("/api/ocr/extract")
async def extract_prescription(file: UploadFile = File(...)) -> Dict[str, Any]:
    """
    Accepts an uploaded prescription image:
    1. If VLM (Gemini Flash) is configured, uses multimodal Vision AI for near-human handwriting extraction.
    2. Fallback to EasyOCR deep learning pipeline + OpenCV image preprocessing.
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

        raw_text = ocr_engine.extract_text(processed_matrix, image_bytes)
        parsed_data = PrescriptionParser.parse(raw_text)
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
