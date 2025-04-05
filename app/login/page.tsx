import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "../../lib/auth";
import LoginForm from "@/components/auth/login-form";
import AuthContainer from "@/components/auth/auth-container";

export default async function LoginPage() {
  const session = await getServerSession(authOptions);

  if (session) {
    redirect("/dashboard");
  }

  return (
    <AuthContainer>
      <LoginForm />
    </AuthContainer>
  );
}
