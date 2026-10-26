"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { currentUser, signOut, type CurrentUser } from "@/lib/auth";

/** Navigation for signed-in pages; visitors without a session are sent to sign in. */
export function AppShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [signOutFailed, setSignOutFailed] = useState(false);

  useEffect(() => {
    currentUser().then(setUser, () => router.replace("/"));
  }, [router]);

  async function handleSignOut() {
    setSignOutFailed(false);
    try {
      await signOut();
      router.replace("/");
    } catch (e) {
      console.error(e);
      setSignOutFailed(true);
    }
  }

  if (!user) {
    return (
      <p role="status" className="px-6 py-10 text-center text-[15px] text-muted">
        Loading…
      </p>
    );
  }

  return (
    <div className="flex min-h-screen flex-1 flex-col">
      <header className="sticky top-0 z-20 border-b border-line bg-white">
        <nav aria-label="Main" className="mx-auto flex h-14 max-w-7xl items-center gap-8 px-4 sm:px-6">
          <Link href="/app/" className="text-lg font-semibold tracking-tight text-navy">
            Prelegal
          </Link>
          <Link href="/app/" className="text-sm font-medium text-stone-600 hover:text-navy">
            Documents
          </Link>
          <div className="ml-auto flex items-center gap-4 text-sm">
            {signOutFailed && (
              <span role="alert" className="text-red-700">
                Sign out failed. Try again.
              </span>
            )}
            <span className="hidden text-muted sm:inline">{user.email}</span>
            <button type="button" onClick={handleSignOut} className="font-medium text-primary hover:underline">
              Sign out
            </button>
          </div>
        </nav>
      </header>
      {children}
    </div>
  );
}
