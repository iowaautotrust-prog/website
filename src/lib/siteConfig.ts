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
  hoursLabel: "Mon-Sat: 9am - 5pm",
  tagline: "Curated pre-owned vehicles in Johnston, Iowa. Every car inspected, priced right, and ready to drive.",

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
  geo: null as null | { lat: number; lng: number },

  // Sold vehicle pages stay reachable (JSON-LD: SoldOut) but are kept out of
  // search results and the sitemap/feed.
  noindexSold: true,
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
  return ld;
};
