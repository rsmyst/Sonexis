"use client";

import { useState } from "react";
import { LoginForm } from "@/components/login-form";
import { SignupForm } from "@/components/signup-form";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [isSignUp, setIsSignUp] = useState(false);
  const router = useRouter();

  const handleToggleForm = () => {
    setIsSignUp(!isSignUp);
  };

  const handleDevLogin = () => {
    // Store a mock session in localStorage
    localStorage.setItem(
      "devSession",
      JSON.stringify({
        user: {
          id: "dev-user",
          name: "Developer",
          role: "admin",
        },
      })
    );
    router.push("/");
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 theme-bg-dark">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-[#bfff00] font-jaro">
            micSQL
          </h1>
          <p className="mt-2 text-lg text-[#bfff00]/80">
            {isSignUp ? "Create your account" : "Log in to your account"}
          </p>
        </div>

        {isSignUp ? (
          <SignupForm onToggleForm={handleToggleForm} />
        ) : (
          <LoginForm onToggleForm={handleToggleForm} />
        )}

        {/* Development-only login button */}
        {process.env.NODE_ENV === "development" && (
          <div className="mt-4 text-center">
            <button
              onClick={handleDevLogin}
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              [Dev] Quick Login
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
