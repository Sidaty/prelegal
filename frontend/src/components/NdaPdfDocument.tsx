import { Document, Font, Link, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { Token, Tokens } from "marked";

/** react-pdf renderer for the markdown tokens of the filled NDA (mirrors NdaPreview). */

// Legal text should never be hyphenated mid-word.
Font.registerHyphenationCallback((word) => [word]);

const styles = StyleSheet.create({
  page: { paddingVertical: 48, paddingHorizontal: 64, fontFamily: "Times-Roman", fontSize: 10.5, lineHeight: 1.35 },
  h1: { fontSize: 18, fontWeight: "bold", textAlign: "center", marginBottom: 12 },
  h2: { fontSize: 11.5, fontWeight: "bold", marginTop: 8, marginBottom: 4 },
  h3: { fontSize: 11, fontWeight: "bold", marginTop: 8, marginBottom: 1 },
  paragraph: { marginVertical: 2 },
  list: { marginVertical: 2 },
  listItem: { flexDirection: "row", marginVertical: 1 },
  // Offset by the paragraph margin so the number lines up with the first line of the item.
  marker: { width: 18, marginTop: 2 },
  itemBody: { flex: 1 },
  checkbox: {
    width: 9,
    height: 9,
    marginTop: 1.5,
    marginRight: 6,
    borderWidth: 0.75,
    fontSize: 7,
    lineHeight: 1.2,
    textAlign: "center",
  },
  table: { marginVertical: 8, borderTopWidth: 0.75, borderLeftWidth: 0.75 },
  row: { flexDirection: "row" },
  cell: { flex: 1, padding: 4, minHeight: 22, borderRightWidth: 0.75, borderBottomWidth: 0.75 },
  labelCell: { flex: 0.8, fontWeight: "bold" },
  headerCell: { fontWeight: "bold", backgroundColor: "#f5f5f4" },
  link: { color: "#1d4ed8" },
  standardTerms: { marginTop: 8 },
});

function Inline({ tokens }: { tokens: Token[] }) {
  return tokens.map((token, i) => {
    switch (token.type) {
      case "strong":
        return (
          <Text key={i} style={{ fontWeight: "bold" }}>
            <Inline tokens={(token as Tokens.Strong).tokens} />
          </Text>
        );
      case "em":
        return (
          <Text key={i} style={{ fontStyle: "italic" }}>
            <Inline tokens={(token as Tokens.Em).tokens} />
          </Text>
        );
      case "link": {
        const link = token as Tokens.Link;
        return (
          <Link key={i} src={link.href} style={styles.link}>
            <Inline tokens={link.tokens} />
          </Link>
        );
      }
      case "br":
        return "\n";
      case "text": {
        const text = token as Tokens.Text;
        return text.tokens ? <Inline key={i} tokens={text.tokens} /> : text.text;
      }
      default:
        return "text" in token ? token.text : null;
    }
  });
}

function ListItem({ item, marker }: { item: Tokens.ListItem; marker: string }) {
  const checkbox = item.tokens.find((token): token is Tokens.Checkbox => token.type === "checkbox");
  const content = item.tokens.filter((token) => token.type !== "checkbox");
  return (
    <View style={styles.listItem} wrap={false}>
      {checkbox ? <Text style={styles.checkbox}>{checkbox.checked ? "X" : " "}</Text> : <Text style={styles.marker}>{marker}</Text>}
      <View style={styles.itemBody}>
        <Blocks tokens={content} />
      </View>
    </View>
  );
}

function Block({ token }: { token: Token }) {
  switch (token.type) {
    case "heading": {
      const heading = token as Tokens.Heading;
      const style = heading.depth === 1 ? styles.h1 : heading.depth === 2 ? styles.h2 : styles.h3;
      return (
        <Text style={style} minPresenceAhead={24}>
          <Inline tokens={heading.tokens} />
        </Text>
      );
    }
    case "paragraph":
      return (
        <Text style={styles.paragraph}>
          <Inline tokens={(token as Tokens.Paragraph).tokens} />
        </Text>
      );
    case "text": {
      const text = token as Tokens.Text;
      return (
        <Text>
          <Inline tokens={text.tokens ?? [text]} />
        </Text>
      );
    }
    case "list": {
      const list = token as Tokens.List;
      const start = Number(list.start) || 1;
      return (
        <View style={styles.list}>
          {list.items.map((item, i) => (
            <ListItem key={i} item={item} marker={list.ordered ? `${start + i}.` : "•"} />
          ))}
        </View>
      );
    }
    case "table": {
      const table = token as Tokens.Table;
      return (
        <View style={styles.table} wrap={false}>
          {[table.header, ...table.rows].map((row, r) => (
            <View key={r} style={styles.row}>
              {row.map((cell, c) => (
                <Text
                  key={c}
                  style={[styles.cell, ...(c === 0 ? [styles.labelCell] : []), ...(r === 0 ? [styles.headerCell] : [])]}
                >
                  <Inline tokens={cell.tokens} />
                </Text>
              ))}
            </View>
          ))}
        </View>
      );
    }
    default:
      return null;
  }
}

function Blocks({ tokens }: { tokens: Token[] }) {
  return tokens.map((token, i) => <Block key={i} token={token} />);
}

interface NdaPdfDocumentProps {
  coverPage: Token[];
  standardTerms: Token[];
}

export function NdaPdfDocument({ coverPage, standardTerms }: NdaPdfDocumentProps) {
  return (
    <Document title="Mutual Non-Disclosure Agreement" creator="Prelegal">
      <Page size="LETTER" style={styles.page}>
        <Blocks tokens={coverPage} />
      </Page>
      <Page size="LETTER" style={styles.page}>
        <View style={styles.standardTerms}>
          <Blocks tokens={standardTerms} />
        </View>
      </Page>
    </Document>
  );
}
