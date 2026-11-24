// Which cars each landing page lists. Pure functions so the React pages and the edge function that
// writes the server-rendered HTML pick exactly the same cars.

export interface FilterableVehicle {
  status?: string | null;
  type?: string | null;
  title_status?: string | null;
  price?: number | null;
}

const notSold = (v: FilterableVehicle) => v.status !== "sold";

export const CATEGORY_FILTERS: Record<string, (v: FilterableVehicle) => boolean> = {
  "/financing": notSold,
  "/used-suvs": (v) => v.type === "SUV",
  "/used-cars-under-10000": (v) => typeof v.price === "number" && v.price > 0 && v.price < 10000,
  "/rebuilt-title-cars": (v) => (v.title_status ?? "").toLowerCase() === "rebuilt",
  "/used-cars-des-moines": notSold,
  "/used-cars-west-des-moines": notSold,
  "/used-cars-waukee": notSold,
  "/used-cars-urbandale": notSold,
};
