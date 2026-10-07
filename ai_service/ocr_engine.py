import io
import threading
import numpy as np
import cv2
from PIL import Image

class OCREngine:
    """
    Intelligent Prescription OCR Engine using EasyOCR (PyTorch CRAFT + CRNN).
    Extracts text from uploaded images with fallback to OpenCV preprocessed matrix.
    """

    def __init__(self):
        self.easy_reader = None
        self.backend = 'initializing'
        self.is_loading = True
        # Start background model loader
        threading.Thread(target=self._load_easyocr_model, daemon=True).start()

    def _load_easyocr_model(self):
        try:
            print("[OCR Engine] Loading EasyOCR PyTorch neural weights...")
            import easyocr
            self.easy_reader = easyocr.Reader(['en'], gpu=False, verbose=False)
            self.backend = 'easyocr'
            self.is_loading = False
            print("[OCR Engine] SUCCESS: EasyOCR neural vision model ready!")
        except Exception as e:
            print(f"[OCR Engine] Notice: EasyOCR loading: {e}.")
            self.backend = 'image_analyzer'
            self.is_loading = False

    def extract_text(self, processed_img: np.ndarray, original_bytes: bytes) -> str:
        # 1. If EasyOCR is ready, use it for deep learning recognition
        if self.easy_reader is not None:
            try:
                # Convert bytes to numpy RGB image for highest EasyOCR accuracy
                nparr = np.frombuffer(original_bytes, np.uint8)
                img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

                # First try raw image
                results = self.easy_reader.readtext(img, detail=0)

                # If few results, try processed contrast-enhanced image
                if len(results) < 3 and processed_img is not None:
                    alt_results = self.easy_reader.readtext(processed_img, detail=0)
                    if len(alt_results) > len(results):
                        results = alt_results

                if results:
                    joined = "\n".join(results)
                    print(f"[OCR] EasyOCR detected {len(results)} text segments from image:")
                    for idx, line in enumerate(results[:10]):
                        print(f"  [{idx+1}] {line}")
                    return joined
                else:
                    print("[OCR] EasyOCR detected 0 text segments.")
                    return ""
            except Exception as e:
                print(f"[OCR] EasyOCR inference error: {e}")

        return ""
