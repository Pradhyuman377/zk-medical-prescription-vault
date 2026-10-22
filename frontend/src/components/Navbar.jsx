import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, Stethoscope, User, Pill, AlertTriangle, LogOut, Lock, Menu, X, Sparkles } from 'lucide-react';
import CryptoVisualizerModal from './CryptoVisualizerModal';

export default function Navbar({ activeTab, setActiveTab, isGuest = false, onToggleLogin, showLogin = false }) {
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showCryptoModal, setShowCryptoModal] = useState(false);

  const getRoleBadge = (role) => {
    switch (role) {
      case 'DOCTOR':
        return <span className="bg-blue-500/10 text-blue-400 border border-blue-500/30 text-xs px-2.5 py-1 rounded-full font-medium flex items-center gap-1.5"><Stethoscope className="w-3.5 h-3.5" /> Doctor</span>;
      case 'PATIENT':
        return <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs px-2.5 py-1 rounded-full font-medium flex items-center gap-1.5"><User className="w-3.5 h-3.5" /> Patient</span>;
      case 'PHARMACIST':
        return <span className="bg-amber-500/10 text-amber-400 border border-amber-500/30 text-xs px-2.5 py-1 rounded-full font-medium flex items-center gap-1.5"><Pill className="w-3.5 h-3.5" /> Pharmacist</span>;
      case 'AUDITOR':
        return <span className="bg-purple-500/10 text-purple-400 border border-purple-500/30 text-xs px-2.5 py-1 rounded-full font-medium flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5" /> SecOps Auditor</span>;
      default:
        return null;
    }
  };

  const handleTabSelect = (tab) => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
  };

  return (
    <>
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* Brand */}
          <div 
            onClick={() => { 
              if (!user && onToggleLogin) onToggleLogin(false); 
              setMobileMenuOpen(false);
            }}
            className={`flex items-center space-x-3 ${!user ? 'cursor-pointer hover:opacity-90 transition-opacity' : ''}`}
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/20 flex-shrink-0">
              <Lock className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-base sm:text-lg font-bold tracking-tight bg-gradient-to-r from-white via-slate-200 to-emerald-400 bg-clip-text text-transparent">
                ZK-Prescription Vault
              </span>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-emerald-400 font-mono tracking-wider">AES-256-GCM • SHA-256</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              </div>
            </div>
          </div>

          {/* Desktop Navigation Tabs */}
          {user && (
            <nav className="hidden md:flex items-center space-x-1 bg-slate-900/60 p-1 rounded-xl border border-slate-800">
              {user.role === 'DOCTOR' && (
                <button
                  onClick={() => handleTabSelect('doctor')}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    activeTab === 'doctor' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Doctor Portal
                </button>
              )}

              {user.role === 'PATIENT' && (
                <button
                  onClick={() => handleTabSelect('patient')}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    activeTab === 'patient' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  My Vault
                </button>
              )}

              {user.role === 'PHARMACIST' && (
                <button
                  onClick={() => handleTabSelect('pharmacist')}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    activeTab === 'pharmacist' ? 'bg-amber-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Dispense Hub
                </button>
              )}

              <button
                onClick={() => handleTabSelect('security')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-all ${
                  activeTab === 'security' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                Security & Anomaly Logs
              </button>
            </nav>
          )}

          {/* User Info & Controls */}
          {user ? (
            <div className="flex items-center space-x-2 sm:space-x-3">
              {/* Crypto Architecture Visualizer Button */}
              <button
                onClick={() => setShowCryptoModal(true)}
                className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20 transition-all shadow-sm"
                title="View interactive Cryptography & ZK Architecture Pipeline"
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <span>Crypto Pipeline</span>
              </button>

              <div className="hidden sm:flex flex-col items-end text-right">
                <span className="text-sm font-semibold text-slate-200">{user.name}</span>
                <span className="text-xs text-slate-400">{user.email}</span>
              </div>
              
              <div className="hidden sm:block">
                {getRoleBadge(user.role)}
              </div>

              <button
                onClick={logout}
                title="Sign Out"
                className="hidden sm:flex p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors border border-transparent hover:border-red-500/20"
              >
                <LogOut className="w-4 h-4" />
              </button>

              {/* Mobile Compact User Pill */}
              <div className="flex sm:hidden items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[11px]">
                <span className="font-semibold text-slate-200 max-w-[90px] truncate">{user.name.split(' ')[0]}</span>
                {getRoleBadge(user.role)}
              </div>

              {/* Mobile Hamburger Toggle */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 text-slate-300 hover:text-white bg-slate-900 border border-slate-800 rounded-lg transition-colors"
                aria-label="Toggle navigation menu"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2.5">
              <button
                onClick={() => setShowCryptoModal(true)}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20 transition-all shadow-sm"
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <span>Crypto Architecture</span>
              </button>

              {onToggleLogin && (
                <button
                  onClick={() => onToggleLogin(!showLogin)}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-600 hover:text-white transition-all shadow-sm flex items-center gap-1.5"
                >
                  {showLogin ? '← Project Overview' : 'Enter Vault / Sign In →'}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Mobile Drawer / Slide-Down Menu */}
        {user && mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-800 bg-slate-950/95 backdrop-blur-xl px-4 py-4 space-y-4 animate-in slide-in-from-top duration-200 shadow-2xl">
            {/* Mobile User Info */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <div className="text-sm font-semibold text-slate-200">{user.name}</div>
                <div className="text-xs text-slate-400">{user.email}</div>
              </div>
              <div>{getRoleBadge(user.role)}</div>
            </div>

            {/* Mobile Nav Links */}
            <nav className="flex flex-col space-y-2">
              {user.role === 'DOCTOR' && (
                <button
                  onClick={() => handleTabSelect('doctor')}
                  className={`w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2.5 transition-all ${
                    activeTab === 'doctor' ? 'bg-blue-600 text-white font-semibold shadow-md' : 'text-slate-300 hover:bg-slate-900'
                  }`}
                >
                  <Stethoscope className="w-4 h-4 text-blue-400" />
                  Doctor Portal
                </button>
              )}

              {user.role === 'PATIENT' && (
                <button
                  onClick={() => handleTabSelect('patient')}
                  className={`w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2.5 transition-all ${
                    activeTab === 'patient' ? 'bg-emerald-600 text-white font-semibold shadow-md' : 'text-slate-300 hover:bg-slate-900'
                  }`}
                >
                  <User className="w-4 h-4 text-emerald-400" />
                  My Vault
                </button>
              )}

              {user.role === 'PHARMACIST' && (
                <button
                  onClick={() => handleTabSelect('pharmacist')}
                  className={`w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2.5 transition-all ${
                    activeTab === 'pharmacist' ? 'bg-amber-600 text-white font-semibold shadow-md' : 'text-slate-300 hover:bg-slate-900'
                  }`}
                >
                  <Pill className="w-4 h-4 text-amber-400" />
                  Dispense Hub
                </button>
              )}

              <button
                onClick={() => handleTabSelect('security')}
                className={`w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2.5 transition-all ${
                  activeTab === 'security' ? 'bg-purple-600 text-white font-semibold shadow-md' : 'text-slate-300 hover:bg-slate-900'
                }`}
              >
                <AlertTriangle className="w-4 h-4 text-purple-400" />
                Security & Anomaly Logs
              </button>

              {/* Mobile Crypto Pipeline trigger */}
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  setShowCryptoModal(true);
                }}
                className="w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2.5 text-emerald-400 hover:bg-emerald-500/10 border border-emerald-500/20 transition-all"
              >
                <Sparkles className="w-4 h-4 text-emerald-400" />
                Explore Cryptography Pipeline
              </button>
            </nav>

            {/* Mobile Sign Out */}
            <div className="pt-2 border-t border-slate-800">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  logout();
                }}
                className="w-full py-2.5 px-3.5 rounded-xl text-xs font-semibold text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 flex items-center justify-center gap-2 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sign Out from Vault
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Interactive Cryptography Visualizer Modal */}
      <CryptoVisualizerModal
        isOpen={showCryptoModal}
        onClose={() => setShowCryptoModal(false)}
      />
    </>
  );
}
