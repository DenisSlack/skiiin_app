import { useQuery } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import AppHeader from "@/components/layout/app-header";
import BottomNavigation from "@/components/layout/bottom-navigation";
import ProductAnalysis from "@/components/analysis/product-analysis";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";

export default function Analysis() {
  const [, params] = useRoute("/analysis/:id");
  const [, setLocation] = useLocation();
  const productId = params?.id;

  const { data: product, isLoading: productLoading } = useQuery({
    queryKey: [`/api/products/${productId}`],
    enabled: !!productId,
  });

  const { data: analyses = [], isLoading: analysesLoading } = useQuery({
    queryKey: ["/api/analysis/user"],
  });

  const isLoading = productLoading || analysesLoading;

  // Find the latest analysis for this product
  const latestAnalysis = analyses.find((analysis: any) => 
    analysis.productId === parseInt(productId || "0")
  );

  if (isLoading) {
    return (
      <div className="app-container">
        <AppHeader />
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center space-y-4">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
            <p className="text-gray-600">Loading analysis...</p>
          </div>
        </div>
        <BottomNavigation />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="app-container">
        <AppHeader />
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center space-y-4">
            <p className="text-gray-600">Product not found</p>
            <Button onClick={() => setLocation("/")}>
              Go Home
            </Button>
          </div>
        </div>
        <BottomNavigation />
      </div>
    );
  }

  return (
    <div className="app-container">
      <AppHeader />
      
      <main className="pb-20 px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-3">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setLocation("/")}
            className="p-2"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h2 className="text-xl font-semibold">Analysis Results</h2>
        </div>

        {/* Product Analysis */}
        <ProductAnalysis 
          product={product} 
          analysis={latestAnalysis}
        />
      </main>

      <BottomNavigation />
    </div>
  );
}
