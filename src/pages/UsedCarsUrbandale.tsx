import CategoryPage from "@/pages/CategoryPage";

const UsedCarsUrbandale = () => (
  <CategoryPage
    title="Used Cars Near Urbandale, IA | Iowa Trust Motors"
    description="Used cars for Urbandale drivers, just next door to Johnston, IA. Inspected vehicles, financing and same-day test drives at Iowa Trust Motors."
    canonical="/used-cars-urbandale"
    heading="Used Cars Near Urbandale, IA"
    filter={(v) => v.status !== "sold"}
    emptyMessage="Check back soon — or browse our full inventory for what's available today."
  >
    <p className="text-body">
      Urbandale is right next to Johnston, so it's a short drive over. Call or text (515) 809-8051
      before you come and we'll have the car ready.
    </p>
  </CategoryPage>
);

export default UsedCarsUrbandale;
