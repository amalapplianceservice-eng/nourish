import { html } from '../vendor/preact-htm.js';
import { useStore, setState, MEALS, todayKey, addDays, parseDay, dayKey, entryNutrition, sum, kcal, amountLabel } from './store.js';
import { Icon, CalorieRing, MacroBar, Pills } from './ui.js';
import { localizeItem } from './foods.js';
import { t, locale, lang } from './i18n.js';

function dayTitle(k) {
  const today = todayKey();
  if (k === today) return t('day.today');
  if (k === addDays(today, -1)) return t('day.yesterday');
  if (k === addDays(today, 1)) return t('day.tomorrow');
  const s = parseDay(k).toLocaleDateString(locale(), { weekday: 'long', month: 'short', day: 'numeric' });
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function WeekStrip({ day, setDay }) {
  const d = parseDay(day);
  const start = new Date(d);
  const firstDay = lang() === 'en' ? 0 : 1; // US weeks start Sunday; ru/es/zh start Monday
  start.setDate(d.getDate() - ((d.getDay() - firstDay + 7) % 7));
  const days = Array.from({ length: 7 }, (_, i) => { const x = new Date(start); x.setDate(start.getDate() + i); return dayKey(x); });
  const today = todayKey();
  return html`
    <div class="week">
      <button class="week-shift" aria-label=${t('week.prev')} onClick=${() => setDay(addDays(day, -7))}><${Icon} name="chevron-left" /></button>
      ${days.map((k) => {
        const date = parseDay(k);
        return html`
          <button class=${'week-day' + (k === day ? ' selected' : '') + (k === today ? ' today' : '')} onClick=${() => setDay(k)}
            aria-label=${date.toDateString()}>
            <span class="wd">${date.toLocaleDateString(locale(), { weekday: 'narrow' })}</span>
            <span class="dn num">${date.getDate()}</span>
          </button>`;
      })}
      <button class="week-shift" aria-label=${t('week.next')} onClick=${() => setDay(addDays(day, 7))}><${Icon} name="chevron-right" /></button>
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
        <div class="semi">${t('install.title')}</div>
        <div class="muted">${t('install.before')} <${Icon} name="share" style="width:14px;height:14px;vertical-align:-2px" /> ${t('install.after')}</div>
      </div>
      <button class="faint" aria-label=${t('dismiss')} onClick=${() => setState((st) => ({ settings: { ...st.settings, hideInstallTip: true } }))}>
        <${Icon} name="x" />
      </button>
    </div>`;
}

export function Diary({ day, setDay, onAdd, onEdit }) {
  const s = useStore();
  const entries = s.entries.filter((e) => e.day === day).sort((a, b) => a.createdAt - b.createdAt).map(localizeItem);
  const total = sum(entries.map(entryNutrition));
  const g = s.goals;

  return html`
    <main class="screen">
      <div class="title-row">
        <h1 class="large-title">${dayTitle(day)}</h1>
        ${day !== todayKey() && html`<button class="text-btn" style="margin-bottom:14px" onClick=${() => setDay(todayKey())}>${t('day.today')}</button>`}
      </div>
      <${WeekStrip} day=${day} setDay=${setDay} />
      <${InstallTip} />

      <section class="card pad-lg">
        <div class="summary-top">
          <${CalorieRing} eaten=${total.kcal} goal=${g.calories} />
          <div class="col" style="gap: 14px">
            <${Stat} icon="flag" label=${t('diary.goal')} value=${g.calories} color="#8E8E93" />
            <${Stat} icon="utensils" label=${t('diary.eaten')} value=${total.kcal} color="var(--accent)" />
            <${Stat} icon="flame" label=${t('diary.remaining')} value=${Math.max(0, g.calories - total.kcal)} color="#FF9500" />
          </div>
        </div>
        <div class="macros">
          <${MacroBar} title=${t('m.protein')} value=${total.p} goal=${g.protein} color="var(--protein)" />
          <${MacroBar} title=${t('m.carbs')} value=${total.c} goal=${g.carbs} color="var(--carbs)" />
          <${MacroBar} title=${t('m.fat')} value=${total.f} goal=${g.fat} color="var(--fat)" />
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
              ${mealKcal > 0 && html`<div class="meal-kcal num">${kcal(mealKcal)} ${t('u.kcal')}</div>`}
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
                    <div class="row-kcal"><div class="v num">${kcal(n.kcal)}</div><div class="u">${t('u.kcal')}</div></div>
                  </button>`;
              })}
              <button class="list-row add-row" onClick=${() => onAdd(meal.id)}>
                <${Icon} name="plus" /> ${t('diary.addFood')}
              </button>
            </div>
          </section>`;
      })}
    </main>`;
}
