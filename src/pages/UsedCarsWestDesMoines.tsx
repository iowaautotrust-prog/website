import CategoryPage from "@/pages/CategoryPage";

const UsedCarsWestDesMoines = () => (
  <CategoryPage
    title="Used Cars Near West Des Moines, IA | Iowa Trust Motors"
    description="Used cars for West Des Moines drivers. A quick trip across the metro to Johnston, IA for inspected vehicles, financing and same-day test drives."
    canonical="/used-cars-west-des-moines"
    compact
    heading="Used Cars Near West Des Moines, IA"
    filter={(v) => v.status !== "sold"}
    emptyMessage="Check back soon — or browse our full inventory for what's available today."
  >
    <p className="text-body">
      Coming from West Des Moines? We're in Johnston — use the directions link below for the best
      route from your address. Call or text (515) 809-8051 and we'll have the car ready for a
      same-day test drive.
    </p>
  </CategoryPage>
);

export default UsedCarsWestDesMoines;
