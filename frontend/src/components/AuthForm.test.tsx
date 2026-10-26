import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { AuthForm } from "./AuthForm";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), replace: vi.fn() }) }));

describe("AuthForm", () => {
  it("signs in with an email and password, and links to sign up", () => {
    const html = renderToStaticMarkup(<AuthForm mode="signIn" />);

    expect(html).toMatch(/<input id="email" type="email"[^>]*required/);
    expect(html).toMatch(/<input id="password" type="password" autoComplete="current-password" required=""/);
    expect(html).toMatch(/<button type="submit"[^>]*>Sign in<\/button>/);
    expect(html).toMatch(/href="\/signup\/?"/);
  });

  it("asks for a new password of 8 to 72 characters to sign up, and links to sign in", () => {
    const html = renderToStaticMarkup(<AuthForm mode="signUp" />);

    expect(html).toMatch(/<input id="password" type="password" autoComplete="new-password" minLength="8" maxLength="72"/);
    expect(html).toContain("8 to 72 characters.");
    expect(html).toMatch(/<button type="submit"[^>]*>Create account<\/button>/);
    expect(html).toMatch(/href="\/"[^>]*>Sign in<\/a>/);
  });
});
