import { FOOD_ROWS } from './foods-data.js';

export const FOODS = FOOD_ROWS.map(([name, servingLabel, servingGrams, kcal, p, c, f], i) => ({
  id: `builtin-${i}`, name, brand: null, servingLabel, servingGrams, kcal, p, c, f, source: 'builtIn',
}));

export const POPULAR = ['Banana', 'Egg (large, boiled)', 'Chicken breast (grilled)', 'White rice (cooked)',
  'Greek yogurt (plain, nonfat)', 'Avocado', 'Oatmeal (cooked with water)', 'Almonds']
  .map((n) => FOODS.find((f) => f.name === n)).filter(Boolean);

/** Prefix matches first, then word-start matches, then substring matches. */
export function searchLocal(query, list = FOODS, limit = 25) {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const terms = q.split(/\s+/);
  return list
    .map((item) => {
      const name = item.name.toLowerCase();
      if (!terms.every((t) => name.includes(t))) return null;
      let score = 2;
      if (name.startsWith(q)) score = 0;
      else if (name.split(/[^a-z]+/).some((w) => w.startsWith(terms[0]))) score = 1;
      return { item, score };
    })
    .filter(Boolean)
    .sort((a, b) => a.score - b.score || a.item.name.length - b.item.name.length)
    .slice(0, limit)
    .map((x) => x.item);
}
