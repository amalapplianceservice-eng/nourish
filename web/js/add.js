import { html, useState, useEffect, useMemo } from '../vendor/preact-htm.js';
import { useStore, MEALS, mealById, addEntry, entryAsItem, kcal } from './store.js';
import { getFoods, getPopular, searchLocal, localizeItem } from './foods.js';
import { t } from './i18n.js';
import { searchUSDA } from './api.js';
import { Icon, Seg, toast } from './ui.js';
import { FoodDetail } from './detail.js';
import { AIMeal } from './ai.js';
import { CreateFood } from './create.js';
import { Scanner } from './scanner.js';

export function AddFood({ day, initialMeal, close }) {
  const [meal, setMeal] = useState(initialMeal);
  const [tab, setTab] = useState('search');
  const [detail, setDetail] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [newBarcode, setNewBarcode] = useState(null);
  const m = mealById(meal);

  return html`
    ${scanning && html`
      <${Scanner} onClose=${() => setScanning(false)}
        onFound=${(item) => { setScanning(false); setDetail(item); }}
        onNotFound=${(code) => { setScanning(false); setNewBarcode(code); setTab('create'); }} />`}
    ${detail && html`
      <${FoodDetail} mode="add" item=${detail} day=${day} meal=${meal}
        onBack=${() => setDetail(null)} onDone=${close} />`}
    <div style=${'display:flex;flex-direction:column;flex:1;min-height:0' + (detail ? ';display:none' : '')}>
      <div class="sheet-head">
        <div class="left"><button class="text-btn" onClick=${close}>${t('done')}</button></div>
        <label class="title">
          <span aria-hidden="true">${m.emoji}</span>
          <select class="meal-select" value=${meal} onChange=${(e) => setMeal(e.currentTarget.value)} aria-label=${t('meal')}>
            ${MEALS.map((x) => html`<option value=${x.id}>${x.title}</option>`)}
          </select>
          <${Icon} name="chevron-down" style="width:14px;height:14px;color:var(--text-2)" />
        </label>
        <div class="right"></div>
      </div>
      <div style="padding: 4px 16px 10px">
        <${Seg} value=${tab} onChange=${setTab} options=${[
          { value: 'search', label: t('add.search') },
          { value: 'ai', label: t('add.ai') },
          { value: 'create', label: t('add.create') },
        ]} />
      </div>
      ${tab === 'search' && html`<${FoodSearch} day=${day} meal=${meal} onPick=${setDetail} onScan=${() => setScanning(true)} />`}
      ${tab === 'ai' && html`<${AIMeal} day=${day} meal=${meal} onDone=${close} />`}
      ${tab === 'create' && html`<${CreateFood} day=${day} meal=${meal} onDone=${close} barcode=${newBarcode} onClearBarcode=${() => setNewBarcode(null)} />`}
    </div>`;
}

function FoodSearch({ day, meal, onPick, onScan }) {
  const s = useStore();
  const [query, setQuery] = useState('');
  const [online, setOnline] = useState({ status: 'idle', items: [] });
  const [added, setAdded] = useState(() => new Set());
  const q = query.trim();

  const recent = useMemo(() => {
    const seen = new Set();
    return [...s.entries]
      .sort((a, b) => b.createdAt - a.createdAt)
      .filter((e) => { const k = (e.en || e.name).toLowerCase() + (e.servingEn || e.servingLabel); return !seen.has(k) && seen.add(k); })
      .slice(0, 15)
      .map(entryAsItem)
      .map(localizeItem);
  }, [s.entries, s.settings.lang]);

  const mine = q ? searchLocal(q, s.customFoods, 20) : s.customFoods.slice(0, 10);
  const local = q ? searchLocal(q, getFoods()) : [];

  useEffect(() => {
    if (q.length < 2) { setOnline({ status: 'idle', items: [] }); return; }
    setOnline({ status: 'loading', items: [] });
    const ctrl = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const items = await searchUSDA(q, s.settings.usdaKey, ctrl.signal);
        setOnline({ status: 'done', items });
      } catch (e) {
        if (e.name !== 'AbortError') setOnline({ status: e.message === 'rate-limit' ? 'rate' : 'error', items: [] });
      }
    }, 450);
    return () => { clearTimeout(timer); ctrl.abort(); };
  }, [q]);

  const quickAdd = (item) => {
    addEntry(item, { meal, day });
    setAdded((prev) => new Set(prev).add(item.id));
    toast(t('toast.addedTo', { meal: mealById(meal).title }));
  };

  const row = (item) => html`
    <div class="list-row" role="button" tabindex="0" key=${item.id} onClick=${() => onPick(item)}
      onKeyDown=${(e) => e.key === 'Enter' && onPick(item)}>
      <div class="grow">
        <div class="row-title" style="font-size:15.5px">${item.name}</div>
        <div class="row-sub ellipsis">${[item.brand, item.servingLabel].filter(Boolean).join(' · ')}</div>
      </div>
      <div class="row-kcal"><div class="v num">${kcal(item.kcal)}</div><div class="u">${t('u.kcal')}</div></div>
      <button class=${'quick-add' + (added.has(item.id) ? ' done' : '')} aria-label=${t('search.quickAdd')}
        onClick=${(e) => { e.stopPropagation(); quickAdd(item); }}>
        <${Icon} name=${added.has(item.id) ? 'check' : 'plus'} />
      </button>
    </div>`;

  const section = (title, items, footer) => items.length > 0 && html`
    <div class="list-header">${title}</div>
    <div class="list">${items.map(row)}</div>
    ${footer && html`<div class="list-footer">${footer}</div>`}`;

  return html`
    <div class="row" style="padding: 0 16px 4px; gap: 8px">
      <div class="search grow">
        <${Icon} name="search" />
        <input type="search" placeholder=${t('search.placeholder')} value=${query} autocomplete="off" autocorrect="off"
          enterkeyhint="search" onInput=${(e) => setQuery(e.currentTarget.value)} aria-label=${t('search.placeholder')} />
        ${query && html`<button class="faint" aria-label=${t('clear')} onClick=${() => setQuery('')}><${Icon} name="x" style="width:16px;height:16px" /></button>`}
      </div>
      <button class="scan-btn" aria-label=${t('search.scan')} onClick=${onScan}><${Icon} name="barcode" /></button>
    </div>
    <div class="sheet-body" style="padding-top:0">
      ${!q && html`
        ${section(t('search.recent'), recent)}
        ${section(t('search.mine'), mine)}
        ${section(t('search.popular'), getPopular())}`}
      ${q && html`
        ${section(t('search.mine'), mine)}
        ${section(t('search.common'), local)}
        <div class="list-header">${t('search.brands')}</div>
        <div class="list">
          ${online.status === 'loading' && html`
            <div class="empty-row row"><span class="spinner dark"></span> ${t('search.loading')}</div>`}
          ${online.status === 'done' && online.items.length === 0 && html`
            <div class="empty-row">${t('search.none')}</div>`}
          ${online.status === 'rate' && html`
            <div class="empty-row">${t('search.rate')}</div>`}
          ${online.status === 'error' && html`
            <div class="empty-row row"><${Icon} name="wifi" /> ${t('search.error')}</div>`}
          ${online.status === 'idle' && html`<div class="empty-row">${t('search.typing')}</div>`}
          ${online.items.map(row)}
        </div>
        <div class="list-footer">${t('search.footer')}</div>`}
    </div>`;
}
