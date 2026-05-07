import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: Request) {
  try {
    const { image } = await req.json();
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = "Identifikasi objek sampah ini. Sebutkan nama bendanya dan kategorinya (Organik/Anorganik/B3). Contoh: 'Botol Plastik - Anorganik'. Maksimal 4 kata.";
    
    const result = await model.generateContent([
      prompt,
      { inlineData: { data: image, mimeType: "image/jpeg" } }
    ]);

    return NextResponse.json({ label: result.response.text() });
  } catch (error) {
    return NextResponse.json({ error: "Failed to process AI" }, { status: 500 });
  }
}