import { findProductIngredients } from '../perplexity';

describe('findProductIngredients', () => {
  it('should return ingredients for a known product', async () => {
    if (!process.env.PERPLEXITY_API_KEY) {
      console.warn('PERPLEXITY_API_KEY не установлен, тест пропущен');
      return;
    }
    const result = await findProductIngredients('La Roche-Posay Effaclar Duo');
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(10);
  });

  it('should return empty string for unknown product', async () => {
    if (!process.env.PERPLEXITY_API_KEY) {
      console.warn('PERPLEXITY_API_KEY не установлен, тест пропущен');
      return;
    }
    const result = await findProductIngredients('Nonexistent Product 12345');
    expect(result).toBe('');
  });
}); 