import NextAuth, { NextAuthOptions } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

export const authOptions : NextAuthOptions = {
    session : {
        strategy : "jwt"
    },
    providers : [
        Credentials({
            name : "Credentials",
            credentials : {
                userId : { label : "userId", type : "text"},
                password : { label : "password", type : "password"}
            },
            async authorize(credentials) {
                if(!credentials) {
                    throw new Error("credentials undefined");
                }
                const { userId, password } = credentials;
                if(!userId || !password) {
                    throw new Error("missing userId or password");
                }
                try {
                    const user = await prisma.user.findUnique({
                        where : { userId }
                    });
                    if(!user) {
                        throw new Error("invalid userId");
                    }
                    const isValidPassword = await bcrypt.compare(password, user.password);
                    if(!isValidPassword) {
                        throw new Error("incorrect password");  
                    }
                    return { id : user.id, userId };
                } catch(err) {
                    console.log(err);
                    throw new Error("auth error");
                }
            } 
        }),
    ],
    callbacks : {
        async jwt({ token, user }) {
            if(user) {
                token.user = user;
            }
            return token;
        },
        async session({ session, token }) {
            session.user = token.user as typeof session.user;
            return session;
        } 
    },
    secret : process.env.NEXTAUTH_SECRET
};

export const GET = NextAuth(authOptions);
export const POST = NextAuth(authOptions);