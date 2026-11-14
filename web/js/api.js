// Network services: USDA FoodData Central search and Claude meal estimation.

// ---------- USDA FoodData Central ----------
// ~400k branded US products plus generic foods. DEMO_KEY works out of the box (rate-limited);
// a free personal key from api.data.gov raises the limit.

const sentenceCase = (s) => {
  if (!s) return s;
  const t = s === s.toUpperCase() ? s.toLowerCase() : s;
  return t.charAt(0).toUpperCase() + t.slice(1);
};
const titleCase = (s) => (s && s === s.toUpperCase() ? s.toLowerCase().replace(/\b\w/g, (m) => m.toUpperCase()) : s);
const r1 = (n) => Math.round(n * 10) / 10;

function mapUSDA(f) {
  const n = (id) => f.foodNutrients?.find((x) => x.nutrientId === id)?.value;
  let kcal100 = n(1008) ?? n(2047) ?? n(2048);
  if (kcal100 == null && n(1062) != null) kcal100 = n(1062) / 4.184;
  if (kcal100 == null || kcal100 < 0 || kcal100 > 950) return null;

  let grams = 100;
  let label = '100 g';
  const unit = (f.servingSizeUnit || '').toLowerCase();
  if (f.dataType === 'Branded' && f.servingSize > 0 && f.servingSize < 2000 && /^(g|grm|ml|mlt)$/.test(unit)) {
    grams = f.servingSize;
    const u = unit.startsWith('m') ? 'ml' : 'g';
    const household = f.householdServingFullText?.trim();
    label = household ? `${household} (${r1(grams)} ${u})` : `${r1(grams)} ${u}`;
  }
  const k = grams / 100;
  // Generic USDA entries often end with the brand in caps: "Yogurt, Greek, plain, CHOBANI".
  let desc = (f.description || 'Food').trim();
  let brand = f.brandName || f.brandOwner || null;
  const trailing = desc.match(/,\s*([A-Z][A-Z0-9'&.\- ]{2,})$/);
  if (trailing && desc !== desc.toUpperCase()) {
    brand = brand || trailing[1];
    desc = desc.slice(0, trailing.index);
  }
  return {
    id: `usda-${f.fdcId}`,
    name: sentenceCase(desc),
    brand: titleCase(brand) || null,
    servingLabel: label,
    servingGrams: grams,
    kcal: kcal100 * k,
    p: (n(1003) ?? 0) * k,
    c: (n(1005) ?? 0) * k,
    f: (n(1004) ?? 0) * k,
    source: 'usda',
  };
}

export async function searchUSDA(query, apiKey, signal) {
  const url = new URL('https://api.nal.usda.gov/fdc/v1/foods/search');
  url.searchParams.set('query', query);
  url.searchParams.set('pageSize', '30');
  url.searchParams.set('dataType', 'Branded,Foundation,SR Legacy,Survey (FNDDS)');
  url.searchParams.set('api_key', apiKey || 'DEMO_KEY');
  const res = await fetch(url, { signal });
  if (res.status === 429) throw new Error('rate-limit');
  if (!res.ok) throw new Error(`USDA ${res.status}`);
  const data = await res.json();
  const seen = new Set();
  return (data.foods || [])
    .map(mapUSDA)
    .filter((x) => x && !seen.has(x.name.toLowerCase() + (x.brand || '')) && seen.add(x.name.toLowerCase() + (x.brand || '')));
}

// ---------- Claude meal estimation ----------
// Called straight from the browser with the user's own key (stored only on this device).

const MODEL = 'claude-opus-5-5';

const SYSTEM_PROMPT = `You are the nutrition engine inside a calorie-tracking app. The user describes what they ate (and may attach a photo). Break the meal into its individual food components and estimate each one's portion and nutrition.

Rules:
- If the user states a quantity or size ("200 g", "2 slices", "a large bowl"), honor it exactly and scale nutrition to it.
- If the size is vague, assume a typical home or restaurant portion, and say what you assumed.
- Include cooking oil, butter, sauces, dressings, toppings and drinks when mentioned or clearly implied by the dish.
- Use standard reference values (USDA FoodData Central style). For named restaurant or packaged items, use their published values when you know them.
- Keep item names short (2–5 words). Portion is a short human label such as "2 large eggs (100 g)".
- grams is the estimated edible weight of that component (use ml ≈ g for drinks).
- Round calories to whole numbers and macros to one decimal.
- meal_name is a short friendly title for the whole meal.
- assumptions is one or two short sentences on portion or ingredient assumptions; empty string if none.
- If the input is not food, return an empty items array and explain in assumptions.`;

const SCHEMA = {
  type: 'object',
  properties: {
    meal_name: { type: 'string' },
    items: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          portion: { type: 'string' },
          grams: { type: 'number' },
          calories: { type: 'number' },
          protein_g: { type: 'number' },
          carbs_g: { type: 'number' },
          fat_g: { type: 'number' },
        },
        required: ['name', 'portion', 'grams', 'calories', 'protein_g', 'carbs_g', 'fat_g'],
        additionalProperties: false,
      },
    },
    assumptions: { type: 'string' },
    confidence: { type: 'string', enum: ['low', 'medium', 'high'] },
  },
  required: ['meal_name', 'items', 'assumptions', 'confidence'],
  additionalProperties: false,
};

export async function estimateMeal({ text, imageBase64, apiKey }) {
  if (!apiKey) throw new Error('Add your Anthropic API key to use AI estimates.');

  const content = [];
  if (imageBase64) content.push({ type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: imageBase64 } });
  content.push({ type: 'text', text: text.trim() || 'Estimate the meal in this photo.' });

  let res;
  try {
    res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2026-10-21',
        'anthropic-beta': 'server-side-fallback-2026-07-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 16000,
        system: SYSTEM_PROMPT,
        // Low effort keeps estimates fast; thinking is adaptive (always on) for this model.
        output_config: { effort: 'low', format: { type: 'json_schema', schema: SCHEMA } },
        // If a safety classifier declines, the API retries on a fallback model in the same call.
        fallbacks: 'default',
        messages: [{ role: 'user', content }],
      }),
    });
  } catch {
    throw new Error("Couldn't reach the AI service. Check your connection.");
  }

  if (!res.ok) {
    if (res.status === 401 || res.status === 403) throw new Error('Your API key was rejected. Check it in Settings.');
    if (res.status === 429) throw new Error('Too many requests right now. Try again in a moment.');
    if (res.status >= 500) throw new Error('The AI service is busy. Try again in a few seconds.');
    const body = await res.json().catch(() => null);
    throw new Error(body?.error?.message || `Request failed (${res.status}).`);
  }

  const data = await res.json();
  if (data.stop_reason === 'refusal') throw new Error("The AI couldn't estimate this one. Try describing it differently.");

  // Structured output arrives as JSON text; skip thinking and fallback blocks.
  const out = (data.content || []).filter((b) => b.type === 'text').map((b) => b.text).join('');
  let result;
  try { result = JSON.parse(out); } catch { throw new Error('Got an unexpected response. Please try again.'); }

  return {
    mealName: result.meal_name || 'Meal',
    assumptions: result.assumptions || '',
    confidence: result.confidence || 'medium',
    items: (result.items || []).map((it, i) => ({
      id: `ai-${Date.now()}-${i}`,
      name: it.name,
      brand: null,
      servingLabel: it.portion,
      servingGrams: it.grams > 0 ? it.grams : null,
      kcal: it.calories, p: it.protein_g, c: it.carbs_g, f: it.fat_g,
      source: 'ai',
    })),
  };
}

/** Resize a photo to ≤1024px JPEG and return base64 (no data: prefix) plus a preview URL. */
export async function prepareImage(file) {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = reject;
      i.src = url;
    });
    const scale = Math.min(1, 1024 / Math.max(img.naturalWidth, img.naturalHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(img.naturalWidth * scale);
    canvas.height = Math.round(img.naturalHeight * scale);
    canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.72);
    return { base64: dataUrl.split(',')[1], preview: dataUrl };
  } finally {
    URL.revokeObjectURL(url);
  }
}
