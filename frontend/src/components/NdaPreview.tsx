import type { Token, Tokens } from "marked";

/** HTML renderer for the markdown tokens of the filled NDA (mirrors NdaPdfDocument). */

function Inline({ tokens }: { tokens: Token[] }) {
  return tokens.map((token, i) => {
    switch (token.type) {
      case "strong":
        return (
          <strong key={i}>
            <Inline tokens={(token as Tokens.Strong).tokens} />
          </strong>
        );
      case "em":
        return (
          <em key={i}>
            <Inline tokens={(token as Tokens.Em).tokens} />
          </em>
        );
      case "link": {
        const link = token as Tokens.Link;
        return (
          <a key={i} href={link.href} target="_blank" rel="noreferrer" className="underline">
            <Inline tokens={link.tokens} />
          </a>
        );
      }
      case "br":
        return <br key={i} />;
      case "text": {
        const text = token as Tokens.Text;
        return text.tokens ? <Inline key={i} tokens={text.tokens} /> : text.text;
      }
      default:
        return "text" in token ? token.text : null;
    }
  });
}

function Checkbox({ checked }: { checked: boolean }) {
  return (
    <span
      aria-label={checked ? "Selected" : "Not selected"}
      className="mt-1.5 mr-2 inline-flex size-3.5 shrink-0 items-center justify-center border border-current text-[10px] leading-none"
    >
      {checked ? "✕" : ""}
    </span>
  );
}

function Block({ token }: { token: Token }) {
  switch (token.type) {
    case "heading": {
      const heading = token as Tokens.Heading;
      const content = <Inline tokens={heading.tokens} />;
      // Shifted one level down: the page's h1 is the app title.
      if (heading.depth === 1) return <h2 className="mt-2 mb-6 text-center text-2xl font-bold">{content}</h2>;
      if (heading.depth === 2) return <h3 className="mt-6 mb-3 text-base font-bold uppercase">{content}</h3>;
      return <h4 className="mt-5 mb-1 font-bold">{content}</h4>;
    }
    case "paragraph":
      return (
        <p className="my-2">
          <Inline tokens={(token as Tokens.Paragraph).tokens} />
        </p>
      );
    case "text": {
      const text = token as Tokens.Text;
      return <Inline tokens={text.tokens ?? [text]} />;
    }
    case "list": {
      const list = token as Tokens.List;
      const items = list.items.map((item, i) =>
        item.task ? (
          <li key={i} className="flex">
            <Checkbox checked={!!item.checked} />
            <div>
              <Blocks tokens={item.tokens.filter((t) => t.type !== "checkbox")} />
            </div>
          </li>
        ) : (
          <li key={i} className="pl-1">
            <Blocks tokens={item.tokens} />
          </li>
        ),
      );
      return list.ordered ? (
        <ol start={Number(list.start) || 1} className="my-2 list-decimal space-y-1 pl-6">
          {items}
        </ol>
      ) : (
        <ul className={list.items.some((item) => item.task) ? "my-2 space-y-1" : "my-2 list-disc space-y-1 pl-6"}>
          {items}
        </ul>
      );
    }
    case "table": {
      const table = token as Tokens.Table;
      return (
        <table className="my-4 w-full table-fixed border-collapse text-sm">
          <thead>
            <tr>
              {table.header.map((cell, i) => (
                <th key={i} className="border border-stone-400 bg-stone-100 px-2 py-1.5 text-left">
                  <Inline tokens={cell.tokens} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {table.rows.map((row, r) => (
              <tr key={r}>
                {row.map((cell, c) => (
                  <td key={c} className={`border border-stone-400 px-2 py-1.5 wrap-break-word ${c === 0 ? "font-semibold" : ""}`}>
                    <Inline tokens={cell.tokens} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      );
    }
    default:
      return null;
  }
}

function Blocks({ tokens }: { tokens: Token[] }) {
  return tokens.map((token, i) => <Block key={i} token={token} />);
}

interface NdaPreviewProps {
  coverPage: Token[];
  standardTerms: Token[];
}

export function NdaPreview({ coverPage, standardTerms }: NdaPreviewProps) {
  return (
    <article className="mx-auto max-w-[8.5in] bg-white px-8 py-10 font-serif text-[15px] leading-relaxed text-stone-900 shadow-lg ring-1 ring-stone-200 sm:px-14">
      <Blocks tokens={coverPage} />
      <hr className="my-10 border-dashed border-stone-300" />
      <Blocks tokens={standardTerms} />
    </article>
  );
}
