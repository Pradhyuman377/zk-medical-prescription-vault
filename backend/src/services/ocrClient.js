const axios = require('axios');
const FormData = require('form-data');

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://127.0.0.1:8000';

class OCRClient {
  /**
   * Forwards uploaded image buffer to Python FastAPI OCR microservice
   */
  static async extractPrescription(fileBuffer, originalFilename, mimetype) {
    try {
      const formData = new FormData();
      formData.append('file', fileBuffer, {
        filename: originalFilename || 'prescription.jpg',
        contentType: mimetype || 'image/jpeg'
      });

      const response = await axios.post(`${AI_SERVICE_URL}/api/ocr/extract`, formData, {
        headers: {
          ...formData.getHeaders(),
        },
        timeout: 30000 // 30s timeout for image processing
      });

      return response.data;
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        throw new Error(`AI OCR service is unreachable at ${AI_SERVICE_URL}. Please ensure the Python service is running on port 8000.`);
      }
      throw error;
    }
  }

  /**
   * TASK 8: Calls AI Service Drug-Drug Interaction Checker microservice
   */
  static async checkInteractions(medications) {
    try {
      const response = await axios.post(`${AI_SERVICE_URL}/api/interactions/check`, {
        medications: Array.isArray(medications) ? medications : []
      }, {
        timeout: 10000
      });
      return response.data;
    } catch (error) {
      console.warn(`[OCR Client] Interaction checker failed or unavailable (${error.message}). Using local fallback checker.`);
      // Local fallback interaction checker if AI service is offline
      const drugList = (medications || []).map(m => (typeof m === 'string' ? m : m.drug_name || '').toLowerCase());
      const flagged = [];
      
      const pairs = [
        { drug_a: 'warfarin', drug_b: 'aspirin', severity: 'HIGH', risk: 'Severe bleeding risk / hemorrhagic stroke' },
        { drug_a: 'metformin', drug_b: 'alcohol', severity: 'HIGH', risk: 'Lactic acidosis risk' },
        { drug_a: 'ciprofloxacin', drug_b: 'antacid', severity: 'MEDIUM', risk: 'Reduced fluoroquinolone antibiotic absorption' },
        { drug_a: 'atorvastatin', drug_b: 'clarithromycin', severity: 'HIGH', risk: 'Increased statin concentration and rhabdomyolysis risk' },
        { drug_a: 'ibuprofen', drug_b: 'aspirin', severity: 'MEDIUM', risk: 'Increased gastrointestinal ulceration risk' }
      ];

      for (const pair of pairs) {
        const hasA = drugList.some(d => d.includes(pair.drug_a));
        const hasB = drugList.some(d => d.includes(pair.drug_b));
        if (hasA && hasB) {
          flagged.push(pair);
        }
      }

      return {
        success: true,
        source: 'backend_fallback_rule_engine',
        flagged_count: flagged.length,
        interactions: flagged
      };
    }
  }
}

module.exports = OCRClient;

