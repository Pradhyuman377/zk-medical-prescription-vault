import React, { useState, useEffect } from 'react';
import { prescriptionService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Pill, Search, ShieldCheck, CheckCircle2, AlertTriangle, Eye, Lock, ArrowRight, QrCode, ShieldAlert, Ban } from 'lucide-react';
import PrescriptionModal from '../components/PrescriptionModal';
import { useToast } from '../context/ToastContext';
import { SkeletonTable } from '../components/SkeletonLoader';

export default function PharmacistDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchId, setSearchId] = useState('');
  
  // TASK 11: QR Scan Input State
  const [qrInput, setQrInput] = useState('');
  const [qrVerifying, setQrVerifying] = useState(false);
  const [qrError, setQrError] = useState('');
  
  const [activeModalId, setActiveModalId] = useState(null);
  const [filterTab, setFilterTab] = useState('my_dispensed'); // 'my_dispensed' | 'all'

  useEffect(() => {
    loadPrescriptions();
  }, []);

  const loadPrescriptions = async () => {
    try {
      const res = await prescriptionService.listPrescriptions();
      setPrescriptions(res.prescriptions);
    } catch (err) {
      console.error('Failed to load prescriptions:', err);
    } finally {
      setLoading(false);
    }
  };

  const displayedPrescriptions = prescriptions.filter(p => {
    if (filterTab === 'my_dispensed') {
      return p.status === 'DISPENSED' && p.dispensedByPharmacist && user?.name &&
        p.dispensedByPharmacist.toLowerCase().includes(user.name.toLowerCase());
    }
    return true; // 'all'
  });

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchId.trim()) {
      setActiveModalId(searchId.trim());
    }
  };

  // TASK 11: Verify Scanned QR Payload
  const handleVerifyQR = async (e) => {
    e.preventDefault();
    if (!qrInput.trim()) return;
    setQrVerifying(true);
    setQrError('');
    try {
      const res = await prescriptionService.verifyQRCode({ rawPayload: qrInput.trim() });
      if (res.prescription?.id) {
        setActiveModalId(res.prescription.id);
        toast.success('HMAC QR Validated', `Prescription for ${res.prescription.patientName} verified.`);
        setQrInput('');
      } else {
        setQrError('Could not resolve prescription from QR payload.');
        toast.error('Verification Error', 'Could not resolve prescription from QR payload.');
      }
    } catch (err) {
      const msg = err.response?.data?.error || 'QR Verification failed: Invalid cryptographic signature.';
      setQrError(msg);
      toast.error('Invalid QR Signature', msg);
    } finally {
      setQrVerifying(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-900 border border-amber-500/20">
        <div>
          <span className="text-xs font-mono uppercase tracking-wider text-amber-400 font-semibold flex items-center gap-1.5 mb-1">
            <Pill className="w-4 h-4" /> Pharmacy Dispense Terminal
          </span>
          <h1 className="text-2xl font-bold text-white">eRx Verification & Dispensation Hub</h1>
          <p className="text-xs text-slate-400 mt-1">
            Logged in as <span className="text-slate-200 font-semibold">{user?.name}</span> ({user?.email}) • License: <span className="text-amber-300 font-mono">{user?.licenseNumber || 'PHARM-N/A'}</span> • Role: <span className="text-slate-300 font-medium">Authorized Pharmacist</span>
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono bg-slate-950/80 px-3.5 py-2 rounded-xl border border-slate-800 text-slate-300">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Double-Fill & Revocation Guard: Active</span>
        </div>
      </div>

      {/* Zero-Knowledge Privacy Notice */}
      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-start gap-3 text-xs text-slate-300">
        <Lock className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-slate-100">Zero-Knowledge Patient Privacy Enforced: </span>
          Pharmacists cannot browse or search through other patients' pending health records. Prescriptions can 
          <span className="text-amber-400 font-semibold"> ONLY be accessed on-demand</span> when the patient presents their 
          <span className="text-emerald-400 font-semibold"> HMAC-signed QR Code</span> or <span className="text-amber-400 font-semibold">Prescription ID</span> at your counter.
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Prescription Lookup Bar */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-3">
          <h2 className="text-sm font-semibold text-white flex items-center gap-2">
            <Search className="w-4 h-4 text-amber-400" />
            Lookup Patient Prescription ID
          </h2>
          <form onSubmit={handleSearchSubmit} className="flex gap-3">
            <input
              type="text"
              placeholder="Enter prescription UUID..."
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
              className="flex-1 px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-amber-500 focus:outline-none text-slate-200 text-xs font-mono placeholder:text-slate-600"
            />
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs transition-colors flex items-center gap-2 shadow-lg shadow-amber-600/20"
            >
              <span>Inspect</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>

        {/* TASK 11: QR Code Scanner / Paste Input Terminal */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-3">
          <h2 className="text-sm font-semibold text-white flex items-center gap-2">
            <QrCode className="w-4 h-4 text-emerald-400" />
            Scan / Paste Patient QR Token
          </h2>
          <form onSubmit={handleVerifyQR} className="flex gap-3">
            <input
              type="text"
              placeholder='Paste scanned QR JSON (e.g. {"prescriptionId":"...", "hmac":"..."})'
              value={qrInput}
              onChange={(e) => setQrInput(e.target.value)}
              className="flex-1 px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-emerald-500 focus:outline-none text-slate-200 text-xs font-mono placeholder:text-slate-600"
            />
            <button
              type="submit"
              disabled={qrVerifying || !qrInput.trim()}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-colors flex items-center gap-2 shadow-lg shadow-emerald-600/20 disabled:opacity-40"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{qrVerifying ? 'Verifying HMAC...' : 'Verify QR'}</span>
            </button>
          </form>
          {qrError && (
            <p className="text-xs text-red-400 flex items-center gap-1.5 font-mono">
              <ShieldAlert className="w-3.5 h-3.5" /> {qrError}
            </p>
          )}
        </div>
      </div>

      {/* Prescription Queue */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <h2 className="text-sm font-semibold text-white">
              Pharmacy Dispense Ledger (Fulfilled at this Counter)
            </h2>
            <span className="text-xs text-slate-500 font-mono">({displayedPrescriptions.length})</span>
          </div>

          <div className="text-xs text-slate-400 font-mono">
            License: {user?.licenseNumber || 'R.Ph'}
          </div>
        </div>

        {loading ? (
          <SkeletonTable rows={3} />
        ) : displayedPrescriptions.length === 0 ? (
          <div className="text-center py-10 space-y-2">
            <Pill className="w-7 h-7 text-slate-600 mx-auto" />
            <p className="text-xs text-slate-400 font-medium">
              {filterTab === 'my_dispensed'
                ? `No prescriptions dispensed by ${user?.name} yet.`
                : filterTab === 'pending'
                  ? 'No pending prescriptions waiting for dispense.'
                  : 'No prescriptions found in system.'}
            </p>
            <p className="text-[10px] text-slate-600">
              {filterTab === 'my_dispensed' ? 'When you verify and fulfill patient prescriptions, they will be tracked here under your license.' : 'New doctor prescriptions will appear automatically.'}
            </p>
          </div>
        ) : (
          <>
            {/* Mobile Cards View */}
            <div className="md:hidden space-y-3">
              {displayedPrescriptions.map((p) => (
                <div key={p.id} className="p-3.5 bg-slate-950/60 border border-slate-800 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-slate-200 text-sm">{p.patientName}</div>
                      <div className="text-[11px] text-slate-400">Dr. {p.doctorName} • {p.dateIssued}</div>
                    </div>
                    {p.status === 'REVOKED' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded font-bold uppercase text-[9px] bg-red-500/20 text-red-400 border border-red-500/40">
                        <Ban className="w-3 h-3" /> REVOKED
                      </span>
                    ) : (
                      <span className={`inline-block px-2 py-0.5 rounded font-bold uppercase text-[10px] ${
                        p.status === 'DISPENSED' 
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' 
                          : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      }`}>
                        {p.status}
                      </span>
                    )}
                  </div>

                  <div className="text-[10px] font-mono text-slate-400 bg-slate-900/80 px-2.5 py-1 rounded border border-slate-800 truncate">
                    <span className="text-slate-500">ID: </span>{p.id}
                  </div>

                  <button
                    onClick={() => setActiveModalId(p.id)}
                    className={`w-full py-2 px-3 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1.5 ${
                      p.status === 'REVOKED'
                        ? 'bg-red-950/30 hover:bg-red-900/50 border border-red-500/30 text-red-300'
                        : 'bg-amber-600/20 hover:bg-amber-600/30 border border-amber-500/30 text-amber-300'
                    }`}
                  >
                    <Eye className="w-3.5 h-3.5" /> 
                    {p.status === 'REVOKED' ? 'View Revocation Details' : 'Verify Cryptography & Dispense'}
                  </button>
                </div>
              ))}
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto rounded-xl border border-slate-800">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/80 text-slate-400 uppercase font-mono text-[10px]">
                  <tr>
                    <th className="p-3">Prescription ID</th>
                    <th className="p-3">Patient</th>
                    <th className="p-3">Doctor</th>
                    <th className="p-3">Date</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 bg-slate-900/40">
                  {displayedPrescriptions.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-800/30">
                      <td className="p-3 font-mono text-[11px] text-slate-400">{p.id.slice(0, 16)}...</td>
                      <td className="p-3 font-semibold text-slate-200">{p.patientName}</td>
                      <td className="p-3 text-slate-300">{p.doctorName}</td>
                      <td className="p-3 text-slate-400">{p.dateIssued}</td>
                      <td className="p-3">
                        {/* TASK 7: Revocation Badge for Pharmacists */}
                        {p.status === 'REVOKED' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded font-bold uppercase text-[10px] bg-red-500/20 text-red-400 border border-red-500/40">
                            <Ban className="w-3 h-3" /> REVOKED — DO NOT DISPENSE
                          </span>
                        ) : (
                          <span className={`inline-block px-2 py-0.5 rounded font-bold uppercase text-[10px] ${
                            p.status === 'DISPENSED' 
                              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' 
                              : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          }`}>
                            {p.status}
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => setActiveModalId(p.id)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors inline-flex items-center gap-1.5 ${
                            p.status === 'REVOKED'
                              ? 'bg-red-950/30 hover:bg-red-900/50 border border-red-500/30 text-red-300'
                              : 'bg-amber-600/20 hover:bg-amber-600/30 border border-amber-500/30 text-amber-300'
                          }`}
                        >
                          <Eye className="w-3.5 h-3.5" /> 
                          {p.status === 'REVOKED' ? 'View Revocation' : 'Verify & Dispense'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
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
