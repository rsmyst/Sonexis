import React, { useState } from "react";

interface LoginFormProps {
  onLogin?: (email: string, password: string) => void;
  onToggleForm?: () => void;
}

export function LoginForm({ onLogin, onToggleForm }: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Handle login logic here
      onLogin?.(email, password);
    } catch (error) {
      console.error("Login failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="border rounded-lg p-6 w-full max-w-md mx-auto bg-card shadow-md">
      <h2
        className="text-2xl font-semibold mb-6 text-center text-card-foreground font-jaro"
        style={{ fontFamily: "Jaro, sans-serif" }}
      >
        Log in to micSQL
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label
            htmlFor="email"
            className="text-sm font-medium text-foreground font-jaro"
          >
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            className="form-input font-jaro bg-[#A49694] text-[#021013] placeholder:text-[#021013]/60"
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
            className="form-input font-jaro bg-[#A49694] text-[#021013] placeholder:text-[#021013]/60"
            required
          />
        </div>

        <div className="pt-2">
          <button
            type="submit"
            className="btn-primary w-full"
            disabled={isLoading}
          >
            {isLoading ? "Logging in..." : "Log In"}
          </button>
        </div>
      </form>

      <div className="mt-6 text-center text-sm">
        <p className="text-muted-foreground">
          Do not have an account?{" "}
          <button
            onClick={onToggleForm}
            className="text-primary hover:underline"
          >
            Sign up
          </button>
        </p>
      </div>
    </div>
  );
}
