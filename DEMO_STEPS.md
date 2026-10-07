# 🧪 Zero-Knowledge Medical Prescription Vault – Demo Walkthrough & Evaluation Guide

This guide provides a structured, step-by-step script for demonstrating the project to professors, examiners, or hackathon judges. It highlights the **AI/OCR pipeline**, **AES-256-GCM encryption**, **Zero-Knowledge Selective Disclosure**, and **Anomaly Detection**.

---

## ⚡ 1. Launching the Services

Open Windows PowerShell in the project root (`d:\ISC_project`) and run:

```powershell
.\run_all.ps1
```

Confirm all three services are active:
* **Frontend Application:** [http://localhost:5173](http://localhost:5173)
* **Backend REST API:** [http://localhost:5000](http://localhost:5000)
* **Python AI OCR Service:** [http://localhost:8000/docs](http://localhost:8000/docs)

---

## 🎭 2. Demo User Personas (1-Click Switcher)

On the login page ([http://localhost:5173](http://localhost:5173)), you can click the quick-login cards:

| Card | Persona | Role | Key Function to Demonstrate |
| :--- | :--- | :--- | :--- |
| 👨‍⚕️ **Doctor** | Dr. Sarah Jenkins | `DOCTOR` | Uploads slip, AI extracts entities, signs with RSA private key |
| 🧑 **Patient** | Aarav Patel | `PATIENT` | Inspects full record, shares Pharmacy Dispense ID |
| 💊 **Pharmacist** | Liam Vance, R.Ph | `PHARMACIST` | Verifies doctor signature, sees meds only (diagnosis is hidden) |
| 🛡️ **SecOps Auditor**| Elena Rostova | `AUDITOR` | Inspects live IDS anomalies and cryptographic audit logs |

---

## 📋 3. Step-by-Step Live Demonstration Script

### 🎬 Scenario 1: The Doctor Issues a Tamper-Proof Prescription (AI + Crypto)

1. **Log in as Doctor:**
   * On the login screen, click the **Doctor** demo card (`doctor@hospital.org`).
2. **Upload Slip for AI OCR Extraction:**
   * In the **Upload Prescription Slip** section, click the file box and choose an image of a prescription (or any test slip image).
   * Click **"Extract Medical Entities via AI"**.
   * **What to show the evaluator:**
     * Point out that the request calls the **Python FastAPI microservice** on port 8000.
     * OpenCV cleans up the image (binarization + contrast enhancement).
     * The parser automatically extracts the **Doctor name**, **Clinic**, **Confidential Diagnosis**, and structured **Medications with dosages and frequencies**.
3. **Cryptographically Seal the e-Prescription:**
   * Review the extracted fields in the clinical form.
   * Click **"Sign, Hash (SHA-256) & Seal to Vault"**.
   * **What to show the evaluator:**
     * The system computes a canonical **SHA-256 tamper-evident fingerprint**.
     * The doctor signs the hash using their **RSA-2048 private key**.
     * Diagnosis and medications are encrypted into the database using **AES-256-GCM**.
     * Copy or note the newly issued **Prescription ID**.

---

### 🎬 Scenario 2: The Patient Accesses Their Vault (Privacy at Rest)

1. **Log in as Patient:**
   * Click the sign-out icon in the top right.
   * Click the **Patient** demo card (`patient@vault.org`).
2. **Inspect the Vault Record:**
   * In **"My Vault"**, locate the prescription just issued by the doctor.
   * Click **"View & Decrypt Full eRx"**.
   * Notice that because the user is the **Patient**, they can view their **Confidential Diagnosis** as well as their prescribed medications.
   * Close the modal and click the **Copy icon** next to **Pharmacy Dispense ID**.

---

### 🎬 Scenario 3: The Pharmacist & Zero-Knowledge Selective Disclosure

1. **Log in as Pharmacist:**
   * Sign out and click the **Pharmacist** demo card (`pharmacist@rxcare.org`).
2. **Lookup the Prescription:**
   * In the **"Lookup Patient Prescription ID"** search bar, paste the copied Prescription ID and click **"Verify & Inspect"**.
3. **Demonstrate Selective Disclosure (The Zero-Knowledge Innovation):**
   * **Point this out to the evaluator:**
     * Look at the **Confidential Diagnosis** field: It reads:  
       `[REDACTED: Protected by Zero-Knowledge Selective Disclosure]`
     * A yellow banner alerts the user: *"As a Pharmacist, you are granted cryptographic access only to authorized medications and doctor validation. Confidential diagnosis is withheld to protect patient privacy."*
     * In the cryptographic proof badges, confirm:
       * **SHA-256 Integrity:** `Tamper Proof (Verified)`
       * **Doctor RSA Signature:** `Authentic (Valid Key)`
4. **Fulfill the Prescription:**
   * Click **"Fulfill & Dispense eRx"**.
   * Status changes from `ISSUED` to `DISPENSED`.

---

### 🎬 Scenario 4: Testing the Anomaly Detector & Cryptographic Guards

#### 🚨 Test A: Double-Fill / Replay Attack Defense
1. While still in the Pharmacist portal, open the **same prescription** that was just dispensed.
2. Click **"Fulfill & Dispense eRx"** again (or attempt to dispense it).
3. **Result:** The system blocks the request immediately with a **"SECURITY REPLAY ALERT: This prescription has ALREADY been dispensed!"**
4. This prevents a patient from visiting multiple pharmacies to get duplicate opioid or controlled-substance refills.

#### 🚨 Test B: Live Cryptographic Tamper Detection
1. Open any prescription in the modal.
2. At the bottom left, click the red button **"Simulate Tamper Attack"**.
3. Confirm the prompt. The backend deliberately corrupts the SHA-256 hash in the database to simulate unauthorized SQL manipulation or bit-flipping.
4. When the prescription reloads, observe:
   * **SHA-256 Integrity Badge:** Flashes **RED** with **"TAMPER DETECTED! HASH MISMATCH"**.
   * The "Fulfill & Dispense" action is automatically disabled because data integrity is compromised.

#### 🚨 Test C: SecOps Command Center & Audit Trail
1. In the top navigation bar, click **"Security & Anomaly Logs"** (or log in using the `AUDITOR` persona).
2. Show the evaluator:
   * **Real-Time Anomaly Alerts:** Shows the `DOUBLE_FILL_ATTACK` and `TAMPER_DETECTED` events with timestamp, severity, and actor IP address.
   * **Cryptographic Access Audit Trail:** Shows the exact timeline of who viewed, issued, or fulfilled the prescription.

---

## 💡 Key Talking Points for Evaluators / Viva Questions

| Question | Strong Answer |
| :--- | :--- |
| **"Why is this called Zero-Knowledge if you use AES-256?"** | Traditional healthcare systems send the entire clinical file to pharmacists. We implemented **Selective Disclosure**: sensitive clinical notes and diagnoses are encrypted as isolated ciphertext blobs. The pharmacist can verify the prescription's authenticity and view medication dosages without gaining knowledge of the underlying disease or diagnosis. |
| **"Why a Python FastAPI microservice instead of Tesseract.js?"** | Real medical slips feature handwriting, abbreviations (`1-0-1`, `TDS`, `mg`), stamps, and non-standard layouts. Pure JS OCR lacks structured entity recognition. Python allows OpenCV image enhancement (CLAHE, adaptive binarization) and deep learning models (EasyOCR / Vision-LLMs) to output clean, structured JSON. |
| **"How do you prove a prescription wasn't forged by someone with DB access?"** | We use asymmetric **RSA-2048 digital signatures**. Every doctor has an individual private key. The SHA-256 fingerprint is signed with this key. Even if an attacker modifies the database directly, they cannot produce a valid doctor signature without the doctor's private key. |
| **"How do you prevent duplicate drug claims?"** | We employ a state machine (`ISSUED` ➔ `DISPENSED`) coupled with an anomaly detection middleware. Any rapid attempt or second dispense attempt triggers a **`DOUBLE_FILL_ATTACK`** security alert. |
