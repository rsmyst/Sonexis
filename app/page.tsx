import React from "react";
import { AuthContainer } from "@/components/auth-container";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-background">
      <div className="w-full max-w-3xl mx-auto">
        <div className="mb-8 text-center">
          <h1
            className="text-4xl font-bold tracking-tight text-foreground font-jaro"
            style={{ fontFamily: "Jaro, sans-serif" }}
          >
            Welcome to micSQL
          </h1>
          <p className="mt-2 text-lg text-muted-foreground">
            Your lightweight SQL database management tool
          </p>
        </div>

        <AuthContainer />
      </div>
    </main>
  );
}
