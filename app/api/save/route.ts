import { Storage } from "@google-cloud/storage";
import { NextResponse } from "next/server";

function createStorageClient() {
  const credentialsJson =
    process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON ||
    process.env.GOOGLE_CLOUD_KEYFILE_JSON ||
    process.env.GCLOUD_KEYFILE_JSON;
  const keyFilename =
    process.env.GOOGLE_APPLICATION_CREDENTIALS ||
    process.env.GOOGLE_CLOUD_KEYFILE ||
    process.env.GCS_KEYFILE;
  const projectId =
    process.env.GOOGLE_CLOUD_PROJECT ||
    process.env.GCLOUD_PROJECT ||
    process.env.GCP_PROJECT ||
    process.env.GCS_PROJECT;

  if (credentialsJson) {
    try {
      const credentials = JSON.parse(credentialsJson);
      return new Storage({ credentials, projectId: projectId || credentials.project_id });
    } catch {
      throw new Error("Invalid JSON in GOOGLE_APPLICATION_CREDENTIALS_JSON or equivalent env var");
    }
  }

  if (keyFilename) {
    return new Storage({ keyFilename, projectId });
  }

  return new Storage();
}

const storage = createStorageClient();
const bucketName = process.env.GCS_BUCKET_NAME;

const hasExplicitGcsCredentials = Boolean(
  process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON ||
  process.env.GOOGLE_CLOUD_KEYFILE_JSON ||
  process.env.GCLOUD_KEYFILE_JSON ||
  process.env.GOOGLE_APPLICATION_CREDENTIALS ||
  process.env.GOOGLE_CLOUD_KEYFILE ||
  process.env.GCS_KEYFILE
);

export async function POST(req: Request) {
  try {
    // In production (serverless) environments we must have explicit credentials
    if (!hasExplicitGcsCredentials && (process.env.VERCEL || process.env.NODE_ENV === 'production')) {
      console.error('GCS Error: missing explicit credentials (set GOOGLE_APPLICATION_CREDENTIALS_JSON in Vercel)');
      return NextResponse.json({ error: 'GCS credentials not configured. Set GOOGLE_APPLICATION_CREDENTIALS_JSON (or equivalent) in your environment.' }, { status: 500 });
    }
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