import React, { useState, useEffect } from 'react';
import { prescriptionService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Upload, Sparkles, FileText, Plus, Trash2, ShieldCheck, CheckCircle2, Lock, Stethoscope, Eye } from 'lucide-react';
import PrescriptionModal from '../components/PrescriptionModal';

export default function DoctorDashboard() {
  const { user } = useAuth();
  const [prescriptions, setPrescriptions] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  
  // OCR & Form State
  const [ocrLoading, setOcrLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [ocrSuccess, setOcrSuccess] = useState(false);
  
  const [patientName, setPatientName] = useState('Aarav Patel');
  const [clinicName, setClinicName] = useState(user?.clinic || 'Apex Healthcare Specialty Clinic');
  const [diagnosis, setDiagnosis] = useState('');
  const [medications, setMedications] = useState([
    { drug_name: 'Amoxicillin & Clavulanate', dosage: '625 mg', frequency: '1-0-1', duration: '5 days', instructions: 'Take after meals' }
  ]);
  
  const [issuing, setIssuing] = useState(false);
  const [issueResult, setIssueResult] = useState(null);
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
      setLoadingList(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setFilePreview(URL.createObjectURL(file));
      setOcrSuccess(false);
    }
  };

  const handleRunOCR = async () => {
    if (!selectedFile) return;
    setOcrLoading(true);
    setOcrSuccess(false);
    try {
      const res = await prescriptionService.uploadAndExtractOCR(selectedFile);
      const parsed = res.data?.prescription_data;
      if (parsed) {
        if (parsed.patient?.name && parsed.patient.name !== 'Patient') setPatientName(parsed.patient.name);
        if (parsed.doctor?.clinic) setClinicName(parsed.doctor.clinic);
        if (parsed.diagnosis) setDiagnosis(parsed.diagnosis);
        if (parsed.medications && parsed.medications.length > 0) setMedications(parsed.medications);
        setOcrSuccess(true);
      }
    } catch (err) {
      alert('OCR Pipeline Error: ' + (err.response?.data?.error || err.message));
    } finally {
      setOcrLoading(false);
    }
  };

  const addMedicationRow = () => {
    setMedications([
      ...medications,
      { drug_name: '', dosage: '500 mg', frequency: '1-0-1', duration: '5 days', instructions: 'After food' }
    ]);
  };

  const updateMedication = (index, field, value) => {
    const updated = [...medications];
    updated[index][field] = value;
    setMedications(updated);
  };

  const removeMedication = (index) => {
    setMedications(medications.filter((_, i) => i !== index));
  };

  const handleIssuePrescription = async (e) => {
    e.preventDefault();
    setIssuing(true);
    setIssueResult(null);
    try {
      const payload = {
        patientName,
        clinicName,
        diagnosis,
        medications
      };
      const res = await prescriptionService.issuePrescription(payload);
      setIssueResult(res);
      loadPrescriptions();
    } catch (err) {
      alert('Issue Error: ' + (err.response?.data?.error || err.message));
    } finally {
      setIssuing(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-blue-950/40 via-slate-900 to-slate-900 border border-blue-500/20">
        <div>
          <span className="text-xs font-mono uppercase tracking-wider text-blue-400 font-semibold flex items-center gap-1.5 mb-1">
            <Stethoscope className="w-4 h-4" /> Doctor Clinical Console
          </span>
          <h1 className="text-2xl font-bold text-white">Prescription Issuance & Cryptographic Vault</h1>
          <p className="text-xs text-slate-400 mt-1">
            Upload paper slips for AI OCR extraction, verify drug details, and seal records with your RSA private key.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono bg-slate-950/80 px-3.5 py-2 rounded-xl border border-slate-800 text-slate-300">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>RSA-2048 Digital Signer: Active</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: OCR Slip Upload & Extraction */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                <Upload className="w-4 h-4 text-cyan-400" />
                Upload Prescription Slip (AI OCR)
              </h2>
              <span className="text-[10px] text-cyan-400 font-mono bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-800/40">
                Python FastAPI / EasyOCR
              </span>
            </div>

            <div className="border-2 border-dashed border-slate-700 hover:border-cyan-500/50 rounded-xl p-4 text-center cursor-pointer transition-colors relative bg-slate-950/40">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
              {filePreview ? (
                <div className="space-y-2">
                  <img src={filePreview} alt="Prescription preview" className="max-h-48 mx-auto rounded-lg object-contain" />
                  <p className="text-xs text-slate-300 font-mono">{selectedFile?.name}</p>
                </div>
              ) : (
                <div className="py-6 space-y-2">
                  <Upload className="w-8 h-8 text-slate-500 mx-auto" />
                  <p className="text-xs text-slate-300 font-medium">Click or drag & drop prescription image</p>
                  <p className="text-[10px] text-slate-500">Supports PNG, JPG, JPEG, WEBP (Doctors' handwritten/printed slips)</p>
                </div>
              )}
            </div>

            <button
              onClick={handleRunOCR}
              disabled={!selectedFile || ocrLoading}
              className="w-full py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs transition-all flex items-center justify-center gap-2 shadow-lg shadow-cyan-600/20 disabled:opacity-40"
            >
              {ocrLoading ? (
                <span>Running OpenCV & Vision Extraction...</span>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Extract Medical Entities via AI</span>
                </>
              )}
            </button>

            {ocrSuccess && (
              <div className="p-3 bg-emerald-950/30 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>AI OCR Extracted entities successfully! Form updated below.</span>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Prescription Review & Cryptographic Sealing Form */}
        <div className="lg:col-span-7">
          <form onSubmit={handleIssuePrescription} className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                <Lock className="w-4 h-4 text-emerald-400" />
                Clinical Details & Vault Encryption
              </h2>
              <span className="text-[10px] text-emerald-400 font-mono bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-800/40">
                AES-256-GCM + SHA-256
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="text-slate-300 block mb-1 font-medium">Patient Full Name</label>
                <input
                  type="text"
                  required
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-emerald-500 focus:outline-none text-slate-200"
                />
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-medium">Clinic / Facility</label>
                <input
                  type="text"
                  required
                  value={clinicName}
                  onChange={(e) => setClinicName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-emerald-500 focus:outline-none text-slate-200"
                />
              </div>
            </div>

            <div className="text-xs">
              <label className="text-slate-300 block mb-1 font-medium flex items-center justify-between">
                <span>Confidential Clinical Diagnosis</span>
                <span className="text-[10px] text-amber-400 font-mono">Protected by Selective Disclosure (Pharmacist cannot see this)</span>
              </label>
              <textarea
                rows={2}
                value={diagnosis}
                onChange={(e) => setDiagnosis(e.target.value)}
                placeholder="e.g. Acute Bacterial Sinusitis, Type 2 Diabetes"
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-emerald-500 focus:outline-none text-slate-200"
              />
            </div>

            {/* Medications Table */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-200">Prescribed Medications</span>
                <button
                  type="button"
                  onClick={addMedicationRow}
                  className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-medium"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Medication
                </button>
              </div>

              <div className="space-y-2">
                {medications.map((m, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-2 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800 text-xs items-center">
                    <input
                      type="text"
                      placeholder="Drug Name"
                      value={m.drug_name}
                      onChange={(e) => updateMedication(idx, 'drug_name', e.target.value)}
                      className="col-span-4 px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-200 focus:outline-none"
                    />
                    <input
                      type="text"
                      placeholder="Dosage"
                      value={m.dosage}
                      onChange={(e) => updateMedication(idx, 'dosage', e.target.value)}
                      className="col-span-2 px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-200 focus:outline-none"
                    />
                    <input
                      type="text"
                      placeholder="Freq (e.g. 1-0-1)"
                      value={m.frequency}
                      onChange={(e) => updateMedication(idx, 'frequency', e.target.value)}
                      className="col-span-2 px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-200 focus:outline-none"
                    />
                    <input
                      type="text"
                      placeholder="Duration"
                      value={m.duration}
                      onChange={(e) => updateMedication(idx, 'duration', e.target.value)}
                      className="col-span-3 px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-200 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => removeMedication(idx)}
                      className="col-span-1 text-slate-500 hover:text-red-400 p-1 flex justify-center"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={issuing}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-xs shadow-xl shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {issuing ? (
                <span>Sealing with Private Key...</span>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Sign, Hash (SHA-256) & Seal to Vault</span>
                </>
              )}
            </button>

            {issueResult && (
              <div className="p-4 bg-emerald-950/40 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs space-y-1">
                <p className="font-semibold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Prescription Cryptographically Sealed!
                </p>
                <p className="font-mono text-[10px] text-slate-400 break-all">
                  SHA-256 Hash: {issueResult.dataHash}
                </p>
              </div>
            )}
          </form>
        </div>
      </div>

      {/* Previously Issued Prescriptions */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <h2 className="text-sm font-semibold text-white flex items-center gap-2">
          <FileText className="w-4 h-4 text-blue-400" />
          Authored Prescriptions in Vault
        </h2>

        {loadingList ? (
          <p className="text-xs text-slate-400">Loading vault records...</p>
        ) : prescriptions.length === 0 ? (
          <p className="text-xs text-slate-500">No prescriptions issued yet. Use the form above to seal your first eRx.</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 uppercase font-mono text-[10px]">
                <tr>
                  <th className="p-3">Patient</th>
                  <th className="p-3">Issued Date</th>
                  <th className="p-3">Tamper Hash (SHA-256)</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 bg-slate-900/40">
                {prescriptions.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-800/30">
                    <td className="p-3 font-semibold text-slate-200">{p.patientName}</td>
                    <td className="p-3 text-slate-400">{p.dateIssued}</td>
                    <td className="p-3 font-mono text-[10px] text-emerald-400">{p.dataHash.slice(0, 16)}...</td>
                    <td className="p-3">
                      <span className={`inline-block px-2 py-0.5 rounded font-bold uppercase text-[10px] ${
                        p.status === 'DISPENSED' ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'
                      }`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => setActiveModalId(p.id)}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors inline-flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" /> View & Decrypt
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
