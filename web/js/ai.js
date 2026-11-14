import { html, useState, useRef } from '../vendor/preact-htm.js';
import { useStore, setState, mealById, addEntry, addCustomFood, sum, kcal } from './store.js';
import { estimateMeal, prepareImage } from './api.js';
import { Icon, Pills, Toggle, toast } from './ui.js';
import { t } from './i18n.js';


const CONF_COLOR = { high: 'var(--accent)', medium: 'var(--fat)', low: '#FF9500' };

/** Describe a meal in plain words (optionally with a photo); Claude breaks it into foods with calories & macros. */
export function AIMeal({ day, meal, onDone }) {
  const s = useStore();
  const [text, setText] = useState('');
  const [photo, setPhoto] = useState(null); // { base64, preview }
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [included, setIncluded] = useState(new Set());
  const [saveMeal, setSaveMeal] = useState(false);
  const [keyDraft, setKeyDraft] = useState('');
  const cameraRef = useRef();
  const libraryRef = useRef();

  const hasKey = !!s.settings.anthropicKey;
  const selected = result ? result.items.filter((i) => included.has(i.id)) : [];
  const total = sum(selected);
  const canEstimate = hasKey && !loading && (text.trim() || photo);

  const onFile = async (e) => {
    const file = e.currentTarget.files?.[0];
    e.currentTarget.value = '';
    if (!file) return;
    try { setPhoto(await prepareImage(file)); } catch { setError(t('ai.photoError')); }
  };

  const run = async () => {
    setError(null);
    setLoading(true);
    document.activeElement?.blur?.();
    try {
      const r = await estimateMeal({ text, imageBase64: photo?.base64, apiKey: s.settings.anthropicKey });
      setResult(r);
      setIncluded(new Set(r.items.map((i) => i.id)));
      if (!r.items.length) setError(r.assumptions || t('ai.noFoods'));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const toggle = (id) => setIncluded((prev) => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  const log = () => {
    selected.forEach((item) => addEntry(item, { meal, day }));
    if (saveMeal) {
      const g = selected.reduce((a, i) => a + (i.servingGrams || 0), 0);
      addCustomFood({
        name: result.mealName, brand: null,
        servingLabel: selected.map((i) => i.name).join(', '),
        servingGrams: g > 0 ? g : null,
        kcal: total.kcal, p: total.p, c: total.c, f: total.f,
      });
    }
    toast(t('toast.logged', { n: selected.length }));
    onDone();
  };

  const saveKey = () => {
    const key = keyDraft.trim();
    setState((st) => ({ settings: { ...st.settings, anthropicKey: key } }));
    setKeyDraft('');
  };

  return html`
    <div class="sheet-body stack" style="padding-top:2px">
      ${!hasKey && html`
        <section class="card stack" style="gap:10px">
          <div class="row semi"><${Icon} name="key" /> ${t('ai.connect')}</div>
          <div class="small muted">${t('ai.connectBody')}</div>
          <div class="row">
            <input class="field grow" type="password" placeholder="sk-ant-…" value=${keyDraft} autocomplete="off"
              onInput=${(e) => setKeyDraft(e.currentTarget.value)} aria-label=${t('settings.anthropicKey')} />
            <button class="chip on" disabled=${!keyDraft.trim()} onClick=${saveKey}>${t('save')}</button>
          </div>
          <a class="small semi" href="https://console.anthropic.com/settings/keys" target="_blank" rel="noopener">${t('ai.getKey')}</a>
        </section>`}

      <section class="card stack" style="gap:12px">
        <div class="ai-badge"><span class="ai-text">${t('ai.question')}</span></div>
        <textarea class="field" rows="4" value=${text} aria-label=${t('ai.question')}
          placeholder=${t('ai.placeholder')}
          onInput=${(e) => setText(e.currentTarget.value)}></textarea>
        <div class="row">
          <button class="chip row" style="gap:6px" onClick=${() => cameraRef.current.click()}><${Icon} name="camera" style="width:17px;height:17px" />${t('ai.camera')}</button>
          <button class="chip row" style="gap:6px" onClick=${() => libraryRef.current.click()}><${Icon} name="image" style="width:17px;height:17px" />${t('ai.photo')}</button>
          <input ref=${cameraRef} type="file" accept="image/*" capture="environment" hidden onChange=${onFile} />
          <input ref=${libraryRef} type="file" accept="image/*" hidden onChange=${onFile} />
          ${photo && html`
            <div class="thumb-wrap pop-in">
              <img class="photo-thumb" src=${photo.preview} alt="" />
              <button class="thumb-x" aria-label=${t('ai.removePhoto')} onClick=${() => setPhoto(null)}><${Icon} name="x" /></button>
            </div>`}
        </div>
      </section>

      ${!text && !result && html`
        <div class="chips">
          ${t('ai.examples').map((ex) => html`<button class="chip" style="background:var(--card);font-weight:500;font-size:13px" onClick=${() => setText(ex)}>${ex}</button>`)}
        </div>`}

      <button class="btn ai" disabled=${!canEstimate} onClick=${run}>
        ${loading ? html`<span class="spinner"></span> ${t('ai.analyzing')}` : html`<${Icon} name="wand" /> ${result ? t('ai.reestimate') : t('ai.estimate')}`}
      </button>

      ${error && html`<div class="error pop-in"><${Icon} name="alert" />${error}</div>`}

      ${loading && !result && html`
        <section class="card stack" style="gap:10px">
          <div class="shimmer" style="height:22px;width:55%"></div>
          <div class="shimmer" style="height:40px;width:35%"></div>
          <div class="shimmer" style="height:16px"></div>
          <div class="shimmer" style="height:16px;width:80%"></div>
        </section>`}

      ${result && result.items.length > 0 && html`
        <section class="card pad-lg stack pop-in" style="gap:14px">
          <div class="row" style="justify-content:space-between;align-items:flex-start">
            <div class="bold" style="font-size:20px">${result.mealName}</div>
            <span class="conf" style=${`color:${CONF_COLOR[result.confidence]};background:color-mix(in srgb, ${CONF_COLOR[result.confidence]} 15%, transparent)`}>
              ${t(`conf.${result.confidence}`)}
            </span>
          </div>
          <div class="row" style="align-items:baseline">
            <span class="num" style="font-size:40px;font-weight:800;letter-spacing:-0.02em">${kcal(total.kcal)}</span>
            <span class="muted">${t('u.kcal')}</span>
            <div class="grow"></div>
            <${Pills} n=${total} />
          </div>
          <div>
            ${result.items.map((item, i) => {
              const on = included.has(item.id);
              return html`
                <button class="row" style=${'width:100%;text-align:left;padding:10px 0' + (i ? ';border-top:0.5px solid var(--sep)' : '')} onClick=${() => toggle(item.id)}>
                  <span class=${'check' + (on ? ' on' : '')}>${on && html`<${Icon} name="check" />`}</span>
                  <div class="grow">
                    <div class="semi" style="font-size:15px">${item.name}</div>
                    <div class="small muted">${item.servingLabel}</div>
                  </div>
                  <span class=${'semi num' + (on ? '' : ' muted')}>${kcal(item.kcal)}</span>
                </button>`;
            })}
          </div>
          ${result.assumptions && html`<div class="small muted row" style="align-items:flex-start;gap:6px"><${Icon} name="info" style="width:15px;height:15px;margin-top:2px" />${result.assumptions}</div>`}
          <div class="row">
            <div class="grow">
              <div class="semi" style="font-size:15px">${t('ai.saveMeal')}</div>
              <div class="small muted">${t('ai.saveMealSub')}</div>
            </div>
            <${Toggle} checked=${saveMeal} onChange=${setSaveMeal} label=${t('ai.saveMeal')} />
          </div>
          <button class="btn" disabled=${!selected.length} onClick=${log}>
            <${Icon} name="plus" /> ${t('ai.log', { n: selected.length, meal: mealById(meal).title })}
          </button>
        </section>`}
    </div>`;
}
