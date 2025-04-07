import { PrismaClient } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../auth/[...nextauth]/route";

const prisma = new PrismaClient();

// Get all query histories for a specific user
export async function GET(
    request: NextRequest,
    { params }: { params: { userId: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "unauthorized" }, { status: 401 });
        }

        const targetUserId = params.userId;
        
        // Security check: Only allow access to your own queries or if you're an admin
        if (session.user.id !== targetUserId && session.user.role !== "ADMIN") {
            return NextResponse.json(
                { error: "You can only access your own query history" },
                { status: 403 }
            );
        }

        // Fetch all queries for the specified user
        const queries = await prisma.queryHistory.findMany({
            where: {
                userId: targetUserId
            },
            orderBy: {
                createdAt: "desc"
            },
            include: {
                visualization: true
            }
        });

        return NextResponse.json({ queries });
    } catch (error) {
        console.error("Error fetching user query history:", error);
        return NextResponse.json(
            { error: "Failed to fetch query history" },
            { status: 500 }
        );
    }
} 