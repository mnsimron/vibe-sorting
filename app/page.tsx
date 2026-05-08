'use client';

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { Camera, Upload, Heart, Loader2, Sparkles, CloudRain, Smile } from 'lucide-react';

export default function JuaraVibeSorting() {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const countdownTimerRef = useRef<number | null>(null);
  const sessionIdRef = useRef<string>(crypto.randomUUID());

  const resizeImage = (base64: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = document.createElement('img');
      img.src = base64;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX = 800;
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
    const msg = new SpeechSynthesisUtterance(text);
    msg.lang = 'id-ID';
    window.speechSynthesis.speak(msg);
  };

  const startCamera = async () => {
    setResult(null);
    setIsSaved(false);
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      setStream(s);
      if (videoRef.current) videoRef.current.srcObject = s;

      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
        countdownTimerRef.current = null;
      }

      let count = 3;
      setCountdown(count);
      countdownTimerRef.current = window.setInterval(() => {
        count--;
        setCountdown(count);
        if (count === 0) {
          if (countdownTimerRef.current) {
            clearInterval(countdownTimerRef.current);
            countdownTimerRef.current = null;
          }
          capture();
          setCountdown(null);
        }
      }, 1000);
    } catch {
      alert("Ups! Izin kamera dibutuhkan ya.");
    }
  };

  const capture = async () => {
    if (videoRef.current && canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      canvasRef.current.width = videoRef.current.videoWidth;
      canvasRef.current.height = videoRef.current.videoHeight;
      ctx?.drawImage(videoRef.current, 0, 0);
      const raw = canvasRef.current.toDataURL('image/jpeg');
      const resized = await resizeImage(raw);
      setPreview(resized);
      processAI(resized);
      stopCamera();
    }
  };

  const stopCamera = () => {
    stream?.getTracks().forEach(t => t.stop());
    setStream(null);
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
      
      const finalResult = data.label || "Gagal mengidentifikasi";
      
      setResult(finalResult);
      speak(finalResult);
    } catch {
      const errorMsg = "Sistem gagal merespon";
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
        body: JSON.stringify({ image: preview.split(',')[1], label: result || '', sessionId: sessionIdRef.current }),
      });
      setIsSaved(true);
      speak("Selesai! Catatan kamu sudah disimpan.");
    } catch {
      alert("Maaf, gagal menyimpan");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    return () => {
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
        countdownTimerRef.current = null;
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#FDFCF8] text-stone-800 flex flex-col items-center p-6">
      
      {/* Header - Warm & Friendly */}
      <header className="w-full max-w-md flex flex-col items-center mb-8 pt-4">
        <div className="bg-amber-100 p-3 rounded-full mb-3">
          <Sparkles className="text-amber-600" size={28} />
        </div>
        <h1 className="text-2xl font-serif font-bold text-stone-900 tracking-tight text-center">
          Teman Vibe <span className="text-amber-600">Kamu</span>
        </h1>
        <p className="text-sm text-stone-500 mt-1 italic text-center">Bantu kenali duniamu dengan lebih hangat.</p>
      </header>

      <main className="w-full max-w-md space-y-6 text-center">
        {/* Viewport - Soft Rounded */}
        <div className="relative aspect-square bg-stone-100 rounded-[2rem] overflow-hidden border-8 border-white shadow-xl shadow-stone-200/50">
          {stream ? (
            <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
          ) : preview ? (
            <Image src={preview} alt="Preview" fill className="object-cover" />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-stone-400">
              <Smile size={64} strokeWidth={1} className="mb-4 opacity-40" />
              <p className="text-sm font-medium">Klik tombol di bawah untuk mulai</p>
            </div>
          )}

          {/* Countdown - Soft Amber */}
          {countdown !== null && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/40 backdrop-blur-md">
              <span className="text-8xl font-bold text-amber-600">{countdown}</span>
            </div>
          )}

          {loading && (
            <div className="absolute inset-0 bg-stone-50/90 flex flex-col items-center justify-center">
              <Loader2 className="animate-spin text-amber-600 mb-3" size={48} />
              <p className="text-sm font-medium text-stone-600 italic">Sedang melihat-lihat sebentar...</p>
            </div>
          )}
        </div>

        {/* Identification Result - Warm Card */}
        {result && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-100 animate-in slide-in-from-bottom-4">
            <p className="text-xs font-semibold text-amber-600 uppercase tracking-widest mb-1">Hasil Temuan Kami:</p>
            <h2 className="text-xl font-bold text-stone-800 leading-tight">Ini terlihat seperti <span className="text-stone-900 underline decoration-amber-300 decoration-4">{result}</span></h2>
          </div>
        )}

        {/* Action Buttons - Friendly Colors */}
        <div className="grid grid-cols-2 gap-4">
          <button onClick={startCamera} className="bg-stone-800 hover:bg-stone-900 text-white h-20 rounded-2xl flex flex-col items-center justify-center transition-all active:scale-95 shadow-lg shadow-stone-200">
            <Camera size={26} />
            <span className="text-xs font-bold mt-2">Ambil Foto</span>
          </button>
          
          <label className="bg-white border-2 border-stone-200 hover:border-stone-300 text-stone-700 h-20 rounded-2xl flex flex-col items-center justify-center transition-all active:scale-95 cursor-pointer shadow-sm">
            <Upload size={24} />
            <span className="text-xs font-bold mt-2">Dari Galeri</span>
            <input type="file" hidden accept="image/*" onChange={(e) => {
               const file = e.target.files?.[0];
               if (file) {
                 const reader = new FileReader();
                 reader.onload = async (ev) => {
                   const raw = ev.target?.result as string;
                   const resized = await resizeImage(raw);
                   setPreview(resized);
                   processAI(resized);
                 };
                 reader.readAsDataURL(file);
               }
            }} />
          </label>
        </div>

        {result && !isSaved && (
          <button onClick={saveToCloud} className="w-full bg-amber-500 hover:bg-amber-600 text-white h-16 rounded-2xl font-bold flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg shadow-amber-200">
            <Heart size={20} fill="currentColor" /> Simpan ke Kenangan
          </button>
        )}

        {isSaved && (
          <div className="flex items-center justify-center gap-2 text-stone-500 text-sm font-medium animate-bounce">
            <CloudRain size={16} className="text-amber-400" /> Tersimpan dengan aman di awan
          </div>
        )}
      </main>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
