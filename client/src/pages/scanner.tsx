import AppHeader from "@/components/layout/app-header";
import BottomNavigation from "@/components/layout/bottom-navigation";
import ProductAnalyzer from "@/components/scanner/product-analyzer";

export default function Scanner() {
  return (
    <div className="app-container">
      <AppHeader />
      <div className="content-area pb-20">
        <ProductAnalyzer />
      </div>
      <BottomNavigation />
    </div>
  );
}