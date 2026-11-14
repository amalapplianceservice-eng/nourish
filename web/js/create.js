import { html, useState } from '../vendor/preact-htm.js';
import { mealById, addEntry, addCustomFood, kcal } from './store.js';
import { Icon, toast } from './ui.js';
import { t } from './i18n.js';

const num = (s) => { const v = parseFloat(String(s).replace(',', '.')); return isFinite(v) ? v : null; };
const empty = () => ({ name: '', brand: '', servingLabel: t('create.defaultServing'), servingGrams: '', kcal: '', p: '', c: '', f: '' });

/** Create your own food or recipe. Calories can be derived from macros. */
export function CreateFood({ day, meal, onDone, barcode, onClearBarcode }) {
  const [form, setForm] = useState(empty);
  const set = (k) => (e) => setForm({ ...form, [k]: e.currentTarget.value });

  const derived = (num(form.p) || 0) * 4 + (num(form.c) || 0) * 4 + (num(form.f) || 0) * 9;
  const calories = num(form.kcal) ?? (derived > 0 ? derived : null);
  const valid = form.name.trim() && calories != null;

  const save = (andLog) => {
    const food = addCustomFood({
      name: form.name.trim(),
      brand: form.brand.trim() || null,
      servingLabel: form.servingLabel.trim() || t('create.defaultServing'),
      servingGrams: num(form.servingGrams),
      kcal: calories, p: num(form.p) || 0, c: num(form.c) || 0, f: num(form.f) || 0,
      ...(barcode ? { barcode } : {}),
    });
    onClearBarcode?.();
    if (andLog) {
      addEntry(food, { meal, day });
      toast(t('toast.addedTo', { meal: mealById(meal).title }));
      onDone();
    } else {
      toast(t('toast.savedFoods'));
      setForm(empty());
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
      ${barcode && html`
        <div class="card small pop-in" style="margin-top:4px">
          <div class="row" style="justify-content:space-between">
            <span class="barcode-tag"><${Icon} name="barcode" />${barcode}</span>
            <button class="faint" aria-label=${t('create.removeBarcode')} onClick=${onClearBarcode}><${Icon} name="x" style="width:16px;height:16px" /></button>
          </div>
          <div class="muted" style="margin-top:8px">${t('create.barcodeHint')}</div>
        </div>`}
      <div class="list-header" style="margin-top:4px">${t('create.food')}</div>
      <div class="form-list">
        <div class="form-row"><input class="full" placeholder=${t('create.name')} value=${form.name} onInput=${set('name')} aria-label=${t('create.name')} /></div>
        <div class="form-row"><input class="full" placeholder=${t('create.brand')} value=${form.brand} onInput=${set('brand')} aria-label=${t('create.brand')} /></div>
      </div>

      <div class="list-header">${t('create.serving')}</div>
      <div class="form-list">
        <div class="form-row"><input class="full" placeholder=${t('create.servingDesc')} value=${form.servingLabel} onInput=${set('servingLabel')} aria-label=${t('create.servingDesc')} /></div>
        ${numRow(t('create.servingWeight'), 'servingGrams', t('u.g'), t('create.optional'))}
      </div>
      <div class="list-footer">${t('create.weightHint')}</div>

      <div class="list-header">${t('create.nutrition')}</div>
      <div class="form-list">
        ${numRow(t('create.calories'), 'kcal', t('u.kcal'), derived > 0 ? kcal(derived) : '0')}
        ${numRow(t('m.protein'), 'p', t('u.g'))}
        ${numRow(t('m.carbs'), 'c', t('u.g'))}
        ${numRow(t('m.fat'), 'f', t('u.g'))}
      </div>
      <div class="list-footer">${t('create.caloriesHint')}</div>

      <div class="stack" style="gap:8px;margin-top:22px">
        <button class="btn" disabled=${!valid} onClick=${() => save(true)}><${Icon} name="plus" /> ${t('create.saveLog', { meal: mealById(meal).title })}</button>
        <button class="btn secondary" disabled=${!valid} onClick=${() => save(false)}>${t('create.saveOnly')}</button>
      </div>
    </div>`;
}
