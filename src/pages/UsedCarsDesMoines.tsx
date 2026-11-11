import CategoryPage from "@/pages/CategoryPage";

const UsedCarsDesMoines = () => (
  <CategoryPage
    title="Used Cars Near Des Moines, IA | Iowa Trust Motors"
    description="Used cars for Des Moines drivers, 15 minutes away in Johnston. Inspected vehicles, financing, same-day test drives."
    canonical="/used-cars-des-moines"
    compact
    heading="Used Cars Near Des Moines, IA"
    filter={(v) => v.status !== "sold"}
    emptyMessage="Check back soon — or browse our full inventory for what's available today."
  >
    <p className="text-body">
      We're about 15 minutes north of Des Moines in Johnston. Every listing shows real photos,
      mileage, VIN, title status and price. Call or text (515) 809-8051 to arrange a same-day test
      drive.
    </p>
  </CategoryPage>
);

export default UsedCarsDesMoines;
