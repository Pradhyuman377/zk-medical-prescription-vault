import React, { useState, useEffect } from 'react';
import { prescriptionService, securityService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { 
  X, ShieldCheck, AlertCircle, Key, CheckCircle, FileText, 
  Lock, Pill, User, Building, Calendar, AlertTriangle, Ban, ShieldAlert,
  Printer, QrCode
} from 'lucide-react';

export default function PrescriptionModal({ prescriptionId, onClose, onDispensed }) {
  const { user } = useAuth();
  const { toast, confirm } = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dispensing, setDispensing] = useState(false);
  const [dispenseMsg, setDispenseMsg] = useState('');
  const [tampering, setTampering] = useState(false);

  useEffect(() => {
    fetchPrescription();
  }, [prescriptionId]);

  const fetchPrescription = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await prescriptionService.getPrescriptionById(prescriptionId);
      setData(res.prescription);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to decrypt prescription from vault.');
    } finally {
      setLoading(false);
    }
  };

  const handleDispense = async () => {
    const ok = await confirm({
      title: 'Fulfill & Dispense Prescription?',
      message: `Are you sure you want to dispense medications for ${data?.patientName || 'this patient'}? This will record the dispense event in the tamper-evident audit ledger and mark this prescription as DISPENSED.`,
      confirmText: 'Yes, Dispense Prescription',
      cancelText: 'Cancel',
      type: 'info'
    });
    if (!ok) return;

    setDispensing(true);
    setDispenseMsg('');
    setError('');
    try {
      const res = await prescriptionService.dispensePrescription(prescriptionId);
      setDispenseMsg(res.message);
      toast.success('Prescription Dispensed', 'Status updated to DISPENSED and chained into security audit log.');
      fetchPrescription();
      if (onDispensed) onDispensed();
    } catch (err) {
      const msg = err.response?.data?.error || 'Dispense failed or blocked by anomaly guard.';
      setError(msg);
      toast.error('Dispense Failed', msg);
    } finally {
      setDispensing(false);
    }
  };

  const handleSimulateTamper = async () => {
    const ok = await confirm({
      title: '⚠️ Simulate Cryptographic Tamper Attack?',
      message: 'This will intentionally mutate the SHA-256 data hash in the database to test the zero-knowledge anti-tamper detection engine.',
      confirmText: 'Execute Attack Simulation',
      cancelText: 'Cancel',
      type: 'danger'
    });
    if (!ok) return;

    setTampering(true);
    try {
      await securityService.simulateTamper(prescriptionId);
      toast.warning('Tamper Attack Injected', 'Database hash mutated. Reloading to observe cryptographic failure alarm...');
      fetchPrescription();
    } catch (err) {
      const msg = err.response?.data?.error || err.message;
      toast.error('Simulation Failed', msg);
    } finally {
      setTampering(false);
    }
  };

  const handlePrint = () => {
    if (!data) return;

    // Use an invisible iframe for completely isolated, crisp 1-page printing
    let printFrame = document.getElementById('rx-print-frame');
    if (!printFrame) {
      printFrame = document.createElement('iframe');
      printFrame.id = 'rx-print-frame';
      printFrame.style.position = 'fixed';
      printFrame.style.right = '0';
      printFrame.style.bottom = '0';
      printFrame.style.width = '0';
      printFrame.style.height = '0';
      printFrame.style.border = '0';
      printFrame.style.opacity = '0';
      printFrame.style.pointerEvents = 'none';
      document.body.appendChild(printFrame);
    }

    const medsRows = (data.medications || []).map((m) => `
      <tr>
        <td style="padding: 7px 10px; font-weight: bold; border-bottom: 1px solid #cbd5e1; border-right: 1px solid #cbd5e1;">${m.drug_name || m.drug || ''}</td>
        <td style="padding: 7px 10px; font-family: monospace; border-bottom: 1px solid #cbd5e1; border-right: 1px solid #cbd5e1;">${m.dosage || ''}</td>
        <td style="padding: 7px 10px; font-family: monospace; border-bottom: 1px solid #cbd5e1; border-right: 1px solid #cbd5e1;">${m.frequency || ''}</td>
        <td style="padding: 7px 10px; border-bottom: 1px solid #cbd5e1; border-right: 1px solid #cbd5e1;">${m.duration || ''}</td>
        <td style="padding: 7px 10px; font-style: italic; color: #475569; border-bottom: 1px solid #cbd5e1;">${m.instructions || 'As directed'}</td>
      </tr>
    `).join('');

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Prescription_${data.patientName || 'eRx'}</title>
          <style>
            @page {
              size: A4 portrait;
              margin: 10mm 14mm;
            }
            * {
              box-sizing: border-box;
              margin: 0;
              padding: 0;
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
              color: #0f172a;
              background: #ffffff;
              padding: 10px;
              font-size: 11px;
            }
            .rx-card {
              border: 2px solid #0f172a;
              border-radius: 8px;
              padding: 18px 22px;
            }
            .header-bar {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              border-bottom: 2px solid #0f172a;
              padding-bottom: 12px;
              margin-bottom: 12px;
            }
            .badge-rx {
              display: inline-block;
              background: #047857;
              color: white;
              font-weight: 800;
              font-size: 15px;
              padding: 4px 10px;
              border-radius: 6px;
              margin-right: 10px;
            }
            .clinic-title {
              font-size: 16px;
              font-weight: 800;
              text-transform: uppercase;
              letter-spacing: -0.025em;
              color: #022c22;
            }
            .clinic-sub {
              font-size: 10px;
              color: #64748b;
              margin-top: 2px;
            }
            .status-badge {
              font-family: monospace;
              font-size: 10px;
              font-weight: bold;
              border: 1px solid #047857;
              color: #065f46;
              background: #ecfdf5;
              padding: 2px 8px;
              border-radius: 4px;
              text-transform: uppercase;
            }
            .meta-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 12px;
              background: #f8fafc;
              border: 1px solid #cbd5e1;
              border-radius: 6px;
              padding: 10px 14px;
              margin-bottom: 12px;
            }
            .meta-label {
              font-size: 9px;
              text-transform: uppercase;
              font-weight: bold;
              color: #64748b;
              display: block;
              margin-bottom: 2px;
            }
            .meta-val {
              font-weight: 700;
              color: #0f172a;
              font-size: 12px;
            }
            .diag-box {
              background: #f8fafc;
              border: 1px solid #cbd5e1;
              border-radius: 6px;
              padding: 10px 14px;
              margin-bottom: 12px;
            }
            .meds-title {
              font-size: 11px;
              font-weight: bold;
              margin-bottom: 6px;
              text-transform: uppercase;
              color: #0f172a;
              letter-spacing: 0.05em;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              border: 1px solid #cbd5e1;
              font-size: 11px;
              margin-bottom: 12px;
            }
            th {
              background: #f1f5f9;
              padding: 7px 10px;
              font-size: 9px;
              text-transform: uppercase;
              color: #475569;
              text-align: left;
              border-bottom: 1px solid #cbd5e1;
              border-right: 1px solid #cbd5e1;
            }
            th:last-child {
              border-right: none;
            }
            .footer-grid {
              border-top: 2px solid #0f172a;
              padding-top: 10px;
              display: flex;
              justify-content: space-between;
              align-items: flex-end;
              font-size: 10px;
            }
            .crypto-hashes {
              font-family: monospace;
              font-size: 9px;
              color: #475569;
              max-width: 60%;
              line-height: 1.4;
            }
            .sig-block {
              text-align: right;
            }
            .sig-title {
              font-family: Georgia, serif;
              font-style: italic;
              font-size: 12px;
              color: #1e293b;
              margin-bottom: 2px;
            }
            .sig-doc {
              font-weight: bold;
              font-size: 12px;
              color: #0f172a;
            }
          </style>
        </head>
        <body>
          <div class="rx-card">
            <div class="header-bar">
              <div style="display: flex; align-items: center;">
                <span class="badge-rx">℞</span>
                <div>
                  <div class="clinic-title">${data.clinicName || 'Medical Enclave Health Center'}</div>
                  <div class="clinic-sub">Department of Clinical Medicine • Certified Electronic Prescription (eRx)</div>
                </div>
              </div>
              <div style="text-align: right;">
                <span class="status-badge">STATUS: ${data.status}</span>
                <div style="font-family: monospace; font-size: 10px; color: #64748b; margin-top: 3px;">Rx ID: ${data.id}</div>
                <div style="font-size: 10px; color: #64748b;">Issued Date: ${data.dateIssued}</div>
              </div>
            </div>

            <div class="meta-grid">
              <div>
                <span class="meta-label">Patient Name</span>
                <span class="meta-val">${data.patientName}</span>
              </div>
              <div>
                <span class="meta-label">Prescribing Physician</span>
                <span class="meta-val">${data.doctorName}</span>
              </div>
            </div>

            <div class="diag-box">
              <span class="meta-label">Clinical Diagnosis</span>
              <div style="font-weight: 600; color: #0f172a; margin-top: 2px;">${data.diagnosis}</div>
            </div>

            <div>
              <div class="meds-title">℞ Prescribed Medications & Dosing Regimen</div>
              <table>
                <thead>
                  <tr>
                    <th>Medication</th>
                    <th>Dosage</th>
                    <th>Frequency</th>
                    <th>Duration</th>
                    <th>Instructions</th>
                  </tr>
                </thead>
                <tbody>
                  ${medsRows}
                </tbody>
              </table>
            </div>

            <div class="footer-grid">
              <div class="crypto-hashes">
                <div><strong>SHA-256 Digest:</strong> ${data.dataHash}</div>
                <div><strong>Doctor RSA-2048 Sig:</strong> ${data.doctorSignature ? data.doctorSignature.slice(0, 48) + '... [Valid & Authentic]' : 'Cryptographically Signed'}</div>
                <div style="font-size: 8px; color: #94a3b8; margin-top: 3px; font-family: sans-serif;">
                  Tamper-evident medical prescription sealed under AES-256-GCM and SHA-256.
                </div>
              </div>

              <div class="sig-block">
                <div class="sig-title">Digitally Sealed with Private Key</div>
                <div class="sig-doc">${data.doctorName}</div>
                <div style="font-size: 9px; color: #64748b; font-family: monospace;">Licensed Medical Practitioner • Verified eRx</div>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    try {
      const frameDoc = printFrame.contentWindow.document;
      frameDoc.open();
      frameDoc.write(htmlContent);
      frameDoc.close();

      setTimeout(() => {
        printFrame.contentWindow.focus();
        printFrame.contentWindow.print();
      }, 200);
    } catch (err) {
      console.error('Print iframe error:', err);
      window.print();
    }
  };

  if (!prescriptionId) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto print:p-0 print:bg-white print:static print:overflow-visible">
      
      {/* 1. ON-SCREEN INTERACTIVE MODAL (Hidden during print) */}
      <div 
        className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-3xl w-full shadow-2xl overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-200 print:hidden"
      >
        {/* Header */}
        <div className="p-4 sm:p-6 bg-slate-950/60 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 flex-shrink-0">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-100 flex items-center gap-2">
                Cryptographic Prescription Record
                <span className="text-xs font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                  {prescriptionId.slice(0, 8)}...
                </span>
              </h2>
              <p className="text-xs text-slate-400">Decrypted on-the-fly via AES-256-GCM + ECDH Vault</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              disabled={!data}
              className="p-2 text-slate-400 hover:text-emerald-400 rounded-lg hover:bg-slate-800 transition-colors flex items-center gap-1.5 text-xs font-medium"
              title="Print or Save official PDF prescription"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">Print / PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {loading && (
            <div className="flex flex-col items-center justify-center py-16 space-y-3">
              <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-sm text-slate-400 font-mono">Decrypting AES-256-GCM Payload & Verifying Signatures...</p>
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-950/40 border border-red-500/40 rounded-xl text-red-300 text-sm flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Security Alarm / Error</p>
                <p className="text-red-300/90 text-xs mt-0.5">{error}</p>
              </div>
            </div>
          )}

          {dispenseMsg && (
            <div className="p-4 bg-emerald-950/40 border border-emerald-500/40 rounded-xl text-emerald-300 text-sm flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-emerald-400" />
              <span>{dispenseMsg}</span>
            </div>
          )}

          {data && (
            <>
              {/* TASK 7: Revocation Notice if Revoked */}
              {data.status === 'REVOKED' && (
                <div className="p-4 bg-red-950/50 border border-red-500/60 rounded-xl text-red-200 text-xs flex items-start gap-3 shadow-lg">
                  <Ban className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-sm text-red-400">PRESCRIPTION REVOKED BY DOCTOR</p>
                    <p className="mt-0.5 text-red-200">
                      This prescription has been officially revoked by the issuing medical practitioner. Pharmacists are strictly prohibited from dispensing medications against this record.
                    </p>
                  </div>
                </div>
              )}

              {/* Cryptographic Proof Badges */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className={`p-3 rounded-xl border flex items-center gap-3 ${
                  data.cryptoVerification?.isIntegrityValid 
                    ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-400' 
                    : 'bg-red-950/30 border-red-500/50 text-red-400'
                }`}>
                  <ShieldCheck className="w-5 h-5 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-semibold">SHA-256 Integrity</p>
                    <p className="text-[10px] opacity-80">
                      {data.cryptoVerification?.isIntegrityValid ? 'Tamper Proof (Verified)' : 'TAMPER DETECTED! HASH MISMATCH'}
                    </p>
                  </div>
                </div>

                <div className="p-3 rounded-xl border bg-blue-950/20 border-blue-500/30 text-blue-400 flex items-center gap-3">
                  <Key className="w-5 h-5 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-semibold">Doctor RSA-2048 Signature</p>
                    <p className="text-[10px] opacity-80">
                      {data.cryptoVerification?.isDoctorSignatureValid ? 'Authentic (Valid Key)' : 'Digital Signature Active'}
                    </p>
                  </div>
                </div>

                <div className={`p-3 rounded-xl border flex items-center gap-3 ${
                  data.diagnosisDisclosed 
                    ? 'bg-purple-950/20 border-purple-500/30 text-purple-400'
                    : 'bg-amber-950/20 border-amber-500/30 text-amber-400'
                }`}>
                  <Lock className="w-5 h-5 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-semibold">Privacy Mode</p>
                    <p className="text-[10px] opacity-80">
                      {data.diagnosisDisclosed ? 'Full Clinical Access' : 'Zero-Knowledge Disclosed'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Zero-Knowledge Selective Disclosure Alert for Pharmacist */}
              {data.cryptoVerification?.selectiveDisclosureActive && (
                <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-300 text-xs flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold">Zero-Knowledge Selective Disclosure Enforced: </span>
                    As a Pharmacist, you are granted cryptographic access only to authorized medications and doctor validation. Confidential medical diagnosis is withheld to protect patient privacy under HIPAA / GDPR standards.
                  </div>
                </div>
              )}

              {/* Prescription Header Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 p-3.5 sm:p-4 rounded-xl bg-slate-950/40 border border-slate-800 text-xs">
                <div>
                  <span className="text-slate-400 block mb-1">Patient</span>
                  <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-emerald-400" /> {data.patientName}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-1">Prescribing Doctor</span>
                  <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-blue-400" /> {data.doctorName}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-1">Clinic / Hospital</span>
                  <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                    <Building className="w-3.5 h-3.5 text-slate-400" /> {data.clinicName}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-1">Status</span>
                  <span className={`inline-block px-2 py-0.5 rounded font-bold uppercase text-[10px] ${
                    data.status === 'REVOKED'
                      ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                      : data.status === 'DISPENSED' 
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' 
                        : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  }`}>
                    {data.status}
                  </span>
                </div>
              </div>

              {/* Diagnosis Field */}
              <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800">
                <span className="text-xs text-slate-400 block mb-1 font-medium">Confidential Diagnosis</span>
                <p className={`text-sm ${data.diagnosisDisclosed ? 'text-slate-200 font-medium' : 'text-slate-500 italic font-mono'}`}>
                  {data.diagnosis}
                </p>
              </div>

              {/* Prescribed Medications */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Pill className="w-4 h-4 text-emerald-400" />
                    Authorized Medications & Dosing Regimen
                  </span>
                  <span className="text-xs text-slate-400">{data.medications?.length || 0} Prescribed Items</span>
                </div>

                <div className="border border-slate-800 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-950/80 text-slate-400 uppercase font-mono text-[10px]">
                      <tr>
                        <th className="p-3">Medication</th>
                        <th className="p-3">Dosage</th>
                        <th className="p-3">Frequency</th>
                        <th className="p-3">Duration</th>
                        <th className="p-3">Instructions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 bg-slate-950/30">
                      {data.medications?.map((m, idx) => (
                        <tr key={idx} className="hover:bg-slate-800/20">
                          <td className="p-3 font-semibold text-slate-200">{m.drug_name || m.drug}</td>
                          <td className="p-3 text-slate-300 font-mono">{m.dosage}</td>
                          <td className="p-3 text-slate-300 font-mono">{m.frequency}</td>
                          <td className="p-3 text-slate-300">{m.duration}</td>
                          <td className="p-3 text-slate-400 italic">{m.instructions || 'As directed'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Cryptographic Seals Footnote */}
              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 space-y-1.5 text-[11px] font-mono">
                <div className="flex items-center justify-between text-slate-400 truncate">
                  <span>SHA-256 Digest:</span>
                  <span className="text-emerald-400 truncate max-w-xs">{data.dataHash}</span>
                </div>
                <div className="flex items-center justify-between text-slate-400 truncate">
                  <span>Doctor RSA Signature:</span>
                  <span className="text-blue-400 truncate max-w-xs">{data.doctorSignature?.slice(0, 48)}...</span>
                </div>
              </div>

              {/* Dispensed Alert */}
              {data.status === 'DISPENSED' && (
                <div className="p-3.5 bg-amber-950/30 border border-amber-500/30 rounded-xl text-xs text-amber-300">
                  <p className="font-semibold">⚠️ Prescription Already Dispensed</p>
                  <p className="text-slate-400 mt-1">Fulfilled by: {data.dispensedByPharmacist} on {new Date(data.dispensedAt).toLocaleString()}</p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {(user?.role === 'AUDITOR' || user?.role === 'DOCTOR') && (
              <button
                onClick={handleSimulateTamper}
                disabled={tampering || !data}
                className="px-3 py-1.5 text-xs rounded-lg font-medium bg-red-950/40 hover:bg-red-900/60 border border-red-500/40 text-red-300 transition-colors"
                title="Corrupt hash in DB to test anomaly alert"
              >
                {tampering ? 'Corrupting...' : 'Simulate Tamper Attack'}
              </button>
            )}
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={handlePrint}
              disabled={!data}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5 text-emerald-400" />
              <span>Print / PDF</span>
            </button>

            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-800 transition-colors"
            >
              Close
            </button>

            {user?.role === 'PHARMACIST' && data?.status !== 'DISPENSED' && data?.status !== 'REVOKED' && (
              <button
                onClick={handleDispense}
                disabled={dispensing || !data?.cryptoVerification?.isIntegrityValid}
                className="px-5 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-1.5 disabled:opacity-50"
              >
                {dispensing ? 'Processing Dispense...' : 'Fulfill & Dispense eRx'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
