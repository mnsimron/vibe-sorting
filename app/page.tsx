'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { Camera, Upload, Heart, Loader2, Sparkles, CloudRain, Smile,RefreshCcw } from 'lucide-react';

export default function JuaraVibeSorting() {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sessionIdRef = useRef<string>(typeof window !== 'undefined' ? crypto.randomUUID() : '');

  // PERBAIKAN UTAMA: Gunakan useEffect untuk menempelkan stream ke video
  // Ini memastikan video muncul setelah elemen <video> dirender oleh React
  useEffect(() => {
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  const resizeImage = (base64: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = document.createElement('img');
      img.src = base64;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX = 800; // Sesuai kriteria hemat biaya
        let w = img.width, h = img.height;
        if (w > h) { if (w > MAX) { h *= MAX / w; w = MAX; } } 
        else { if (h > MAX) { w *= MAX / h; h = MAX; } }
        canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      };
    });
  };

  const speak = (text: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    window.speechSynthesis.cancel(); 
    const msg = new SpeechSynthesisUtterance(text);
    msg.lang = 'id-ID';
    window.speechSynthesis.speak(msg);
  };

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(t => t.stop());
      setStream(null);
    }
  }, [stream]);

  const startCamera = async () => {
    setResult(null);
    setPreview(null);
    setIsSaved(false);

    try {
      const s = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      setStream(s);
      // Logic srcObject dipindahkan ke useEffect di atas agar tidak bugs
    } catch {
      alert("Ups! Izin kamera dibutuhkan untuk memindai objek ya.");
    }
  };

  const capture = async () => {
    if (videoRef.current && canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      canvasRef.current.width = videoRef.current.videoWidth;
      canvasRef.current.height = videoRef.current.videoHeight;
      ctx?.drawImage(videoRef.current, 0, 0);
      
      const raw = canvasRef.current.toDataURL('image/jpeg');
      stopCamera(); 

      const resized = await resizeImage(raw);
      setPreview(resized);
      processAI(resized);
    }
  };

  const processAI = async (resized: string) => {
    setLoading(true);
    try {
      const res = await fetch('/api/identify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: resized.split(',')[1] }),
      });
      
      const data = await res.json();
      const finalResult = data.label || "Benda tidak dikenali";
      
      setResult(finalResult);
      speak("Ini adalah " + finalResult);
    } catch {
      const errorMsg = "Sistem sibuk, coba lagi nanti ya.";
      setResult(errorMsg);
      speak(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const saveToCloud = async () => {
    if (!preview) return;
    setLoading(true);
    try {
      await fetch('/api/save', {
        method: 'POST',
        body: JSON.stringify({ 
          image: preview.split(',')[1], 
          label: result || '', 
          sessionId: sessionIdRef.current 
        }),
      });
      setIsSaved(true);
      speak("Selesai! Catatan kamu sudah disimpan.");
    } catch {
      alert("Maaf, gagal menyimpan ke awan.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  return (
    <div className="min-h-screen bg-[#FDFCF8] text-stone-800 flex flex-col items-center p-6">
      
      <header className="w-full max-w-md flex flex-col items-center mb-8 pt-4">
        <div className="bg-amber-100 p-3 rounded-full mb-3">
          <Sparkles className="text-amber-600" size={28} />
        </div>
        <h1 className="text-2xl font-serif font-bold text-stone-900 tracking-tight text-center">
          Vibe <span className="text-amber-600">Mendengar</span>
        </h1>
        <p className="text-sm text-stone-500 mt-1 italic text-center px-4">Membantumu mengenal dunia dengan lebih hangat.</p>
      </header>

      <main className="w-full max-w-md space-y-6 text-center">
        {/* Viewport */}
        <div className="relative aspect-square bg-stone-100 rounded-[2rem] overflow-hidden border-8 border-white shadow-xl shadow-stone-200/50">
          {stream ? (
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              className="w-full h-full object-cover scale-x-[-1]" 
            />
          ) : preview ? (
            <div className="relative w-full h-full">
              <Image src={preview} alt="Hasil Foto" fill className="object-cover" />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-stone-400 p-8">
              <Smile size={64} strokeWidth={1} className="mb-4 opacity-40" />
              <p className="text-sm font-medium">Ambil foto atau unggah gambar untuk mengenali benda di sekitarmu.</p>
            </div>
          )}

          {loading && (
            <div className="absolute inset-0 bg-stone-50/90 flex flex-col items-center justify-center">
              <Loader2 className="animate-spin text-amber-600 mb-3" size={48} />
              <p className="text-sm font-medium text-stone-600 italic">Sedang menganalisis...</p>
            </div>
          )}
        </div>

        {/* Hasil Identifikasi */}
        {result && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-100 animate-in slide-in-from-bottom-4">
            <p className="text-xs font-semibold text-amber-600 uppercase tracking-widest mb-1 text-center">Hasil Deteksi:</p>
            <h2 className="text-xl font-bold text-stone-800 leading-tight italic text-center">
              &quot;Ini adalah <span className="text-stone-900 underline decoration-amber-300 decoration-4">{result}</span>&quot;
            </h2>
          </div>
        )}

        {/* Tombol Aksi Utama */}
        <div className="grid grid-cols-2 gap-4">
          {!stream ? (
            <button onClick={startCamera} className="bg-stone-800 hover:bg-stone-900 text-white h-20 rounded-2xl flex flex-col items-center justify-center transition-all active:scale-95 shadow-lg shadow-stone-200">
              <Camera size={26} />
              <span className="text-xs font-bold mt-2 uppercase tracking-tighter">Mulai Kamera</span>
            </button>
          ) : (
            <button onClick={capture} className="bg-amber-500 hover:bg-amber-600 text-white h-20 rounded-2xl flex flex-col items-center justify-center transition-all active:scale-95 shadow-lg shadow-amber-200">
              <Camera size={26} />
              <span className="text-xs font-bold mt-2 uppercase tracking-tighter">Potret</span>
            </button>
          )}

          <label className="bg-white border-2 border-stone-200 hover:border-stone-300 text-stone-700 h-20 rounded-2xl flex flex-col items-center justify-center transition-all active:scale-95 cursor-pointer shadow-sm">
            <Upload size={24} />
            <span className="text-xs font-bold mt-2 uppercase tracking-tighter">Buka Galeri</span>
            <input type="file" hidden accept="image/*" onChange={(e) => {
               const file = e.target.files?.[0];
               if (file) {
                 const reader = new FileReader();
                 reader.onload = async (ev) => {
                   const raw = ev.target?.result as string;
                   const resized = await resizeImage(raw);
                   setPreview(resized);
                   setResult(null); 
                   processAI(resized);
                 };
                 reader.readAsDataURL(file);
               }
            }} />
          </label>
        </div>

        {/* Tombol Kontrol Tambahan */}
        <div className="space-y-3">
          {stream && (
            <button onClick={stopCamera} className="w-full bg-stone-200 hover:bg-stone-300 text-stone-700 h-14 rounded-2xl font-semibold transition-all active:scale-95 shadow-sm">
              Batal Kamera
            </button>
          )}

          {result && (
            <button onClick={() => speak("Ini adalah " + result)} className="w-full bg-white border border-amber-300 hover:bg-amber-50 text-amber-700 h-14 rounded-2xl font-semibold transition-all active:scale-95 shadow-sm flex items-center justify-center gap-2">
              <RefreshCcw size={16} className="hidden" /> Putar Ulang Suara
            </button>
          )}

          {result && !isSaved && (
            <button onClick={saveToCloud} className="w-full bg-amber-500 hover:bg-amber-600 text-white h-16 rounded-2xl font-bold flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg shadow-amber-200">
              <Heart size={20} fill="currentColor" /> Simpan ke Memori
            </button>
          )}
        </div>

        {isSaved && (
          <div className="flex items-center justify-center gap-2 text-stone-500 text-sm font-medium animate-bounce pt-2">
            <CloudRain size={16} className="text-amber-400" /> Tersimpan aman di awan
          </div>
        )}
      </main>

      {/* Canvas Tersembunyi untuk Capture */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}