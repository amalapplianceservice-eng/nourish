// App state, persisted to localStorage on this device.
import { useState, useEffect } from '../vendor/preact-htm.js';

const KEY = 'nourish.v1';

export const MEALS = [
  { id: 'breakfast', title: 'Breakfast', emoji: '🌅', tint: '#FF9E42' },
  { id: 'lunch', title: 'Lunch', emoji: '☀️', tint: '#F5B921' },
  { id: 'dinner', title: 'Dinner', emoji: '🌙', tint: '#7378F2' },
  { id: 'snacks', title: 'Snacks', emoji: '🍎', tint: '#F26B8C' },
];
export const mealById = (id) => MEALS.find((m) => m.id === id) || MEALS[3];

export function suggestedMeal(date = new Date()) {
  const h = date.getHours();
  if (h >= 4 && h < 11) return 'breakfast';
  if (h >= 11 && h < 16) return 'lunch';
  if (h >= 16 && h < 22) return 'dinner';
  return 'snacks';
}

const usesMetricByDefault = () => !/^en-(US|LR)|^my/.test(navigator.language || 'en-US');

const defaults = () => ({
  onboarded: false,
  goals: { calories: 2000, protein: 140, carbs: 220, fat: 65 },
  profile: { sex: 'female', age: 30, heightCm: 170, weightKg: 70, activity: 'light', goal: 'maintain', metric: usesMetricByDefault() },
  settings: { anthropicKey: '', usdaKey: '' },
  entries: [],
  customFoods: [],
});

function load() {
  const d = defaults();
  try {
    const s = JSON.parse(localStorage.getItem(KEY));
    if (s && typeof s === 'object') {
      return { ...d, ...s, goals: { ...d.goals, ...s.goals }, profile: { ...d.profile, ...s.profile }, settings: { ...d.settings, ...s.settings } };
    }
  } catch { /* corrupted or blocked storage: start fresh */ }
  return d;
}

let state = load();
const listeners = new Set();

function persist() {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { console.warn('Could not save', e); }
}

export const getState = () => state;

export function setState(patch) {
  const next = typeof patch === 'function' ? patch(state) : patch;
  state = { ...state, ...next };
  persist();
  listeners.forEach((l) => l(state));
}

export function useStore() {
  const [s, set] = useState(state);
  useEffect(() => {
    const l = (n) => set(n);
    listeners.add(l);
    set(state);
    return () => listeners.delete(l);
  }, []);
  return s;
}

// Ask the browser not to evict our storage.
navigator.storage?.persist?.().catch(() => {});

// ---------- Dates ----------
export const uid = () => (crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2) + Date.now().toString(36));
export const dayKey = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
export const parseDay = (k) => { const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d); };
export const addDays = (k, n) => { const d = parseDay(k); d.setDate(d.getDate() + n); return dayKey(d); };
export const todayKey = () => dayKey();

// ---------- Nutrition helpers ----------
export const ZERO = { kcal: 0, p: 0, c: 0, f: 0 };
export const scale = (n, k) => ({ kcal: n.kcal * k, p: n.p * k, c: n.c * k, f: n.f * k });
export const sum = (list) => list.reduce((a, n) => ({ kcal: a.kcal + n.kcal, p: a.p + n.p, c: a.c + n.c, f: a.f + n.f }), { ...ZERO });
export const entryNutrition = (e) => scale(e, e.servings);

export const entryAsItem = (e) => ({
  id: `recent-${e.name}-${e.servingLabel}`, name: e.name, brand: e.brand, servingLabel: e.servingLabel,
  servingGrams: e.servingGrams, kcal: e.kcal, p: e.p, c: e.c, f: e.f, source: e.source,
});

export function amountLabel(e) {
  if (e.inGrams && e.servingGrams) return `${fmt(e.servings * e.servingGrams, 0)} ${unitOf(e.servingLabel)}`;
  if (e.servings === 1) return e.servingLabel;
  return `${fmt(e.servings, 2)} × ${e.servingLabel}`;
}

export const unitOf = (label = '') => (/\bml\b/i.test(label) ? 'ml' : 'g');

export function fmt(n, digits = 1) {
  if (!isFinite(n)) return '0';
  const f = 10 ** digits;
  return String(Math.round(n * f) / f);
}
export const kcal = (n) => String(Math.round(n || 0));
export const grams = (n) => (n < 10 ? fmt(n, 1) : String(Math.round(n)));

// ---------- Actions ----------
export function addEntry(item, { servings = 1, inGrams = false, meal, day }) {
  const entry = {
    id: uid(), name: item.name, brand: item.brand || null, servingLabel: item.servingLabel,
    servingGrams: item.servingGrams || null, servings, inGrams,
    kcal: item.kcal, p: item.p, c: item.c, f: item.f,
    meal, day, createdAt: Date.now(), source: item.source || 'custom',
  };
  setState((s) => ({ entries: [...s.entries, entry] }));
  return entry;
}

export const updateEntry = (id, patch) => setState((s) => ({ entries: s.entries.map((e) => (e.id === id ? { ...e, ...patch } : e)) }));
export const deleteEntry = (id) => setState((s) => ({ entries: s.entries.filter((e) => e.id !== id) }));

export function addCustomFood(food) {
  const f = { id: `custom-${uid()}`, source: 'custom', createdAt: Date.now(), ...food };
  setState((s) => ({ customFoods: [f, ...s.customFoods] }));
  return f;
}
export const deleteCustomFood = (id) => setState((s) => ({ customFoods: s.customFoods.filter((f) => f.id !== id) }));

export const SOURCES = {
  builtIn: { label: 'Nourish database', icon: 'leaf' },
  usda: { label: 'USDA FoodData Central', icon: 'globe' },
  custom: { label: 'My food', icon: 'user' },
  ai: { label: 'AI estimate', icon: 'sparkles' },
};
