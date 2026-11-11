import { Link } from "react-router-dom";
import InfoPage from "@/components/InfoPage";
import { HOW_WE_WORK_STEPS } from "@/lib/pageContent";

const linkClass = "text-primary underline underline-offset-2 hover:no-underline";

const HowWeWork = () => (
  <InfoPage path="/how-we-work" heading="How We Work">
    <ol className="space-y-5">
      {HOW_WE_WORK_STEPS.map((s, i) => (
        <li key={s.title}>
          <p className="font-semibold text-foreground">{s.title}</p>
          <p className="text-body">
            {i === HOW_WE_WORK_STEPS.length - 1 ? (
              <>
                Visit us in Johnston for a same-day test drive.{" "}
                <Link to="/financing" className={linkClass}>Financing is available</Link>, and we keep the paperwork simple.
              </>
            ) : (
              s.body
            )}
          </p>
        </li>
      ))}
    </ol>
    <p className="text-body">
      Learn more <Link to="/about" className={linkClass}>about us</Link> or see what a{" "}
      <Link to="/rebuilt-title-cars" className={linkClass}>rebuilt title</Link> means.
    </p>
  </InfoPage>
);

export default HowWeWork;
