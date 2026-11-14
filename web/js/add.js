import { html, useState, useEffect, useMemo } from '../vendor/preact-htm.js';
import { useStore, MEALS, mealById, addEntry, entryAsItem, kcal } from './store.js';
import { FOODS, POPULAR, searchLocal } from './foods.js';
import { searchUSDA } from './api.js';
import { Icon, Seg, toast } from './ui.js';
import { FoodDetail } from './detail.js';
import { AIMeal } from './ai.js';
import { CreateFood } from './create.js';

export function AddFood({ day, initialMeal, close }) {
  const [meal, setMeal] = useState(initialMeal);
  const [tab, setTab] = useState('search');
  const [detail, setDetail] = useState(null);
  const m = mealById(meal);

  return html`
    ${detail && html`
      <${FoodDetail} mode="add" item=${detail} day=${day} meal=${meal}
        onBack=${() => setDetail(null)} onDone=${close} />`}
    <div style=${'display:flex;flex-direction:column;flex:1;min-height:0' + (detail ? ';display:none' : '')}>
      <div class="sheet-head">
        <div class="left"><button class="text-btn" onClick=${close}>Done</button></div>
        <label class="title">
          <span aria-hidden="true">${m.emoji}</span>
          <select class="meal-select" value=${meal} onChange=${(e) => setMeal(e.currentTarget.value)} aria-label="Meal">
            ${MEALS.map((x) => html`<option value=${x.id}>${x.title}</option>`)}
          </select>
          <${Icon} name="chevron-down" style="width:14px;height:14px;color:var(--text-2)" />
        </label>
        <div class="right"></div>
      </div>
      <div style="padding: 4px 16px 10px">
        <${Seg} value=${tab} onChange=${setTab} options=${[
          { value: 'search', label: 'Search' },
          { value: 'ai', label: '✦ AI Meal' },
          { value: 'create', label: 'Create' },
        ]} />
      </div>
      ${tab === 'search' && html`<${FoodSearch} day=${day} meal=${meal} onPick=${setDetail} />`}
      ${tab === 'ai' && html`<${AIMeal} day=${day} meal=${meal} onDone=${close} />`}
      ${tab === 'create' && html`<${CreateFood} day=${day} meal=${meal} onDone=${close} />`}
    </div>`;
}

function FoodSearch({ day, meal, onPick }) {
  const s = useStore();
  const [query, setQuery] = useState('');
  const [online, setOnline] = useState({ status: 'idle', items: [] });
  const [added, setAdded] = useState(() => new Set());
  const q = query.trim();

  const recent = useMemo(() => {
    const seen = new Set();
    return [...s.entries]
      .sort((a, b) => b.createdAt - a.createdAt)
      .filter((e) => { const k = e.name.toLowerCase() + e.servingLabel; return !seen.has(k) && seen.add(k); })
      .slice(0, 15)
      .map(entryAsItem);
  }, [s.entries]);

  const mine = q ? searchLocal(q, s.customFoods, 20) : s.customFoods.slice(0, 10);
  const local = q ? searchLocal(q, FOODS) : [];

  useEffect(() => {
    if (q.length < 2) { setOnline({ status: 'idle', items: [] }); return; }
    setOnline({ status: 'loading', items: [] });
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      try {
        const items = await searchUSDA(q, s.settings.usdaKey, ctrl.signal);
        setOnline({ status: 'done', items });
      } catch (e) {
        if (e.name !== 'AbortError') setOnline({ status: e.message === 'rate-limit' ? 'rate' : 'error', items: [] });
      }
    }, 450);
    return () => { clearTimeout(t); ctrl.abort(); };
  }, [q]);

  const quickAdd = (item) => {
    addEntry(item, { meal, day });
    setAdded((prev) => new Set(prev).add(item.id));
    toast(`Added to ${mealById(meal).title}`);
  };

  const row = (item) => html`
    <div class="list-row" role="button" tabindex="0" key=${item.id} onClick=${() => onPick(item)}
      onKeyDown=${(e) => e.key === 'Enter' && onPick(item)}>
      <div class="grow">
        <div class="row-title" style="font-size:15.5px">${item.name}</div>
        <div class="row-sub ellipsis">${[item.brand, item.servingLabel].filter(Boolean).join(' · ')}</div>
      </div>
      <div class="row-kcal"><div class="v num">${kcal(item.kcal)}</div><div class="u">kcal</div></div>
      <button class=${'quick-add' + (added.has(item.id) ? ' done' : '')} aria-label="Quick add one serving"
        onClick=${(e) => { e.stopPropagation(); quickAdd(item); }}>
        <${Icon} name=${added.has(item.id) ? 'check' : 'plus'} />
      </button>
    </div>`;

  const section = (title, items, footer) => items.length > 0 && html`
    <div class="list-header">${title}</div>
    <div class="list">${items.map(row)}</div>
    ${footer && html`<div class="list-footer">${footer}</div>`}`;

  return html`
    <div style="padding: 0 16px 4px">
      <div class="search">
        <${Icon} name="search" />
        <input type="search" placeholder="Search foods & brands" value=${query} autocomplete="off" autocorrect="off"
          enterkeyhint="search" onInput=${(e) => setQuery(e.currentTarget.value)} aria-label="Search foods" />
        ${query && html`<button class="faint" aria-label="Clear" onClick=${() => setQuery('')}><${Icon} name="x" style="width:16px;height:16px" /></button>`}
      </div>
    </div>
    <div class="sheet-body" style="padding-top:0">
      ${!q && html`
        ${section('Recent', recent)}
        ${section('My foods & meals', mine)}
        ${section('Popular', POPULAR)}`}
      ${q && html`
        ${section('My foods & meals', mine)}
        ${section('Common foods', local)}
        <div class="list-header">Brands & packaged</div>
        <div class="list">
          ${online.status === 'loading' && html`
            <div class="empty-row row"><span class="spinner dark"></span> Searching USDA database…</div>`}
          ${online.status === 'done' && online.items.length === 0 && html`
            <div class="empty-row">No branded matches. Try the ✦ AI Meal tab — just describe it.</div>`}
          ${online.status === 'rate' && html`
            <div class="empty-row">Free search limit reached for now. Add a free USDA key in Settings for unlimited search.</div>`}
          ${online.status === 'error' && html`
            <div class="empty-row row"><${Icon} name="wifi" /> Couldn't reach the online database.</div>`}
          ${online.status === 'idle' && html`<div class="empty-row">Keep typing to search 400k+ products…</div>`}
          ${online.items.map(row)}
        </div>
        <div class="list-footer">Branded data from USDA FoodData Central.</div>`}
    </div>`;
}
