import CategoryPage from "@/pages/CategoryPage";
import FinancingLink from "@/components/FinancingLink";

const Financing = () => (
  <CategoryPage
    path="/financing"
    primaryAction={
      <FinancingLink className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors">
        Apply for Financing
      </FinancingLink>
    }
  />
);

export default Financing;