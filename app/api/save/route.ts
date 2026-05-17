import { Storage } from "@google-cloud/storage";
import { NextResponse } from "next/server";

// Di Google Cloud Run, cukup inisialisasi tanpa argumen.
// SDK akan otomatis mengambil izin dari Service Account.
const storage = new Storage();
const bucketName = process.env.GCS_BUCKET_NAME;

export async function POST(req: Request) {
  try {
    const { image, label, sessionId }: { image: string; label: string; sessionId: string } = await req.json();

    if (!sessionId) {
      return NextResponse.json({ error: "Session ID dibutuhkan" }, { status: 400 });
    }

    if (!bucketName) {
      console.error("GCS_BUCKET_NAME belum diset!");
      return NextResponse.json({ error: "Konfigurasi Bucket salah" }, { status: 500 });
    }

    const bucket = storage.bucket(bucketName);
    
    // Nama file: folder session/timestamp-label.jpg
    const fileName = `uploads/${sessionId}/${Date.now()}-${label.replace(/\s+/g, '_')}.jpg`;
    const file = bucket.file(fileName);

    // Simpan ke GCS
    await file.save(Buffer.from(image, 'base64'), {
      contentType: 'image/jpeg',
      resumable: false, // Matikan resumable untuk performa file kecil
      metadata: { metadata: { label, sessionId } }
    });

    console.log(`Berhasil simpan ke GCS: ${fileName}`);
    return NextResponse.json({ success: true, path: fileName });

  } catch (error: any) {
    console.error("DETAIL ERROR GCS:", error.message);
    return NextResponse.json({ error: "Gagal upload ke Cloud Storage", detail: error.message }, { status: 500 });
  }
}