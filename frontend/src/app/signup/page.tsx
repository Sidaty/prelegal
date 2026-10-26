import type { Metadata } from "next";
import { AuthForm } from "@/components/AuthForm";
import { AuthLayout } from "@/components/AuthLayout";

export const metadata: Metadata = {
  title: "Create an account | Prelegal",
};

export default function SignUpPage() {
  return (
    <AuthLayout title="Create your account" intro="Draft NDAs, cloud service agreements, DPAs and more in a few minutes.">
      <AuthForm mode="signUp" />
    </AuthLayout>
  );
}
