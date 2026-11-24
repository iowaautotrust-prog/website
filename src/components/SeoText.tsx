import { Fragment } from "react";
import { Link } from "react-router-dom";
import type { Block } from "@/lib/seoPages";

const linkClass = "text-primary underline underline-offset-2 hover:no-underline";

// "[text](/path)" becomes an internal link; "\n" becomes a line break.
const Inline = ({ text }: { text: string }) => {
  const out: React.ReactNode[] = [];
  const re = /\[([^\]]+)\]\((\/[^)\s]+)\)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    out.push(<Lines key={`t${last}`} text={text.slice(last, m.index)} />);
    out.push(<Link key={`l${m.index}`} to={m[2]} className={linkClass}>{m[1]}</Link>);
    last = m.index + m[0].length;
  }
  out.push(<Lines key={`t${last}`} text={text.slice(last)} />);
  return <>{out}</>;
};

const Lines = ({ text }: { text: string }) => (
  <>
    {text.split("\n").map((line, i) => (
      <Fragment key={i}>
        {i > 0 && <br />}
        {line}
      </Fragment>
    ))}
  </>
);

/** The client's page text: paragraphs, "## " subheadings (H2) and bullet lists. */
const SeoText = ({ blocks }: { blocks: Block[] }) => (
  <div className="space-y-4">
    {blocks.map((b, i) =>
      "h2" in b ? (
        <h2 key={i} className="text-xl md:text-2xl font-bold text-foreground pt-4">{b.h2}</h2>
      ) : "p" in b ? (
        <p key={i} className="text-body"><Inline text={b.p} /></p>
      ) : (
        <ul key={i} className="list-disc pl-6 space-y-1.5 text-body">
          {b.ul.map((item) => <li key={item}>{item}</li>)}
        </ul>
      )
    )}
  </div>
);

export default SeoText;
