import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { X, Camera, Upload, AlertCircle, Sparkles, CheckCircle2, RefreshCw } from 'lucide-react';

export default function QRCameraScannerModal({ isOpen, onClose, onScanSuccess }) {
  const [activeTab, setActiveTab] = useState('camera'); // 'camera' | 'upload'
  const [cameraLoading, setCameraLoading] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [scanningActive, setScanningActive] = useState(false);
  const [uploadProcessing, setUploadProcessing] = useState(false);
  const [uploadError, setUploadError] = useState('');
  
  const scannerRef = useRef(null);
  const containerId = 'interactive-qr-reader';

  useEffect(() => {
    if (!isOpen) return;

    if (activeTab === 'camera') {
      startCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isOpen, activeTab]);

  const startCamera = async () => {
    setCameraLoading(true);
    setCameraError('');
    
    // Stop any existing instance
    await stopCamera();

    try {
      const html5QrCode = new Html5Qrcode(containerId);
      scannerRef.current = html5QrCode;

      const config = {
        fps: 10,
        qrbox: { width: 240, height: 240 },
        aspectRatio: 1.0
      };

      await html5QrCode.start(
        { facingMode: 'environment' },
        config,
        (decodedText) => {
          handleDetected(decodedText);
        },
        () => {
          // Frame scanned without QR match (ignore)
        }
      );

      setScanningActive(true);
    } catch (err) {
      console.warn('Camera scan initialization failed:', err);
      const errMsg = err?.message || 'Camera permission denied or no webcam detected on this device.';
      setCameraError(errMsg);
      setScanningActive(false);
    } finally {
      setCameraLoading(false);
    }
  };

  const stopCamera = async () => {
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }
        scannerRef.current.clear();
      } catch (e) {
        console.warn('Error stopping scanner:', e);
      }
      scannerRef.current = null;
    }
    setScanningActive(false);
  };

  const handleDetected = async (rawText) => {
    await stopCamera();
    onScanSuccess(rawText);
    onClose();
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadProcessing(true);
    setUploadError('');

    try {
      // Create temporary scanner instance for image file scan
      const html5QrCode = new Html5Qrcode('qr-file-scanner-temp');
      const decodedText = await html5QrCode.scanFile(file, true);
      html5QrCode.clear();
      handleDetected(decodedText);
    } catch (err) {
      console.error('QR file scan error:', err);
      setUploadError('No valid QR code detected in this image. Please upload a clear QR code image.');
    } finally {
      setUploadProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-150">
      <div 
        className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden my-6 animate-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 bg-slate-950/70 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                Live Pharmacist QR Scanner
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/50 border border-emerald-800/40 px-2 py-0.5 rounded">
                  HMAC-SHA256
                </span>
              </h2>
              <p className="text-[11px] text-slate-400">Scan patient token via webcam or upload QR image</p>
            </div>
          </div>
          
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 text-xs font-medium">
          <button
            type="button"
            onClick={() => setActiveTab('camera')}
            className={`flex-1 py-2.5 flex items-center justify-center gap-2 border-b-2 transition-colors ${
              activeTab === 'camera'
                ? 'border-emerald-500 text-emerald-400 bg-emerald-950/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Camera className="w-4 h-4" />
            <span>Webcam Stream</span>
          </button>
          <button
            type="button"
            onClick={() => {
              stopCamera();
              setActiveTab('upload');
            }}
            className={`flex-1 py-2.5 flex items-center justify-center gap-2 border-b-2 transition-colors ${
              activeTab === 'upload'
                ? 'border-emerald-500 text-emerald-400 bg-emerald-950/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>Upload QR Image</span>
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {activeTab === 'camera' && (
            <div className="space-y-3">
              {/* Camera Video Viewport */}
              <div className="relative rounded-xl overflow-hidden bg-slate-950 border border-slate-800 flex items-center justify-center min-h-[280px]">
                <div id={containerId} className="w-full h-full max-w-[340px] mx-auto text-slate-400 text-xs"></div>
                
                {cameraLoading && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/90 space-y-2 z-10">
                    <RefreshCw className="w-6 h-6 text-emerald-400 animate-spin" />
                    <p className="text-xs text-slate-400 font-mono">Requesting Camera Permissions...</p>
                  </div>
                )}

                {cameraError && (
                  <div className="absolute inset-0 p-6 flex flex-col items-center justify-center text-center bg-slate-950/95 space-y-3 z-10">
                    <AlertCircle className="w-8 h-8 text-amber-400" />
                    <div>
                      <p className="text-xs font-semibold text-white">Camera Access Unavailable</p>
                      <p className="text-[11px] text-slate-400 mt-1 max-w-xs">{cameraError}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={startCamera}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Retry Camera</span>
                      </button>
                      <button
                        onClick={() => {
                          stopCamera();
                          setActiveTab('upload');
                        }}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Switch to Image Upload</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {scanningActive && (
                <div className="flex items-center justify-center gap-2 text-xs text-emerald-400 font-mono bg-emerald-950/30 border border-emerald-500/20 py-2 rounded-xl">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>Point camera at patient's eRx QR code</span>
                </div>
              )}
            </div>
          )}

          {activeTab === 'upload' && (
            <div className="space-y-4">
              <div className="border-2 border-dashed border-slate-700 hover:border-emerald-500/50 rounded-xl p-8 text-center cursor-pointer transition-colors relative bg-slate-950/50">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
                <div className="space-y-2">
                  <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto">
                    <Upload className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-medium text-slate-200">
                    {uploadProcessing ? 'Decoding QR cryptographic token...' : 'Click or drop Patient QR Image here'}
                  </p>
                  <p className="text-[10px] text-slate-500">
                    Supports PNG, JPG, JPEG, WEBP or screenshots of patient QR code
                  </p>
                </div>
              </div>

              {uploadError && (
                <div className="p-3 bg-red-950/40 border border-red-500/30 rounded-xl text-red-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                  <span>{uploadError}</span>
                </div>
              )}

              {/* Hidden element required by html5-qrcode for file scanning */}
              <div id="qr-file-scanner-temp" style={{ display: 'none' }}></div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950/60 border-t border-slate-800 flex items-center justify-between text-xs text-slate-500">
          <span>Decodes HMAC-SHA256 QR Tokens</span>
          <button
            type="button"
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
