// Single source of truth for business details (name / address / phone).
// Imported by the React app AND by the Netlify edge functions, so keep this
// file free of imports. Keep the address identical to the Google Business Profile.

export const SITE = {
  name: "Iowa Trust Motors",
  url: "https://iowatrustmotors.com",
  phone: "(515) 809-8051",
  phoneTel: "tel:5158098051",
  phoneE164: "+15158098051",
  email: "sales@iowatrustmotors.com",
  address: {
    // Exactly as on the Google Business Profile / Google Maps (client confirmed "Unit 2", 2026-10-30).
    street: "5421 NW Beaver Dr Unit 2",
    city: "Johnston",
    region: "IA",
    postalCode: "50131",
    country: "US",
  },
  mapsUrl: "https://maps.google.com/?q=5421+NW+Beaver+Dr+Unit+2+Johnston+IA",
  // Opens the Maps app / site with the route to the lot already filled in.
  directionsUrl: "https://www.google.com/maps/dir/?api=1&destination=5421+NW+Beaver+Dr+Unit+2%2C+Johnston%2C+IA+50131",
  // Key-free Google Maps embed (allowed by frame-src in public/_headers).
  mapsEmbedUrl: "https://www.google.com/maps?q=5421+NW+Beaver+Dr+Unit+2%2C+Johnston%2C+IA+50131&output=embed",
  // "Text Us" buttons.
  smsTel: "sms:+15158098051",
  // Opens the Google review box for the business (the Business Profile short link + /review).
  reviewUrl: "https://g.page/r/CWckIMJKiLqiEBM/review",
  hoursLabel: "Mon-Sat: 9am - 5pm",
  tagline: "Curated pre-owned vehicles in Johnston, Iowa. Every car inspected, priced right, and ready to drive.",
  // Shown on every vehicle page, right under the price.
  asIsNotice: "Sold AS-IS – No dealer warranty.",

  // Empty values are simply left out of the footer and the structured data.
  social: {
    googleBusiness: "https://g.page/r/CWckIMJKiLqiEBM",
    facebook: "", // client will send this later
    instagram: "https://www.instagram.com/iowatrustmotors.ia/",
    yelp: "https://yelp.to/2z_OPRyT7B",
  },
  logo: "https://iowatrustmotors.com/iowa_logo.jpeg", // public/iowa_logo.jpeg (1254x1254)
  // Used for the dealer "image" and as the default share image. Swap for a storefront photo when there is one.
  image: "https://iowatrustmotors.com/iowa_logo.jpeg",
  // Exact pin from Google Maps (right-click the building -> first line "41.xxxx, -93.xxxx").
  geo: { lat: 41.65871668274264, lng: -93.6841880730135 } as null | { lat: number; lng: number },

  // Sold vehicle pages stay reachable (JSON-LD: SoldOut) but are kept out of
  // search results and the sitemap/feed.
  noindexSold: true,

  // Local SEO plan (Nov 10, 2026), section 3.3: the exact cities for AutoDealer.areaServed.
  // Keep in sync with src/lib/areas.ts, which holds the longer "Areas We Serve" prose list.
  areaServed: ["Johnston, IA", "Des Moines, IA", "Urbandale, IA", "West Des Moines, IA", "Waukee, IA", "Grimes, IA", "Ankeny, IA"],
};

export const fullAddress = (): string => {
  const a = SITE.address;
  return `${a.street}, ${a.city}, ${a.region} ${a.postalCode}`;
};

export type SocialLabel = "Facebook" | "Instagram" | "Yelp";

/** Footer links, in display order. Entries without a URL are skipped. */
export const socialLinks = (): { label: SocialLabel; href: string }[] =>
  (
    [
      { label: "Facebook", href: SITE.social.facebook },
      { label: "Instagram", href: SITE.social.instagram },
      { label: "Yelp", href: SITE.social.yelp },
    ] as { label: SocialLabel; href: string }[]
  ).filter((s) => s.href);

/** AutoDealer JSON-LD for every public page. Optional fields are omitted when empty. */
export const dealerJsonLd = (): Record<string, unknown> => {
  const sameAs = [SITE.social.googleBusiness, SITE.social.facebook, SITE.social.instagram, SITE.social.yelp].filter(Boolean);
  const ld: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "AutoDealer",
    "@id": `${SITE.url}/#dealer`,
    name: SITE.name,
    description: SITE.tagline,
    url: SITE.url,
    telephone: SITE.phoneE164,
    email: SITE.email,
    priceRange: "$$",
    address: {
      "@type": "PostalAddress",
      streetAddress: SITE.address.street,
      addressLocality: SITE.address.city,
      addressRegion: SITE.address.region,
      postalCode: SITE.address.postalCode,
      addressCountry: SITE.address.country,
    },
    openingHoursSpecification: {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
      opens: "09:00",
      closes: "17:00",
    },
  };
  if (SITE.logo) ld.logo = SITE.logo;
  if (SITE.image) ld.image = SITE.image;
  if (SITE.geo) ld.geo = { "@type": "GeoCoordinates", latitude: SITE.geo.lat, longitude: SITE.geo.lng };
  if (sameAs.length) ld.sameAs = sameAs;
  if (SITE.areaServed.length) ld.areaServed = SITE.areaServed.map((name) => ({ "@type": "City", name }));
  if (SITE.social.googleBusiness) ld.hasMap = SITE.social.googleBusiness;
  return ld;
};

/** One Q/A entry. Shared by the /faq page, its FAQPage JSON-LD and the server-rendered HTML, so they never drift. */
export interface FaqItem {
  q: string;
  a: string;
}

// The client's wording (ITM_website_request_nov21, Nov 21 2026), used as written.
export const FAQ_ITEMS: FaqItem[] = [
  {
    q: "Do you offer financing?",
    a: 'Yes. You can apply online through our lending partner, Marine Credit Union, using the "Apply for Financing" button on our website. The application takes a few minutes. Approval and terms depend on the lender\'s review of your credit and income. Financing is available with approved credit. If you have questions, call us at (515) 809-8051.',
  },
  {
    q: 'What does "Rebuilt Title" mean?',
    a: "A rebuilt title means the vehicle was declared a total loss by an insurance company in the past, was then repaired, and passed the Iowa state inspection before being titled again. Rebuilt-title vehicles usually cost less than similar clean-title vehicles.",
  },
  {
    q: "Can I see what repairs were done?",
    a: "Yes. We document the repairs on our vehicles, and repair details and photos are available on request. Just ask when you call or visit.",
  },
  {
    q: "Do your vehicles come with a warranty?",
    a: "No. Our vehicles are sold AS-IS with no dealer warranty, and the factory warranty may not apply on rebuilt-title vehicles. That is why we share the title status, repairs, and real photos before you buy, and why we encourage you to take a test drive.",
  },
  {
    q: "Can I insure a rebuilt-title car?",
    a: "Most insurance companies insure rebuilt-title vehicles, but coverage options can vary by company. We recommend calling your insurance agent with the VIN before you buy. The VIN is listed on every vehicle page.",
  },
  {
    q: "Can I test drive a car?",
    a: "Yes. Call or text (515) 809-8051 to confirm the car is available and set a time. In most cases we can arrange a test drive the same day. Please bring your driver's license.",
  },
  {
    q: "Do you accept trade-ins?",
    a: "Ask us about your trade-in when you call. Bring your vehicle's title and any payoff information so we can talk through it.",
  },
  {
    q: 'What does "Coming Soon" mean?',
    a: 'A "Coming Soon" vehicle is in our inventory but is still being prepared — repairs, inspection, or photos may not be finished yet. You can use the "Notify Me" button on the vehicle page or call us to be the first to know when it is ready.',
  },
  {
    q: "What do I need to bring to buy a car?",
    a: "A valid driver's license, proof of insurance, and your payment or financing approval. If you are trading in a vehicle, bring its title.",
  },
  {
    q: "Where are you located and what are your hours?",
    a: "Iowa Trust Motors is at 5421 NW Beaver Dr Unit 2, Johnston, IA 50131. We are open Monday to Saturday, 9am to 5pm, and closed on Sunday. You can also reach us at sales@iowatrustmotors.com.",
  },
];
export const faqJsonLd = (items: FaqItem[]): Record<string, unknown> => ({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: items.map((i) => ({
    "@type": "Question",
    name: i.q,
    acceptedAnswer: { "@type": "Answer", text: i.a },
  })),
});
