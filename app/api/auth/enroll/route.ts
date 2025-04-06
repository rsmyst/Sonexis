import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../lib/auth";
import fs from "fs";
import path from "path";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const audioFile = formData.get("audio") as Blob;

    if (!audioFile) {
      return NextResponse.json(
        { error: "No audio file provided" },
        { status: 400 }
      );
    }

    // Save the audio file temporarily
    const tempDir = path.join(process.cwd(), "temp");
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir);
    }

    const tempFilePath = path.join(tempDir, `enroll_${session.user.id}.wav`);
    const buffer = Buffer.from(await audioFile.arrayBuffer());
    fs.writeFileSync(tempFilePath, buffer);

    // Send request to Python backend
    const response = await fetch("http://localhost:8000/enroll", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        user_id: session.user.id,
        audio_path: tempFilePath,
      }),
    });

    // Clean up temp file
    fs.unlinkSync(tempFilePath);

    if (!response.ok) {
      throw new Error("Voice enrollment failed");
    }

    return NextResponse.json({
      success: true,
      message: "Voice profile enrolled successfully",
    });
  } catch (error) {
    console.error("Voice enrollment error:", error);
    return NextResponse.json({ error: "Enrollment failed" }, { status: 500 });
  }
}
