import { LoginForm } from "@/components/LoginForm";

export default function LoginPage() {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm rounded-lg border-t-4 border-accent bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-semibold text-navy">Prelegal</h1>
        <p className="mt-1 mb-6 text-sm text-muted">Sign in to draft your legal agreements.</p>
        <LoginForm />
      </div>
    </main>
  );
}
