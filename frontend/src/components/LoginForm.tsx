"use client";

import { useRouter } from "next/navigation";
import type { FormEvent } from "react";

const inputClass =
  "rounded-md border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 shadow-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20";

/** Placeholder login: credentials are not checked yet, any submission enters the platform. */
export function LoginForm() {
  const router = useRouter();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    router.push("/app/");
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="email" className="text-sm font-medium text-stone-800">
          Email
        </label>
        <input id="email" name="email" type="email" autoComplete="email" required className={inputClass} />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="password" className="text-sm font-medium text-stone-800">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className={inputClass}
        />
      </div>
      <button
        type="submit"
        className="mt-2 rounded-md bg-submit px-4 py-2 text-sm font-medium text-white shadow-sm hover:opacity-90"
      >
        Sign in
      </button>
    </form>
  );
}
