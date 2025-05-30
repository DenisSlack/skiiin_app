import { InsertAnalysis } from '@shared/schema';

interface Storage {
  createAnalysis(analysis: InsertAnalysis): Promise<any>;
  getUserAnalyses(userId: string): Promise<any[]>;
  getProductAnalyses(productId: number): Promise<any[]>;
}

export function analysisServiceFactory(
  storage: Storage,
  analyzeIngredientsWithPerplexity: (ingredients: string, productName: string, skinProfile?: any) => Promise<any>
) {
  return {
    async analyzeIngredients(ingredientList: string[], productName: string, skinProfile?: any) {
      const ingredientsStr = Array.isArray(ingredientList) ? ingredientList.join(', ') : String(ingredientList);
      return analyzeIngredientsWithPerplexity(ingredientsStr, productName, skinProfile);
    },
    async createAnalysis(analysis: InsertAnalysis) {
      return storage.createAnalysis(analysis);
    },
    async getUserAnalyses(userId: string) {
      return storage.getUserAnalyses(userId);
    },
    async getProductAnalyses(productId: number) {
      return storage.getProductAnalyses(productId);
    },
  };
} 