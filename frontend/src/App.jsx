import React, { useState, useEffect, lazy, Suspense } from 'react';
import { useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';

// Code-split pages for optimized bundle size & fast mobile loading
const LandingPage = lazy(() => import('./pages/LandingPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const DoctorDashboard = lazy(() => import('./pages/DoctorDashboard'));
const PatientDashboard = lazy(() => import('./pages/PatientDashboard'));
const PharmacistDashboard = lazy(() => import('./pages/PharmacistDashboard'));
const SecurityDashboard = lazy(() => import('./pages/SecurityDashboard'));

function PageLoader() {
  return (
    <div className="flex flex-col items-center justify-center py-28 space-y-3">
      <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-xs text-slate-400 font-mono tracking-wider">Accessing Vault Module...</p>
    </div>
  );
}

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
          <Suspense fallback={<PageLoader />}>
            <LandingPage onGetStarted={() => setShowLogin(true)} />
          </Suspense>
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
        <Suspense fallback={<PageLoader />}>
          <LoginPage onBack={() => setShowLogin(false)} />
        </Suspense>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-emerald-500 selection:text-white">
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="pb-16">
        <Suspense fallback={<PageLoader />}>
          {activeTab === 'doctor' && <DoctorDashboard key={user?.id} />}
          {activeTab === 'patient' && <PatientDashboard key={user?.id} />}
          {activeTab === 'pharmacist' && <PharmacistDashboard key={user?.id} />}
          {activeTab === 'security' && <SecurityDashboard key={user?.id} />}
        </Suspense>
      </main>
    </div>
  );
}
