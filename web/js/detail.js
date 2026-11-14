import { html, useState } from '../vendor/preact-htm.js';
import { MEALS, mealById, addEntry, updateEntry, deleteEntry, entryAsItem, scale, kcal, grams, fmt, unitOf, todayKey, SOURCES } from './store.js';
import { Icon, MacroDonut, Seg, toast } from './ui.js';

/** Pick amount + meal for a food and log it, or edit an existing diary entry. */
export function FoodDetail({ mode, item: addItem, entry, day, meal: initialMeal, onBack, onDone }) {
  const editing = mode === 'edit';
  const item = editing ? entryAsItem(entry) : addItem;
  const unitWord = unitOf(item.servingLabel);

  // Foods measured "per 100 g" read more naturally by weight.
  const per100 = !editing && item.servingGrams === 100 && /^100 (g|ml)$/.test(item.servingLabel);
  const [unit, setUnit] = useState((editing && entry.inGrams && entry.servingGrams) || per100 ? 'grams' : 'servings');
  const [amount, setAmount] = useState(() => {
    if (per100) return '100';
    if (!editing) return '1';
    return entry.inGrams && entry.servingGrams ? fmt(entry.servings * entry.servingGrams, 0) : fmt(entry.servings, 2);
  });
  const [meal, setMeal] = useState(editing ? entry.meal : initialMeal);

  const value = parseFloat(String(amount).replace(',', '.')) || 0;
  const servings = unit === 'grams' ? (item.servingGrams ? value / item.servingGrams : 0) : value;
  const n = scale(item, servings);
  const quick = unit === 'grams' ? [50, 100, 150, 200, 250, 300] : [0.5, 1, 1.5, 2, 3];
  const source = SOURCES[item.source] || SOURCES.custom;

  const switchUnit = (next) => {
    if (next === unit || !item.servingGrams) return;
    setAmount(next === 'grams' ? fmt(value * item.servingGrams, 0) : fmt(value / item.servingGrams, 2));
    setUnit(next);
  };

  const save = () => {
    if (editing) {
      updateEntry(entry.id, { servings, inGrams: unit === 'grams', meal });
      toast('Saved');
    } else {
      addEntry(item, { servings, inGrams: unit === 'grams', meal, day });
      toast(`Added to ${mealById(meal).title}`);
    }
    onDone();
  };

  const remove = () => {
    const id = entry.id;
    onDone();
    setTimeout(() => deleteEntry(id), 260); // let the sheet animate out first
    toast('Removed');
  };

  const logAgainToday = () => {
    addEntry(item, { servings: entry.servings, inGrams: entry.inGrams, meal: entry.meal, day: todayKey() });
    toast('Logged again today');
    onDone();
  };

  return html`
    <div class="sheet-head">
      <div class="left">
        <button class="text-btn row" style="gap:2px" onClick=${onBack}>
          ${editing ? 'Cancel' : html`<${Icon} name="chevron-left" /> Back`}
        </button>
      </div>
      <div class="title">${editing ? 'Edit entry' : ''}</div>
      <div class="right"></div>
    </div>

    <div class="sheet-body stack pop-in">
      <div style="padding: 0 4px">
        <span class=${'source-tag' + (item.source === 'ai' ? ' ai-text' : '')}><${Icon} name=${source.icon} />${source.label}</span>
        <div class="food-title">${item.name}</div>
        ${item.brand && html`<div class="muted">${item.brand}</div>`}
      </div>

      <section class="card pad-lg nutri">
        <${MacroDonut} n=${n}>
          <div class="bold num" style="font-size:24px">${kcal(n.kcal)}</div>
          <div class="tiny muted">kcal</div>
        <//>
        <div class="grow">
          ${[['Protein', n.p, 'var(--protein)'], ['Carbs', n.c, 'var(--carbs)'], ['Fat', n.f, 'var(--fat)']].map(([t, v, c]) => html`
            <div class="macro-line">
              <span class="dot" style=${`background:${c}`}></span>
              <span class="muted grow">${t}</span>
              <b class="num">${grams(v)} g</b>
            </div>`)}
        </div>
      </section>

      <section class="card stack" style="gap:14px">
        <div class="card-title" style="margin:0">Amount</div>
        <div class="amount-row">
          <input class="field amount-input num" inputmode="decimal" value=${amount} aria-label="Amount"
            onInput=${(e) => setAmount(e.currentTarget.value)} onFocus=${(e) => e.currentTarget.select()} />
          ${item.servingGrams
            ? html`<div class="grow"><${Seg} value=${unit} onChange=${switchUnit}
                options=${[{ value: 'servings', label: 'Servings' }, { value: 'grams', label: unitWord === 'ml' ? 'ml' : 'Grams' }]} /></div>`
            : html`<span class="muted">servings</span>`}
        </div>
        <div class="chips">
          ${quick.map((q) => html`
            <button class=${'chip' + (value === q ? ' on' : '')} onClick=${() => setAmount(String(q))}>
              ${unit === 'grams' ? `${q} ${unitWord}` : `${q}×`}
            </button>`)}
        </div>
        <div class="small muted">1 serving = ${item.servingLabel}</div>
      </section>

      <section class="card">
        <div class="card-title">Meal</div>
        <div class="meal-grid">
          ${MEALS.map((m) => {
            const on = m.id === meal;
            return html`
              <button class="meal-opt" onClick=${() => setMeal(m.id)}
                style=${on ? `background:${m.tint};color:#fff` : `background:color-mix(in srgb, ${m.tint} 14%, transparent)`}>
                <span class="e">${m.emoji}</span>${m.title}
              </button>`;
          })}
        </div>
      </section>

      ${editing && html`
        <div class="stack" style="gap:4px">
          <button class="btn secondary" onClick=${logAgainToday}><${Icon} name="repeat" /> Log again today</button>
          <button class="btn danger" onClick=${remove}><${Icon} name="trash" /> Remove from diary</button>
        </div>`}
    </div>

    <div class="sheet-footer">
      <button class="btn" disabled=${servings <= 0} onClick=${save}>
        <${Icon} name=${editing ? 'check' : 'plus'} />
        ${editing ? 'Save changes' : `Add to ${mealById(meal).title}`}
      </button>
    </div>`;
}
