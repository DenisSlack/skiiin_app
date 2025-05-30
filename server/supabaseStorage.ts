import { supabase, handleSupabaseError } from './supabase';
import type {
  User,
  UpsertUser,
  Product,
  InsertProduct,
  Analysis,
  InsertAnalysis,
  Ingredient,
  InsertIngredient,
  UpdateSkinProfile,
  RegisterData,
  SmsCode,
  InsertSmsCode
} from '@shared/schema';
import type { IStorage } from './storage';

export class SupabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        handleSupabaseError(error);
      }
      
      return data || undefined;
    } catch (error) {
      console.error('Error getting user:', error);
      return undefined;
    }
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('username', username)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        handleSupabaseError(error);
      }
      
      return data || undefined;
    } catch (error) {
      console.error('Error getting user by username:', error);
      return undefined;
    }
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        handleSupabaseError(error);
      }
      
      return data || undefined;
    } catch (error) {
      console.error('Error getting user by email:', error);
      return undefined;
    }
  }

  async getUserByPhone(phone: string): Promise<User | undefined> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('phone', phone)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        handleSupabaseError(error);
      }
      
      return data || undefined;
    } catch (error) {
      console.error('Error getting user by phone:', error);
      return undefined;
    }
  }

  async createUser(userData: RegisterData): Promise<User> {
    try {
      const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const { data, error } = await supabase
        .from('users')
        .insert({
          id: userId,
          username: userData.username,
          password: userData.password,
          email: userData.email,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        handleSupabaseError(error);
      }

      return data;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  async createUserWithPhone(phone: string): Promise<User> {
    try {
      const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const { data, error } = await supabase
        .from('users')
        .insert({
          id: userId,
          username: `user_${Date.now()}`,
          password: 'temp_password',
          phone,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        handleSupabaseError(error);
      }

      return data;
    } catch (error) {
      console.error('Error creating user with phone:', error);
      throw error;
    }
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    try {
      const { data, error } = await supabase
        .from('users')
        .upsert({
          ...userData,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        handleSupabaseError(error);
      }

      return data;
    } catch (error) {
      console.error('Error upserting user:', error);
      throw error;
    }
  }

  async updateSkinProfile(userId: string, profile: UpdateSkinProfile): Promise<User> {
    try {
      const { data, error } = await supabase
        .from('users')
        .update({
          gender: profile.gender,
          age: profile.age,
          skin_type: profile.skinType,
          skin_concerns: profile.skinConcerns,
          allergies: profile.allergies,
          preferences: profile.preferences,
          profile_completed: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        handleSupabaseError(error);
      }

      return data;
    } catch (error) {
      console.error('Error updating skin profile:', error);
      throw error;
    }
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    try {
      const { data, error } = await supabase
        .from('products')
        .insert({
          ...product,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        handleSupabaseError(error);
      }

      return data;
    } catch (error) {
      console.error('Error creating product:', error);
      throw error;
    }
  }

  async getUserProducts(userId: string): Promise<Product[]> {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        handleSupabaseError(error);
      }

      return data || [];
    } catch (error) {
      console.error('Error getting user products:', error);
      return [];
    }
  }

  async getProduct(id: number): Promise<Product | undefined> {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single();

      if (error && error.code !== 'PGRST116') {
        handleSupabaseError(error);
      }

      return data || undefined;
    } catch (error) {
      console.error('Error getting product:', error);
      return undefined;
    }
  }

  async deleteProduct(id: number, userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);

      if (error) {
        handleSupabaseError(error);
      }
    } catch (error) {
      console.error('Error deleting product:', error);
      throw error;
    }
  }

  async createAnalysis(analysis: InsertAnalysis): Promise<Analysis> {
    try {
      const { data, error } = await supabase
        .from('analyses')
        .insert({
          ...analysis,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        handleSupabaseError(error);
      }

      return data;
    } catch (error) {
      console.error('Error creating analysis:', error);
      throw error;
    }
  }

  async getProductAnalyses(productId: number): Promise<Analysis[]> {
    try {
      const { data, error } = await supabase
        .from('analyses')
        .select('*')
        .eq('product_id', productId)
        .order('created_at', { ascending: false });

      if (error) {
        handleSupabaseError(error);
      }

      return data || [];
    } catch (error) {
      console.error('Error getting product analyses:', error);
      return [];
    }
  }

  async getUserAnalyses(userId: string): Promise<Analysis[]> {
    try {
      const { data, error } = await supabase
        .from('analyses')
        .select(`
          *,
          products!inner(user_id)
        `)
        .eq('products.user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        handleSupabaseError(error);
      }

      return data || [];
    } catch (error) {
      console.error('Error getting user analyses:', error);
      return [];
    }
  }

  async getIngredient(name: string): Promise<Ingredient | undefined> {
    try {
      const { data, error } = await supabase
        .from('ingredients')
        .select('*')
        .eq('name', name)
        .single();

      if (error && error.code !== 'PGRST116') {
        handleSupabaseError(error);
      }

      return data || undefined;
    } catch (error) {
      console.error('Error getting ingredient:', error);
      return undefined;
    }
  }

  async createIngredient(ingredient: InsertIngredient): Promise<Ingredient> {
    try {
      const { data, error } = await supabase
        .from('ingredients')
        .insert({
          ...ingredient,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        handleSupabaseError(error);
      }

      return data;
    } catch (error) {
      console.error('Error creating ingredient:', error);
      throw error;
    }
  }

  async searchIngredients(query: string): Promise<Ingredient[]> {
    try {
      const { data, error } = await supabase
        .from('ingredients')
        .select('*')
        .ilike('name', `%${query}%`)
        .order('name');

      if (error) {
        handleSupabaseError(error);
      }

      return data || [];
    } catch (error) {
      console.error('Error searching ingredients:', error);
      return [];
    }
  }

  async createSmsCode(smsCode: InsertSmsCode): Promise<SmsCode> {
    try {
      const { data, error } = await supabase
        .from('sms_codes')
        .insert({
          ...smsCode,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        handleSupabaseError(error);
      }

      return data;
    } catch (error) {
      console.error('Error creating SMS code:', error);
      throw error;
    }
  }

  async getValidSmsCode(phone: string, code: string): Promise<SmsCode | undefined> {
    try {
      const { data, error } = await supabase
        .from('sms_codes')
        .select('*')
        .eq('phone', phone)
        .eq('code', code)
        .eq('verified', false)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        handleSupabaseError(error);
      }

      return data || undefined;
    } catch (error) {
      console.error('Error getting valid SMS code:', error);
      return undefined;
    }
  }

  async markSmsCodeAsVerified(id: number): Promise<void> {
    try {
      const { error } = await supabase
        .from('sms_codes')
        .update({ verified: true })
        .eq('id', id);

      if (error) {
        handleSupabaseError(error);
      }
    } catch (error) {
      console.error('Error marking SMS code as verified:', error);
      throw error;
    }
  }

  async cleanupExpiredSmsCodes(): Promise<void> {
    try {
      const { error } = await supabase
        .from('sms_codes')
        .delete()
        .lt('expires_at', new Date().toISOString());

      if (error) {
        handleSupabaseError(error);
      }
    } catch (error) {
      console.error('Error cleaning up expired SMS codes:', error);
    }
  }
}