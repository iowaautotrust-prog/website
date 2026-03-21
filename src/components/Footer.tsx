import { Link } from "react-router-dom";
import { Phone, Mail, MapPin, Facebook, Instagram, Twitter } from "lucide-react";

const Footer = () => (
  <footer className="bg-foreground text-background">
    <div className="section-padding py-16">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
        {/* Brand */}
        <div>
          <p className="text-xl font-bold tracking-tight mb-1">IOWA AUTO TRUST</p>
          <p className="text-xs tracking-[0.2em] text-background/50 uppercase mb-4">
            Premium Pre-Owned Vehicles
          </p>
          <p className="text-sm text-background/70 leading-relaxed max-w-xs">
            Your trusted source for quality pre-owned vehicles in Woodward, Iowa.
            Every vehicle is inspected and ready for the road.
          </p>
          <div className="flex items-center gap-3 mt-6">
            <a
              href="https://instagram.com/iowaautotrust"
              target="_blank"
              rel="noopener noreferrer"
              className="w-8 h-8 rounded-full bg-background/10 flex items-center justify-center hover:bg-primary transition-colors"
              aria-label="Instagram"
            >
              <Instagram className="w-4 h-4" />
            </a>
            <a
              href="https://facebook.com/iowaautotrust"
              target="_blank"
              rel="noopener noreferrer"
              className="w-8 h-8 rounded-full bg-background/10 flex items-center justify-center hover:bg-primary transition-colors"
              aria-label="Facebook"
            >
              <Facebook className="w-4 h-4" />
            </a>
          </div>
        </div>

        {/* Quick Links */}
        <div>
          <p className="text-xs font-semibold tracking-[0.15em] uppercase text-background/50 mb-5">
            Quick Links
          </p>
          <ul className="space-y-3">
            {[
              { to: "/", label: "Home" },
              { to: "/inventory", label: "Browse Inventory" },
              { to: "/compare", label: "Compare Vehicles" },
              { to: "/contact", label: "Contact Us" },
              { to: "/login", label: "Sign In" },
            ].map(({ to, label }) => (
              <li key={to}>
                <Link
                  to={to}
                  className="text-sm text-background/70 hover:text-background transition-colors"
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Contact */}
        <div>
          <p className="text-xs font-semibold tracking-[0.15em] uppercase text-background/50 mb-5">
            Contact Us
          </p>
          <ul className="space-y-4">
            <li>
              <a
                href="tel:5156725406"
                className="flex items-start gap-3 text-sm text-background/70 hover:text-background transition-colors group"
              >
                <Phone className="w-4 h-4 mt-0.5 shrink-0 group-hover:text-primary transition-colors" />
                <span>(515) 672-5406</span>
              </a>
            </li>
            <li>
              <a
                href="mailto:info@iowaautotrust.com"
                className="flex items-start gap-3 text-sm text-background/70 hover:text-background transition-colors group"
              >
                <Mail className="w-4 h-4 mt-0.5 shrink-0 group-hover:text-primary transition-colors" />
                <span>info@iowaautotrust.com</span>
              </a>
            </li>
            <li>
              <a
                href="https://maps.google.com/?q=204+S+Main+St+Woodward+IA+50276"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-3 text-sm text-background/70 hover:text-background transition-colors group"
              >
                <MapPin className="w-4 h-4 mt-0.5 shrink-0 group-hover:text-primary transition-colors" />
                <span>204 S Main St<br />Woodward, IA 50276</span>
              </a>
            </li>
          </ul>
        </div>
      </div>
    </div>

    {/* Bottom bar */}
    <div className="section-padding py-5 border-t border-background/10">
      <div className="flex flex-col md:flex-row justify-between items-center gap-2">
        <p className="text-xs text-background/40">
          © {new Date().getFullYear()} Iowa Auto Trust. All rights reserved.
        </p>
        <p className="text-xs text-background/40">
          204 S Main St, Woodward, IA 50276
        </p>
      </div>
    </div>
  </footer>
);

export default Footer;
