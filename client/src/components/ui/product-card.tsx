import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface ProductCardProps {
  product: any;
  onClick?: () => void;
}

export default function ProductCard({ product, onClick }: ProductCardProps) {
  const getCompatibilityColor = (rating: string) => {
    switch (rating) {
      case "excellent": return "bg-green-500";
      case "good": return "bg-blue-500";
      case "caution": return "bg-yellow-500";
      case "avoid": return "bg-red-500";
      default: return "bg-gray-400";
    }
  };

  const getCompatibilityLabel = (rating: string) => {
    switch (rating) {
      case "excellent": return "Excellent Match";
      case "good": return "Good Match";
      case "caution": return "Use with Caution";
      case "avoid": return "Avoid";
      default: return "Not Analyzed";
    }
  };

  const formattedDate = product.scannedAt 
    ? formatDistanceToNow(new Date(product.scannedAt), { addSuffix: true })
    : "";

  return (
    <Card className="border-gray-200 hover:shadow-md transition-shadow cursor-pointer" onClick={onClick}>
      <CardContent className="p-4">
        <div className="flex items-start space-x-3">
          <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
            {product.imageUrl ? (
              <img 
                src={product.imageUrl} 
                alt={product.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="text-gray-400 text-xs text-center">No Image</div>
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-sm truncate">{product.name}</h4>
            {product.brand && (
              <p className="text-xs text-gray-500 truncate">{product.brand}</p>
            )}
            
            <div className="flex items-center space-x-2 mt-1">
              <div className="flex items-center space-x-1">
                <div className={`w-2 h-2 rounded-full ${getCompatibilityColor(product.compatibilityRating)}`}></div>
                <span className="text-xs font-medium text-gray-700">
                  {getCompatibilityLabel(product.compatibilityRating)}
                </span>
              </div>
              {formattedDate && (
                <>
                  <span className="text-xs text-gray-400">•</span>
                  <span className="text-xs text-gray-400">{formattedDate}</span>
                </>
              )}
            </div>
          </div>
          
          <Button variant="ghost" size="sm" className="p-1 flex-shrink-0">
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
