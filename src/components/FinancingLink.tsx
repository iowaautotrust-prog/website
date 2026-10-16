import type { AnchorHTMLAttributes } from "react";
import { FINANCING_URL } from "@/lib/financing";

type FinancingLinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href" | "target" | "rel">;

const FinancingLink = ({ children, ...props }: FinancingLinkProps) => (
  <a href={FINANCING_URL} target="_blank" rel="noopener noreferrer" {...props}>
    {children}
    <span className="sr-only"> (opens in a new tab)</span>
  </a>
);

export default FinancingLink;
