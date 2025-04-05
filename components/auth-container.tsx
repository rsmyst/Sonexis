"use client";
import React, { useState } from "react";
import { LoginForm } from "./login-form";
import { SignupForm } from "./signup-form";

export function AuthContainer() {
  const [isLogin, setIsLogin] = useState(true);

  const toggleForm = () => {
    setIsLogin(!isLogin);
  };

  const handleLogin = (email: string, password: string) => {
    console.log("Login attempt with:", email, password);
    // Implement actual login logic here
  };

  const handleSignup = (formData: any) => {
    console.log("Signup with data:", formData);
    // Implement actual signup logic here
  };

  return (
    <div className="w-full">
      {isLogin ? (
        <LoginForm onLogin={handleLogin} onToggleForm={toggleForm} />
      ) : (
        <SignupForm onToggleForm={toggleForm} />
      )}
    </div>
  );
}
