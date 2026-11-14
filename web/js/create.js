import { html, useState } from '../vendor/preact-htm.js';
import { mealById, addEntry, addCustomFood, kcal } from './store.js';
import { Icon, toast } from './ui.js';

const num = (s) => { const v = parseFloat(String(s).replace(',', '.')); return isFinite(v) ? v : null; };
const EMPTY = { name: '', brand: '', servingLabel: '1 serving', servingGrams: '', kcal: '', p: '', c: '', f: '' };

/** Create your own food or recipe. Calories can be derived from macros. */
export function CreateFood({ day, meal, onDone }) {
  const [form, setForm] = useState(EMPTY);
  const set = (k) => (e) => setForm({ ...form, [k]: e.currentTarget.value });

  const derived = (num(form.p) || 0) * 4 + (num(form.c) || 0) * 4 + (num(form.f) || 0) * 9;
  const calories = num(form.kcal) ?? (derived > 0 ? derived : null);
  const valid = form.name.trim() && calories != null;

  const save = (andLog) => {
    const food = addCustomFood({
      name: form.name.trim(),
      brand: form.brand.trim() || null,
      servingLabel: form.servingLabel.trim() || '1 serving',
      servingGrams: num(form.servingGrams),
      kcal: calories, p: num(form.p) || 0, c: num(form.c) || 0, f: num(form.f) || 0,
    });
    if (andLog) {
      addEntry(food, { meal, day });
      toast(`Added to ${mealById(meal).title}`);
      onDone();
    } else {
      toast('Saved to My Foods');
      setForm(EMPTY);
    }
  };

  const numRow = (label, key, unit, placeholder = '0') => html`
    <div class="form-row">
      <label for=${'cf-' + key}>${label}</label>
      <input id=${'cf-' + key} inputmode="decimal" placeholder=${placeholder} value=${form[key]} onInput=${set(key)} />
      <span class="unit">${unit}</span>
    </div>`;

  return html`
    <div class="sheet-body" style="padding-top:2px">
      <div class="list-header" style="margin-top:4px">Food</div>
      <div class="form-list">
        <div class="form-row"><input class="full" placeholder="Name (e.g. Mom's lasagna)" value=${form.name} onInput=${set('name')} aria-label="Name" /></div>
        <div class="form-row"><input class="full" placeholder="Brand or note (optional)" value=${form.brand} onInput=${set('brand')} aria-label="Brand" /></div>
      </div>

      <div class="list-header">Serving</div>
      <div class="form-list">
        <div class="form-row"><input class="full" placeholder="Serving description" value=${form.servingLabel} onInput=${set('servingLabel')} aria-label="Serving description" /></div>
        ${numRow('Serving weight', 'servingGrams', 'g', 'optional')}
      </div>
      <div class="list-footer">Add the weight to log this food by grams later.</div>

      <div class="list-header">Nutrition per serving</div>
      <div class="form-list">
        ${numRow('Calories', 'kcal', 'kcal', derived > 0 ? kcal(derived) : '0')}
        ${numRow('Protein', 'p', 'g')}
        ${numRow('Carbs', 'c', 'g')}
        ${numRow('Fat', 'f', 'g')}
      </div>
      <div class="list-footer">Leave calories blank to calculate them from macros.</div>

      <div class="stack" style="gap:8px;margin-top:22px">
        <button class="btn" disabled=${!valid} onClick=${() => save(true)}><${Icon} name="plus" /> Save & add to ${mealById(meal).title}</button>
        <button class="btn secondary" disabled=${!valid} onClick=${() => save(false)}>Save to My Foods only</button>
      </div>
    </div>`;
}
