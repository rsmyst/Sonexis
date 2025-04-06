import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { writeFile } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const audio = formData.get("audio") as Blob;

    if (!audio) {
      return NextResponse.json(
        { error: "Missing audio file" },
        { status: 400 }
      );
    }

    // Save the audio to a temporary file
    const buffer = await audio.arrayBuffer();
    const tempDir = tmpdir();
    const tempFilePath = join(tempDir, `verify.wav`);
    await writeFile(tempFilePath, Buffer.from(buffer));

    // Get all voice profiles
    const voiceProfiles = await prisma.voiceProfile.findMany({
      where: {
        isActive: true,
      },
    });

    // Try to verify against each profile
    for (const profile of voiceProfiles) {
      const response = await fetch("http://localhost:8000/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: profile.userId,
          audio_path: tempFilePath,
        }),
      });

      if (!response.ok) {
        continue;
      }

      const result = await response.json();
      if (result.authenticated) {
        return NextResponse.json({
          authenticated: true,
          confidence: result.similarity_score,
          userId: profile.userId,
        });
      }
    }

    return NextResponse.json({
      authenticated: false,
      confidence: 0,
    });
  } catch (error) {
    console.error("Error in voice authentication:", error);
    return NextResponse.json(
      { error: "Failed to process voice authentication" },
      { status: 500 }
    );
  }
}
