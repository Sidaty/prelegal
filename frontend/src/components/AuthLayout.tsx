import type { ReactNode } from "react";

/** The two signature blocks of a cover page: the product shown as it is, instead of a slogan. */
function CoverPageExcerpt() {
  return (
    <figure aria-hidden="true" className="w-full max-w-sm rounded-sm bg-white px-8 py-9 font-serif text-navy shadow-2xl">
      <p className="text-center text-lg font-bold">Mutual Non-Disclosure Agreement</p>
      <p className="mt-4 text-sm leading-relaxed text-stone-600">
        This MNDA consists of this Cover Page and the Common Paper Mutual NDA Standard Terms.
      </p>
      <dl className="mt-6 space-y-3 text-sm">
        <div className="flex justify-between gap-4">
          <dt className="font-bold">Governing Law</dt>
          <dd>Delaware</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="font-bold">MNDA Term</dt>
          <dd>1 year</dd>
        </div>
      </dl>
      <div className="mt-10 grid grid-cols-2 gap-6 text-xs text-stone-500">
        {["Party 1", "Party 2"].map((party) => (
          <div key={party}>
            <div className="h-8 border-b-2 border-accent" />
            <p className="mt-1.5">{party} signature</p>
          </div>
        ))}
      </div>
    </figure>
  );
}

/** Sign in and sign up: the form on one side, what the product produces on the other. */
export function AuthLayout({ title, intro, children }: { title: string; intro: string; children: ReactNode }) {
  return (
    <div className="grid min-h-screen flex-1 lg:grid-cols-[1fr_1.1fr]">
      <main className="flex flex-col px-6 py-10 sm:px-12">
        <p className="text-lg font-semibold tracking-tight text-navy">Prelegal</p>
        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-12">
          <h1 className="text-3xl font-semibold tracking-tight text-navy">{title}</h1>
          <p className="mt-2 mb-8 text-[15px] leading-relaxed text-muted">{intro}</p>
          {children}
        </div>
      </main>
      <aside className="hidden flex-col items-center justify-center gap-10 bg-navy px-12 lg:flex">
        <CoverPageExcerpt />
        <p className="max-w-sm text-center text-[15px] leading-relaxed text-white/75">
          Describe the agreement you need in plain words. Prelegal drafts it from Common Paper standard terms.
        </p>
      </aside>
    </div>
  );
}
