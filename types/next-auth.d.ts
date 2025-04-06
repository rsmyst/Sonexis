import NextAuth from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string; // Ensure this field is included
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role?: "USER" | "ADMIN";
    };
  }
}
