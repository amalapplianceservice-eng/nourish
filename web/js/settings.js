import { html, useState, useRef } from '../vendor/preact-htm.js';
import { useStore, setState, getState, deleteCustomFood, kcal } from './store.js';
import { Icon, Sheet, Pills, toast } from './ui.js';
import { GoalSetup } from './goals.js';
import { t, LANGS, lang } from './i18n.js';

function GoalRow({ label, k, unit, color }) {
  const s = useStore();
  return html`
    <div class="form-row">
      <span class="dot" style=${`background:${color}`}></span>
      <label for=${'goal-' + k}>${label}</label>
      <input id=${'goal-' + k} class="num" inputmode="numeric" value=${s.goals[k]}
        onChange=${(e) => {
          const v = Math.max(0, Math.round(Number(e.currentTarget.value) || 0));
          setState((st) => ({ goals: { ...st.goals, [k]: v } }));
        }} />
      <span class="unit">${unit}</span>
    </div>`;
}

function KeyRow({ label, k, placeholder }) {
  const s = useStore();
  const [draft, setDraft] = useState('');
  const saved = s.settings[k];
  const save = (v) => setState((st) => ({ settings: { ...st.settings, [k]: v } }));
  if (saved) {
    return html`
      <div class="form-row">
        <${Icon} name="check" style="color:var(--accent)" />
        <span class="grow">${t('settings.keySaved', { label })} <span class="faint small">••••${saved.slice(-4)}</span></span>
        <button class="text-btn" style="color:var(--over)" onClick=${() => save('')}>${t('remove')}</button>
      </div>`;
  }
  return html`
    <div class="form-row">
      <input class="full" type="password" autocomplete="off" placeholder=${placeholder} value=${draft}
        onInput=${(e) => setDraft(e.currentTarget.value)} aria-label=${label} />
      <button class="text-btn" disabled=${!draft.trim()} onClick=${() => { save(draft.trim()); setDraft(''); toast(t('toast.keySaved')); }}>${t('save')}</button>
    </div>`;
}

export function Settings() {
  const s = useStore();
  const [sheet, setSheet] = useState(null);
  const fileRef = useRef();

  const exportData = () => {
    const blob = new Blob([JSON.stringify({ ...getState(), settings: undefined }, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `nourish-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };

  const importData = async (e) => {
    const file = e.currentTarget.files?.[0];
    e.currentTarget.value = '';
    if (!file) return;
    try {
      const data = JSON.parse(await file.text());
      if (!Array.isArray(data.entries)) throw new Error();
      if (!confirm(t('confirm.restore', { n: data.entries.length }))) return;
      setState({ entries: data.entries, customFoods: data.customFoods || [], goals: { ...getState().goals, ...data.goals }, profile: { ...getState().profile, ...data.profile } });
      toast(t('toast.restored'));
    } catch {
      alert(t('alert.badBackup'));
    }
  };

  const deleteAll = () => {
    if (confirm(t('confirm.deleteAll'))) {
      setState({ entries: [] });
      toast(t('toast.cleared'));
    }
  };

  return html`
    <main class="screen">
      <h1 class="large-title">${t('tab.settings')}</h1>

      <div class="list-header">${t('language')}</div>
      <div class="form-list">
        ${LANGS.map((l) => html`
          <button class="form-row" style="width:100%" key=${l.id}
            onClick=${() => setState((st) => ({ settings: { ...st.settings, lang: l.id } }))}>
            <span class="grow" style="text-align:left">${l.label}</span>
            ${lang() === l.id && html`<${Icon} name="check" style="color:var(--accent)" />`}
          </button>`)}
      </div>

      <div class="list-header">${t('settings.goals')}</div>
      <div class="form-list">
        <${GoalRow} label=${t('create.calories')} k="calories" unit=${t('u.kcal')} color="var(--accent)" />
        <${GoalRow} label=${t('m.protein')} k="protein" unit=${t('u.g')} color="var(--protein)" />
        <${GoalRow} label=${t('m.carbs')} k="carbs" unit=${t('u.g')} color="var(--carbs)" />
        <${GoalRow} label=${t('m.fat')} k="fat" unit=${t('u.g')} color="var(--fat)" />
        <button class="form-row text-btn" style="width:100%" onClick=${() => setSheet('goals')}>
          <${Icon} name="wand" /> ${t('settings.recalc')}
        </button>
      </div>

      <div class="list-header">${t('settings.ai')}</div>
      <div class="form-list">
        <${KeyRow} label=${t('settings.anthropicKey')} k="anthropicKey" placeholder=${t('settings.anthropicPh')} />
      </div>
      <div class="list-footer">
        ${t('settings.aiFooter')} <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noopener">${t('settings.getKey')}</a>
      </div>

      <div class="list-header">${t('settings.search')}</div>
      <div class="form-list">
        <${KeyRow} label=${t('settings.usdaKey')} k="usdaKey" placeholder=${t('settings.usdaPh')} />
      </div>
      <div class="list-footer">
        ${t('settings.usdaFooter')} <a href="https://fdc.nal.usda.gov/api-key-signup" target="_blank" rel="noopener">${t('settings.getFreeKey')}</a>
      </div>

      <div class="list-header">${t('settings.data')}</div>
      <div class="form-list">
        <button class="form-row" style="width:100%" onClick=${() => setSheet('foods')}>
          <span class="grow" style="text-align:left">${t('search.mine')}</span>
          <span class="muted num">${s.customFoods.length}</span>
          <${Icon} name="chevron-right" style="color:var(--text-3);width:16px" />
        </button>
        <button class="form-row text-btn" style="width:100%" onClick=${exportData}><${Icon} name="download" /> ${t('settings.export')}</button>
        <button class="form-row text-btn" style="width:100%" onClick=${() => fileRef.current.click()}><${Icon} name="upload" /> ${t('settings.restore')}</button>
        <button class="form-row text-btn" style="width:100%;color:var(--over)" onClick=${deleteAll}><${Icon} name="trash" /> ${t('settings.deleteAll')}</button>
        <input ref=${fileRef} type="file" accept="application/json,.json" hidden onChange=${importData} />
      </div>
      <div class="list-footer">${t('settings.dataFooter')}</div>

      <div class="list-header">${t('settings.about')}</div>
      <div class="form-list">
        <div class="form-row"><span class="grow">${t('settings.version')}</span><span class="muted">1.1 (web)</span></div>
        <div class="form-row"><span class="grow small muted">${t('settings.installHow')}</span></div>
      </div>
      <div class="list-footer">${t('settings.aboutFooter')}</div>

      ${sheet === 'goals' && html`
        <${Sheet} onClose=${() => setSheet(null)} render=${(close) => html`
          <div class="sheet-head">
            <div class="left"><button class="text-btn" onClick=${close}>${t('cancel')}</button></div>
            <div class="title">${t('settings.calc')}</div><div class="right"></div>
          </div>
          <${GoalSetup} onSave=${() => { toast(t('toast.goals')); close(); }} />`} />`}

      ${sheet === 'foods' && html`
        <${Sheet} onClose=${() => setSheet(null)} render=${(close) => html`
          <div class="sheet-head">
            <div class="left"></div><div class="title">${t('search.mine')}</div>
            <div class="right"><button class="text-btn" onClick=${close}>${t('done')}</button></div>
          </div>
          <div class="sheet-body">
            ${s.customFoods.length === 0
              ? html`<div class="center muted" style="padding:40px 20px">${t('myfoods.empty')}</div>`
              : html`<div class="list">${s.customFoods.map((f) => html`
                  <div class="list-row" key=${f.id}>
                    <div class="grow">
                      <div class="row-title ellipsis">${f.name}</div>
                      <div class="row-sub ellipsis">${f.servingLabel}</div>
                      <${Pills} n=${f} />
                    </div>
                    <div class="row-kcal"><div class="v num">${kcal(f.kcal)}</div><div class="u">${t('u.kcal')}</div></div>
                    <button class="quick-add" style="color:var(--over)" aria-label=${t('delete')}
                      onClick=${() => confirm(t('confirm.deleteFood', { name: f.name })) && deleteCustomFood(f.id)}><${Icon} name="trash" style="width:20px;height:20px" /></button>
                  </div>`)}</div>`}
          </div>`} />`}
    </main>`;
}
