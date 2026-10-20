import React, { useState, useEffect } from 'react';
import { 
  Lock, ShieldCheck, Eye, EyeOff, Key, Fingerprint, 
  Pill, Stethoscope, FileText, Zap, ArrowRight, 
  CheckCircle, AlertTriangle, Database, Link2, QrCode,
  Shield, Cpu, Binary, ChevronDown
} from 'lucide-react';

export default function LandingPage({ onGetStarted }) {
  const [visibleSections, setVisibleSections] = useState(new Set());
  const [activeFeature, setActiveFeature] = useState(0);
  const [showDemo, setShowDemo] = useState(false);

  // Animate sections on scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisibleSections(prev => new Set([...prev, entry.target.id]));
          }
        });
      },
      { threshold: 0.15 }
    );

    document.querySelectorAll('[data-animate]').forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  // Auto-cycle features
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveFeature(prev => (prev + 1) % 4);
    }, 3500);
    return () => clearInterval(timer);
  }, []);

  const features = [
    {
      icon: <EyeOff className="w-6 h-6" />,
      title: 'Zero-Knowledge Selective Disclosure',
      description: 'Pharmacists verify prescriptions and dispense medications without ever seeing your confidential diagnosis. Mathematically enforced privacy.',
      color: 'emerald',
      badge: 'Core Innovation'
    },
    {
      icon: <Fingerprint className="w-6 h-6" />,
      title: 'SHA-256 Tamper Detection',
      description: 'Every prescription is fingerprinted with a cryptographic hash. If even a single character is altered in the database, the system instantly detects corruption.',
      color: 'cyan',
      badge: 'Integrity'
    },
    {
      icon: <Key className="w-6 h-6" />,
      title: 'RSA-2048 Doctor Signatures',
      description: 'Doctors digitally sign prescriptions with their private key. No administrator or attacker can forge a valid prescription without the key.',
      color: 'blue',
      badge: 'Non-Repudiation'
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: 'Double-Fill Replay Guard',
      description: 'A cryptographic state machine prevents opioid shopping and duplicate dispensing. Attempts trigger real-time security alerts.',
      color: 'purple',
      badge: 'Anti-Fraud'
    }
  ];

  const roles = [
    { icon: <Stethoscope className="w-5 h-5" />, name: 'Doctor', desc: 'Upload prescriptions, AI OCR extraction, digitally sign & seal records', color: 'blue' },
    { icon: <FileText className="w-5 h-5" />, name: 'Patient', desc: 'View encrypted health vault, generate HMAC-signed QR codes for pharmacy', color: 'emerald' },
    { icon: <Pill className="w-5 h-5" />, name: 'Pharmacist', desc: 'Verify signatures, dispense meds — diagnosis stays REDACTED', color: 'amber' },
    { icon: <AlertTriangle className="w-5 h-5" />, name: 'Auditor', desc: 'Monitor IDS alerts, verify blockchain audit chain, simulate attacks', color: 'purple' },
  ];

  const cryptoStack = [
    { name: 'AES-256-GCM', purpose: 'Authenticated Encryption', detail: 'Confidentiality + Tamper Proof' },
    { name: 'SHA-256', purpose: 'Integrity Fingerprint', detail: 'Deterministic Hash Verification' },
    { name: 'RSA-2048', purpose: 'Digital Signatures', detail: 'Physician Non-Repudiation' },
    { name: 'ECDH secp256k1', purpose: 'Key Agreement', detail: 'Pairwise Forward Secrecy' },
    { name: 'HMAC-SHA256', purpose: 'QR Authentication', detail: 'Contactless Tamper-Proof Sharing' },
    { name: 'bcrypt', purpose: 'Password Hashing', detail: 'Rainbow Table Resistance' },
  ];

  const isVisible = (id) => visibleSections.has(id);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 overflow-x-hidden">

      {/* ===== HERO SECTION ===== */}
      <section className="relative min-h-[92vh] flex items-center justify-center px-4 overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-cyan-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
          <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
          
          {/* Grid pattern */}
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.03) 1px, transparent 0)',
            backgroundSize: '40px 40px'
          }}></div>
        </div>

        <div className="relative z-10 max-w-5xl mx-auto text-center space-y-8">
          {/* Floating badge */}
          <div className="inline-flex items-center gap-2 bg-slate-900/80 border border-slate-700/50 px-4 py-2 rounded-full backdrop-blur-sm animate-bounce" style={{ animationDuration: '3s' }}>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-xs font-mono text-slate-300">ISC Project • Cryptographic Security • AI-Powered</span>
          </div>

          {/* Main heading */}
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[1.1]">
            <span className="bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
              Zero-Knowledge
            </span>
            <br />
            <span className="bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-500 bg-clip-text text-transparent">
              Medical Prescription
            </span>
            <br />
            <span className="bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
              Vault
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
            A privacy-preserving, tamper-evident e-prescription ecosystem where pharmacists 
            verify and dispense medications <span className="text-emerald-400 font-semibold">without ever seeing your diagnosis</span>.
          </p>

          {/* CTA buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <button
              onClick={onGetStarted}
              className="group px-8 py-3.5 bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-bold rounded-xl shadow-xl shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all duration-300 flex items-center gap-2 text-sm"
            >
              <Lock className="w-4 h-4" />
              Enter Secure Vault
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
            <a
              href="https://github.com/Pradhyuman377/zk-medical-prescription-vault"
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3.5 bg-slate-900/80 hover:bg-slate-800 border border-slate-700 hover:border-slate-600 text-slate-200 font-semibold rounded-xl transition-all text-sm flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>
              View Source Code
            </a>
          </div>

          {/* Crypto badge strip */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-6">
            {['AES-256-GCM', 'RSA-2048', 'SHA-256', 'ECDH-secp256k1', 'HMAC-SHA256'].map(tag => (
              <span key={tag} className="px-3 py-1.5 bg-slate-900/60 border border-slate-800 rounded-lg text-[10px] font-mono text-emerald-400 tracking-wider">
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <ChevronDown className="w-5 h-5 text-slate-500" />
        </div>
      </section>

      {/* ===== PROBLEM SECTION ===== */}
      <section 
        id="problem" 
        data-animate 
        className={`py-24 px-4 transition-all duration-1000 ${isVisible('problem') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
      >
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-xs font-mono text-red-400 uppercase tracking-widest">The Problem</span>
            <h2 className="text-3xl sm:text-4xl font-bold mt-3 text-white">Healthcare Privacy is Broken</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: <EyeOff />, title: 'Information Leakage', desc: 'Pharmacists see your full diagnosis (HIV status, psychiatric history, substance disorders) when they only need to know what medicine to dispense.' },
              { icon: <AlertTriangle />, title: 'Prescription Forgery', desc: 'Paper prescriptions are trivially forged. Opioid shoppers fill the same prescription at multiple pharmacies with no digital safeguard.' },
              { icon: <Database />, title: 'Database Tampering', desc: 'Rogue insiders or compromised admins can silently alter dosages, drug names, or patient records with no cryptographic audit trail.' }
            ].map((item, i) => (
              <div key={i} className="p-6 bg-red-950/20 border border-red-500/20 rounded-2xl space-y-3 hover:border-red-500/40 transition-colors">
                <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center text-red-400">
                  {item.icon}
                </div>
                <h3 className="font-bold text-red-300 text-sm">{item.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== KEY FEATURES ===== */}
      <section 
        id="features" 
        data-animate 
        className={`py-24 px-4 transition-all duration-1000 ${isVisible('features') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
      >
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-xs font-mono text-emerald-400 uppercase tracking-widest">Our Solution</span>
            <h2 className="text-3xl sm:text-4xl font-bold mt-3 text-white">Key Security Innovations</h2>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {features.map((f, i) => (
              <div 
                key={i} 
                className={`group relative p-6 rounded-2xl border transition-all duration-500 cursor-pointer ${
                  activeFeature === i 
                    ? `bg-${f.color}-950/30 border-${f.color}-500/40 shadow-lg shadow-${f.color}-500/10` 
                    : 'bg-slate-900/40 border-slate-800 hover:border-slate-700'
                }`}
                onClick={() => setActiveFeature(i)}
              >
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
                    activeFeature === i 
                      ? `bg-${f.color}-500/20 text-${f.color}-400` 
                      : 'bg-slate-800 text-slate-400'
                  }`}>
                    {f.icon}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-white text-sm">{f.title}</h3>
                      <span className={`text-[9px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full ${
                        activeFeature === i 
                          ? `bg-${f.color}-500/20 text-${f.color}-400 border border-${f.color}-500/30` 
                          : 'bg-slate-800 text-slate-500'
                      }`}>
                        {f.badge}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">{f.description}</p>
                  </div>
                </div>
                {activeFeature === i && (
                  <div className={`absolute top-0 left-0 w-1 h-full bg-${f.color}-500 rounded-l-2xl`}></div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== SELECTIVE DISCLOSURE DEMO ===== */}
      <section 
        id="disclosure" 
        data-animate 
        className={`py-24 px-4 transition-all duration-1000 ${isVisible('disclosure') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
      >
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-xs font-mono text-amber-400 uppercase tracking-widest">Interactive Demo</span>
            <h2 className="text-3xl sm:text-4xl font-bold mt-3 text-white">Zero-Knowledge in Action</h2>
            <p className="text-sm text-slate-400 mt-3">See how the same prescription looks different to each role</p>
          </div>

          <div className="flex items-center justify-center gap-3 mb-8">
            <button 
              onClick={() => setShowDemo(false)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${!showDemo ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-900 text-slate-400 border border-slate-800'}`}
            >
              <span className="flex items-center gap-1.5"><Stethoscope className="w-3.5 h-3.5" /> Doctor / Patient View</span>
            </button>
            <button 
              onClick={() => setShowDemo(true)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${showDemo ? 'bg-amber-600 text-white shadow-md' : 'bg-slate-900 text-slate-400 border border-slate-800'}`}
            >
              <span className="flex items-center gap-1.5"><Pill className="w-3.5 h-3.5" /> Pharmacist View</span>
            </button>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-emerald-400" />
                <span className="text-sm font-bold text-white">Cryptographic Prescription Record</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                <span className="text-[10px] text-emerald-400 font-mono">SHA-256 VERIFIED</span>
              </div>
            </div>

            {/* Fields */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div><span className="text-slate-500 block mb-1">Patient</span><span className="text-slate-200 font-medium">Maya Sharma</span></div>
              <div><span className="text-slate-500 block mb-1">Doctor</span><span className="text-slate-200 font-medium">Dr. Emily Chen, MD</span></div>
              <div><span className="text-slate-500 block mb-1">Clinic</span><span className="text-slate-200 font-medium">Sunshine Pediatric</span></div>
              <div><span className="text-slate-500 block mb-1">Status</span><span className="text-emerald-400 font-bold">ISSUED</span></div>
            </div>

            {/* Diagnosis - the key demo */}
            <div className={`p-4 rounded-xl border transition-all duration-500 ${showDemo ? 'bg-amber-950/30 border-amber-500/30' : 'bg-slate-950/50 border-slate-800'}`}>
              <span className="text-xs text-slate-500 block mb-1.5 font-medium">Confidential Diagnosis</span>
              {showDemo ? (
                <div className="space-y-2">
                  <p className="text-sm text-slate-500 italic font-mono">[REDACTED: Protected by Zero-Knowledge Selective Disclosure]</p>
                  <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-lg text-[11px] text-amber-300 flex items-start gap-2">
                    <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                    <span>As a Pharmacist, your access is cryptographically restricted to medications only. The diagnosis is encrypted with a key you do not possess.</span>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-slate-200 font-medium flex items-center gap-2">
                  <Eye className="w-3.5 h-3.5 text-emerald-400" />
                  Acute Asthma Exacerbation with Allergic Rhinitis
                </p>
              )}
            </div>

            {/* Medications - visible to all */}
            <div>
              <span className="text-xs font-semibold text-slate-300 mb-2 flex items-center gap-1.5"><Pill className="w-3.5 h-3.5 text-emerald-400" /> Medications (visible to all authorized roles)</span>
              <div className="overflow-hidden rounded-xl border border-slate-800 mt-2">
                <table className="w-full text-xs">
                  <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-mono">
                    <tr>
                      <th className="p-2.5 text-left">Drug</th>
                      <th className="p-2.5 text-left">Dosage</th>
                      <th className="p-2.5 text-left">Frequency</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    <tr className="bg-slate-900/40"><td className="p-2.5 font-semibold text-slate-200">Albuterol Inhaler</td><td className="p-2.5 text-emerald-400 font-mono">90mcg</td><td className="p-2.5 text-slate-300">2 puffs q4-6h PRN</td></tr>
                    <tr className="bg-slate-900/40"><td className="p-2.5 font-semibold text-slate-200">Cetirizine Syrup</td><td className="p-2.5 text-emerald-400 font-mono">5mg/5ml</td><td className="p-2.5 text-slate-300">5ml OD at bedtime</td></tr>
                    <tr className="bg-slate-900/40"><td className="p-2.5 font-semibold text-slate-200">Fluticasone Nasal Spray</td><td className="p-2.5 text-emerald-400 font-mono">50mcg</td><td className="p-2.5 text-slate-300">1 spray each nostril BD</td></tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== ROLES ===== */}
      <section 
        id="roles" 
        data-animate 
        className={`py-24 px-4 transition-all duration-1000 ${isVisible('roles') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
      >
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-xs font-mono text-blue-400 uppercase tracking-widest">Role-Based Access Control</span>
            <h2 className="text-3xl sm:text-4xl font-bold mt-3 text-white">Four Personas, Four Levels of Access</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {roles.map((r, i) => (
              <div key={i} className={`p-5 rounded-2xl bg-slate-900/50 border border-slate-800 hover:border-${r.color}-500/30 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-${r.color}-500/10 space-y-3`}>
                <div className={`w-10 h-10 rounded-xl bg-${r.color}-500/10 border border-${r.color}-500/20 flex items-center justify-center text-${r.color}-400`}>
                  {r.icon}
                </div>
                <h3 className="font-bold text-white text-sm">{r.name}</h3>
                <p className="text-[11px] text-slate-400 leading-relaxed">{r.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CRYPTO STACK ===== */}
      <section 
        id="crypto" 
        data-animate 
        className={`py-24 px-4 transition-all duration-1000 ${isVisible('crypto') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
      >
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-xs font-mono text-cyan-400 uppercase tracking-widest">Cryptographic Foundation</span>
            <h2 className="text-3xl sm:text-4xl font-bold mt-3 text-white">6-Layer Security Stack</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {cryptoStack.map((c, i) => (
              <div key={i} className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl hover:border-cyan-500/30 transition-colors group">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono font-bold text-cyan-400">{c.name}</span>
                  <Cpu className="w-3.5 h-3.5 text-slate-600 group-hover:text-cyan-500/50 transition-colors" />
                </div>
                <p className="text-xs text-slate-200 font-medium">{c.purpose}</p>
                <p className="text-[10px] text-slate-500 mt-0.5">{c.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== TECH STACK ===== */}
      <section 
        id="tech" 
        data-animate 
        className={`py-24 px-4 transition-all duration-1000 ${isVisible('tech') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
      >
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-xs font-mono text-purple-400 uppercase tracking-widest">Technology Stack</span>
            <h2 className="text-3xl sm:text-4xl font-bold mt-3 text-white">Built With Modern Engineering</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { 
                title: 'Frontend', port: ':5173',
                items: ['React 18 + Vite 5', 'Tailwind CSS', 'Lucide Icons', 'Axios + JWT Auth'],
                hoverBorder: 'hover:border-blue-500/30',
                badgeText: 'text-blue-400',
                badgeBg: 'bg-blue-500/10',
                badgeBorder: 'border-blue-500/20',
                iconColor: 'text-blue-500'
              },
              { 
                title: 'Backend & Crypto Engine', port: ':5000',
                items: ['Node.js + Express', 'Prisma ORM + SQLite', 'Native Node crypto (AES, RSA, SHA)', 'JWT + bcrypt + RBAC'],
                hoverBorder: 'hover:border-emerald-500/30',
                badgeText: 'text-emerald-400',
                badgeBg: 'bg-emerald-500/10',
                badgeBorder: 'border-emerald-500/20',
                iconColor: 'text-emerald-500'
              },
              { 
                title: 'AI / OCR Microservice', port: ':8000',
                items: ['Python FastAPI + Uvicorn', 'EasyOCR (PyTorch CRAFT + CRNN)', 'OpenCV Image Processing', 'Medical Entity Parser'],
                hoverBorder: 'hover:border-amber-500/30',
                badgeText: 'text-amber-400',
                badgeBg: 'bg-amber-500/10',
                badgeBorder: 'border-amber-500/20',
                iconColor: 'text-amber-500'
              }
            ].map((stack, i) => (
              <div key={i} className={`p-6 rounded-2xl bg-slate-900/50 border border-slate-800 ${stack.hoverBorder} transition-colors space-y-4`}>
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-white text-sm">{stack.title}</h3>
                  <span className={`text-[10px] font-mono ${stack.badgeText} ${stack.badgeBg} px-2 py-0.5 rounded-full border ${stack.badgeBorder}`}>{stack.port}</span>
                </div>
                <ul className="space-y-2">
                  {stack.items.map((item, j) => (
                    <li key={j} className="flex items-center gap-2 text-xs text-slate-300">
                      <CheckCircle className={`w-3 h-3 ${stack.iconColor} flex-shrink-0`} />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CTA FOOTER ===== */}
      <section className="py-24 px-4">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-600 to-cyan-500 flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/20">
            <ShieldCheck className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-white">Ready to Explore?</h2>
          <p className="text-sm text-slate-400 max-w-lg mx-auto">
            Log in as any of the 4 demo personas to experience Zero-Knowledge Selective Disclosure, 
            tamper detection, and live attack simulations firsthand.
          </p>
          <button
            onClick={onGetStarted}
            className="group px-8 py-3.5 bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-bold rounded-xl shadow-xl shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all duration-300 flex items-center gap-2 mx-auto text-sm"
          >
            <Lock className="w-4 h-4" />
            Enter the Vault
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-8 px-4">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <Lock className="w-3.5 h-3.5 text-emerald-500" />
            <span>ZK-Prescription Vault • ISC Security Project</span>
          </div>
          <div className="flex items-center gap-4">
            <span>AES-256-GCM • RSA-2048 • SHA-256</span>
            <a 
              href="https://github.com/Pradhyuman377/zk-medical-prescription-vault"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-400 hover:text-white transition-colors"
            >
              GitHub
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
