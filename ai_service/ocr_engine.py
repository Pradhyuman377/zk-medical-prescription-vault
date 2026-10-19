import io
import threading
import numpy as np
import cv2
from typing import List, Dict, Any, Tuple
from PIL import Image

class OCREngine:
    """
    Intelligent Prescription OCR Engine using EasyOCR (PyTorch CRAFT + CRNN).
    Extracts text with character/word-level confidence scores (detail=1).
    """

    def __init__(self):
        self.easy_reader = None
        self.backend = 'initializing'
        self.is_loading = True
        self._load_lock = threading.Lock()
        threading.Thread(target=self._load_easyocr_model, daemon=True).start()

    def _load_easyocr_model(self):
        try:
            print("[OCR Engine] Loading EasyOCR PyTorch neural weights...")
            import easyocr
            reader = easyocr.Reader(['en'], gpu=False, verbose=False)
            with self._load_lock:
                self.easy_reader = reader
                self.backend = 'easyocr'
                self.is_loading = False
            print("[OCR Engine] SUCCESS: EasyOCR neural vision model ready!")
        except Exception as e:
            print(f"[OCR Engine] Notice: EasyOCR loading fallback: {e}.")
            with self._load_lock:
                self.backend = 'image_analyzer'
                self.is_loading = False

    def extract_text(self, processed_img: np.ndarray, original_bytes: bytes) -> Tuple[str, List[Dict[str, Any]]]:
        """
        TASK 9: Uses readtext(..., detail=1) to retrieve bounding boxes, text, and confidence scores.
        Returns:
            joined_text: str (concatenated lines)
            segments: List[{"text": str, "confidence": float}]
        """
        # If still loading in background thread, wait up to 10 seconds for it
        if self.is_loading:
            import time
            waited = 0
            while self.is_loading and waited < 15:
                time.sleep(0.5)
                waited += 0.5
        segments = []
        if self.easy_reader is not None:
            try:
                nparr = np.frombuffer(original_bytes, np.uint8)
                img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

                # detail=1 returns list of (bbox, text, prob)
                raw_results = self.easy_reader.readtext(img, detail=1)

                # Fallback to enhanced image if low recognition count
                if len(raw_results) < 3 and processed_img is not None:
                    alt_results = self.easy_reader.readtext(processed_img, detail=1)
                    if len(alt_results) > len(raw_results):
                        raw_results = alt_results

                for item in raw_results:
                    if len(item) >= 3:
                        text = str(item[1]).strip()
                        prob = float(item[2])
                    elif len(item) == 2:
                        text = str(item[0]).strip()
                        prob = float(item[1])
                    else:
                        text = str(item).strip()
                        prob = 0.85

                    if text:
                        segments.append({
                            "text": text,
                            "confidence": round(prob, 3)
                        })

                if segments:
                    joined = "\n".join(s["text"] for s in segments)
                    print(f"[OCR] EasyOCR detected {len(segments)} segments with confidence scores:")
                    for idx, s in enumerate(segments[:8]):
                        print(f"  [{idx+1}] {s['text']} (conf: {s['confidence']})")
                    return joined, segments

            except Exception as e:
                print(f"[OCR] EasyOCR inference error: {e}")

        # Return empty if nothing detected in image
        return "", []
