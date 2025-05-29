import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import AppHeader from "@/components/layout/app-header";
import BottomNavigation from "@/components/layout/bottom-navigation";
import ProductCard from "@/components/ui/product-card";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, Star, AlertCircle, Plus } from "lucide-react";

export default function Library() {
  const [, setLocation] = useLocation();

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["/api/products"],
  });

  // Filter products by compatibility rating
  const excellentProducts = products.filter((p: any) => p.compatibilityRating === "excellent");
  const goodProducts = products.filter((p: any) => p.compatibilityRating === "good");
  const cautionProducts = products.filter((p: any) => p.compatibilityRating === "caution");
  const avoidProducts = products.filter((p: any) => p.compatibilityRating === "avoid");

  if (isLoading) {
    return (
      <div className="app-container">
        <AppHeader />
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center space-y-4">
            <div className="w-8 h-8 animate-spin mx-auto border-2 border-primary border-t-transparent rounded-full" />
            <p className="text-gray-600">Loading your library...</p>
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
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <BookOpen className="w-6 h-6 text-primary" />
            <h2 className="text-xl font-semibold">My Library</h2>
          </div>
          <Button
            size="sm"
            onClick={() => setLocation("/scanner")}
            className="app-gradient text-white"
          >
            <Plus className="w-4 h-4 mr-1" />
            Add Product
          </Button>
        </div>

        {products.length === 0 ? (
          /* Empty State */
          <Card className="border-gray-200">
            <CardContent className="p-8 text-center space-y-4">
              <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto flex items-center justify-center">
                <BookOpen className="w-8 h-8 text-gray-400" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">No products yet</h3>
                <p className="text-gray-600 text-sm">Start by scanning your first product to build your personalized library</p>
              </div>
              <Button
                onClick={() => setLocation("/scanner")}
                className="app-gradient text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Scan Your First Product
              </Button>
            </CardContent>
          </Card>
        ) : (
          /* Product Tabs */
          <Tabs defaultValue="all" className="space-y-4">
            <TabsList className="grid grid-cols-4 w-full">
              <TabsTrigger value="all" className="text-xs">All ({products.length})</TabsTrigger>
              <TabsTrigger value="excellent" className="text-xs">
                <Star className="w-3 h-3 mr-1" />
                {excellentProducts.length}
              </TabsTrigger>
              <TabsTrigger value="good" className="text-xs">Good ({goodProducts.length})</TabsTrigger>
              <TabsTrigger value="caution" className="text-xs">
                <AlertCircle className="w-3 h-3 mr-1" />
                {cautionProducts.length + avoidProducts.length}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-3">
              {products.map((product: any) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onClick={() => setLocation(`/analysis/${product.id}`)}
                />
              ))}
            </TabsContent>

            <TabsContent value="excellent" className="space-y-3">
              {excellentProducts.length > 0 ? (
                excellentProducts.map((product: any) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onClick={() => setLocation(`/analysis/${product.id}`)}
                  />
                ))
              ) : (
                <Card className="border-gray-200">
                  <CardContent className="p-6 text-center">
                    <p className="text-gray-600">No excellent matches yet. Keep scanning to find your perfect products!</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="good" className="space-y-3">
              {goodProducts.length > 0 ? (
                goodProducts.map((product: any) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onClick={() => setLocation(`/analysis/${product.id}`)}
                  />
                ))
              ) : (
                <Card className="border-gray-200">
                  <CardContent className="p-6 text-center">
                    <p className="text-gray-600">No good matches found yet.</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="caution" className="space-y-3">
              {[...cautionProducts, ...avoidProducts].length > 0 ? (
                [...cautionProducts, ...avoidProducts].map((product: any) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onClick={() => setLocation(`/analysis/${product.id}`)}
                  />
                ))
              ) : (
                <Card className="border-gray-200">
                  <CardContent className="p-6 text-center">
                    <p className="text-gray-600">Great! No problematic products in your library.</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        )}
      </main>

      <BottomNavigation />
    </div>
  );
}
