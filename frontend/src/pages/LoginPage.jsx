import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/api';
import { Lock, Stethoscope, User, Pill, ShieldCheck, ArrowRight, CheckCircle2, Sparkles } from 'lucide-react';

export default function LoginPage() {
  const { login, register } = useAuth();
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('DOCTOR');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [clinic, setClinic] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [seedStatus, setSeedStatus] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (isRegistering) {
        await register({ email, password, name, role, licenseNumber, clinic });
      } else {
        await login(email, password);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (demoEmail, demoPassword) => {
    setLoading(true);
    setError('');
    try {
      // First ensure demo accounts exist
      await authService.seedDemo();
      await login(demoEmail, demoPassword);
    } catch (err) {
      setError(err.response?.data?.error || 'Quick login failed. Try standard login.');
    } finally {
      setLoading(false);
    }
  };

  const handleSeed = async () => {
    setLoading(true);
    try {
      const res = await authService.seedDemo();
      setSeedStatus('Demo database seeded successfully!');
      setTimeout(() => setSeedStatus(''), 4000);
    } catch (err) {
      setError('Seed failed: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
      {/* Background radial gradients */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-10 right-10 w-[400px] h-[400px] bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-md w-full space-y-8 relative z-10">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 rounded-2xl bg-gradient-to-tr from-emerald-500 to-cyan-500 shadow-xl shadow-emerald-500/20 text-white mb-2">
            <Lock className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            {isRegistering ? 'Create Secure Vault Identity' : 'Zero-Knowledge Prescription Vault'}
          </h1>
          <p className="text-xs text-slate-400">
            End-to-end encrypted medical records with AI OCR & tamper-proof audit trails
          </p>
        </div>

        {/* 1-Click Role Switcher Demo Cards */}
        {!isRegistering && (
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-2.5 backdrop-blur-md">
            <div className="flex items-center justify-between text-xs text-slate-400 font-semibold mb-1">
              <span className="flex items-center gap-1.5 text-emerald-400">
                <Sparkles className="w-3.5 h-3.5" /> 1-Click Role Switcher Demo:
              </span>
              <button onClick={handleSeed} className="text-[11px] text-cyan-400 hover:underline">
                Reset Demo DB
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleQuickLogin('doctor@hospital.org', 'password123')}
                className="p-2.5 rounded-xl bg-slate-950 hover:bg-blue-950/40 border border-slate-800 hover:border-blue-500/40 text-left transition-all group"
              >
                <div className="flex items-center gap-2 text-blue-400 font-semibold mb-0.5">
                  <Stethoscope className="w-3.5 h-3.5" /> Doctor
                </div>
                <div className="text-[10px] text-slate-400 truncate">Dr. Sarah Jenkins</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('patient@vault.org', 'password123')}
                className="p-2.5 rounded-xl bg-slate-950 hover:bg-emerald-950/40 border border-slate-800 hover:border-emerald-500/40 text-left transition-all group"
              >
                <div className="flex items-center gap-2 text-emerald-400 font-semibold mb-0.5">
                  <User className="w-3.5 h-3.5" /> Patient
                </div>
                <div className="text-[10px] text-slate-400 truncate">Aarav Patel</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('pharmacist@rxcare.org', 'password123')}
                className="p-2.5 rounded-xl bg-slate-950 hover:bg-amber-950/40 border border-slate-800 hover:border-amber-500/40 text-left transition-all group"
              >
                <div className="flex items-center gap-2 text-amber-400 font-semibold mb-0.5">
                  <Pill className="w-3.5 h-3.5" /> Pharmacist
                </div>
                <div className="text-[10px] text-slate-400 truncate">Liam Vance, R.Ph</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('auditor@cybersecurity.org', 'password123')}
                className="p-2.5 rounded-xl bg-slate-950 hover:bg-purple-950/40 border border-slate-800 hover:border-purple-500/40 text-left transition-all group"
              >
                <div className="flex items-center gap-2 text-purple-400 font-semibold mb-0.5">
                  <ShieldCheck className="w-3.5 h-3.5" /> SecOps Auditor
                </div>
                <div className="text-[10px] text-slate-400 truncate">Elena Rostova</div>
              </button>
            </div>

            {seedStatus && (
              <p className="text-[11px] text-emerald-400 flex items-center gap-1.5 pt-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> {seedStatus}
              </p>
            )}
          </div>
        )}

        {/* Auth Form */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl backdrop-blur-md">
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            
            {error && (
              <div className="p-3 bg-red-950/50 border border-red-500/40 rounded-xl text-red-300">
                {error}
              </div>
            )}

            {isRegistering && (
              <>
                <div>
                  <label className="text-slate-300 font-medium block mb-1">Full Legal Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Dr. Rajesh Sharma"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-emerald-500 focus:outline-none text-slate-200 placeholder:text-slate-600"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-medium block mb-1">Select Vault Role</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-emerald-500 focus:outline-none text-slate-200"
                  >
                    <option value="DOCTOR">Doctor (Cryptographic Signer)</option>
                    <option value="PATIENT">Patient (Vault Owner)</option>
                    <option value="PHARMACIST">Pharmacist (Selective Disclosure Dispenser)</option>
                    <option value="AUDITOR">Security Auditor (Anomaly Inspector)</option>
                  </select>
                </div>

                {role === 'DOCTOR' && (
                  <div>
                    <label className="text-slate-300 font-medium block mb-1">Medical License / Registration No.</label>
                    <input
                      type="text"
                      required
                      value={licenseNumber}
                      onChange={(e) => setLicenseNumber(e.target.value)}
                      placeholder="e.g. MED-KA-2023-88419"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-emerald-500 focus:outline-none text-slate-200 placeholder:text-slate-600"
                    />
                  </div>
                )}
              </>
            )}

            <div>
              <label className="text-slate-300 font-medium block mb-1">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@hospital.org"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-emerald-500 focus:outline-none text-slate-200 placeholder:text-slate-600"
              />
            </div>

            <div>
              <label className="text-slate-300 font-medium block mb-1">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-emerald-500 focus:outline-none text-slate-200 placeholder:text-slate-600"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-sm shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <span>Securing Access...</span>
              ) : (
                <>
                  <span>{isRegistering ? 'Register & Generate Keypair' : 'Authenticate & Unlock Vault'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-4 pt-4 border-t border-slate-800 text-center">
            <button
              type="button"
              onClick={() => { setIsRegistering(!isRegistering); setError(''); }}
              className="text-xs text-slate-400 hover:text-emerald-400 transition-colors"
            >
              {isRegistering ? 'Already have credentials? Sign in' : "Don't have an account? Register new identity"}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
