import { Storage } from "@google-cloud/storage";
import { NextResponse } from "next/server";

function createStorageClient() {
  const credentialsJson = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
  const keyFilename = process.env.GOOGLE_APPLICATION_CREDENTIALS;

  if (credentialsJson) {
    try {
      return new Storage({ credentials: JSON.parse(credentialsJson) });
    } catch (error) {
      throw new Error("Invalid GOOGLE_APPLICATION_CREDENTIALS_JSON environment variable");
    }
  }

  if (keyFilename) {
    return new Storage({ keyFilename });
  }

  return new Storage();
}

const storage = createStorageClient();
const bucketName = process.env.GCS_BUCKET_NAME;

export async function POST(req: Request) {
  try {
    const { image, label, sessionId }: { image: string; label: string; sessionId: string } = await req.json();

    if (!sessionId) {
      return NextResponse.json({ error: "Session ID is required" }, { status: 400 });
    }

    if (!bucketName) {
      return NextResponse.json(
        { error: "GCS_BUCKET_NAME is not configured" },
        { status: 500 }
      );
    }

    const bucket = storage.bucket(bucketName);
    
    // Nama file: folder session/timestamp-label.jpg
    const fileName = `uploads/${sessionId}/${Date.now()}-${label.replace(/\s+/g, '_')}.jpg`;
    const file = bucket.file(fileName);

    await file.save(Buffer.from(image, 'base64'), {
      contentType: 'image/jpeg',
      metadata: { metadata: { label, sessionId } }
    });

    return NextResponse.json({ success: true, path: fileName });
  } catch (error: unknown) {
    console.error("GCS Error:", error);
    return NextResponse.json({ error: "GCS Upload Failed" }, { status: 500 });
  }
}