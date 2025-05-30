// Field mapping utilities for Supabase snake_case to camelCase conversion

export function mapUserToSupabase(user: any): any {
  const mapped: any = {};
  
  if (user.id !== undefined) mapped.id = user.id;
  if (user.username !== undefined) mapped.username = user.username;
  if (user.password !== undefined) mapped.password = user.password;
  if (user.email !== undefined) mapped.email = user.email;
  if (user.phone !== undefined) mapped.phone = user.phone;
  if (user.firstName !== undefined) mapped.first_name = user.firstName;
  if (user.lastName !== undefined) mapped.last_name = user.lastName;
  if (user.profileImageUrl !== undefined) mapped.profile_image_url = user.profileImageUrl;
  if (user.gender !== undefined) mapped.gender = user.gender;
  if (user.age !== undefined) mapped.age = user.age;
  if (user.skinType !== undefined) mapped.skin_type = user.skinType;
  if (user.skinConcerns !== undefined) mapped.skin_concerns = user.skinConcerns;
  if (user.allergies !== undefined) mapped.allergies = user.allergies;
  if (user.preferences !== undefined) mapped.preferences = user.preferences;
  if (user.profileCompleted !== undefined) mapped.profile_completed = user.profileCompleted;
  if (user.createdAt !== undefined) mapped.created_at = user.createdAt;
  if (user.updatedAt !== undefined) mapped.updated_at = user.updatedAt;
  
  return mapped;
}

export function mapProductToSupabase(product: any): any {
  const mapped: any = {};
  
  if (product.userId !== undefined) mapped.user_id = product.userId;
  if (product.name !== undefined) mapped.name = product.name;
  if (product.brand !== undefined) mapped.brand = product.brand;
  if (product.category !== undefined) mapped.category = product.category;
  if (product.ingredients !== undefined) mapped.ingredients = product.ingredients;
  if (product.imageUrl !== undefined) mapped.image_url = product.imageUrl;
  if (product.imageData !== undefined) mapped.image_data = product.imageData;
  if (product.compatibilityScore !== undefined) mapped.compatibility_score = product.compatibilityScore;
  if (product.compatibilityRating !== undefined) mapped.compatibility_rating = product.compatibilityRating;
  if (product.createdAt !== undefined) mapped.created_at = product.createdAt;
  
  return mapped;
}

export function mapAnalysisToSupabase(analysis: any): any {
  const mapped: any = {};
  
  if (analysis.productId !== undefined) mapped.product_id = analysis.productId;
  if (analysis.compatibilityScore !== undefined) mapped.compatibility_score = analysis.compatibilityScore;
  if (analysis.compatibilityRating !== undefined) mapped.compatibility_rating = analysis.compatibilityRating;
  if (analysis.analysisData !== undefined) mapped.analysis_data = analysis.analysisData;
  if (analysis.createdAt !== undefined) mapped.created_at = analysis.createdAt;
  
  return mapped;
}

export function mapSmsCodeToSupabase(smsCode: any): any {
  const mapped: any = {};
  
  if (smsCode.phone !== undefined) mapped.phone = smsCode.phone;
  if (smsCode.code !== undefined) mapped.code = smsCode.code;
  if (smsCode.expiresAt !== undefined) mapped.expires_at = smsCode.expiresAt;
  if (smsCode.verified !== undefined) mapped.verified = smsCode.verified;
  if (smsCode.createdAt !== undefined) mapped.created_at = smsCode.createdAt;
  
  return mapped;
}

export function mapIngredientToSupabase(ingredient: any): any {
  const mapped: any = {};
  
  if (ingredient.name !== undefined) mapped.name = ingredient.name;
  if (ingredient.purpose !== undefined) mapped.purpose = ingredient.purpose;
  if (ingredient.benefits !== undefined) mapped.benefits = ingredient.benefits;
  if (ingredient.concerns !== undefined) mapped.concerns = ingredient.concerns;
  if (ingredient.safetyRating !== undefined) mapped.safety_rating = ingredient.safetyRating;
  if (ingredient.createdAt !== undefined) mapped.created_at = ingredient.createdAt;
  
  return mapped;
}