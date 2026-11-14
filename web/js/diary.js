import { html } from '../vendor/preact-htm.js';
import { useStore, setState, MEALS, todayKey, addDays, parseDay, dayKey, entryNutrition, sum, kcal, amountLabel } from './store.js';
import { Icon, CalorieRing, MacroBar, Pills } from './ui.js';

function dayTitle(k) {
  const t = todayKey();
  if (k === t) return 'Today';
  if (k === addDays(t, -1)) return 'Yesterday';
  if (k === addDays(t, 1)) return 'Tomorrow';
  return parseDay(k).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });
}

function WeekStrip({ day, setDay }) {
  const d = parseDay(day);
  const start = new Date(d);
  start.setDate(d.getDate() - d.getDay()); // week starts Sunday
  const days = Array.from({ length: 7 }, (_, i) => { const x = new Date(start); x.setDate(start.getDate() + i); return dayKey(x); });
  const today = todayKey();
  return html`
    <div class="week">
      <button class="week-shift" aria-label="Previous week" onClick=${() => setDay(addDays(day, -7))}><${Icon} name="chevron-left" /></button>
      ${days.map((k) => {
        const date = parseDay(k);
        return html`
          <button class=${'week-day' + (k === day ? ' selected' : '') + (k === today ? ' today' : '')} onClick=${() => setDay(k)}
            aria-label=${date.toDateString()}>
            <span class="wd">${date.toLocaleDateString(undefined, { weekday: 'narrow' })}</span>
            <span class="dn num">${date.getDate()}</span>
          </button>`;
      })}
      <button class="week-shift" aria-label="Next week" onClick=${() => setDay(addDays(day, 7))}><${Icon} name="chevron-right" /></button>
    </div>`;
}

function Stat({ icon, label, value, color }) {
  return html`
    <div class="stat">
      <div class="stat-icon" style=${`color:${color}; background: color-mix(in srgb, ${color} 15%, transparent)`}><${Icon} name=${icon} /></div>
      <div>
        <div class="stat-label">${label}</div>
        <div class="stat-value num">${kcal(value)}</div>
      </div>
    </div>`;
}

function InstallTip() {
  const s = useStore();
  const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent);
  const standalone = window.navigator.standalone || window.matchMedia('(display-mode: standalone)').matches;
  if (!isIOS || standalone || s.settings.hideInstallTip) return null;
  return html`
    <div class="card install-tip pop-in" style="margin-bottom: 14px">
      <img src="icons/apple-touch-icon.png" alt="" />
      <div class="grow small">
        <div class="semi">Install Nourish on your iPhone</div>
        <div class="muted">Tap <${Icon} name="share" style="width:14px;height:14px;vertical-align:-2px" /> Share, then <b>Add to Home Screen</b>.</div>
      </div>
      <button class="faint" aria-label="Dismiss" onClick=${() => setState((st) => ({ settings: { ...st.settings, hideInstallTip: true } }))}>
        <${Icon} name="x" />
      </button>
    </div>`;
}

export function Diary({ day, setDay, onAdd, onEdit }) {
  const s = useStore();
  const entries = s.entries.filter((e) => e.day === day).sort((a, b) => a.createdAt - b.createdAt);
  const total = sum(entries.map(entryNutrition));
  const g = s.goals;

  return html`
    <main class="screen">
      <div class="title-row">
        <h1 class="large-title">${dayTitle(day)}</h1>
        ${day !== todayKey() && html`<button class="text-btn" style="margin-bottom:14px" onClick=${() => setDay(todayKey())}>Today</button>`}
      </div>
      <${WeekStrip} day=${day} setDay=${setDay} />
      <${InstallTip} />

      <section class="card pad-lg">
        <div class="summary-top">
          <${CalorieRing} eaten=${total.kcal} goal=${g.calories} />
          <div class="col" style="gap: 14px">
            <${Stat} icon="flag" label="Goal" value=${g.calories} color="#8E8E93" />
            <${Stat} icon="utensils" label="Eaten" value=${total.kcal} color="var(--accent)" />
            <${Stat} icon="flame" label="Remaining" value=${Math.max(0, g.calories - total.kcal)} color="#FF9500" />
          </div>
        </div>
        <div class="macros">
          <${MacroBar} title="Protein" value=${total.p} goal=${g.protein} color="var(--protein)" />
          <${MacroBar} title="Carbs" value=${total.c} goal=${g.carbs} color="var(--carbs)" />
          <${MacroBar} title="Fat" value=${total.f} goal=${g.fat} color="var(--fat)" />
        </div>
      </section>

      ${MEALS.map((meal) => {
        const list = entries.filter((e) => e.meal === meal.id);
        const mealKcal = sum(list.map(entryNutrition)).kcal;
        return html`
          <section style="margin-top: 22px">
            <div class="meal-head">
              <div class="meal-emoji" style=${`background: color-mix(in srgb, ${meal.tint} 18%, transparent)`}>${meal.emoji}</div>
              <div class="meal-name">${meal.title}</div>
              ${mealKcal > 0 && html`<div class="meal-kcal num">${kcal(mealKcal)} kcal</div>`}
            </div>
            <div class="list">
              ${list.map((e) => {
                const n = entryNutrition(e);
                return html`
                  <button class="list-row" onClick=${() => onEdit(e)}>
                    <div class="grow">
                      <div class="row-title ellipsis">
                        ${e.name}${e.source === 'ai' && html` <span class="ai-text small">✦</span>`}
                      </div>
                      <div class="row-sub ellipsis">${[e.brand, amountLabel(e)].filter(Boolean).join(' · ')}</div>
                      <${Pills} n=${n} />
                    </div>
                    <div class="row-kcal"><div class="v num">${kcal(n.kcal)}</div><div class="u">kcal</div></div>
                  </button>`;
              })}
              <button class="list-row add-row" onClick=${() => onAdd(meal.id)}>
                <${Icon} name="plus" /> Add food
              </button>
            </div>
          </section>`;
      })}
    </main>`;
}
