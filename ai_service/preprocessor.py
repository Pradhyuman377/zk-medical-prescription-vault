import cv2
import numpy as np
from PIL import Image
import io

class ImagePreprocessor:
    """
    Medical prescription image preprocessor using OpenCV.
    Performs noise removal, contrast adjustment, and adaptive binarization 
    to make handwriting and printed prescription text OCR-ready.
    """
    
    @staticmethod
    def preprocess_image_bytes(image_bytes: bytes) -> np.ndarray:
        # Convert bytes to numpy array
        nparr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if img is None:
            raise ValueError("Failed to decode image from bytes.")
            
        return ImagePreprocessor.enhance_for_ocr(img)

    @staticmethod
    def enhance_for_ocr(img: np.ndarray) -> np.ndarray:
        # 1. Convert to grayscale
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        
        # 2. Resize if too small (upscaling enhances OCR on low-res slips)
        h, w = gray.shape
        if w < 1000:
            scale = 1200 / w
            gray = cv2.resize(gray, None, fx=scale, fy=scale, interpolation=cv2.INTER_CUBIC)

        # 3. Apply contrast stretching using CLAHE (Contrast Limited Adaptive Histogram Equalization)
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
        contrast_enhanced = clahe.apply(gray)

        # 4. Light Gaussian blur to eliminate high-frequency paper grain/noise
        blurred = cv2.GaussianBlur(contrast_enhanced, (3, 3), 0)

        # 5. Adaptive thresholding to separate ink from background paper
        binary = cv2.adaptiveThreshold(
            blurred, 255, 
            cv2.ADAPTIVE_THRESH_GAUSSIAN_C, 
            cv2.THRESH_BINARY, 11, 2
        )

        return binary
