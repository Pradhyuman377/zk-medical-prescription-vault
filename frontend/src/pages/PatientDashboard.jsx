import React, { useState, useEffect } from 'react';
import { prescriptionService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Lock, ShieldCheck, Eye, Copy, Check, QrCode, FileText, Pill, Calendar, Building, X, Sparkles, Plus, KeyRound } from 'lucide-react';
import PrescriptionModal from '../components/PrescriptionModal';
import { useToast } from '../context/ToastContext';
import { SkeletonCard } from '../components/SkeletonLoader';
import CryptoTooltip from '../components/CryptoTooltip';

export default function PatientDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeModalId, setActiveModalId] = useState(null);
  const [copiedId, setCopiedId] = useState('');
  
  // TASK 11: QR Code Modal State
  const [qrModalData, setQrModalData] = useState(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [qrCopied, setQrCopied] = useState(false);

  // Claim Unlinked / Walk-In Prescription State
  const [claimId, setClaimId] = useState('');
  const [claiming, setClaiming] = useState(false);
  const [showClaimBox, setShowClaimBox] = useState(false);

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
    toast.info('Dispense ID Copied', 'Prescription ID copied to clipboard. Share this with your pharmacist.');
    setTimeout(() => setCopiedId(''), 3000);
  };

  // TASK 11: Open QR Code modal
  const handleShowQR = async (id) => {
    setQrLoading(true);
    setQrCopied(false);
    try {
      const res = await prescriptionService.getPrescriptionQR(id);
      setQrModalData(res);
    } catch (err) {
      const msg = err.response?.data?.error || err.message;
      toast.error('QR Generation Failed', msg);
    } finally {
      setQrLoading(false);
    }
  };

  const handleCopyQRPayload = () => {
    if (!qrModalData) return;
    const payload = JSON.stringify({
      prescriptionId: qrModalData.prescriptionId,
      hmac: qrModalData.hmac,
      protocol: 'ZK-RX-QR-v1'
    });
    navigator.clipboard.writeText(payload);
    setQrCopied(true);
    toast.success('HMAC Payload Copied', 'Cryptographic verification token copied to clipboard.');
    setTimeout(() => setQrCopied(false), 3000);
  };

  const handleClaim = async (e) => {
    e.preventDefault();
    if (!claimId.trim()) return;
    setClaiming(true);
    try {
      const res = await prescriptionService.claimPrescription(claimId.trim());
      toast.success('Prescription Linked', res.message || 'Prescription added to your vault!');
      setClaimId('');
      setShowClaimBox(false);
      loadPrescriptions();
    } catch (err) {
      const msg = err.response?.data?.error || err.message;
      toast.error('Linking Failed', msg);
    } finally {
      setClaiming(false);
    }
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
            Authenticated Patient: <span className="text-slate-200 font-semibold">{user?.name}</span> ({user?.email}) • Records are encrypted with AES-256-GCM + pairwise ECDH. Share your Dispense ID or QR token with any pharmacy safely.
          </p>
        </div>
        <CryptoTooltip term="Selective Disclosure">
          <div className="flex items-center gap-2 text-xs font-mono bg-slate-950/80 px-3.5 py-2 rounded-xl border border-slate-800 text-slate-300 hover:border-emerald-500/50 transition-colors">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Zero-Knowledge Privacy: Enforced ℹ️</span>
          </div>
        </CryptoTooltip>
      </div>

      {/* Info Card on Privacy */}
      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-start gap-3 text-xs text-slate-300">
        <QrCode className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-slate-100">How Pharmacy Sharing Works: </span>
          When you present your Prescription ID or{' '}
          <CryptoTooltip term="HMAC-SHA256">
            <span className="text-emerald-400 font-semibold border-b border-dashed border-emerald-500/60 pb-0.5">
              HMAC-signed QR Code ℹ️
            </span>
          </CryptoTooltip>{' '}
          to a pharmacist, our system uses{' '}
          <CryptoTooltip term="Selective Disclosure">
            <span className="text-cyan-400 font-semibold border-b border-dashed border-cyan-500/60 pb-0.5">
              Selective Disclosure ℹ️
            </span>
          </CryptoTooltip>.
          The pharmacist can verify the doctor's signature and dispense medications, but your confidential clinical diagnosis remains completely encrypted and hidden from them.
        </div>
      </div>

      {/* Claim / Link Prescription by ID Banner */}
      <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-semibold text-white flex items-center gap-1.5">
              <KeyRound className="w-4 h-4 text-cyan-400" />
              Have a Walk-In or Paper Slip from your Doctor?
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Link any prescription directly to your vault using its unique Prescription UUID.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowClaimBox(!showClaimBox)}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 self-start sm:self-auto"
          >
            <Plus className="w-3.5 h-3.5" />
            {showClaimBox ? 'Close Linker' : 'Link Prescription by ID'}
          </button>
        </div>

        {showClaimBox && (
          <form onSubmit={handleClaim} className="mt-3 pt-3 border-t border-slate-800 flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              required
              placeholder="Paste 36-character Prescription UUID (e.g. 9d872e5c-da6c-4cc8-b949-ce233d067cba)"
              value={claimId}
              onChange={(e) => setClaimId(e.target.value)}
              className="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-cyan-500 focus:outline-none text-slate-200 font-mono text-xs placeholder:text-slate-600"
            />
            <button
              type="submit"
              disabled={claiming}
              className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-semibold transition-colors disabled:opacity-50 whitespace-nowrap"
            >
              {claiming ? 'Linking...' : 'Claim & Add to Vault'}
            </button>
          </form>
        )}
      </div>

      {/* List of Prescriptions */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <h2 className="text-sm font-semibold text-white flex items-center gap-2">
          <FileText className="w-4 h-4 text-emerald-400" />
          Your Issued e-Prescriptions
        </h2>

        {loading ? (
          <SkeletonCard count={3} />
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
                    p.status === 'REVOKED'
                      ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                      : p.status === 'DISPENSED' 
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

                <div className="grid grid-cols-2 gap-2">
                  {/* TASK 11: Show QR Code button */}
                  <button
                    onClick={() => handleShowQR(p.id)}
                    className="py-2 px-3 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-300 font-semibold text-xs transition-colors flex items-center justify-center gap-1.5"
                  >
                    <QrCode className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Show QR</span>
                  </button>

                  <button
                    onClick={() => setActiveModalId(p.id)}
                    className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Decrypt</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* TASK 11: QR Code Modal */}
      {qrModalData && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-sm w-full p-6 space-y-4 text-center shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                <QrCode className="w-4 h-4" />
                <span>e-Prescription QR Token</span>
              </div>
              <button
                onClick={() => setQrModalData(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-white p-4 rounded-2xl inline-block mx-auto shadow-inner">
              <img
                src={qrModalData.qrImage}
                alt="Prescription QR Code"
                className="w-48 h-48 mx-auto object-contain"
              />
            </div>

            <div className="space-y-1 text-xs">
              <p className="text-slate-200 font-medium">{qrModalData.instructions}</p>
              <p className="text-[10px] text-slate-400 font-mono break-all">
                HMAC-SHA256: {qrModalData.hmac?.slice(0, 24)}...
              </p>
            </div>

            <button
              onClick={handleCopyQRPayload}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-2 border border-slate-700 transition-colors"
            >
              {qrCopied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-400" />}
              <span>{qrCopied ? 'Copied QR Payload to Clipboard!' : 'Copy Scannable QR Payload'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Prescription Full Decrypt Modal */}
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
