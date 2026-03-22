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

export default function Terms() {
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
            <h1 className="heading-section mb-4">Terms of Service</h1>
            <p className="text-muted-foreground max-w-2xl">
              Effective Date: March 1, 2026
            </p>
            <p className="text-muted-foreground max-w-2xl mt-2">
              Please read these Terms of Service ("Terms") carefully before
              using the Iowa Auto Trust website or services. By accessing or
              using our services, you agree to be bound by these Terms.
            </p>
          </motion.div>

          <div className="max-w-3xl">
            <Section title="1. About Iowa Auto Trust" delay={0.1}>
              <p>
                Iowa Auto Trust operates as a pre-owned vehicle dealership and
                automotive service provider located at 204 S Main St, Woodward,
                IA 50276. Our website provides information about available
                vehicles, service offerings, and means to contact our team.
              </p>
            </Section>

            <Section title="2. Age Requirement" delay={0.15}>
              <p>
                You must be at least 18 years of age to use our website,
                create an account, submit inquiries, schedule service
                appointments, or enter into any purchase or service agreement
                with Iowa Auto Trust. By using our services, you represent and
                warrant that you meet this age requirement.
              </p>
            </Section>

            <Section title="3. Vehicle Listings — Informational Purposes Only" delay={0.2}>
              <p>
                All vehicle listings displayed on our website are provided for
                informational purposes only. While we strive to keep listings
                accurate and up to date:
              </p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>
                  Vehicle availability is not guaranteed until a purchase
                  agreement has been signed and a deposit received.
                </li>
                <li>
                  Prices, mileage, features, and specifications are subject to
                  change without notice.
                </li>
                <li>
                  Photos are representative; actual vehicle appearance may vary
                  slightly.
                </li>
                <li>
                  We reserve the right to correct errors in pricing or
                  descriptions at any time prior to completing a sale.
                </li>
              </ul>
              <p>
                Iowa Auto Trust is not liable for losses arising from reliance
                on inaccurate listing information.
              </p>
            </Section>

            <Section title="4. User Accounts" delay={0.25}>
              <p>
                If you create an account on our platform, you agree to:
              </p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>
                  Provide accurate, current, and complete information during
                  registration.
                </li>
                <li>
                  Maintain the security of your password and not share account
                  access with others.
                </li>
                <li>
                  Notify us immediately at{" "}
                  <a
                    href="mailto:info@iowaautotrust.com"
                    className="text-primary hover:underline"
                  >
                    info@iowaautotrust.com
                  </a>{" "}
                  if you suspect unauthorized access.
                </li>
                <li>
                  Accept full responsibility for all activity that occurs under
                  your account.
                </li>
              </ul>
              <p>
                We reserve the right to suspend or terminate accounts that
                violate these Terms or are used fraudulently.
              </p>
            </Section>

            <Section title="5. Oil Change and Service Appointment Terms" delay={0.3}>
              <p className="font-medium text-foreground">Scheduling:</p>
              <p>
                Service appointments may be scheduled through our website,
                by phone, or in person. Appointments are confirmed via email
                or phone. Confirmation does not guarantee parts availability;
                we will contact you if additional parts must be ordered.
              </p>
              <p className="font-medium text-foreground mt-3">
                Cancellation Policy:
              </p>
              <p>
                We require at least <strong className="text-foreground">24 hours' notice</strong> to
                cancel or reschedule a service appointment. Cancellations with
                less than 24 hours' notice may result in a cancellation fee at
                our discretion. No-shows without prior notice may be subject to
                a service fee.
              </p>
              <p className="font-medium text-foreground mt-3">
                Service Scope:
              </p>
              <p>
                Any additional repairs or services identified during your
                appointment will be communicated to you before work begins. We
                will not perform additional work without your explicit approval.
              </p>
            </Section>

            <Section title="6. Invoice and Payment Terms" delay={0.35}>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>
                  Payment is due in full upon completion of service unless a
                  prior payment arrangement has been made in writing.
                </li>
                <li>
                  We accept cash, check, and major credit/debit cards.
                  Financing options may be available for vehicle purchases —
                  ask our team for details.
                </li>
                <li>
                  Invoices for vehicle purchases must be settled according to
                  the terms specified in the purchase agreement.
                </li>
                <li>
                  Overdue balances may be subject to collection action and
                  associated fees.
                </li>
                <li>
                  All sales are subject to applicable Iowa state taxes and fees.
                </li>
              </ul>
            </Section>

            <Section title="7. Acceptable Use" delay={0.4}>
              <p>You agree not to:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>
                  Use our website for any unlawful purpose or in violation of
                  these Terms.
                </li>
                <li>
                  Submit false or misleading information in forms or inquiries.
                </li>
                <li>
                  Attempt to gain unauthorized access to any part of our
                  systems or accounts.
                </li>
                <li>
                  Use automated tools to scrape, crawl, or harvest data from
                  our website without our written consent.
                </li>
                <li>
                  Interfere with the proper operation of the website or its
                  infrastructure.
                </li>
              </ul>
            </Section>

            <Section title="8. Intellectual Property" delay={0.45}>
              <p>
                All content on this website — including text, images, logos,
                vehicle photos, and software — is the property of Iowa Auto
                Trust or its content suppliers and is protected by applicable
                copyright and trademark laws. You may not reproduce, distribute,
                or create derivative works without our express written
                permission.
              </p>
            </Section>

            <Section title="9. Limitation of Liability" delay={0.5}>
              <p>
                To the fullest extent permitted by Iowa law, Iowa Auto Trust,
                its owners, employees, and agents shall not be liable for any
                indirect, incidental, special, consequential, or punitive
                damages arising from:
              </p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>
                  Your use of, or inability to use, our website or services
                </li>
                <li>
                  Errors, omissions, or inaccuracies in vehicle listings
                </li>
                <li>
                  Unauthorized access to or alteration of your data
                </li>
                <li>
                  Any other matter relating to our services
                </li>
              </ul>
              <p>
                Our total liability to you for any claim arising under these
                Terms shall not exceed the amount you paid to Iowa Auto Trust
                for the specific service giving rise to the claim.
              </p>
            </Section>

            <Section title="10. Disclaimer of Warranties" delay={0.55}>
              <p>
                Our website and services are provided on an "as is" and "as
                available" basis without warranties of any kind, express or
                implied, including but not limited to warranties of
                merchantability, fitness for a particular purpose, or
                non-infringement. We do not warrant that the website will be
                uninterrupted, error-free, or free of viruses or harmful
                components.
              </p>
            </Section>

            <Section title="11. Governing Law" delay={0.6}>
              <p>
                These Terms shall be governed by and construed in accordance
                with the laws of the State of Iowa, without regard to its
                conflict of law provisions. Any disputes arising under these
                Terms shall be subject to the exclusive jurisdiction of the
                state and federal courts located in Dallas County, Iowa.
              </p>
            </Section>

            <Section title="12. Changes to These Terms" delay={0.65}>
              <p>
                We reserve the right to update these Terms at any time. Changes
                will be posted on this page with a revised effective date.
                Continued use of our services after changes are posted
                constitutes your acceptance of the revised Terms. We encourage
                you to review this page periodically.
              </p>
            </Section>

            <Section title="13. Contact Us" delay={0.7}>
              <p>
                For questions about these Terms, please contact:
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
