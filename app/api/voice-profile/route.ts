import { PrismaClient } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import axios from "axios";

const prisma = new PrismaClient();

// Get all voice profiles for a specific user
export const GET = async (req: NextRequest) => {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "unauthorized" }, { status: 401 });
        }

        const searchParams = req.nextUrl.searchParams;
        const userId = searchParams.get("userId");

        // If admin, allow fetching any user's voice profiles
        // If regular user, only allow fetching their own voice profiles
        if (session.user.role !== "ADMIN" && userId !== session.user.id) {
            return NextResponse.json({ error: "unauthorized: can only access your own voice profiles" }, { status: 403 });
        }

        const profiles = await prisma.voiceProfile.findMany({
            where: {
                userId: userId || session.user.id
            }
        });

        return NextResponse.json(profiles);
    } catch (err) {
        console.log(err);
        return NextResponse.json({ error: "error fetching voice profiles" }, { status: 500 });
    }
};

// Create a new voice profile for a user
export const POST = async (req: NextRequest) => {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "unauthorized" }, { status: 401 });
        }

        const {
            userId,
            audioData,
            audioPath
        } = await req.json();

        // Admin can create voice profiles for any user
        // Regular users can only create profiles for themselves
        if (session.user.role !== "ADMIN" && userId !== session.user.id) {
            return NextResponse.json({ error: "unauthorized: can only create voice profiles for yourself" }, { status: 403 });
        }

        // Validate that the user exists
        const user = await prisma.user.findUnique({
            where: { id: userId || session.user.id }
        });

        if (!user) {
            return NextResponse.json({ error: "user not found" }, { status: 404 });
        }

        // Enroll with the speaker diarization model
        try {
            const enrollmentResponse = await axios.post(`${process.env.VOICE_AUTH_API_URL}/enroll`, {
                user_id: user.userId.toString(), // Convert to string for the API
                audio_path: audioPath || 'default_path.wav', // This would be replaced with actual path logic
            });

            // Store reference to the voice profile
            const voiceProfile = await prisma.voiceProfile.create({
                data: {
                    userId: userId || session.user.id,
                    embeddings: {}, // The actual embeddings are stored in the diarization system
                    modelVersion: "v1.0",
                    isActive: true
                }
            });

            return NextResponse.json({
                success: true,
                message: "Voice profile created successfully",
                profileId: voiceProfile.id
            }, { status: 201 });

        } catch (error) {
            if (axios.isAxiosError(error) && error.response) {
                return NextResponse.json({ 
                    error: "Failed to enroll voice profile", 
                    details: error.response.data 
                }, { status: error.response.status });
            }
            throw error;
        }

    } catch (err) {
        console.log(err);
        return NextResponse.json({ error: "error creating voice profile" }, { status: 500 });
    }
};

// Update an existing voice profile
export const PUT = async (req: NextRequest) => {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "unauthorized" }, { status: 401 });
        }

        const {
            id,
            embeddings,
            modelVersion,
            isActive
        } = await req.json();

        if (!id) {
            return NextResponse.json({ error: "voice profile id is required" }, { status: 400 });
        }

        // Get the profile to check ownership
        const existingProfile = await prisma.voiceProfile.findUnique({
            where: { id },
            include: { user: true }
        });

        if (!existingProfile) {
            return NextResponse.json({ error: "voice profile not found" }, { status: 404 });
        }

        // Check authorization - only admin or the profile owner can update
        if (session.user.role !== "ADMIN" && existingProfile.userId !== session.user.id) {
            return NextResponse.json({ error: "unauthorized: can only update your own voice profiles" }, { status: 403 });
        }

        // Update the profile
        const updatedProfile = await prisma.voiceProfile.update({
            where: { id },
            data: {
                embeddings: embeddings || existingProfile.embeddings,
                modelVersion: modelVersion || existingProfile.modelVersion,
                isActive: isActive !== undefined ? isActive : existingProfile.isActive
            }
        });

        return NextResponse.json(updatedProfile);
    } catch (err) {
        console.log(err);
        return NextResponse.json({ error: "error updating voice profile" }, { status: 500 });
    }
};

// Delete a voice profile
export const DELETE = async (req: NextRequest) => {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "unauthorized" }, { status: 401 });
        }

        const { id } = await req.json();

        if (!id) {
            return NextResponse.json({ error: "voice profile id is required" }, { status: 400 });
        }

        // Get the profile to check ownership
        const existingProfile = await prisma.voiceProfile.findUnique({
            where: { id }
        });

        if (!existingProfile) {
            return NextResponse.json({ error: "voice profile not found" }, { status: 404 });
        }

        // Check authorization - only admin or the profile owner can delete
        if (session.user.role !== "ADMIN" && existingProfile.userId !== session.user.id) {
            return NextResponse.json({ error: "unauthorized: can only delete your own voice profiles" }, { status: 403 });
        }

        // Delete the profile
        await prisma.voiceProfile.delete({
            where: { id }
        });

        return NextResponse.json({ success: true, message: "Voice profile deleted" });
    } catch (err) {
        console.log(err);
        return NextResponse.json({ error: "error deleting voice profile" }, { status: 500 });
    }
}; 