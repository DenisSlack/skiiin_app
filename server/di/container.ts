import { storage } from '../storage';
import { analyzeIngredientsWithPerplexity } from '../perplexity';
import { productServiceFactory } from '../services/productService';
import { analysisServiceFactory } from '../services/analysisService';
import { userServiceFactory } from '../services/userService';

export const container = {
  productService: productServiceFactory(storage),
  analysisService: analysisServiceFactory(storage, analyzeIngredientsWithPerplexity),
  userService: userServiceFactory(storage),
}; 