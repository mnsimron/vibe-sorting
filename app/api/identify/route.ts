import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY!,
});

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
      "Identify this object or waste type. Respond only with the object name.";

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        {
          role: "user",
          parts: [
            {
              text: prompt,
            },
            {
              inlineData: {
                mimeType: "image/jpeg",
                data: image,
              },
            },
          ],
        },
      ],
    });

    const text =
      response.text?.trim() ||
      "Tidak dapat mengidentifikasi";

    return NextResponse.json({
      label: text,
    });
  } catch (error: any) {
    console.error("Gemini Error:", error);

    if (error?.status === 429) {
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
