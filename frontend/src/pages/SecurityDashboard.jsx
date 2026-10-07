import React, { useState, useEffect } from 'react';
import { securityService } from '../services/api';
import { ShieldCheck, AlertTriangle, Activity, RefreshCw, Terminal, Radio, Zap, ShieldAlert, Bug, CheckCircle2 } from 'lucide-react';

export default function SecurityDashboard() {
  const [alerts, setAlerts] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('alerts');
  const [simulating, setSimulating] = useState('');
  const [simMessage, setSimMessage] = useState(null);

  useEffect(() => {
    fetchSecurityData();
    const interval = setInterval(fetchSecurityData, 4000); // Poll every 4s for live attack monitoring
    return () => clearInterval(interval);
  }, []);

  const fetchSecurityData = async () => {
    try {
      const [alertsRes, auditRes] = await Promise.all([
        securityService.getAlerts(),
        securityService.getAuditLogs()
      ]);
      setAlerts(alertsRes.alerts);
      setAuditLogs(auditRes.logs);
    } catch (err) {
      console.error('Failed to fetch security logs:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSimulateAttack = async (type) => {
    setSimulating(type);
    setSimMessage(null);
    try {
      let res;
      if (type === 'double-fill') {
        res = await securityService.simulateDoubleFill();
      } else if (type === 'tamper') {
        res = await securityService.simulateTamperBitflip();
      } else if (type === 'burst') {
        res = await securityService.simulateBotBurst();
      }
      setSimMessage({
        type: 'success',
        text: res.message || 'Attack intercepted by intrusion detection engine!'
      });
      fetchSecurityData();
    } catch (err) {
      // 409 Conflict is expected for blocked replay attacks!
      if (err.response?.status === 409) {
        setSimMessage({
          type: 'intercepted',
          text: err.response.data.message || '🚨 ATTACK INTERCEPTED: Duplicate claim blocked by state machine!'
        });
      } else {
        setSimMessage({
          type: 'error',
          text: err.response?.data?.error || 'Attack simulation error.'
        });
      }
      fetchSecurityData();
    } finally {
      setSimulating('');
    }
  };

  const getSeverityBadge = (severity) => {
    switch (severity) {
      case 'CRITICAL':
        return <span className="bg-red-500/20 text-red-400 border border-red-500/40 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">CRITICAL</span>;
      case 'HIGH':
        return <span className="bg-amber-500/20 text-amber-400 border border-amber-500/40 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">HIGH</span>;
      default:
        return <span className="bg-blue-500/20 text-blue-400 border border-blue-500/40 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">INFO</span>;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-purple-950/40 via-slate-900 to-slate-900 border border-purple-500/20">
        <div>
          <span className="text-xs font-mono uppercase tracking-wider text-purple-400 font-semibold flex items-center gap-1.5 mb-1">
            <ShieldCheck className="w-4 h-4" /> SecOps & Anomaly Command Center
          </span>
          <h1 className="text-2xl font-bold text-white">Threat Intelligence & Attack Prevention</h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time monitoring engine protecting against double-fills, SQL tamper attacks, and bot bursts.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchSecurityData}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
          <div className="flex items-center gap-1.5 text-xs font-mono bg-slate-950/80 px-3.5 py-1.5 rounded-xl border border-slate-800 text-emerald-400">
            <Radio className="w-3.5 h-3.5 animate-pulse text-emerald-400" />
            <span>IDS Active</span>
          </div>
        </div>
      </div>

      {/* ⚡ Interactive Live Attack Sandbox (For Viva / Demo Presentation) */}
      <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-purple-950/30 border border-purple-500/30 shadow-2xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-400" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
              Live Attack Simulation Sandbox (Examiner Demo Mode)
            </h2>
          </div>
          <span className="text-[11px] text-purple-300 font-mono bg-purple-950/60 px-2.5 py-0.5 rounded border border-purple-700/50">
            Click an attack to observe real-time IDS prevention
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          {/* Attack 1 */}
          <button
            onClick={() => handleSimulateAttack('double-fill')}
            disabled={!!simulating}
            className="p-3.5 rounded-xl bg-slate-950 hover:bg-red-950/40 border border-slate-800 hover:border-red-500/50 text-left transition-all group disabled:opacity-50"
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-bold text-red-400 flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4" /> 1. Double-Fill Replay
              </span>
              <span className="text-[10px] font-mono text-slate-500 group-hover:text-red-400">EXECUTE ➔</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Simulates redeeming an already-dispensed opioid/eRx at another pharmacy.
            </p>
          </button>

          {/* Attack 2 */}
          <button
            onClick={() => handleSimulateAttack('tamper')}
            disabled={!!simulating}
            className="p-3.5 rounded-xl bg-slate-950 hover:bg-amber-950/40 border border-slate-800 hover:border-amber-500/50 text-left transition-all group disabled:opacity-50"
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-bold text-amber-400 flex items-center gap-1.5">
                <Bug className="w-4 h-4" /> 2. DB Tamper (Bit-Flip)
              </span>
              <span className="text-[10px] font-mono text-slate-500 group-hover:text-amber-400">EXECUTE ➔</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Simulates a rogue admin corrupting the prescription hash/ciphertext in the DB.
            </p>
          </button>

          {/* Attack 3 */}
          <button
            onClick={() => handleSimulateAttack('burst')}
            disabled={!!simulating}
            className="p-3.5 rounded-xl bg-slate-950 hover:bg-purple-950/40 border border-slate-800 hover:border-purple-500/50 text-left transition-all group disabled:opacity-50"
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-bold text-purple-400 flex items-center gap-1.5">
                <Zap className="w-4 h-4" /> 3. Bot Flood Burst
              </span>
              <span className="text-[10px] font-mono text-slate-500 group-hover:text-purple-400">EXECUTE ➔</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Simulates rapid bot queries from suspicious proxy IPs to test sliding-window rate limit.
            </p>
          </button>
        </div>

        {/* Simulation Feedback Banner */}
        {simMessage && (
          <div className={`p-3.5 rounded-xl border text-xs flex items-start gap-2.5 animate-in fade-in ${
            simMessage.type === 'intercepted' || simMessage.type === 'success'
              ? 'bg-red-950/40 border-red-500/50 text-red-200'
              : 'bg-amber-950/40 border-amber-500/50 text-amber-200'
          }`}>
            <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Security Engine Response:</p>
              <p className="text-[11px] mt-0.5 font-mono">{simMessage.text}</p>
            </div>
          </div>
        )}
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1">
          <span className="text-xs text-slate-400">Total Anomaly Alerts</span>
          <p className="text-2xl font-bold text-red-400 font-mono">{alerts.length}</p>
          <span className="text-[10px] text-slate-500">Flags recorded by security middleware</span>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1">
          <span className="text-xs text-slate-400">Cryptographic Audits</span>
          <p className="text-2xl font-bold text-cyan-400 font-mono">{auditLogs.length}</p>
          <span className="text-[10px] text-slate-500">Immutable access and issuance events</span>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1">
          <span className="text-xs text-slate-400">Active Encryption Standard</span>
          <p className="text-sm font-bold text-emerald-400 font-mono mt-1">AES-256-GCM + SHA-256</p>
          <span className="text-[10px] text-slate-500">Authenticated encryption with 12-byte IV</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('alerts')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 ${
            activeTab === 'alerts' 
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20' 
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>Anomaly & Attack Alerts ({alerts.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('audits')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 ${
            activeTab === 'audits' 
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20' 
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>Access Audit Trail ({auditLogs.length})</span>
        </button>
      </div>

      {/* Alerts View */}
      {activeTab === 'alerts' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              Real-Time Security & Replay Alerts
            </h2>
            <span className="text-xs text-slate-500 font-mono">Auto-refreshes every 4s</span>
          </div>

          {loading ? (
            <p className="text-xs text-slate-400">Scanning logs...</p>
          ) : alerts.length === 0 ? (
            <div className="p-8 text-center space-y-2">
              <ShieldCheck className="w-8 h-8 text-emerald-500 mx-auto" />
              <p className="text-xs text-slate-300 font-medium">No anomalous attacks detected.</p>
              <p className="text-[10px] text-slate-500">
                Use the Live Attack Simulation Sandbox above to trigger an attack test.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {alerts.map((a) => (
                <div
                  key={a.id}
                  className="p-4 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2.5">
                      {getSeverityBadge(a.severity)}
                      <span className="font-semibold text-slate-200 font-mono text-[11px]">{a.type}</span>
                      <span className="text-slate-500 text-[10px]">IP: {a.ipAddress}</span>
                    </div>
                    <p className="text-slate-300 text-xs mt-1">{a.details}</p>
                    {a.prescriptionId && (
                      <p className="text-[10px] font-mono text-slate-500">Target eRx: {a.prescriptionId}</p>
                    )}
                  </div>
                  <div className="text-[10px] text-slate-500 sm:text-right font-mono flex-shrink-0">
                    {new Date(a.timestamp).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Audit Trail View */}
      {activeTab === 'audits' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <h2 className="text-sm font-semibold text-white flex items-center gap-2">
            <Terminal className="w-4 h-4 text-cyan-400" />
            Cryptographic Vault Audit Trail
          </h2>

          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 uppercase font-mono text-[10px]">
                <tr>
                  <th className="p-3">Timestamp</th>
                  <th className="p-3">Actor</th>
                  <th className="p-3">Role</th>
                  <th className="p-3">Action</th>
                  <th className="p-3">IP Address</th>
                  <th className="p-3">Prescription Target</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 bg-slate-900/40">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/30">
                    <td className="p-3 text-slate-400 font-mono text-[10px]">{new Date(log.timestamp).toLocaleTimeString()}</td>
                    <td className="p-3 font-semibold text-slate-200">{log.user?.name || 'Anonymous'}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-300">
                        {log.userRole}
                      </span>
                    </td>
                    <td className="p-3 font-mono text-emerald-400 text-[11px]">{log.action}</td>
                    <td className="p-3 text-slate-400 font-mono text-[10px]">{log.ipAddress}</td>
                    <td className="p-3 text-slate-300 text-[11px]">{log.prescription?.patientName || log.prescriptionId?.slice(0, 8)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}
