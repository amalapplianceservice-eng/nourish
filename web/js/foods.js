import { FOOD_ROWS } from './foods-data.js';
import { NAMES, SERVINGS, UNITS } from './foods-i18n.js';
import { lang } from './i18n.js';

const LANG_INDEX = { ru: 0, es: 1, zh: 2 };

/** Translate a built-in serving label like "1 cup (158 g)". */
export function localizeServing(label, l = lang()) {
  const i = LANG_INDEX[l];
  if (i === undefined) return label;
  const m = label.match(/^(.*?)(?:\s*\(([\d.]+)\s*(g|ml)\))?$/);
  const phrase = SERVINGS[m[1]]?.[i] ?? m[1];
  return m[2] ? `${phrase} (${m[2]} ${UNITS[m[3]][i]})` : phrase;
}

const BASE = FOOD_ROWS.map(([name, servingLabel, servingGrams, kcal, p, c, f], i) => ({
  id: `builtin-${i}`, name, en: name, servingEn: servingLabel, brand: null, servingLabel, servingGrams, kcal, p, c, f, source: 'builtIn',
}));

const cache = {};
/** Built-in foods in the current language (English name kept in `en` so search matches both). */
export function getFoods() {
  const l = lang();
  if (!cache[l]) {
    const i = LANG_INDEX[l];
    cache[l] = i === undefined ? BASE : BASE.map((f) => ({
      ...f, name: NAMES[f.en]?.[i] ?? f.en, servingLabel: localizeServing(f.servingLabel, l),
    }));
  }
  return cache[l];
}

/** Show a built-in food (or a diary entry logged from one) in the current language. */
export function localizeItem(x) {
  if (!x?.en) return x;
  const i = LANG_INDEX[lang()];
  return {
    ...x,
    name: i === undefined ? x.en : (NAMES[x.en]?.[i] ?? x.en),
    servingLabel: x.servingEn ? localizeServing(x.servingEn) : x.servingLabel,
  };
}

const POPULAR_NAMES = ['Banana', 'Egg (large, boiled)', 'Chicken breast (grilled)', 'White rice (cooked)',
  'Greek yogurt (plain, nonfat)', 'Avocado', 'Oatmeal (cooked with water)', 'Almonds'];
export const getPopular = () => POPULAR_NAMES.map((n) => getFoods().find((f) => f.en === n)).filter(Boolean);

/** Prefix matches first, then word-start matches, then substring matches. Searches local and English names. */
export function searchLocal(query, list = getFoods(), limit = 25) {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const terms = q.split(/\s+/);
  return list
    .map((item) => {
      const names = [item.name, item.en].filter(Boolean).map((n) => n.toLowerCase());
      let best = null;
      for (const name of names) {
        if (!terms.every((t) => name.includes(t))) continue;
        let score = 2;
        if (name.startsWith(q)) score = 0;
        else if (name.split(/[^\p{L}\p{N}]+/u).some((w) => w.startsWith(terms[0]))) score = 1;
        best = best === null ? score : Math.min(best, score);
      }
      return best === null ? null : { item, score: best };
    })
    .filter(Boolean)
    .sort((a, b) => a.score - b.score || a.item.name.length - b.item.name.length)
    .slice(0, limit)
    .map((x) => x.item);
}
