import React, { useState, useEffect } from 'react';
import { prescriptionService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Pill, Search, ShieldCheck, CheckCircle2, AlertTriangle, Eye, Lock, ArrowRight } from 'lucide-react';
import PrescriptionModal from '../components/PrescriptionModal';

export default function PharmacistDashboard() {
  const { user } = useAuth();
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchId, setSearchId] = useState('');
  const [activeModalId, setActiveModalId] = useState(null);

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

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchId.trim()) {
      setActiveModalId(searchId.trim());
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
            Verify doctor cryptographic credentials, review medication list, and record one-time fulfillment.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono bg-slate-950/80 px-3.5 py-2 rounded-xl border border-slate-800 text-slate-300">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Double-Fill Prevention: Active</span>
        </div>
      </div>

      {/* Prescription Lookup Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-3">
        <h2 className="text-sm font-semibold text-white flex items-center gap-2">
          <Search className="w-4 h-4 text-amber-400" />
          Lookup Patient Prescription ID
        </h2>
        <form onSubmit={handleSearchSubmit} className="flex gap-3">
          <input
            type="text"
            placeholder="Enter prescription UUID (e.g. 550e8400-e29b-41d4-a716-446655440000)"
            value={searchId}
            onChange={(e) => setSearchId(e.target.value)}
            className="flex-1 px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-amber-500 focus:outline-none text-slate-200 text-xs font-mono placeholder:text-slate-600"
          />
          <button
            type="submit"
            className="px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs transition-colors flex items-center gap-2 shadow-lg shadow-amber-600/20"
          >
            <span>Verify & Inspect</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>

      {/* Prescription Queue */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            Prescription Verification Queue
          </h2>
          <span className="text-xs text-slate-500">{prescriptions.length} Records In System</span>
        </div>

        {loading ? (
          <p className="text-xs text-slate-400">Loading prescriptions...</p>
        ) : prescriptions.length === 0 ? (
          <p className="text-xs text-slate-500">No prescriptions found in system.</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-800">
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
                {prescriptions.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-800/30">
                    <td className="p-3 font-mono text-[11px] text-slate-400">{p.id.slice(0, 16)}...</td>
                    <td className="p-3 font-semibold text-slate-200">{p.patientName}</td>
                    <td className="p-3 text-slate-300">{p.doctorName}</td>
                    <td className="p-3 text-slate-400">{p.dateIssued}</td>
                    <td className="p-3">
                      <span className={`inline-block px-2 py-0.5 rounded font-bold uppercase text-[10px] ${
                        p.status === 'DISPENSED' 
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' 
                          : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      }`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => setActiveModalId(p.id)}
                        className="px-3 py-1.5 rounded-lg bg-amber-600/20 hover:bg-amber-600/30 border border-amber-500/30 text-amber-300 text-xs font-medium transition-colors inline-flex items-center gap-1.5"
                      >
                        <Eye className="w-3.5 h-3.5" /> Verify & Dispense
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
