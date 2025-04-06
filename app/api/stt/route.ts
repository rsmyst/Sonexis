import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get("audio") as Blob;

    if (!audioFile) {
      return NextResponse.json(
        { error: "No audio file provided" },
        { status: 400 }
      );
    }

    // TODO: Implement actual STT logic here
    // For now, we'll simulate the response
    const text = "This is a simulated transcription of the audio input";

    // Get database schema
    const schema = await prisma.databaseMetadata.findMany({
      include: {
        columns: true,
      },
    });

    return NextResponse.json({
      text,
      schema,
    });
  } catch (error) {
    console.error("STT processing error:", error);
    return NextResponse.json(
      { error: "STT processing failed" },
      { status: 500 }
    );
  }
}
