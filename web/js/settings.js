import { html, useState, useRef } from '../vendor/preact-htm.js';
import { useStore, setState, getState, deleteCustomFood, kcal } from './store.js';
import { Icon, Sheet, Pills, toast } from './ui.js';
import { GoalSetup } from './goals.js';

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
        <span class="grow">${label} saved <span class="faint small">••••${saved.slice(-4)}</span></span>
        <button class="text-btn" style="color:var(--over)" onClick=${() => save('')}>Remove</button>
      </div>`;
  }
  return html`
    <div class="form-row">
      <input class="full" type="password" autocomplete="off" placeholder=${placeholder} value=${draft}
        onInput=${(e) => setDraft(e.currentTarget.value)} aria-label=${label} />
      <button class="text-btn" disabled=${!draft.trim()} onClick=${() => { save(draft.trim()); setDraft(''); toast('Key saved'); }}>Save</button>
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
      if (!confirm(`Replace your diary with this backup (${data.entries.length} entries)?`)) return;
      setState({ entries: data.entries, customFoods: data.customFoods || [], goals: { ...getState().goals, ...data.goals }, profile: { ...getState().profile, ...data.profile } });
      toast('Backup restored');
    } catch {
      alert("That file isn't a Nourish backup.");
    }
  };

  const deleteAll = () => {
    if (confirm("Delete every logged entry? This can't be undone.")) {
      setState({ entries: [] });
      toast('Diary cleared');
    }
  };

  return html`
    <main class="screen">
      <h1 class="large-title">Settings</h1>

      <div class="list-header">Daily goals</div>
      <div class="form-list">
        <${GoalRow} label="Calories" k="calories" unit="kcal" color="var(--accent)" />
        <${GoalRow} label="Protein" k="protein" unit="g" color="var(--protein)" />
        <${GoalRow} label="Carbs" k="carbs" unit="g" color="var(--carbs)" />
        <${GoalRow} label="Fat" k="fat" unit="g" color="var(--fat)" />
        <button class="form-row text-btn" style="width:100%" onClick=${() => setSheet('goals')}>
          <${Icon} name="wand" /> Recalculate from my profile
        </button>
      </div>

      <div class="list-header">AI meal estimates</div>
      <div class="form-list">
        <${KeyRow} label="Anthropic API key" k="anthropicKey" placeholder="Anthropic API key (sk-ant-…)" />
      </div>
      <div class="list-footer">
        Powered by Claude. Meal descriptions and photos go to Anthropic only when you tap Estimate; each estimate costs about a cent. <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noopener">Get a key →</a>
      </div>

      <div class="list-header">Food search</div>
      <div class="form-list">
        <${KeyRow} label="USDA key" k="usdaKey" placeholder="Free USDA API key (optional)" />
      </div>
      <div class="list-footer">
        Branded search works without a key but is rate-limited. A free key removes the limit. <a href="https://fdc.nal.usda.gov/api-key-signup" target="_blank" rel="noopener">Get a free key →</a>
      </div>

      <div class="list-header">Data</div>
      <div class="form-list">
        <button class="form-row" style="width:100%" onClick=${() => setSheet('foods')}>
          <span class="grow" style="text-align:left">My foods & meals</span>
          <span class="muted num">${s.customFoods.length}</span>
          <${Icon} name="chevron-right" style="color:var(--text-3);width:16px" />
        </button>
        <button class="form-row text-btn" style="width:100%" onClick=${exportData}><${Icon} name="download" /> Export backup</button>
        <button class="form-row text-btn" style="width:100%" onClick=${() => fileRef.current.click()}><${Icon} name="upload" /> Restore from backup</button>
        <button class="form-row text-btn" style="width:100%;color:var(--over)" onClick=${deleteAll}><${Icon} name="trash" /> Delete all diary entries</button>
        <input ref=${fileRef} type="file" accept="application/json,.json" hidden onChange=${importData} />
      </div>
      <div class="list-footer">Everything is stored on this device only. Export a backup now and then.</div>

      <div class="list-header">About</div>
      <div class="form-list">
        <div class="form-row"><span class="grow">Version</span><span class="muted">1.0 (web)</span></div>
        <div class="form-row"><span class="grow small muted">Install on iPhone: open in Safari → Share → Add to Home Screen.</span></div>
      </div>
      <div class="list-footer">Food data: USDA FoodData Central. Nutrition values are estimates for general wellness tracking and are not medical advice.</div>

      ${sheet === 'goals' && html`
        <${Sheet} onClose=${() => setSheet(null)} render=${(close) => html`
          <div class="sheet-head">
            <div class="left"><button class="text-btn" onClick=${close}>Cancel</button></div>
            <div class="title">Goal calculator</div><div class="right"></div>
          </div>
          <${GoalSetup} onSave=${() => { toast('Goals updated'); close(); }} />`} />`}

      ${sheet === 'foods' && html`
        <${Sheet} onClose=${() => setSheet(null)} render=${(close) => html`
          <div class="sheet-head">
            <div class="left"></div><div class="title">My foods & meals</div>
            <div class="right"><button class="text-btn" onClick=${close}>Done</button></div>
          </div>
          <div class="sheet-body">
            ${s.customFoods.length === 0
              ? html`<div class="center muted" style="padding:40px 20px">No saved foods yet. Create a food or save an AI-estimated meal and it shows up here.</div>`
              : html`<div class="list">${s.customFoods.map((f) => html`
                  <div class="list-row" key=${f.id}>
                    <div class="grow">
                      <div class="row-title ellipsis">${f.name}</div>
                      <div class="row-sub ellipsis">${f.servingLabel}</div>
                      <${Pills} n=${f} />
                    </div>
                    <div class="row-kcal"><div class="v num">${kcal(f.kcal)}</div><div class="u">kcal</div></div>
                    <button class="quick-add" style="color:var(--over)" aria-label=${`Delete ${f.name}`}
                      onClick=${() => confirm(`Delete “${f.name}”?`) && deleteCustomFood(f.id)}><${Icon} name="trash" style="width:20px;height:20px" /></button>
                  </div>`)}</div>`}
          </div>`} />`}
    </main>`;
}
