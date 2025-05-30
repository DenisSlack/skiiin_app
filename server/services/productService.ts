import { storage } from '../storage';
import { InsertProduct } from '@shared/schema';

interface Storage {
  createProduct(product: InsertProduct): Promise<any>;
  getUserProducts(userId: string): Promise<any[]>;
  getProduct(productId: number): Promise<any>;
  deleteProduct(productId: number, userId: string): Promise<void>;
}

export function productServiceFactory(storage: Storage) {
  return {
    async createProduct(product: InsertProduct) {
      return storage.createProduct(product);
    },
    async getUserProducts(userId: string) {
      return storage.getUserProducts(userId);
    },
    async getProductById(productId: number) {
      return storage.getProduct(productId);
    },
    async updateProduct(productId: number, userId: string, update: Partial<InsertProduct>) {
      throw new Error('Not implemented');
    },
    async deleteProduct(productId: number, userId: string) {
      return storage.deleteProduct(productId, userId);
    },
  };
} 