import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const Section = ({
  title,
  children,
  delay = 0,
}: {
  title: string;
  children: React.ReactNode;
  delay?: number;
}) => (
  <motion.section
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay }}
    className="mb-12"
  >
    <h2 className="text-xl font-semibold text-foreground mb-4 pb-2 border-b border-border">
      {title}
    </h2>
    <div className="text-muted-foreground leading-relaxed space-y-3">{children}</div>
  </motion.section>
);

export default function Privacy() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-28 pb-24">
        <div className="section-padding">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-14"
          >
            <p className="text-xs font-semibold tracking-[0.2em] uppercase text-primary mb-3">
              Legal
            </p>
            <h1 className="heading-section mb-4">Privacy Policy</h1>
            <p className="text-muted-foreground max-w-2xl">
              Effective Date: March 1, 2026
            </p>
            <p className="text-muted-foreground max-w-2xl mt-2">
              Iowa Auto Trust ("we," "us," or "our") is committed to protecting
              your personal information. This Privacy Policy explains how we
              collect, use, disclose, and safeguard information when you visit
              our website or interact with our services. Please read it
              carefully.
            </p>
          </motion.div>

          <div className="max-w-3xl">
            <Section title="1. Who We Are" delay={0.1}>
              <p>
                <strong className="text-foreground">Iowa Auto Trust</strong>
                <br />
                204 S Main St, Woodward, IA 50276
                <br />
                Phone: (515) 672-5406
                <br />
                Email:{" "}
                <a
                  href="mailto:info@iowaautotrust.com"
                  className="text-primary hover:underline"
                >
                  info@iowaautotrust.com
                </a>
              </p>
            </Section>

            <Section title="2. Information We Collect" delay={0.15}>
              <p>
                We collect information you provide directly and information
                collected automatically when you use our site.
              </p>
              <p className="font-medium text-foreground mt-2">
                Information You Provide:
              </p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Full name</li>
                <li>Email address</li>
                <li>Phone number</li>
                <li>
                  Vehicle interest (make, model, price range, or specific
                  listing)
                </li>
                <li>Messages or inquiries submitted through our contact forms</li>
                <li>Account credentials (email and password) if you create an account</li>
              </ul>
              <p className="font-medium text-foreground mt-4">
                Information Collected Automatically:
              </p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>
                  Browsing data (pages visited, time on site, referring URL)
                </li>
                <li>Device and browser type</li>
                <li>IP address</li>
                <li>
                  Cookie identifiers and similar tracking technologies (see
                  Section 7)
                </li>
              </ul>
            </Section>

            <Section title="3. How We Use Your Information" delay={0.2}>
              <p>We use the information we collect to:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>
                  Respond to inquiries and connect you with the right vehicle or
                  service
                </li>
                <li>
                  Schedule and confirm oil change or service appointments
                </li>
                <li>
                  Send transactional emails such as appointment confirmations,
                  invoice notices, and account activity
                </li>
                <li>
                  Send optional marketing emails if you have opted in (you may
                  unsubscribe at any time)
                </li>
                <li>Improve our website through analytics and usage data</li>
                <li>
                  Maintain the security and integrity of our platform
                </li>
                <li>Comply with applicable laws and regulations</li>
              </ul>
              <p>
                We do not use your data for automated decision-making or
                profiling that produces legal or similarly significant effects.
              </p>
            </Section>

            <Section title="4. How We Share Your Information" delay={0.25}>
              <p>
                We do not sell your personal information. We may share it only
                in the following limited circumstances:
              </p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>
                  <strong className="text-foreground">Service providers:</strong>{" "}
                  Third-party vendors who assist with email delivery, website
                  hosting, or analytics, bound by confidentiality agreements.
                </li>
                <li>
                  <strong className="text-foreground">Legal requirements:</strong>{" "}
                  When required by law, court order, or to protect our legal
                  rights.
                </li>
                <li>
                  <strong className="text-foreground">Business transfers:</strong>{" "}
                  In connection with a merger, acquisition, or sale of assets,
                  with notice to affected users.
                </li>
              </ul>
            </Section>

            <Section title="5. CCPA Rights (California Residents)" delay={0.3}>
              <p>
                If you are a California resident, the California Consumer
                Privacy Act (CCPA) grants you the following rights:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-2">
                <li>
                  <strong className="text-foreground">Right to Know:</strong>{" "}
                  You may request disclosure of the categories and specific
                  pieces of personal information we have collected about you,
                  the sources, our business purpose for collecting it, and any
                  third parties we share it with.
                </li>
                <li>
                  <strong className="text-foreground">Right to Delete:</strong>{" "}
                  You may request that we delete personal information we have
                  collected from you, subject to certain exceptions.
                </li>
                <li>
                  <strong className="text-foreground">
                    Right to Opt-Out of Sale:
                  </strong>{" "}
                  We do not sell personal information to third parties. No
                  opt-out action is required.
                </li>
                <li>
                  <strong className="text-foreground">
                    Right to Non-Discrimination:
                  </strong>{" "}
                  We will not discriminate against you for exercising any CCPA
                  rights.
                </li>
              </ul>
              <p>
                To exercise any of the above rights, contact us at{" "}
                <a
                  href="mailto:info@iowaautotrust.com"
                  className="text-primary hover:underline"
                >
                  info@iowaautotrust.com
                </a>{" "}
                or call (515) 672-5406. We will respond to verifiable requests
                within 45 days.
              </p>
            </Section>

            <Section title="6. Data Retention" delay={0.35}>
              <p>
                We retain personal information for as long as necessary to
                fulfill the purposes described in this policy, unless a longer
                retention period is required by law. Account data is retained
                until you request deletion. Inquiry and lead data is retained
                for up to three years for business records.
              </p>
            </Section>

            <Section title="7. Cookies and Tracking Technologies" delay={0.4}>
              <p>
                We use cookies and similar technologies to operate our website
                and understand how visitors use it.
              </p>
              <p className="font-medium text-foreground mt-2">
                Types of cookies we use:
              </p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>
                  <strong className="text-foreground">Essential cookies:</strong>{" "}
                  Required for the site to function, including authentication
                  and security tokens.
                </li>
                <li>
                  <strong className="text-foreground">Analytics cookies:</strong>{" "}
                  Help us understand traffic patterns and improve site
                  performance (e.g., page views, session duration).
                </li>
                <li>
                  <strong className="text-foreground">Preference cookies:</strong>{" "}
                  Remember your settings and choices between visits.
                </li>
              </ul>
              <p>
                You can manage your cookie preferences via the consent banner
                displayed on your first visit. You may also configure your
                browser to refuse cookies, though some site features may not
                work correctly without them.
              </p>
              <p>
                Your consent choice is stored locally on your device under the
                key{" "}
                <code className="text-xs bg-secondary px-1 py-0.5 rounded font-mono">
                  iat_cookie_consent
                </code>{" "}
                and can be cleared at any time by clearing your browser's local
                storage.
              </p>
            </Section>

            <Section title="8. Data Security" delay={0.45}>
              <p>
                We implement industry-standard security measures to protect your
                personal information, including encrypted data transmission
                (HTTPS), secure database storage, and access controls. However,
                no method of transmission over the internet is 100% secure.
              </p>
            </Section>

            <Section title="9. Children's Privacy" delay={0.5}>
              <p>
                Our services are not directed to individuals under the age of
                18. We do not knowingly collect personal information from
                minors. If you believe a minor has provided us with personal
                information, please contact us so we may delete it promptly.
              </p>
            </Section>

            <Section title="10. Changes to This Policy" delay={0.55}>
              <p>
                We may update this Privacy Policy from time to time. We will
                post the revised policy on this page with an updated effective
                date. Continued use of our site after changes constitutes
                acceptance of the revised policy.
              </p>
            </Section>

            <Section title="11. Contact Us" delay={0.6}>
              <p>
                For privacy-related questions, requests, or complaints, please
                contact:
              </p>
              <p className="mt-2">
                <strong className="text-foreground">Iowa Auto Trust</strong>
                <br />
                204 S Main St, Woodward, IA 50276
                <br />
                <a
                  href="mailto:info@iowaautotrust.com"
                  className="text-primary hover:underline"
                >
                  info@iowaautotrust.com
                </a>
                <br />
                (515) 672-5406
              </p>
            </Section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
