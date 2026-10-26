import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { LoginForm } from "./LoginForm";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));

describe("LoginForm", () => {
  const html = renderToStaticMarkup(<LoginForm />);

  it("asks for a required email and password", () => {
    expect(html).toMatch(/<input(?=[^>]*id="email")(?=[^>]*type="email")(?=[^>]*required)/);
    expect(html).toMatch(/<input(?=[^>]*id="password")(?=[^>]*type="password")(?=[^>]*required)/);
  });

  it("has a sign-in submit button", () => {
    expect(html).toMatch(/<button type="submit"[^>]*>Sign in<\/button>/);
  });
});
