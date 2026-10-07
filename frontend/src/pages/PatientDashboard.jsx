import React, { useState, useEffect } from 'react';
import { prescriptionService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Lock, ShieldCheck, Eye, Copy, Check, QrCode, FileText, Pill, Calendar, Building } from 'lucide-react';
import PrescriptionModal from '../components/PrescriptionModal';

export default function PatientDashboard() {
  const { user } = useAuth();
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeModalId, setActiveModalId] = useState(null);
  const [copiedId, setCopiedId] = useState('');

  useEffect(() => {
    loadPrescriptions();
  }, []);

  const loadPrescriptions = async () => {
    try {
      const res = await prescriptionService.listPrescriptions();
      setPrescriptions(res.prescriptions);
    } catch (err) {
      console.error('Failed to load patient prescriptions:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (id) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(''), 3000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-900 border border-emerald-500/20">
        <div>
          <span className="text-xs font-mono uppercase tracking-wider text-emerald-400 font-semibold flex items-center gap-1.5 mb-1">
            <Lock className="w-4 h-4" /> Personal Health Vault
          </span>
          <h1 className="text-2xl font-bold text-white">Encrypted Prescription Portfolio</h1>
          <p className="text-xs text-slate-400 mt-1">
            Welcome back, {user?.name}. Your medical records are encrypted with AES-256-GCM. Share your Dispense ID with any pharmacy safely.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono bg-slate-950/80 px-3.5 py-2 rounded-xl border border-slate-800 text-slate-300">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Zero-Knowledge Privacy: Enforced</span>
        </div>
      </div>

      {/* Info Card on Privacy */}
      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-start gap-3 text-xs text-slate-300">
        <QrCode className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-slate-100">How Pharmacy Sharing Works: </span>
          When you present your Prescription ID to a pharmacist, our system uses <span className="text-emerald-400 font-semibold">Selective Disclosure</span>. The pharmacist can verify the doctor's signature and dispense medications, but your confidential clinical diagnosis remains completely encrypted and hidden from them.
        </div>
      </div>

      {/* List of Prescriptions */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <h2 className="text-sm font-semibold text-white flex items-center gap-2">
          <FileText className="w-4 h-4 text-emerald-400" />
          Your Issued e-Prescriptions
        </h2>

        {loading ? (
          <p className="text-xs text-slate-400">Querying cryptographic vault...</p>
        ) : prescriptions.length === 0 ? (
          <div className="text-center py-12 space-y-2">
            <Lock className="w-8 h-8 text-slate-600 mx-auto" />
            <p className="text-xs text-slate-400 font-medium">No prescriptions found in your vault.</p>
            <p className="text-[10px] text-slate-600">Prescriptions issued by your doctor will automatically appear here.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {prescriptions.map((p) => (
              <div
                key={p.id}
                className="bg-slate-950 border border-slate-800/80 hover:border-slate-700 rounded-xl p-5 space-y-4 transition-all shadow-md"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-slate-200 text-sm">{p.doctorName}</h3>
                    <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                      <Building className="w-3 h-3" /> {p.clinicName}
                    </p>
                  </div>
                  <span className={`px-2 py-0.5 rounded font-bold uppercase text-[10px] ${
                    p.status === 'DISPENSED' 
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' 
                      : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  }`}>
                    {p.status}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs text-slate-400 pt-2 border-t border-slate-900">
                  <div className="flex items-center justify-between">
                    <span>Issued Date:</span>
                    <span className="text-slate-200 font-medium">{p.dateIssued}</span>
                  </div>
                  <div className="flex items-center justify-between font-mono text-[10px]">
                    <span>SHA-256 Hash:</span>
                    <span className="text-emerald-400">{p.dataHash.slice(0, 12)}...</span>
                  </div>
                </div>

                {/* Pharmacy Share Token */}
                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between text-xs font-mono">
                  <div className="truncate pr-2">
                    <span className="text-[10px] text-slate-500 block uppercase font-sans">Pharmacy Dispense ID:</span>
                    <span className="text-slate-300 text-[11px]">{p.id.slice(0, 16)}...</span>
                  </div>
                  <button
                    onClick={() => handleCopy(p.id)}
                    className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded transition-colors flex-shrink-0"
                    title="Copy Full ID for Pharmacist"
                  >
                    {copiedId === p.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>

                <button
                  onClick={() => setActiveModalId(p.id)}
                  className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs transition-colors flex items-center justify-center gap-1.5"
                >
                  <Eye className="w-3.5 h-3.5" />
                  View & Decrypt Full eRx
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {activeModalId && (
        <PrescriptionModal
          prescriptionId={activeModalId}
          onClose={() => setActiveModalId(null)}
          onDispensed={loadPrescriptions}
        />
      )}
    </div>
  );
}
