import React, { useState } from 'react';
import { 
  ShieldCheck, Lock, Key, QrCode, FileText, CheckCircle2, 
  ArrowRight, Cpu, EyeOff, X, Sparkles, RefreshCw, Layers 
} from 'lucide-react';

export default function CryptoVisualizerModal({ isOpen, onClose }) {
  const [activeStep, setActiveStep] = useState(0);

  if (!isOpen) return null;

  const steps = [
    {
      id: 'ocr',
      stepNum: 1,
      title: 'AI OCR & Entity Parsing',
      subtitle: 'Computer Vision & Deep Learning',
      badge: 'CRAFT + CRNN (FastAPI)',
      badgeColor: 'border-cyan-500/30 text-cyan-400 bg-cyan-500/10',
      icon: Cpu,
      description: 'Handwritten or printed prescription slips are scanned via PyTorch EasyOCR. OpenCV normalizes contrast while our medical parser extracts drug names, dosages, frequencies, and durations with individual confidence scores.',
      formula: 'Image \\to OpenCV(Binarize) \\to CRNN(Tokens) \\to \\{Drug, Dosage, Freq, Dur\\}',
      sampleInput: {
        rawSlip: 'Amoxicillin 500mg tid x 5 days, Paracetamol 650mg prn',
        ocrConfidence: '94.2%'
      },
      sampleOutput: {
        medications: [
          { drug: 'Amoxicillin', dosage: '500mg', frequency: '1-0-1', duration: '5 days', confidence: 0.96 },
          { drug: 'Paracetamol', dosage: '650mg', frequency: 'PRN', duration: '3 days', confidence: 0.92 }
        ]
      }
    },
    {
      id: 'selective_disclosure',
      stepNum: 2,
      title: 'Zero-Knowledge Selective Disclosure',
      subtitle: 'Confidentiality Enforced by AES-256-GCM',
      badge: 'Dual AES-256 Keys',
      badgeColor: 'border-amber-500/30 text-amber-400 bg-amber-500/10',
      icon: EyeOff,
      description: 'The core privacy mechanism: The patient clinical diagnosis is encrypted with an isolated ECDH-derived key known only to the Doctor and Patient. Pharmacists receive only the medication cipher and tamper hash.',
      formula: 'C_{diag} = \\text{AES-256-GCM}(K_{doc-pt}, \\text{Diagnosis}), \\quad C_{meds} = \\text{AES-256-GCM}(K_{pharm}, \\text{Medications})',
      sampleInput: {
        confidentialDiagnosis: 'Acute Bacterial Sinusitis (Patient Consent: Private)',
        visibility: 'DOCTOR & PATIENT ONLY (Hidden from Pharmacy)'
      },
      sampleOutput: {
        pharmacistView: '[REDACTED: Protected by Zero-Knowledge Selective Disclosure]',
        patientView: 'Acute Bacterial Sinusitis'
      }
    },
    {
      id: 'sha256',
      stepNum: 3,
      title: 'Cryptographic SHA-256 Tamper Hash',
      subtitle: 'Mathematical Immutability & Anti-Forgery',
      badge: 'SHA-256 Integrity',
      badgeColor: 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10',
      icon: ShieldCheck,
      description: 'A canonical cryptographic digest is computed across all prescription elements (Doctor ID, Patient ID, Clinic, Medications, Timestamp). If a malicious party alters even a single character, the resulting hash completely changes.',
      formula: 'H = \\text{SHA-256}(ID_{doc} \\parallel ID_{pt} \\parallel C_{diag} \\parallel C_{meds} \\parallel \\text{Timestamp})',
      sampleInput: {
        payloadSize: '1,428 bytes (Canonical JSON)',
        avalancheEffect: '1 bit flip changes 50%+ of hash bits'
      },
      sampleOutput: {
        tamperHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'
      }
    },
    {
      id: 'rsa',
      stepNum: 4,
      title: 'Doctor RSA-2048 Digital Signature',
      subtitle: 'Non-Repudiation & Medical Authority',
      badge: 'RSA-PSS / PKCS#1 v1.5',
      badgeColor: 'border-blue-500/30 text-blue-400 bg-blue-500/10',
      icon: Key,
      description: 'The issuing physician uses their private RSA-2048 key to sign the SHA-256 hash. Any pharmacy or auditor verifies this signature with the doctor’s public certificate, proving the prescription was sealed by a licensed medical authority.',
      formula: 'S = \\text{Sign}_{PrivKey_{doc}}(H) \\implies \\text{Verify}_{PubKey_{doc}}(H, S) = \\text{TRUE}',
      sampleInput: {
        signingKey: 'RSA 2048-bit Private Key (PKCS#8)',
        certificateHolder: 'Dr. Sarah Jenkins, MD (License #MD-88421)'
      },
      sampleOutput: {
        signatureHex: '3a8f1b9c02e5d7... [256 bytes RSA Signature Block]',
        verifiedStatus: 'AUTHENTIC & UNTAMPERED'
      }
    },
    {
      id: 'qr_hmac',
      stepNum: 5,
      title: 'HMAC-SHA256 QR Dispense Verification',
      subtitle: 'One-Time Verification at Pharmacy',
      badge: 'HMAC-SHA256 Token',
      badgeColor: 'border-purple-500/30 text-purple-400 bg-purple-500/10',
      icon: QrCode,
      description: 'The patient presents an HMAC-signed QR code to the pharmacist. The pharmacy app validates the HMAC signature, confirms the prescription status is ISSUED (not REVOKED or previously DISPENSED), and logs the event to the audit hash chain.',
      formula: 'Token = \\text{Base64}(ID \\parallel Timestamp \\parallel \\text{HMAC}_{Secret}(ID \\parallel Timestamp))',
      sampleInput: {
        qrPayload: '{"id":"rx_8f29...","sig":"c0b7...","exp":1761000000}',
        antiReplay: 'Timestamp nonce prevents replay attacks'
      },
      sampleOutput: {
        verificationOutcome: 'PASSED (Doctor Authentic + Tamper Proof + Not Dispensed)',
        dispenseAction: 'Status updated to DISPENSED & chained to audit trail'
      }
    }
  ];

  const current = steps[activeStep];
  const StepIcon = current.icon;

  return (
    <div className="fixed inset-0 z-[9999] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/20 flex-shrink-0">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                ZK-Prescription Cryptography Architecture
              </h2>
              <p className="text-xs text-slate-400">
                End-to-end zero-knowledge security, tamper-proofing, and selective disclosure pipeline
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Selector Tabs */}
        <div className="grid grid-cols-5 border-b border-slate-800 bg-slate-950/40 p-2 gap-1.5 sm:gap-2">
          {steps.map((s, idx) => {
            const Icon = s.icon;
            const isActive = activeStep === idx;
            return (
              <button
                key={s.id}
                onClick={() => setActiveStep(idx)}
                className={`py-2 px-1 sm:px-3 rounded-xl text-xs font-medium flex flex-col sm:flex-row items-center justify-center gap-1.5 transition-all ${
                  isActive
                    ? 'bg-slate-800 text-white shadow-md border border-slate-700 font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
                }`}
              >
                <div className={`w-5 h-5 rounded-lg flex items-center justify-center text-[11px] font-bold ${
                  isActive ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-300'
                }`}>
                  {s.stepNum}
                </div>
                <span className="hidden md:inline truncate">{s.title.split(' ')[0]}</span>
              </button>
            );
          })}
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6">
          {/* Top Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-slate-950/80 border border-slate-800">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-emerald-400">
                <StepIcon className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-semibold text-emerald-400">STEP {current.stepNum} OF 5</span>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${current.badgeColor}`}>
                    {current.badge}
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-bold text-white mt-0.5">{current.title}</h3>
                <p className="text-xs text-slate-400">{current.subtitle}</p>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">How It Protects the Patient & Doctor</h4>
            <p className="text-sm text-slate-300 leading-relaxed bg-slate-950/40 p-4 rounded-xl border border-slate-800/80">
              {current.description}
            </p>
          </div>

          {/* Mathematical / Cryptographic Formula */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Cryptographic Primitive / Logic Formula</h4>
            <div className="p-3.5 rounded-xl bg-slate-950 border border-emerald-500/20 font-mono text-xs text-emerald-300 overflow-x-auto shadow-inner">
              {current.formula}
            </div>
          </div>

          {/* Interactive Input / Output Inspector */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-blue-400" />
                Input Payload
              </h4>
              <pre className="p-3.5 rounded-xl bg-slate-950/90 border border-slate-800 font-mono text-[11px] text-slate-300 overflow-x-auto leading-relaxed max-h-48">
                {JSON.stringify(current.sampleInput, null, 2)}
              </pre>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                Cryptographic Output / Verified State
              </h4>
              <pre className="p-3.5 rounded-xl bg-slate-950/90 border border-slate-800 font-mono text-[11px] text-emerald-300 overflow-x-auto leading-relaxed max-h-48">
                {JSON.stringify(current.sampleOutput, null, 2)}
              </pre>
            </div>
          </div>
        </div>

        {/* Footer Navigation */}
        <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <button
            onClick={() => setActiveStep((prev) => Math.max(0, prev - 1))}
            disabled={activeStep === 0}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-800 disabled:opacity-40 disabled:hover:bg-slate-800/80 transition-all"
          >
            ← Previous Step
          </button>

          <div className="flex items-center gap-1.5">
            {steps.map((_, i) => (
              <button
                key={i}
                onClick={() => setActiveStep(i)}
                className={`w-2 h-2 rounded-full transition-all ${
                  activeStep === i ? 'w-6 bg-emerald-400' : 'bg-slate-700 hover:bg-slate-600'
                }`}
                aria-label={`Go to step ${i + 1}`}
              />
            ))}
          </div>

          {activeStep < steps.length - 1 ? (
            <button
              onClick={() => setActiveStep((prev) => Math.min(steps.length - 1, prev + 1))}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-md transition-all flex items-center gap-1.5"
            >
              Next Step <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 shadow-md transition-all flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5" /> Complete
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
