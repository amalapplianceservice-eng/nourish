import { html, useState } from '../vendor/preact-htm.js';
import { useStore, setState } from './store.js';
import { Icon, Seg, Wheel, range } from './ui.js';
import { t, LANGS, lang } from './i18n.js';

const ACTIVITY = [
  { id: 'sedentary', k: 1.2 },
  { id: 'light', k: 1.375 },
  { id: 'moderate', k: 1.55 },
  { id: 'active', k: 1.725 },
  { id: 'athlete', k: 1.9 },
];
const GOALS = [
  { id: 'lose', emoji: '📉', delta: -500 },
  { id: 'maintain', emoji: '⚖️', delta: 0 },
  { id: 'gain', emoji: '💪', delta: 300 },
];

/** Mifflin–St Jeor BMR × activity, adjusted for goal; protein by body weight, fat 27%, carbs the rest. */
export function calcTargets(p) {
  const bmr = 10 * p.weightKg + 6.25 * p.heightCm - 5 * p.age + (p.sex === 'male' ? 5 : -161);
  const act = ACTIVITY.find((a) => a.id === p.activity) || ACTIVITY[1];
  const goal = GOALS.find((g) => g.id === p.goal) || GOALS[1];
  const floor = p.sex === 'male' ? 1500 : 1200;
  const calories = Math.max(floor, Math.round((bmr * act.k + goal.delta) / 10) * 10);
  const protein = Math.round(p.weightKg * (goal.id === 'maintain' ? 1.6 : 2.0));
  const fat = Math.round((calories * 0.27) / 9);
  const carbs = Math.max(50, Math.round((calories - protein * 4 - fat * 9) / 4));
  return { calories, protein, carbs, fat };
}

const AGES = range(13, 100);
const CM = range(120, 230);
const KG = range(30, 250);
const FEET = range(4, 7);
const INCHES = range(0, 11);
const LBS = range(66, 550);

export function GoalSetup({ buttonTitle = t('goal.save'), onSave }) {
  const s = useStore();
  const [p, setP] = useState(s.profile);
  const set = (patch) => setP({ ...p, ...patch });
  const tg = calcTargets(p);
  const inches = Math.round(p.heightCm / 2.54);
  const lb = Math.round(p.weightKg * 2.20462);

  const save = () => { setState({ profile: p, goals: tg }); onSave(); };

  return html`
    <div class="sheet-body stack" style="padding-bottom:24px">
      <section class="card">
        <div class="card-title">${t('goal.your')}</div>
        <div class="row" style="gap:8px">
          ${GOALS.map((g) => html`
            <button class=${'goal-opt' + (p.goal === g.id ? ' on' : '')} onClick=${() => set({ goal: g.id })}>
              <span class="e">${g.emoji}</span>${t(`goal.${g.id}`)}
            </button>`)}
        </div>
      </section>

      <section class="card stack" style="gap:14px">
        <div class="row" style="justify-content:space-between">
          <div class="card-title" style="margin:0">${t('goal.about')}</div>
          <div style="width:140px"><${Seg} value=${p.metric} onChange=${(v) => set({ metric: v })}
            options=${[{ value: true, label: `${t('u.kg')}/${t('u.cm')}` }, { value: false, label: 'lb/ft' }]} /></div>
        </div>
        <${Seg} value=${p.sex} onChange=${(v) => set({ sex: v })} options=${[{ value: 'female', label: t('sex.female') }, { value: 'male', label: t('sex.male') }]} />
        <div class="wheels" key=${p.metric ? 'metric' : 'imperial'}>
          <div class="wheel-col">
            <div class="wheel-label">${t('age')}</div>
            <${Wheel} label=${t('age')} values=${AGES} value=${p.age} onChange=${(v) => set({ age: v })} />
          </div>
          ${p.metric ? html`
            <div class="wheel-col">
              <div class="wheel-label">${t('height')}</div>
              <${Wheel} label=${t('height')} values=${CM} value=${Math.round(p.heightCm)}
                format=${(v) => `${v} ${t('u.cm')}`} onChange=${(v) => set({ heightCm: v })} />
            </div>
            <div class="wheel-col">
              <div class="wheel-label">${t('weight')}</div>
              <${Wheel} label=${t('weight')} values=${KG} value=${p.weightKg}
                format=${(v) => `${v} ${t('u.kg')}`} onChange=${(v) => set({ weightKg: v })} />
            </div>`
          : html`
            <div class="wheel-col" style="flex:1.3">
              <div class="wheel-label">${t('height')}</div>
              <div class="wheel-pair">
                <${Wheel} label=${t('height')} values=${FEET} value=${Math.floor(inches / 12)}
                  format=${(v) => `${v}′`} onChange=${(v) => set({ heightCm: (v * 12 + (inches % 12)) * 2.54 })} />
                <${Wheel} label=${t('height')} values=${INCHES} value=${inches % 12}
                  format=${(v) => `${v}″`} onChange=${(v) => set({ heightCm: (Math.floor(inches / 12) * 12 + v) * 2.54 })} />
              </div>
            </div>
            <div class="wheel-col">
              <div class="wheel-label">${t('weight')}</div>
              <${Wheel} label=${t('weight')} values=${LBS} value=${lb}
                format=${(v) => `${v} ${t('u.lb')}`} onChange=${(v) => set({ weightKg: Math.round((v / 2.20462) * 10) / 10 })} />
            </div>`}
        </div>
      </section>

      <section class="card">
        <div class="card-title">${t('goal.activity')}</div>
        ${ACTIVITY.map((a) => html`
          <button class=${'activity' + (p.activity === a.id ? ' on' : '')} onClick=${() => set({ activity: a.id })}>
            <div class="grow"><div class="semi" style="font-size:15px">${t(`act.${a.id}`)}</div><div class="small muted">${t(`act.${a.id}.sub`)}</div></div>
            <span class=${'check' + (p.activity === a.id ? ' on' : '')}>${p.activity === a.id && html`<${Icon} name="check" />`}</span>
          </button>`)}
      </section>

      <section class="card pad-lg center">
        <div class="small semi muted">${t('goal.target')}</div>
        <div><span class="num" style="font-size:48px;font-weight:800;letter-spacing:-0.02em">${tg.calories}</span> <span class="muted">${t('u.kcal')}</span></div>
        <div class="row" style="justify-content:space-around;margin-top:8px">
          ${[[t('m.protein'), tg.protein, 'var(--protein)'], [t('m.carbs'), tg.carbs, 'var(--carbs)'], [t('m.fat'), tg.fat, 'var(--fat)']].map(([n, v, c]) => html`
            <div><div class="bold num">${v} ${t('u.g')}</div><div class="small semi" style=${`color:${c}`}>${n}</div></div>`)}
        </div>
      </section>

      <button class="btn" onClick=${save}>${buttonTitle}</button>
    </div>`;
}

export function Onboarding() {
  const [step, setStep] = useState(0);

  if (step === 1) {
    return html`
      <div class="app" style="display:flex;flex-direction:column;min-height:100dvh;padding-top:var(--safe-top)">
        <div class="sheet-head">
          <div class="left"><button class="text-btn row" style="gap:2px" onClick=${() => setStep(0)}><${Icon} name="chevron-left" /> ${t('back')}</button></div>
          <div class="title">${t('onb.setGoals')}</div>
          <div class="right"></div>
        </div>
        <${GoalSetup} buttonTitle=${t('onb.track')} onSave=${() => setState({ onboarded: true })} />
      </div>`;
  }

  return html`
    <div class="hero">
      <div class="row" style="justify-content:flex-end">
        <${LangSelect} />
      </div>
      <div style="flex:1"></div>
      <img class="hero-logo pop-in" src="icons/icon-512.png" alt="" />
      <h1>Nourish</h1>
      <p class="center muted" style="margin:0 0 30px;font-size:17px;white-space:pre-line">${t('onb.tagline')}</p>
      <div class="stack" style="gap:18px;margin-bottom:30px">
        ${[
          ['search', t('onb.f1'), t('onb.f1s')],
          ['sparkles', t('onb.f2'), t('onb.f2s')],
          ['chart', t('onb.f3'), t('onb.f3s')],
        ].map(([icon, title, sub]) => html`
          <div class="feature">
            <div class="feature-icon"><${Icon} name=${icon} /></div>
            <div><div class="semi">${title}</div><div class="small muted">${sub}</div></div>
          </div>`)}
      </div>
      <div style="flex:1"></div>
      <button class="btn" onClick=${() => setStep(1)}>${t('onb.start')}</button>
      <p class="center tiny faint" style="margin-top:12px">${t('onb.private')}</p>
    </div>`;
}

/** Compact language menu (globe + current language). Choosing a non-English language also defaults to metric units. */
export function LangSelect() {
  useStore();
  return html`
    <label class="lang-select">
      <${Icon} name="globe" />
      <select value=${lang()} aria-label=${t('language')}
        onChange=${(e) => {
          const v = e.currentTarget.value;
          setState((st) => ({ settings: { ...st.settings, lang: v }, profile: { ...st.profile, metric: v !== 'en' || st.profile.metric } }));
        }}>
        ${LANGS.map((l) => html`<option value=${l.id}>${l.label}</option>`)}
      </select>
    </label>`;
}
