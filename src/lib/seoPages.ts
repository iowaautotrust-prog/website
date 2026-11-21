// Title, description, H1 and body text of the 12 SEO pages. This is the client's own wording
// (ITM_website_request_nov21, Nov 21 2026), used as written. One source for everything that shows it:
// the React pages, the server-rendered HTML (netlify/edge-functions/_lib/html.ts), the <title> /
// description tags (pageMeta.ts) and the FAQ schema (siteConfig.ts), so they can never disagree.
//
// Text may contain [link text](/path) for an internal link and \n for a line break.

import { FAQ_ITEMS } from "./siteConfig.ts";

export type Block = { h2: string } | { p: string } | { ul: string[] };

export interface SeoPageData {
  title: string;
  description: string;
  h1: string;
  blocks: Block[];
  /** Pages that list cars: the heading above the cars and what shows when none match. */
  inventory?: { heading?: string; emptyMessage: string };
}

const h2 = (text: string): Block => ({ h2: text });
const p = (text: string): Block => ({ p: text });
const ul = (...items: string[]): Block => ({ ul: items });

const NONE_NOW = "Check back soon — or browse our full inventory for what's available today.";

export const SEO_PAGES: Record<string, SeoPageData> = {
  "/financing": {
    title: "Used Car Financing in Johnston, IA | Iowa Trust Motors",
    description:
      "Apply for used car financing online at Iowa Trust Motors in Johnston, IA. Simple application through our lending partner, fast answers, and help from a real person.",
    h1: "Used Car Financing in Johnston, IA",
    inventory: { emptyMessage: "Every vehicle currently in stock qualifies for financing — check back soon, or browse our full inventory." },
    blocks: [
      p("Buying a car should not mean a long day at a finance desk. At Iowa Trust Motors in Johnston, we keep financing simple: you choose the car, apply online, and we help you through every step until you drive away."),
      h2("How financing works at Iowa Trust Motors"),
      p('We work with our lending partner, Marine Credit Union. You can start your application from any vehicle page or from the "Apply for Financing" button on our website. The application takes a few minutes, and you can complete it from your phone. Once you apply, we follow up with you to go over the next steps and answer any questions.'),
      h2("What you will need"),
      p("To speed things up, have these ready when you apply or visit:"),
      ul(
        "A valid driver's license",
        "Proof of income, such as recent pay stubs",
        "Proof of address, such as a utility bill",
        "Proof of insurance before you take the car home"
      ),
      p("If you plan to trade in a vehicle, bring the title and any payoff information."),
      h2("Financing with any credit history"),
      p("Every application is reviewed by the lender, and approval and terms depend on your credit and income. If you are rebuilding your credit or buying your first car, call us before you apply. We will explain the process honestly and help you understand your options. Financing is available with approved credit."),
      h2("Choose the car first"),
      p("All of our vehicles are listed online with real photos, mileage, VIN, title status, and price, so you can pick the right car before you talk about payments. Many of our vehicles carry a rebuilt title, which often means a lower price than a similar clean-title car. Ask us about insurance for rebuilt-title vehicles before you buy."),
      h2("Talk to us"),
      p("Have a question before you apply? Call or text (515) 809-8051, or stop by 5421 NW Beaver Dr Unit 2 in Johnston, Monday to Saturday, 9am to 5pm. We serve buyers from Des Moines, Urbandale, Ankeny, Grimes, Waukee, West Des Moines, and across central Iowa."),
    ],
  },

  "/used-suvs": {
    title: "Used SUVs for Sale in Johnston, IA | Iowa Trust Motors",
    description:
      "Shop used SUVs and crossovers in Johnston, IA. AWD options from Ford, Chevrolet, Nissan, Buick and more, with real photos, clear pricing and financing available.",
    h1: "Used SUVs for Sale in Johnston, IA",
    inventory: {
      heading: "SUVs Available Now",
      emptyMessage: "We're between SUVs in stock right now — check back soon, or browse our full inventory for what's available today.",
    },
    blocks: [
      p("Iowa winters, gravel roads, school runs, and weekend trips to the lake — an SUV handles all of it. At Iowa Trust Motors in Johnston, SUVs and crossovers make up most of our inventory, and many of them come with all-wheel drive."),
      h2("SUVs built for Iowa driving"),
      p("We focus on practical, reliable SUVs that make great daily drivers. Our inventory often includes models such as the Ford Escape, Chevrolet Equinox, Nissan Rogue, Nissan Rogue Sport, and Buick Encore. Inventory changes often, so check the listings above for what is available today."),
      h2("What you can expect from every SUV we sell"),
      ul(
        "Real photos of the actual vehicle, inside and out",
        "Clear pricing listed online",
        "The VIN, mileage, and title status on every listing",
        "Repair details and photos available on request",
        "A test drive the same day you call, in most cases"
      ),
      h2("AWD for winter"),
      p("All-wheel drive gives you better traction in snow, ice, and rain, which matters during an Iowa winter. Each listing shows whether the SUV is AWD or front-wheel drive, so you can filter quickly and compare."),
      h2("Rebuilt-title SUVs at a lower price"),
      p("Many of our SUVs carry a rebuilt title. These vehicles were repaired professionally and passed the Iowa state inspection before they were titled again. A rebuilt-title SUV can cost noticeably less than a similar clean-title vehicle, which lets you get a newer model or more features for your budget. We are upfront about the title status and the repairs on every car."),
      h2("Financing and trade-ins"),
      p("Financing is available with approved credit through our lending partner, and you can apply online in minutes. Thinking about trading in your current vehicle? Ask us when you call."),
      h2("Visit our Johnston lot"),
      p("Iowa Trust Motors is at 5421 NW Beaver Dr Unit 2, Johnston, IA 50131 — a short drive from Des Moines, Urbandale, Ankeny, and Grimes. Call or text (515) 809-8051 to confirm a vehicle is available and set up a test drive."),
    ],
  },

  "/used-cars-under-10000": {
    title: "Used Cars Under $10,000 Near Des Moines | Iowa Trust Motors",
    description:
      "Find inspected used cars and SUVs under $10,000 near Des Moines at Iowa Trust Motors in Johnston, IA. Clear prices, real photos and financing available.",
    h1: "Used Cars Under $10,000 Near Des Moines",
    inventory: {
      heading: "Under $10,000 Right Now",
      emptyMessage: "Nothing under $10,000 is in stock this week — browse our full inventory to see today's prices.",
    },
    blocks: [
      p("A dependable car does not have to cost a fortune. At Iowa Trust Motors in Johnston, we list vehicles priced under $10,000 for buyers who want a solid daily driver on a tight budget — first-time drivers, students, commuters, and families who need a second car."),
      h2("Budget-friendly does not mean cutting corners"),
      p("Every vehicle under $10,000 goes through the same process as the rest of our inventory. We repair it, have it inspected, and list it online with real photos, the VIN, the mileage, the title status, and the price. You see exactly what you are buying before you visit."),
      h2("Why our prices are lower"),
      p("Many of our vehicles carry a rebuilt title. That means the car was repaired professionally and passed the Iowa state inspection before it was titled again. Rebuilt-title vehicles usually sell for less than similar clean-title cars, which is how we can offer newer models and lower mileage at a lower price. We always tell you the title status and the repairs that were done, and repair photos are available on request."),
      h2("Tips for buying a car under $10,000"),
      ul(
        "Decide on your monthly budget, including insurance and fuel",
        "Ask your insurance company about coverage for the car you like",
        "Look at mileage and the features you really need",
        "Take a test drive and ask about any repairs",
        "Come with your driver's license and proof of insurance"
      ),
      h2("Financing available"),
      p("Even at this price range, you can apply for financing online with approved credit. If you are buying your first car or rebuilding credit, call us and we will walk you through the process."),
      h2("Inventory changes fast"),
      p("Cars in this price range sell quickly. Call or text (515) 809-8051 to confirm a car is still available before you drive over. Iowa Trust Motors is at 5421 NW Beaver Dr Unit 2, Johnston, IA 50131, open Monday to Saturday, 9am to 5pm, and serves buyers across the Des Moines metro."),
    ],
  },

  "/rebuilt-title-cars": {
    title: "Rebuilt Title Cars for Sale in Iowa | Iowa Trust Motors",
    description:
      "Rebuilt title cars and SUVs for sale in Johnston, Iowa. Professionally repaired, Iowa state inspected, with repair details and photos available. Financing available.",
    h1: "Rebuilt Title Cars for Sale in Iowa",
    inventory: {
      heading: "Rebuilt Title Cars Available Now",
      emptyMessage: "None of our current inventory is marked Rebuilt right now — browse our full inventory to see what's available today.",
    },
    blocks: [
      p("A rebuilt-title vehicle can be a smart way to drive a newer car for less money — as long as you know exactly what you are buying. At Iowa Trust Motors in Johnston, transparency comes first. Every rebuilt-title car we sell is listed with its title status, its repairs, and real photos."),
      h2('What does "rebuilt title" mean?'),
      p("When an insurance company declares a vehicle a total loss, it receives a salvage title. After the vehicle is repaired, it must pass an Iowa state inspection before it can be titled again and driven on the road. Once it passes, it receives a rebuilt title. A rebuilt title tells you the car was damaged in the past and has since been repaired and inspected."),
      h2("How we repair our vehicles"),
      p("We buy vehicles we believe are worth repairing and that will make reliable daily drivers. The repairs are completed before the car is listed, and we document the work. Repair details and photos are available for every vehicle, so you can see what was done."),
      h2("Benefits of buying a rebuilt-title car"),
      ul(
        "Lower price than a similar clean-title vehicle",
        "Access to newer models, lower mileage, or more features for your budget",
        "Full disclosure of the title status and repairs"
      ),
      h2("Things to know before you buy"),
      ul(
        "Insurance: most insurance companies cover rebuilt-title vehicles, but coverage options can vary. Call your insurance agent with the VIN before you buy.",
        "Resale value: rebuilt-title vehicles usually resell for less than clean-title vehicles.",
        "Warranty: our vehicles are sold AS-IS with no dealer warranty, and the factory warranty may not apply.",
        "Inspection: you are welcome to see the car in person, take a test drive, and ask any questions."
      ),
      h2("Financing available"),
      p("Financing is available with approved credit through our lending partner. You can apply online in a few minutes."),
      h2("Visit Iowa Trust Motors"),
      p("We are located at 5421 NW Beaver Dr Unit 2, Johnston, IA 50131, open Monday to Saturday, 9am to 5pm. Call or text (515) 809-8051 to ask about any vehicle, request repair photos, or schedule a test drive."),
    ],
  },

  "/used-cars-des-moines": {
    title: "Used Cars Near Des Moines, IA | Iowa Trust Motors",
    description:
      "Looking for used cars near Des Moines? Iowa Trust Motors in Johnston offers inspected SUVs and cars with clear pricing, real photos and financing, minutes from Des Moines.",
    h1: "Used Cars Near Des Moines, IA",
    inventory: { emptyMessage: NONE_NOW },
    blocks: [
      p("If you are shopping for a used car in Des Moines, Iowa Trust Motors is right next door in Johnston — about 15 minutes north of downtown. We are a small, locally owned dealership that focuses on practical cars and SUVs at fair, clearly listed prices."),
      h2("Why Des Moines drivers shop with us"),
      p("Big dealerships can feel rushed and confusing. We keep it simple. Every vehicle is listed online with real photos, the mileage, the VIN, the title status, and the price, so you can compare from home before you visit. When you are ready, call or text us and we will have the car ready for a test drive, often the same day."),
      h2("What we sell"),
      p("Most of our inventory is SUVs and crossovers, many with all-wheel drive for Iowa winters, plus a selection of sedans. Popular models include the Ford Escape, Chevrolet Equinox, Nissan Rogue, and Buick Encore. Inventory changes often, so check the listings above for today's vehicles."),
      h2("Honest about every car"),
      p("Many of our vehicles carry a rebuilt title. These cars were professionally repaired and passed the Iowa state inspection before being titled again. Rebuilt-title vehicles usually cost less than similar clean-title cars, which helps Des Moines buyers get more car for their budget. We always disclose the title status and the repairs, and repair photos are available on request."),
      h2("Financing and easy paperwork"),
      p("You can apply for financing online in a few minutes, with approved credit. We help you with the paperwork so you can finish quickly and get back on the road."),
      h2("Getting here from Des Moines"),
      p("Iowa Trust Motors is at 5421 NW Beaver Dr Unit 2, Johnston, IA 50131. From most of Des Moines it is a short drive north. We are open Monday to Saturday, 9am to 5pm."),
      h2("Contact us"),
      p("Call or text (515) 809-8051 or email sales@iowatrustmotors.com to confirm a vehicle is available, ask a question, or book a test drive."),
    ],
  },

  "/used-cars-west-des-moines": {
    title: "Used Cars Near West Des Moines, IA | Iowa Trust Motors",
    description:
      "Used cars and SUVs near West Des Moines at Iowa Trust Motors in Johnston, IA. Real photos, clear prices, rebuilt-title transparency and financing available.",
    h1: "Used Cars Near West Des Moines, IA",
    inventory: { emptyMessage: NONE_NOW },
    blocks: [
      p("West Des Moines drivers looking for a reliable used car at a fair price can find it a short drive north at Iowa Trust Motors in Johnston. We are a locally owned dealership with a simple goal: honest listings, fair prices, and a no-pressure buying experience."),
      h2("A smaller dealership with a personal touch"),
      p("When you call us, you talk to the people who know the cars. We can tell you how a vehicle drives, what repairs were done, and whether it fits your needs. There is no pressure and no runaround — just straight answers."),
      h2("Cars that fit West Des Moines life"),
      p("Whether you commute to work, drive the kids to school, or head out of town on weekends, we focus on dependable vehicles for everyday life. Most of our inventory is SUVs and crossovers, many with all-wheel drive, along with fuel-efficient sedans. Check the listings above for the vehicles available today."),
      h2("Everything you need to know, online"),
      ul(
        "Real photos of the actual vehicle",
        "Mileage, VIN, and title status on every listing",
        "Clear price shown upfront",
        "Repair details and photos available on request"
      ),
      h2("Rebuilt-title value"),
      p("Many of our vehicles carry a rebuilt title. They were professionally repaired and passed the Iowa state inspection before being titled again, and they usually cost less than similar clean-title vehicles. We explain the title and the repairs on every car so you can buy with confidence. Before you buy, check insurance with your agent using the VIN."),
      h2("Financing for West Des Moines buyers"),
      p("Financing is available with approved credit. You can apply online in minutes, and we will help you with the next steps."),
      h2("Plan your visit"),
      p("Iowa Trust Motors is at 5421 NW Beaver Dr Unit 2, Johnston, IA 50131, open Monday to Saturday, 9am to 5pm. Call or text (515) 809-8051 to confirm availability and set up a test drive at a time that works for you."),
    ],
  },

  "/used-cars-waukee": {
    title: "Used Cars Near Waukee, IA | Iowa Trust Motors",
    description:
      "Shopping for a used car near Waukee? Iowa Trust Motors in Johnston offers inspected SUVs and cars with honest listings, fair prices and financing available.",
    h1: "Used Cars Near Waukee, IA",
    inventory: { emptyMessage: NONE_NOW },
    blocks: [
      p("Waukee is one of the fastest-growing communities in central Iowa, and growing families need dependable vehicles. Iowa Trust Motors in Johnston is a short drive from Waukee and offers used SUVs and cars at fair, clearly listed prices."),
      h2("Vehicles for growing families"),
      p("Many Waukee households need room for kids, sports gear, and groceries, plus traction for winter roads. That is why most of our inventory is SUVs and crossovers, many with all-wheel drive. Models such as the Chevrolet Equinox, Ford Escape, and Nissan Rogue offer good cargo space, comfortable seating, and modern safety features. Check the listings above for the vehicles available today."),
      h2("Shop from home first"),
      p("We list every vehicle online with real photos, the mileage, the VIN, the title status, and the price. You can narrow down your choices from home, compare vehicles side by side with our Compare tool, and only make the trip when you are ready to test drive."),
      h2("Clear about rebuilt titles"),
      p("Many of our vehicles carry a rebuilt title. These cars were professionally repaired and passed the Iowa state inspection before they were titled again. A rebuilt-title vehicle usually costs less than a similar clean-title one, so your budget goes further. We always tell you the title status and what was repaired, and we can share repair photos."),
      h2("Financing and trade-ins"),
      p("Financing is available with approved credit, and you can apply online in a few minutes. If you are thinking about trading in your current vehicle, mention it when you call so we can talk through it."),
      h2("Visit us in Johnston"),
      p("Iowa Trust Motors is located at 5421 NW Beaver Dr Unit 2, Johnston, IA 50131. We are open Monday to Saturday, 9am to 5pm. Call or text (515) 809-8051 before you head over, and we will have the vehicle ready for you."),
    ],
  },

  "/used-cars-urbandale": {
    title: "Used Cars Near Urbandale, IA | Iowa Trust Motors",
    description:
      "Used cars and SUVs minutes from Urbandale at Iowa Trust Motors in Johnston, IA. Real photos, clear pricing, same-day test drives and financing available.",
    h1: "Used Cars Near Urbandale, IA",
    inventory: { emptyMessage: NONE_NOW },
    blocks: [
      p("Urbandale and Johnston are neighbors, so Iowa Trust Motors is only minutes away for Urbandale drivers. If you need a dependable used car or SUV, we make the process simple, honest, and quick."),
      h2("Close to home"),
      p("Because we are so close to Urbandale, it is easy to stop by on your lunch break or after work to see a car in person. Call or text us first and we will have the vehicle ready for a test drive, often the same day."),
      h2("What you will find on our lot"),
      p("Our inventory is mostly SUVs and crossovers — many with all-wheel drive for Iowa weather — plus some sedans for commuters who want better fuel economy. Inventory changes often, so check the listings above for what is available today."),
      h2("Transparent listings"),
      ul(
        "Real photos of the actual car, not stock images",
        "Mileage, VIN, and title status on every listing",
        "Price clearly listed",
        "Repair details and photos available on request"
      ),
      h2("Rebuilt-title vehicles explained"),
      p("Many of our vehicles carry a rebuilt title. That means the car was repaired professionally and passed the Iowa state inspection before being titled again. Rebuilt-title cars usually cost less than similar clean-title cars. We always disclose the title status and repairs, and we recommend checking insurance with your agent using the VIN before you buy. Our vehicles are sold AS-IS with no dealer warranty."),
      h2("Financing for Urbandale buyers"),
      p("Apply for financing online in a few minutes, with approved credit. If you have questions about the process, call us and we will help."),
      h2("Stop by today"),
      p("Iowa Trust Motors is at 5421 NW Beaver Dr Unit 2, Johnston, IA 50131, just minutes from Urbandale. We are open Monday to Saturday, 9am to 5pm. Call or text (515) 809-8051 or email sales@iowatrustmotors.com."),
    ],
  },

  "/about": {
    title: "About Iowa Trust Motors | Used Cars in Johnston, IA",
    description:
      "Iowa Trust Motors is a locally owned used car dealership in Johnston, Iowa, serving the Des Moines metro with repaired, inspected vehicles at fair, clearly listed prices.",
    h1: "About Iowa Trust Motors",
    blocks: [
      p("Iowa Trust Motors is a locally owned used car dealership in Johnston, Iowa, serving drivers across the Des Moines metro. We buy quality vehicles, repair them professionally, have them inspected, and sell them at fair, clearly listed prices."),
      h2("Our name is our promise"),
      p("We chose the name Iowa Trust Motors because trust is the most important part of buying a used car. Many buyers have had bad experiences with hidden problems, surprise fees, or pushy salespeople. We built our dealership to be the opposite: clear information, honest answers, and no pressure."),
      h2("Transparency about rebuilt titles"),
      p("Many of our vehicles carry a [rebuilt title](/rebuilt-title-cars). We believe you should know exactly what you are buying, so every listing shows the title status, the repairs that were done, and real photos of the car. Repair details and photos are available on request. Every rebuilt-title vehicle has passed the Iowa state inspection before it was titled again."),
      h2("What we focus on"),
      ul(
        "Practical, reliable SUVs and cars that make great daily drivers",
        "Fair prices that are listed upfront",
        "Real photos of every vehicle",
        "A simple, quick buying process",
        "Financing available with approved credit"
      ),
      h2("A local business"),
      p("We are part of the Johnston community and serve customers from Des Moines, Urbandale, West Des Moines, Clive, Grimes, Waukee, and Ankeny. Many of our customers find us through friends and family, and we work hard to earn that trust every day. After the sale, we stay in touch to make sure everything is going well with your car."),
      h2("Visit us"),
      p("Iowa Trust Motors LLC\n5421 NW Beaver Dr Unit 2, Johnston, IA 50131\nPhone and text: (515) 809-8051\nEmail: sales@iowatrustmotors.com\nHours: Monday to Saturday, 9am to 5pm. Closed Sunday."),
      p("We look forward to helping you find your next car."),
    ],
  },

  "/how-we-work": {
    title: "How We Work | Iowa Trust Motors, Johnston IA",
    description:
      "See how Iowa Trust Motors selects, repairs, inspects and prices every used car in Johnston, IA — and how easy it is to test drive, finance and buy.",
    h1: "How We Work",
    blocks: [
      p("We want you to understand exactly how your car got to our lot and what happens when you buy it. Here is our process, step by step."),
      h2("Step 1 — We select the vehicle"),
      p("We buy vehicles we believe are worth repairing and that will make reliable daily drivers. We focus on popular, practical models — mostly SUVs and crossovers — that are known for good value and easy ownership."),
      h2("Step 2 — We repair it professionally"),
      p("Every needed repair is completed before the car is listed. We document the work and keep repair details and photos, so you can see what was done."),
      h2("Step 3 — It passes the Iowa state inspection"),
      p("Vehicles with a rebuilt title must pass the Iowa state inspection before they can be titled again and driven on the road. We complete this step before the car is offered for sale."),
      h2("Step 4 — We list it with full details"),
      p("Every listing on our website shows real photos of the actual vehicle, the mileage, the VIN, the title status, and a clear price. No stock photos and no hidden details."),
      h2("Step 5 — You test drive it"),
      p("Call or text (515) 809-8051 to confirm the car is available. In most cases, we can set up a test drive the same day. Take your time, ask questions, and ask to see the repair photos."),
      h2("Step 6 — Financing and paperwork"),
      p("If you need financing, you can apply online in a few minutes through our lending partner, with approved credit. We help you complete the paperwork quickly and clearly."),
      h2("Step 7 — You drive home"),
      p("Bring your driver's license and proof of insurance, and you can drive your car home. Vehicles are sold AS-IS with no dealer warranty, which is why we are fully transparent before you buy. After the sale, we follow up to make sure you are happy with your car."),
      h2("Questions?"),
      p("We are at 5421 NW Beaver Dr Unit 2, Johnston, IA 50131, open Monday to Saturday, 9am to 5pm. Call, text, or email sales@iowatrustmotors.com anytime."),
    ],
  },

  "/areas-we-serve": {
    title: "Areas We Serve | Used Cars Near Des Moines | Iowa Trust Motors",
    description:
      "Iowa Trust Motors in Johnston, IA serves used car buyers from Des Moines, Urbandale, West Des Moines, Clive, Grimes, Waukee, Ankeny and across central Iowa.",
    h1: "Areas We Serve",
    blocks: [
      p("Iowa Trust Motors is located in Johnston, in the northwest part of the Des Moines metro. Our central location makes it easy for drivers from across central Iowa to visit, test drive, and buy."),
      h2("Johnston"),
      p("Our lot is at 5421 NW Beaver Dr Unit 2 in Johnston. If you live or work in Johnston, you are only a few minutes away. Call ahead and stop by on your lunch break or after work."),
      h2("Des Moines"),
      p("We are about 15 minutes north of downtown Des Moines. Many of our customers come from Des Moines for our clear pricing and no-pressure approach. See our page on [used cars near Des Moines](/used-cars-des-moines)."),
      h2("Urbandale"),
      p("Urbandale is right next to Johnston, so a visit takes only a few minutes. See our page on [used cars near Urbandale](/used-cars-urbandale)."),
      h2("West Des Moines and Clive"),
      p("Drivers from West Des Moines and Clive can reach us with a short drive north. See our page on [used cars near West Des Moines](/used-cars-west-des-moines)."),
      h2("Grimes"),
      p("Grimes is just west of Johnston, making us one of the closest used car dealers for Grimes residents."),
      h2("Waukee"),
      p("Waukee families looking for a dependable SUV can reach us in a short drive. See our page on [used cars near Waukee](/used-cars-waukee)."),
      h2("Ankeny"),
      p("Ankeny is a short drive east of Johnston, and many Ankeny buyers shop our SUVs and crossovers."),
      h2("Farther away?"),
      p("We also work with buyers from across Iowa. Every listing has real photos, the mileage, the VIN, the title status, and the price, so you can review the vehicle from home. Call or text (515) 809-8051 and we can send more photos or videos and answer your questions before you make the trip."),
      h2("Visit us"),
      p("Iowa Trust Motors, 5421 NW Beaver Dr Unit 2, Johnston, IA 50131. Open Monday to Saturday, 9am to 5pm. Financing is available with approved credit."),
    ],
  },

  "/faq": {
    title: "Frequently Asked Questions | Iowa Trust Motors",
    description:
      "Answers to common questions about buying a used car at Iowa Trust Motors in Johnston, IA — financing, rebuilt titles, warranties, insurance, test drives and more.",
    h1: "Frequently Asked Questions",
    // Same list as the FAQPage schema, so the visible text and the markup always match.
    blocks: FAQ_ITEMS.flatMap((f) => [h2(f.q), p(f.a)]),
  },
};

export const SEO_PAGE_PATHS = Object.keys(SEO_PAGES);

/** Text of every block, for word counts and tests. */
export const blocksText = (blocks: Block[]): string =>
  blocks.map((b) => ("h2" in b ? b.h2 : "p" in b ? b.p : b.ul.join(" "))).join(" ");
