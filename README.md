
# 🔒 Zero-Knowledge Medical Prescription Vault

A privacy-preserving, tamper-evident e-prescription management system combining **Deep Learning OCR**, **Role-Based Access Control (RBAC)**, **Zero-Knowledge Selective Disclosure**, **AES-256-GCM Cryptographic Vaulting**, and **Automated Anomaly Detection**.

---

## 🏛️ System Architecture

```text
[ React (Vite + Tailwind CSS + Lucide) ]
                 │
                 ▼ (REST API / JWT Auth)
[ Node.js + Express Backend Engine ]
  ├── RBAC Middleware (Patient, Doctor, Pharmacist, SecOps Auditor)
  ├── Anomaly Detection & IDS (IP Rate-Limits, Rapid Replay Prevention)
  ├── Cryptographic Vault
  │     ├── AES-256-GCM (Authenticated Encryption at Rest with 12-byte IV)
  │     ├── SHA-256 (Deterministic Tamper-Evident Canonical Fingerprint)
  │     ├── RSA-2048 Digital Signatures (Doctor Private Key Signing)
  │     └── Selective Disclosure (Zero-Knowledge: Hides Diagnosis from Pharmacist)
  │     │
  │     └── Prisma ORM (SQLite / PostgreSQL)
  │
  ▼ (Forward Image)
[ Python FastAPI AI Microservice (Port 8000) ]
  ├── Image Preprocessing (OpenCV: CLAHE contrast, adaptive binarization)
  ├── OCR Text Extractor (EasyOCR / Tesseract with intelligent fallback)
  └── Medical Entity Parser (Extracts Doctor, Clinic, Diagnosis, Medications, Dosages)
```

---

## 🔑 Key Features & Security Innovations

### 1. Zero-Knowledge Selective Disclosure
* **The Healthcare Problem:** Pharmacists need to know *what* medications to dispense, but have no legal or medical right to know sensitive diagnoses (e.g., oncology, psychiatric therapy, HIV status).
* **Our Solution:** The backend encrypts the diagnosis and medications as **separate AES-256-GCM ciphertext blobs**. When a Pharmacist looks up the prescription, the diagnosis is cryptographically redacted (`[REDACTED: Protected by Zero-Knowledge Selective Disclosure]`), while medications and doctor verification are fully transparent.

### 2. Tamper-Evident Integrity Fingerprinting (SHA-256 + RSA-2048)
* Before storage, a canonical representation of the prescription is computed and hashed with **SHA-256**.
* The issuing Doctor signs this hash using their **RSA private key**.
* Any database corruption, unauthorized tampering, or bit-flipping is caught in real-time by the verification engine.

### 3. Double-Fill & Replay Attack Defense
* Prevents patients from reusing an opioid/antibiotic prescription at multiple pharmacies.
* Implements an immutable state machine: `ISSUED` ➔ `DISPENSED`.
* Any repeat attempt triggers an instant **CRITICAL DOUBLE_FILL_ATTACK** alert in the security monitoring dashboard.

### 4. Rapid Request Anomaly Detection
* Sliding-window rate limiter monitors requests per IP and prescription fill frequency.
* Spikes in rapid prescription queries (>20 requests in 10s or rapid dispense bursts) trigger automated threat alerts.

---

## 🚀 Quick Start Guide

### 1-Click Launch (Windows PowerShell)
From the root workspace folder, run:
```powershell
.\run_all.ps1
```
This automatically launches all three services:
1. **Python AI OCR Service:** `http://localhost:8000` (Docs at `http://localhost:8000/docs`)
2. **Node.js Express Backend:** `http://localhost:5000`
3. **React Vite Frontend:** `http://localhost:5173`

---

## 👥 Demo Credentials (1-Click Switcher Available on Login Page)

| Role | Name | Email | Password | Responsibilities |
| :--- | :--- | :--- | :--- | :--- |
| **Doctor** | Dr. Sarah Jenkins | `doctor@hospital.org` | `password123` | Upload slips for OCR, review AI extraction, sign with private key |
| **Patient** | Aarav Patel | `patient@vault.org` | `password123` | Inspect personal vault, copy Pharmacy Dispense ID |
| **Pharmacist** | Liam Vance, R.Ph | `pharmacist@rxcare.org` | `password123` | Lookup ID, verify doctor signature, view meds only, dispense eRx |
| **Auditor** | Elena Rostova | `auditor@cybersecurity.org` | `password123` | Monitor IDS anomalies, audit logs, run tamper attack simulations |

---

## 👨‍💻 Team Task Division (3–4 Members)

* **Member 1 (Database, Auth & RBAC):**
  * Prisma schema (`backend/prisma/schema.prisma`), SQLite/Postgres configuration, JWT authentication, and RBAC role guards.
* **Member 2 (Frontend & UI/UX):**
  * React dashboards (`DoctorDashboard.jsx`, `PatientDashboard.jsx`, `PharmacistDashboard.jsx`, `SecurityDashboard.jsx`, `PrescriptionModal.jsx`).
* **Member 3 (AI & OCR Pipeline):**
  * Python FastAPI microservice (`ai_service/main.py`), OpenCV image enhancement (`preprocessor.py`), and entity parser (`parser.py`).
* **Member 4 (Cryptography & Anomaly Detection):**
  * AES-256-GCM encryption, SHA-256 canonical hashing, RSA-2048 signing (`cryptoService.js`), and sliding-window anomaly detector (`anomalyDetector.js`).
