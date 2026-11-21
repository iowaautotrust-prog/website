// Link lists for the header "About" menu, the mobile menu and the footer.

/** Header "About" menu, the mobile menu and the footer all read this list. */
export const ABOUT_LINKS: { to: string; label: string }[] = [
  { to: "/about", label: "About Iowa Trust Motors" },
  { to: "/how-we-work", label: "How We Work" },
  { to: "/areas-we-serve", label: "Areas We Serve" },
  { to: "/faq", label: "FAQ" },
];

/** Category and city pages, for the footer "Browse By" column. */
export const BROWSE_LINKS: { to: string; label: string }[] = [
  { to: "/used-suvs", label: "Used SUVs" },
  { to: "/used-cars-under-10000", label: "Cars Under $10,000" },
  { to: "/rebuilt-title-cars", label: "Rebuilt Title Cars" },
  { to: "/financing", label: "Financing" },
  { to: "/used-cars-des-moines", label: "Des Moines" },
  { to: "/used-cars-west-des-moines", label: "West Des Moines" },
  { to: "/used-cars-urbandale", label: "Urbandale" },
  { to: "/used-cars-waukee", label: "Waukee" },
];
