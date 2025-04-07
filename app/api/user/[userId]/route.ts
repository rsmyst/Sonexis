import { PrismaClient } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";

const prisma = new PrismaClient();

export const GET = async (req: NextRequest, { params }: { params: { userId: string } }) => {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "unauthorised" }, { status: 401 });
        }
        const userId = params.userId;
        if (session.user.role !== "ADMIN" && session.user.id !== userId) {
            return NextResponse.json({ error: "unauthorised: can only access own data" }, { status: 403 });
        }
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                name: true,
                role: true,
                password: false
            }
        });

        if (!user) {
            return NextResponse.json({ error: "user not found" }, { status: 404 });
        }

        return NextResponse.json(user);
    } catch (err) {
        console.log(err);
        return NextResponse.json({ error: "error fetching user" }, { status: 500 });
    }
}

export const PATCH = async (req: NextRequest, { params }: { params: { userId: string } }) => {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "unauthorised" }, { status: 401 });
        }

        if (session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "unauthorised: must be admin" }, { status: 403 });
        }

        const { name, password, role } = await req.json();
        const userId = params.userId;

        const response = await prisma.user.update({
            where: { id: userId },
            data: {
                name,
                password,
                role
            }
        });

        return NextResponse.json(response);
    } catch (err) {
        console.log(err);
        return NextResponse.json({ error: "error updating user" }, { status: 500 });
    }
}

export const DELETE = async (req: NextRequest, { params }: { params: { userId: string } }) => {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "unauthorised" }, { status: 401 });
        }

        if (session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "unauthorised: must be admin" }, { status: 403 });
        }

        const userId = params.userId;
        
        const response = await prisma.user.delete({
            where: { id: userId }
        });

        return NextResponse.json(response);
    } catch (err) {
        console.log(err);
        return NextResponse.json({ error: "error deleting user" }, { status: 500 });
    }
}