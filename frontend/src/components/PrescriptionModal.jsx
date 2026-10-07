import React, { useState, useEffect } from 'react';
import { prescriptionService, securityService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { X, ShieldCheck, AlertCircle, Key, CheckCircle, FileText, Lock, Pill, User, Building, Calendar, AlertTriangle } from 'lucide-react';

export default function PrescriptionModal({ prescriptionId, onClose, onDispensed }) {
  const { user } = useAuth();
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
    setDispensing(true);
    setDispenseMsg('');
    setError('');
    try {
      const res = await prescriptionService.dispensePrescription(prescriptionId);
      setDispenseMsg(res.message);
      fetchPrescription();
      if (onDispensed) onDispensed();
    } catch (err) {
      setError(err.response?.data?.error || 'Dispense failed or blocked by anomaly guard.');
    } finally {
      setDispensing(false);
    }
  };

  const handleSimulateTamper = async () => {
    if (!window.confirm("⚠️ ATTACK SIMULATION: This will intentionally corrupt the SHA-256 hash in the database to test the cryptographic tamper detector. Proceed?")) return;
    setTampering(true);
    try {
      await securityService.simulateTamper(prescriptionId);
      alert("Tamper attack executed! Reloading prescription to observe cryptographic failure alarm...");
      fetchPrescription();
    } catch (err) {
      alert("Error: " + (err.response?.data?.error || err.message));
    } finally {
      setTampering(false);
    }
  };

  if (!prescriptionId) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-3xl w-full shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-6 bg-slate-950/60 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                Cryptographic Prescription Record
                <span className="text-xs font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                  {prescriptionId.slice(0, 8)}...
                </span>
              </h2>
              <p className="text-xs text-slate-400">Decrypted on-the-fly via AES-256-GCM Vault</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {loading && (
            <div className="flex flex-col items-center justify-center py-12 space-y-3">
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
                    <p className="text-xs font-semibold">Doctor RSA Signature</p>
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
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-950/40 border border-slate-800 text-xs">
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
                    data.status === 'DISPENSED' 
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

              {/* Medication Table */}
              <div>
                <h3 className="text-sm font-semibold text-slate-200 mb-3 flex items-center gap-2">
                  <Pill className="w-4 h-4 text-emerald-400" />
                  Prescribed Medications & Dosages
                </h3>
                <div className="overflow-x-auto rounded-xl border border-slate-800">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-950/80 text-slate-400 uppercase font-mono text-[10px]">
                      <tr>
                        <th className="p-3">Drug Name</th>
                        <th className="p-3">Dosage</th>
                        <th className="p-3">Frequency</th>
                        <th className="p-3">Duration</th>
                        <th className="p-3">Instructions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 bg-slate-900/40">
                      {Array.isArray(data.medications) && data.medications.map((m, idx) => (
                        <tr key={idx} className="hover:bg-slate-800/30">
                          <td className="p-3 font-semibold text-slate-200">{m.drug_name}</td>
                          <td className="p-3 text-emerald-400 font-mono">{m.dosage}</td>
                          <td className="p-3 text-slate-300">{m.frequency}</td>
                          <td className="p-3 text-slate-300">{m.duration}</td>
                          <td className="p-3 text-slate-400">{m.instructions}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Cryptographic SHA-256 Fingerprint */}
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 font-mono text-[11px] space-y-1">
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Immutable Cryptographic Fingerprint (SHA-256):</span>
                <span className="text-emerald-400 break-all select-all block">{data.cryptoVerification?.dataHash}</span>
              </div>

              {/* Dispensed Information if fulfilled */}
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
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-800 transition-colors"
            >
              Close
            </button>

            {user?.role === 'PHARMACIST' && data?.status !== 'DISPENSED' && (
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
