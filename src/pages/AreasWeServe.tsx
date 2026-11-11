import { Link } from "react-router-dom";
import InfoPage from "@/components/InfoPage";
import { AREAS, AREAS_INTRO } from "@/lib/pageContent";
import { SITE } from "@/lib/siteConfig";

const linkClass = "text-primary underline underline-offset-2 hover:no-underline";

const AreasWeServe = () => (
  <InfoPage path="/areas-we-serve" heading="Serving Johnston and the Des Moines Metro">
    <p className="text-body">{AREAS_INTRO}</p>
    <p className="text-body font-medium">
      {AREAS.map((a, i) => (
        <span key={a.name}>
          {i > 0 && " · "}
          {a.to ? <Link to={a.to} className={linkClass}>{a.name}</Link> : a.name}
        </span>
      ))}
    </p>
    <p className="text-body">
      Hours: {SITE.hoursLabel}
      <br />
      Call or text: <a href={SITE.phoneTel} className={linkClass}>{SITE.phone}</a>
    </p>
    <p className="text-body">
      <a href={SITE.directionsUrl} target="_blank" rel="noopener noreferrer" className={linkClass}>Get directions</a>
      {" "}or <Link to="/contact" className={linkClass}>contact us</Link> to plan your visit.
    </p>
  </InfoPage>
);

export default AreasWeServe;
