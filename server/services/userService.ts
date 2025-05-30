import { RegisterData, UpdateSkinProfile } from '@shared/schema';

interface Storage {
  createUser(user: RegisterData): Promise<any>;
  getUser(userId: string): Promise<any>;
  getUserByEmail(email: string): Promise<any>;
  getUserByUsername(username: string): Promise<any>;
  updateSkinProfile(userId: string, profile: UpdateSkinProfile): Promise<any>;
}

export function userServiceFactory(storage: Storage) {
  return {
    async createUser(user: RegisterData) {
      return storage.createUser(user);
    },
    async getUserById(userId: string) {
      return storage.getUser(userId);
    },
    async getUserByEmail(email: string) {
      return storage.getUserByEmail(email);
    },
    async getUserByUsername(username: string) {
      return storage.getUserByUsername(username);
    },
    async updateSkinProfile(userId: string, profile: UpdateSkinProfile) {
      return storage.updateSkinProfile(userId, profile);
    },
  };
} 