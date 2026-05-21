import { redirect } from "next/navigation";
import { RegisterForm } from "@/features/auth/components/register-form";

export default function RegisterPage() {
  if (process.env.ALLOW_REGISTRATION !== "true") {
    redirect("/login");
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <RegisterForm />
    </div>
  );
}
