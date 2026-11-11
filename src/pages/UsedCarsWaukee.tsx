import CategoryPage from "@/pages/CategoryPage";

const UsedCarsWaukee = () => (
  <CategoryPage
    title="Used Cars Near Waukee, IA | Iowa Trust Motors"
    description="Used cars for Waukee drivers. Inspected vehicles, financing and same-day test drives at Iowa Trust Motors in Johnston, IA."
    canonical="/used-cars-waukee"
    heading="Used Cars Near Waukee, IA"
    filter={(v) => v.status !== "sold"}
    emptyMessage="Check back soon — or browse our full inventory for what's available today."
  >
    <p className="text-body">
      Driving over from Waukee? Every listing shows real photos, mileage, VIN, title status and
      price, so you can check the car online first. Call or text (515) 809-8051 to set up a
      same-day test drive.
    </p>
  </CategoryPage>
);

export default UsedCarsWaukee;
