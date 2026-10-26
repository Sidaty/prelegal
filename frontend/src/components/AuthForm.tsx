"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { ApiError } from "@/lib/api";
import { currentUser, signIn, signUp } from "@/lib/auth";

const inputClass =
  "w-full rounded-md border border-line bg-white px-3 py-2.5 text-[15px] text-stone-900 shadow-xs outline-none focus:border-primary focus:ring-2 focus:ring-primary/20";

type Mode = "signIn" | "signUp";

const COPY = {
  signIn: { submit: "Sign in", pending: "Signing in…", switchText: "New to Prelegal?", switchLink: "Create an account", switchHref: "/signup/" },
  signUp: { submit: "Create account", pending: "Creating account…", switchText: "Already have an account?", switchLink: "Sign in", switchHref: "/" },
};

/** What went wrong, and how to fix it. */
function errorMessage(error: unknown, mode: Mode): string {
  const status = error instanceof ApiError ? error.status : 0;
  if (status === 401) return "That email and password don't match. Check them, or create an account.";
  if (status === 409) return "An account already exists for this email. Sign in instead.";
  if (status === 400) return "Enter a valid email and a password of 8 to 72 characters.";
  return mode === "signIn" ? "Signing in failed. Try again in a moment." : "Creating your account failed. Try again in a moment.";
}

export function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const copy = COPY[mode];

  // Already signed in: go straight to the documents. Also fetches the CSRF cookie needed to submit.
  useEffect(() => {
    currentUser().then(() => router.replace("/app/"), () => {});
  }, [router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email"));
    const password = String(form.get("password"));
    setPending(true);
    setError(null);
    try {
      await (mode === "signIn" ? signIn(email, password) : signUp(email, password));
      router.push("/app/");
    } catch (e) {
      setError(errorMessage(e, mode));
      setPending(false);
    }
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="email" className="text-sm font-medium text-stone-800">
            Work email
          </label>
          <input id="email" name="email" type="email" autoComplete="email" required className={inputClass} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="password" className="text-sm font-medium text-stone-800">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete={mode === "signIn" ? "current-password" : "new-password"}
            minLength={mode === "signUp" ? 8 : undefined}
            maxLength={mode === "signUp" ? 72 : undefined}
            required
            aria-describedby={mode === "signUp" ? "password-hint" : undefined}
            className={inputClass}
          />
          {mode === "signUp" && (
            <p id="password-hint" className="text-xs text-muted">
              8 to 72 characters.
            </p>
          )}
        </div>
        <p role="alert" className="text-sm text-red-700 empty:hidden">
          {error}
        </p>
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-submit px-4 py-2.5 text-[15px] font-medium text-white shadow-sm hover:bg-submit/90 disabled:cursor-wait disabled:opacity-70"
        >
          {pending ? copy.pending : copy.submit}
        </button>
      </form>
      <p className="mt-8 text-sm text-muted">
        {copy.switchText}{" "}
        <Link href={copy.switchHref} className="font-medium text-primary hover:underline">
          {copy.switchLink}
        </Link>
      </p>
    </>
  );
}
