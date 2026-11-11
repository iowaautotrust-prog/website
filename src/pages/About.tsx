import { Link } from "react-router-dom";
import InfoPage from "@/components/InfoPage";
import { ABOUT_PARAGRAPHS } from "@/lib/pageContent";

const linkClass = "text-primary underline underline-offset-2 hover:no-underline";

// The second paragraph's "rebuilt title" is linked to its page; the wording is unchanged.
const About = () => (
  <InfoPage path="/about" heading="About Iowa Trust Motors">
    <p className="text-body">{ABOUT_PARAGRAPHS[0]}</p>
    <p className="text-body">
      {ABOUT_PARAGRAPHS[1].split("rebuilt title")[0]}
      <Link to="/rebuilt-title-cars" className={linkClass}>rebuilt title</Link>
      {ABOUT_PARAGRAPHS[1].split("rebuilt title").slice(1).join("rebuilt title")}
    </p>
    <p className="text-body">{ABOUT_PARAGRAPHS[2]}</p>
    <p className="text-body">
      See <Link to="/how-we-work" className={linkClass}>how we work</Link>, the{" "}
      <Link to="/areas-we-serve" className={linkClass}>areas we serve</Link>, or{" "}
      <Link to="/faq" className={linkClass}>read our FAQ</Link>.
    </p>
  </InfoPage>
);

export default About;
