import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { writeFile } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const audio = formData.get("audio") as Blob;
    const userId = formData.get("userId") as string;

    if (!audio || !userId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Save the audio to a temporary file
    const buffer = await audio.arrayBuffer();
    const tempDir = tmpdir();
    const tempFilePath = join(tempDir, `${userId}_enroll.wav`);
    await writeFile(tempFilePath, Buffer.from(buffer));

    // Send to speaker authentication service
    const response = await fetch("http://localhost:8000/enroll", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        user_id: userId,
        audio_path: tempFilePath,
      }),
    });

    if (!response.ok) {
      throw new Error("Speaker authentication service failed");
    }

    const result = await response.json();

    // Store the voice profile in the database
    await prisma.voiceProfile.create({
      data: {
        userId,
        embeddings: result.embeddings,
        modelVersion: "1.0", // Update this based on the actual model version
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in voice enrollment:", error);
    return NextResponse.json(
      { error: "Failed to process voice enrollment" },
      { status: 500 }
    );
  }
}
