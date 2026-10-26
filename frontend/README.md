# Prelegal — Mutual NDA Creator

A Next.js prototype that drafts a [Common Paper Mutual NDA](https://commonpaper.com/standards/mutual-nda/1.0):
the user fills in the key terms in a form, sees the completed agreement live, and downloads it as a PDF.

## How it works

- `src/app/page.tsx` reads the templates from the repository's `../templates` folder at build time
  (`Mutual-NDA-coverpage.md` and `Mutual-NDA.md`), so the templates stay the single source of truth.
- `src/lib/nda.ts` fills the cover page placeholders with the form values (escaped, so user input is always literal).
  Blank fields keep the template placeholder, e.g. `[Fill in state]`.
- The filled markdown is tokenized once with [marked](https://marked.js.org) and rendered twice:
  as HTML for the preview (`NdaPreview`) and with [@react-pdf/renderer](https://react-pdf.org) for the
  download (`NdaPdfDocument`, loaded on demand).

## Development

```bash
npm install
npm run dev     # http://localhost:3000
npm test        # unit tests (Vitest)
npm run lint
npm run build
```

Run the commands from this `frontend` folder: the templates are resolved relative to it.
