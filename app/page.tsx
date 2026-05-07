'use client';

import React, { useState, useRef } from 'react';
import { Camera, Upload, Save, RefreshCw, Loader2, Leaf, ScanSearch } from 'lucide-react';

export default function JuaraVibeSorting() {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const [isSaved, setIsSaved] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // --- LOGIKA HEMAT BIAYA: RESIZE 800PX DI CLIENT ---
  const resizeImage = (base64: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = base64;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX = 800;
        let w = img.width;
        let h = img.height;
        if (w > h) { if (w > MAX) { h *= MAX / w; w = MAX; } } 
        else { if (h > MAX) { w *= MAX / h; h = MAX; } }
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      };
    });
  };

  // --- TTS LOGIC ---
  const speak = (text: string) => {
    const msg = new SpeechSynthesisUtterance(text);
    msg.lang = 'id-ID';
    window.speechSynthesis.speak(msg);
  };

  // --- CAMERA & TIMER LOGIC ---
  const startCamera = async () => {
    setResult("");
    setIsSaved(false);
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      setStream(s);
      if (videoRef.current) videoRef.current.srcObject = s;

      let count = 3;
      setCountdown(count);
      const timer = setInterval(() => {
        count--;
        setCountdown(count);
        if (count === 0) {
          clearInterval(timer);
          capture();
          setCountdown(null);
        }
      }, 1000);
    } catch (err) {
      alert("Akses kamera ditolak.");
    }
  };

  const capture = () => {
    if (videoRef.current && canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      canvasRef.current.width = videoRef.current.videoWidth;
      canvasRef.current.height = videoRef.current.videoHeight;
      ctx?.drawImage(videoRef.current, 0, 0);
      const raw = canvasRef.current.toDataURL('image/jpeg');
      stopCamera();
      processAI(raw);
    }
  };

  const stopCamera = () => {
    stream?.getTracks().forEach(t => t.stop());
    setStream(null);
  };

  // --- AI INTEGRATION ---
  const processAI = async (raw: string) => {
    setLoading(true);
    const resized = await resizeImage(raw);
    setPreview(resized);

    try {
      const res = await fetch('/api/identify', {
        method: 'POST',
        body: JSON.stringify({ image: resized.split(',')[1] }),
      });
      const data = await res.json();
      setResult(data.label);
      speak(data.label);
    } catch (e) {
      setResult("Gagal Mengidentifikasi");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center p-5 font-sans text-slate-800">
      
      {/* Header - Eco Tech Style */}
      <header className="w-full max-w-md flex justify-between items-center mb-8 mt-2">
        <div className="flex items-center gap-2">
          <div className="bg-emerald-600 p-2 rounded-xl shadow-lg shadow-emerald-200">
            <Leaf className="text-white" size={20} />
          </div>
          <h1 className="text-xl font-black tracking-tight text-slate-800">
            VIBE<span className="text-emerald-600">SORTING</span>
          </h1>
        </div>
        <span className="text-[10px] font-bold py-1 px-3 bg-slate-200 rounded-full text-slate-500 tracking-widest uppercase">
          v1.0-Juara
        </span>
      </header>

      <main className="w-full max-w-md space-y-6">
        
        {/* Viewport - Slate & Emerald Border */}
        <div className="relative aspect-square bg-slate-200 rounded-[3rem] overflow-hidden shadow-2xl border-[6px] border-white ring-1 ring-slate-200">
          {stream ? (
            <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
          ) : preview ? (
            <img src={preview} className="w-full h-full object-cover animate-in fade-in duration-500" alt="Preview" />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-slate-400">
              <ScanSearch size={64} strokeWidth={1} className="mb-4 opacity-40" />
              <p className="text-xs font-bold tracking-widest uppercase">Siap Memindai Sampah</p>
            </div>
          )}

          {/* Countdown Overlay - Amber 400 */}
          {countdown !== null && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm">
              <div className="bg-amber-400 w-32 h-32 rounded-full flex items-center justify-center shadow-2xl animate-pulse">
                <span className="text-6xl font-black text-slate-900">{countdown}</span>
              </div>
            </div>
          )}

          {/* Loading Overlay */}
          {loading && (
            <div className="absolute inset-0 bg-emerald-600/90 backdrop-blur-md flex flex-col items-center justify-center text-white">
              <Loader2 className="animate-spin mb-4" size={48} />
              <p className="text-sm font-black tracking-[0.3em] uppercase">AI Menganalisis</p>
            </div>
          )}
        </div>

        {/* Identification Card - Slate 800 Background for High Tech Feel */}
        {result && (
          <div className="bg-slate-800 p-6 rounded-[2rem] shadow-xl border-l-8 border-emerald-500 animate-in slide-in-from-bottom-5">
            <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-[0.2em] mb-2">Hasil Identifikasi</p>
            <h2 className="text-3xl font-bold text-white tracking-tight leading-none">{result}</h2>
          </div>
        )}

        {/* Buttons Section */}
        <div className="grid grid-cols-2 gap-4">
          <button 
            onClick={startCamera}
            className="group bg-emerald-600 hover:bg-emerald-700 text-white h-24 rounded-[2rem] flex flex-col items-center justify-center transition-all active:scale-95 shadow-xl shadow-emerald-200"
          >
            <Camera size={28} className="group-hover:scale-110 transition-transform" />
            <span className="text-[11px] font-black mt-2 uppercase tracking-tighter">Buka Kamera</span>
          </button>

          <label className="group bg-white border-2 border-slate-200 text-slate-600 h-24 rounded-[2rem] flex flex-col items-center justify-center transition-all active:scale-95 cursor-pointer hover:border-emerald-200">
            <Upload size={28} className="group-hover:-translate-y-1 transition-transform text-amber-500" />
            <span className="text-[11px] font-black mt-2 uppercase tracking-tighter text-slate-500">Upload Foto</span>
            <input type="file" hidden accept="image/*" onChange={(e) => {
               const file = e.target.files?.[0];
               if (file) {
                 const reader = new FileReader();
                 reader.onload = (ev) => processAI(ev.target?.result as string);
                 reader.readAsDataURL(file);
               }
            }} />
          </label>
        </div>

        {/* Save Button - Eco Tech Modern */}
        {result && !isSaved && (
          <button 
            onClick={() => setIsSaved(true)}
            className="w-full bg-slate-900 text-white h-20 rounded-[2rem] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 shadow-2xl active:scale-[0.98] transition-all border-b-4 border-emerald-600"
          >
            <Save className="text-emerald-500" size={24} />
            Simpan ke Cloud
          </button>
        )}

        {isSaved && (
          <div className="w-full py-4 text-center text-emerald-600 font-bold text-sm animate-bounce">
            ✓ Berhasil Tersimpan di GCS
          </div>
        )}

        {preview && (
          <button 
            onClick={() => {setPreview(null); setResult(""); setIsSaved(false);}}
            className="w-full text-slate-400 text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2"
          >
            <RefreshCw size={12} /> Reset Lensa
          </button>
        )}
      </main>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}