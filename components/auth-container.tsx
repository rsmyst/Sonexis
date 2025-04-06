"use client";
import React, { useState } from "react";
import { LoginForm } from "./login-form";
import { SignupForm } from "./signup-form";

interface AuthContainerProps {
  onLogin?: (email: string, password: string) => void;
  onSignup?: (email: string, password: string, name: string) => void;
}

export function AuthContainer({ onLogin, onSignup }: AuthContainerProps) {
  const [isLogin, setIsLogin] = useState(true);

  const toggleForm = () => {
    setIsLogin(!isLogin);
  };

  return (
    <div className="w-full">
      {isLogin ? (
        <LoginForm onLogin={onLogin} onToggleForm={toggleForm} />
      ) : (
        <SignupForm onSignup={onSignup} onToggleForm={toggleForm} />
      )}
    </div>
  );
}
