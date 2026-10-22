import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Lock, Mail, KeyRound, User, Stethoscope, Building, Pill, ShieldCheck, ArrowRight, Shield } from 'lucide-react';

export default function LoginPage({ onBack }) {
  const { login, register } = useAuth();
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('PATIENT');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [clinic, setClinic] = useState('');
  const [auditorSecurityCode, setAuditorSecurityCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (isRegistering) {
        await register({ email, password, name, role, licenseNumber, clinic, auditorSecurityCode });
      } else {
        await login(email, password);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
      {/* Background ambient radial gradients */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-10 right-10 w-[400px] h-[400px] bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-md w-full space-y-6 relative z-10">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="text-xs text-slate-400 hover:text-emerald-400 transition-colors flex items-center gap-1.5 font-medium"
          >
            ← Back to Project Overview
          </button>
        )}
        
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 rounded-2xl bg-gradient-to-tr from-emerald-500 to-cyan-500 shadow-xl shadow-emerald-500/20 text-white mb-1">
            <Lock className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            {isRegistering ? 'Create Secure Vault Identity' : 'Zero-Knowledge Prescription Vault'}
          </h1>
          <p className="text-xs text-slate-400">
            {isRegistering
              ? 'Register with cryptographic ECDH & RSA keypairs generated for your role'
              : 'Sign in to access your encrypted prescription records and vault terminal'}
          </p>
        </div>

        {/* Tab Toggle: Sign In / Register */}
        <div className="grid grid-cols-2 p-1 bg-slate-900/90 border border-slate-800 rounded-xl">
          <button
            type="button"
            onClick={() => { setIsRegistering(false); setError(''); }}
            className={`py-2 text-xs font-semibold rounded-lg transition-all ${
              !isRegistering
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setIsRegistering(true); setError(''); }}
            className={`py-2 text-xs font-semibold rounded-lg transition-all ${
              isRegistering
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Main Authentication Form */}
        <div className="bg-slate-900/95 border border-slate-800 rounded-2xl p-6 shadow-2xl backdrop-blur-md">
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            
            {error && (
              <div className="p-3 bg-red-950/60 border border-red-500/40 rounded-xl text-red-300 font-medium">
                {error}
              </div>
            )}

            {isRegistering && (
              <>
                <div>
                  <label className="text-slate-300 font-medium block mb-1">Full Legal Name</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3 pointer-events-none" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Maya Sharma or Dr. Rajesh Patel"
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-emerald-500 focus:outline-none text-slate-200 placeholder:text-slate-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-slate-300 font-medium block mb-1">Select Vault Role</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-emerald-500 focus:outline-none text-slate-200"
                  >
                    <option value="PATIENT">Patient (Vault Owner)</option>
                    <option value="DOCTOR">Doctor (Cryptographic Signer)</option>
                    <option value="PHARMACIST">Pharmacist (Selective Disclosure Dispenser)</option>
                    <option value="AUDITOR">Security Auditor (Anomaly Inspector)</option>
                  </select>
                </div>

                {(role === 'DOCTOR' || role === 'PHARMACIST') && (
                  <div>
                    <label className="text-slate-300 font-medium block mb-1">
                      {role === 'DOCTOR' ? 'Medical License / Registration No.' : 'Pharmacy License Number'}
                    </label>
                    <div className="relative">
                      {role === 'DOCTOR' ? (
                        <Stethoscope className="w-4 h-4 text-slate-500 absolute left-3.5 top-3 pointer-events-none" />
                      ) : (
                        <Pill className="w-4 h-4 text-slate-500 absolute left-3.5 top-3 pointer-events-none" />
                      )}
                      <input
                        type="text"
                        required
                        value={licenseNumber}
                        onChange={(e) => setLicenseNumber(e.target.value)}
                        placeholder={role === 'DOCTOR' ? 'e.g. MED-KA-2023-88419' : 'e.g. PHARM-88210'}
                        className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-emerald-500 focus:outline-none text-slate-200 placeholder:text-slate-600"
                      />
                    </div>
                  </div>
                )}

                {role === 'DOCTOR' && (
                  <div>
                    <label className="text-slate-300 font-medium block mb-1">Clinic / Hospital Affiliation</label>
                    <div className="relative">
                      <Building className="w-4 h-4 text-slate-500 absolute left-3.5 top-3 pointer-events-none" />
                      <input
                        type="text"
                        value={clinic}
                        onChange={(e) => setClinic(e.target.value)}
                        placeholder="e.g. City General Hospital"
                        className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-emerald-500 focus:outline-none text-slate-200 placeholder:text-slate-600"
                      />
                    </div>
                  </div>
                )}

                {role === 'AUDITOR' && (
                  <div>
                    <label className="text-slate-300 font-medium block mb-1 flex items-center justify-between">
                      <span>Institutional Auditor Security Passcode *</span>
                      <span className="text-[10px] text-amber-400 font-mono">Restricted Access</span>
                    </label>
                    <div className="relative">
                      <Shield className="w-4 h-4 text-amber-400 absolute left-3.5 top-3 pointer-events-none" />
                      <input
                        type="password"
                        required
                        value={auditorSecurityCode}
                        onChange={(e) => setAuditorSecurityCode(e.target.value)}
                        placeholder="Enter Master Security Key"
                        className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-amber-500 focus:outline-none text-slate-200 placeholder:text-slate-600 font-mono text-xs"
                      />
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1">
                      Auditor registration requires an institutional master security authorization key.
                    </p>
                  </div>
                )}
              </>
            )}

            <div>
              <label className="text-slate-300 font-medium block mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3 pointer-events-none" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-emerald-500 focus:outline-none text-slate-200 placeholder:text-slate-600"
                />
              </div>
            </div>

            <div>
              <label className="text-slate-300 font-medium block mb-1">Password</label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-500 absolute left-3.5 top-3 pointer-events-none" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-emerald-500 focus:outline-none text-slate-200 placeholder:text-slate-600"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-3 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-sm shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Securing Access...</span>
                </div>
              ) : (
                <>
                  <span>{isRegistering ? 'Register & Generate Cryptographic Identity' : 'Authenticate & Unlock Vault'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-4 pt-4 border-t border-slate-800/80 text-center">
            <button
              type="button"
              onClick={() => { setIsRegistering(!isRegistering); setError(''); }}
              className="text-xs text-slate-400 hover:text-emerald-400 transition-colors"
            >
              {isRegistering ? 'Already have an identity? Sign in to vault' : "Don't have an identity yet? Register new account"}
            </button>
          </div>
        </div>

        {/* Security badge footer */}
        <div className="flex items-center justify-center gap-2 text-[11px] text-slate-500 font-mono">
          <Shield className="w-3.5 h-3.5 text-emerald-400" />
          <span>Protected with AES-256-GCM • ECDH secp256k1 • bcrypt</span>
        </div>

      </div>
    </div>
  );
}
