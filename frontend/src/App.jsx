import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import DoctorDashboard from './pages/DoctorDashboard';
import PatientDashboard from './pages/PatientDashboard';
import PharmacistDashboard from './pages/PharmacistDashboard';
import SecurityDashboard from './pages/SecurityDashboard';

export default function App() {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('doctor');
  const [showLogin, setShowLogin] = useState(false);

  useEffect(() => {
    if (user) {
      if (user.role === 'DOCTOR') setActiveTab('doctor');
      else if (user.role === 'PATIENT') setActiveTab('patient');
      else if (user.role === 'PHARMACIST') setActiveTab('pharmacist');
      else if (user.role === 'AUDITOR') setActiveTab('security');
    }
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center space-y-3">
        <div className="w-10 h-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs text-slate-400 font-mono">Initializing Cryptographic Enclave...</p>
      </div>
    );
  }

  if (!user) {
    if (!showLogin) {
      return (
        <div className="min-h-screen bg-slate-950 text-slate-100">
          <Navbar 
            activeTab="landing" 
            setActiveTab={() => {}} 
            isGuest={true}
            onToggleLogin={() => setShowLogin(true)}
            showLogin={false}
          />
          <LandingPage onGetStarted={() => setShowLogin(true)} />
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-slate-950 text-slate-100">
        <Navbar 
          activeTab="login" 
          setActiveTab={() => {}} 
          isGuest={true}
          onToggleLogin={() => setShowLogin(false)}
          showLogin={true}
        />
        <LoginPage onBack={() => setShowLogin(false)} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-emerald-500 selection:text-white">
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="pb-16">
        {activeTab === 'doctor' && <DoctorDashboard />}
        {activeTab === 'patient' && <PatientDashboard />}
        {activeTab === 'pharmacist' && <PharmacistDashboard />}
        {activeTab === 'security' && <SecurityDashboard />}
      </main>
    </div>
  );
}
