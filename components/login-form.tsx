"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export function LoginForm() {
  const [employeeId, setEmployeeId] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await signIn("credentials", {
        userId: parseInt(employeeId),
        password,
        redirect: false,
      });

      if (!result?.error) {
        router.push("/");
      } else {
        console.error("Login error:", result.error);
      }
    } catch (error) {
      console.error("Login error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-6 bg-[#241a13] shadow-[6px_6px_0px_0px_rgba(191,255,0,1)]">
      <h2 className="text-2xl font-bold mb-6 text-center theme-text-accent">
        Welcome Back
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label
            htmlFor="employeeId"
            className="text-sm font-medium text-foreground font-jaro"
          >
            Employee ID
          </label>
          <input
            id="employeeId"
            type="text"
            value={employeeId}
            onChange={(e) => setEmployeeId(e.target.value)}
            placeholder="Enter your Employee ID"
            className="form-input font-jaro bg-[#A49694] text-[#021013] placeholder:text-[#021013]/60 shadow-[4px_4px_0px_0px_rgba(191,255,0,1)]"
            required
          />
        </div>

        <div className="space-y-2">
          <label
            htmlFor="password"
            className="text-sm font-medium text-foreground font-jaro"
          >
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            className="form-input font-jaro bg-[#A49694] text-[#021013] placeholder:text-[#021013]/60 shadow-[4px_4px_0px_0px_rgba(191,255,0,1)]"
            required
          />
        </div>

        <div className="pt-2">
          <button
            type="submit"
            className="btn-primary w-full transition-all duration-300 hover:shadow-[4px_4px_0px_0px_rgba(191,255,0,1)] hover:-translate-y-0.5"
            disabled={isLoading}
          >
            {isLoading ? "Logging in..." : "Log In"}
          </button>
        </div>
      </form>
    </div>
  );
}
