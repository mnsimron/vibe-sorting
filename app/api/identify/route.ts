import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: Request) {
  try {
    const { image } = await req.json();

    if (!image || typeof image !== "string") {
      return NextResponse.json(
        { label: "Invalid image" },
        { status: 400 }
      );
    }

    const prompt =
      "Identifikasi benda atau jenis sampah ini. Hanya berikan nama bendanya.";

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          mimeType: "image/jpeg",
          data: image,
        },
      },
    ]);

    const response = await result.response;
    const text = response.text().trim() || "Tidak dapat mengidentifikasi";

    return NextResponse.json({
      label: text,
    });
  } catch (error: unknown) {
    console.error("Gemini Error:", error);

    const isQuotaError =
      error instanceof Error &&
      error.message?.includes("429");

    if (isQuotaError) {
      return NextResponse.json(
        {
          label:
            "Quota Gemini habis, coba lagi nanti.",
        },
        { status: 429 }
      );
    }

    return NextResponse.json(
      {
        label: "Sistem AI Error",
      },
      { status: 500 }
    );
  }
}
