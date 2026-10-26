import { AuthForm } from "@/components/AuthForm";
import { AuthLayout } from "@/components/AuthLayout";

export default function SignInPage() {
  return (
    <AuthLayout title="Sign in" intro="Pick up your agreements where you left them.">
      <AuthForm mode="signIn" />
    </AuthLayout>
  );
}
