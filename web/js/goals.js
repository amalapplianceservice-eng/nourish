import { html, useState } from '../vendor/preact-htm.js';
import { useStore, setState } from './store.js';
import { Icon, Seg, Wheel, range } from './ui.js';

const ACTIVITY = [
  { id: 'sedentary', title: 'Sedentary', sub: 'Desk job, little exercise', k: 1.2 },
  { id: 'light', title: 'Lightly active', sub: 'Exercise 1–3 days a week', k: 1.375 },
  { id: 'moderate', title: 'Moderately active', sub: 'Exercise 3–5 days a week', k: 1.55 },
  { id: 'active', title: 'Very active', sub: 'Hard exercise 6–7 days a week', k: 1.725 },
  { id: 'athlete', title: 'Athlete', sub: 'Physical job or twice-daily training', k: 1.9 },
];
const GOALS = [
  { id: 'lose', title: 'Lose weight', emoji: '📉', delta: -500 },
  { id: 'maintain', title: 'Maintain', emoji: '⚖️', delta: 0 },
  { id: 'gain', title: 'Build muscle', emoji: '💪', delta: 300 },
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

export function GoalSetup({ buttonTitle = 'Save goals', onSave }) {
  const s = useStore();
  const [p, setP] = useState(s.profile);
  const set = (patch) => setP({ ...p, ...patch });
  const t = calcTargets(p);
  const inches = Math.round(p.heightCm / 2.54);
  const lb = Math.round(p.weightKg * 2.20462);

  const save = () => { setState({ profile: p, goals: t }); onSave(); };

  return html`
    <div class="sheet-body stack" style="padding-bottom:24px">
      <section class="card">
        <div class="card-title">Your goal</div>
        <div class="row" style="gap:8px">
          ${GOALS.map((g) => html`
            <button class=${'goal-opt' + (p.goal === g.id ? ' on' : '')} onClick=${() => set({ goal: g.id })}>
              <span class="e">${g.emoji}</span>${g.title}
            </button>`)}
        </div>
      </section>

      <section class="card stack" style="gap:14px">
        <div class="row" style="justify-content:space-between">
          <div class="card-title" style="margin:0">About you</div>
          <div style="width:140px"><${Seg} value=${p.metric} onChange=${(v) => set({ metric: v })}
            options=${[{ value: true, label: 'kg/cm' }, { value: false, label: 'lb/ft' }]} /></div>
        </div>
        <${Seg} value=${p.sex} onChange=${(v) => set({ sex: v })} options=${[{ value: 'female', label: 'Female' }, { value: 'male', label: 'Male' }]} />
        <div class="wheels" key=${p.metric ? 'metric' : 'imperial'}>
          <div class="wheel-col">
            <div class="wheel-label">Age</div>
            <${Wheel} label="Age" values=${AGES} value=${p.age} onChange=${(v) => set({ age: v })} />
          </div>
          ${p.metric ? html`
            <div class="wheel-col">
              <div class="wheel-label">Height</div>
              <${Wheel} label="Height in centimeters" values=${CM} value=${Math.round(p.heightCm)}
                format=${(v) => `${v} cm`} onChange=${(v) => set({ heightCm: v })} />
            </div>
            <div class="wheel-col">
              <div class="wheel-label">Weight</div>
              <${Wheel} label="Weight in kilograms" values=${KG} value=${p.weightKg}
                format=${(v) => `${v} kg`} onChange=${(v) => set({ weightKg: v })} />
            </div>`
          : html`
            <div class="wheel-col" style="flex:1.3">
              <div class="wheel-label">Height</div>
              <div class="wheel-pair">
                <${Wheel} label="Height feet" values=${FEET} value=${Math.floor(inches / 12)}
                  format=${(v) => `${v}′`} onChange=${(v) => set({ heightCm: (v * 12 + (inches % 12)) * 2.54 })} />
                <${Wheel} label="Height inches" values=${INCHES} value=${inches % 12}
                  format=${(v) => `${v}″`} onChange=${(v) => set({ heightCm: (Math.floor(inches / 12) * 12 + v) * 2.54 })} />
              </div>
            </div>
            <div class="wheel-col">
              <div class="wheel-label">Weight</div>
              <${Wheel} label="Weight in pounds" values=${LBS} value=${lb}
                format=${(v) => `${v} lb`} onChange=${(v) => set({ weightKg: Math.round((v / 2.20462) * 10) / 10 })} />
            </div>`}
        </div>
      </section>

      <section class="card">
        <div class="card-title">Activity level</div>
        ${ACTIVITY.map((a) => html`
          <button class=${'activity' + (p.activity === a.id ? ' on' : '')} onClick=${() => set({ activity: a.id })}>
            <div class="grow"><div class="semi" style="font-size:15px">${a.title}</div><div class="small muted">${a.sub}</div></div>
            <span class=${'check' + (p.activity === a.id ? ' on' : '')}>${p.activity === a.id && html`<${Icon} name="check" />`}</span>
          </button>`)}
      </section>

      <section class="card pad-lg center">
        <div class="small semi muted">Your daily target</div>
        <div><span class="num" style="font-size:48px;font-weight:800;letter-spacing:-0.02em">${t.calories}</span> <span class="muted">kcal</span></div>
        <div class="row" style="justify-content:space-around;margin-top:8px">
          ${[['Protein', t.protein, 'var(--protein)'], ['Carbs', t.carbs, 'var(--carbs)'], ['Fat', t.fat, 'var(--fat)']].map(([n, v, c]) => html`
            <div><div class="bold num">${v} g</div><div class="small semi" style=${`color:${c}`}>${n}</div></div>`)}
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
          <div class="left"><button class="text-btn row" style="gap:2px" onClick=${() => setStep(0)}><${Icon} name="chevron-left" /> Back</button></div>
          <div class="title">Set your goals</div>
          <div class="right"></div>
        </div>
        <${GoalSetup} buttonTitle="Start tracking" onSave=${() => setState({ onboarded: true })} />
      </div>`;
  }

  return html`
    <div class="hero">
      <div style="flex:1"></div>
      <img class="hero-logo pop-in" src="icons/icon-512.png" alt="" />
      <h1>Nourish</h1>
      <p class="center muted" style="margin:0 0 30px;font-size:17px">Track what you eat in seconds.<br />Search foods or just describe your meal.</p>
      <div class="stack" style="gap:18px;margin-bottom:30px">
        ${[
          ['search', 'Huge food database', 'Common foods offline, plus 400k+ branded products.'],
          ['sparkles', 'AI meal estimates', 'Type “chicken bowl with rice” or snap a photo.'],
          ['chart', 'See your progress', 'Calories, macros, streaks and trends.'],
        ].map(([icon, title, sub]) => html`
          <div class="feature">
            <div class="feature-icon"><${Icon} name=${icon} /></div>
            <div><div class="semi">${title}</div><div class="small muted">${sub}</div></div>
          </div>`)}
      </div>
      <div style="flex:1"></div>
      <button class="btn" onClick=${() => setStep(1)}>Get started</button>
      <p class="center tiny faint" style="margin-top:12px">Your data stays on this device.</p>
    </div>`;
}
