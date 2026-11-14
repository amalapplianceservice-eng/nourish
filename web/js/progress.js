import { html, useState } from '../vendor/preact-htm.js';
import { useStore, todayKey, addDays, parseDay, entryNutrition, sum, kcal, grams, scale, ZERO } from './store.js';
import { Icon, MacroDonut, Seg } from './ui.js';
import { t, locale } from './i18n.js';
import { localizeItem } from './foods.js';

function Tile({ icon, color, value, unit, label }) {
  return html`
    <div class="card" style="padding:14px">
      <div class="tile-icon" style=${`color:${color};background:color-mix(in srgb, ${color} 15%, transparent)`}><${Icon} name=${icon} /></div>
      <div class="row" style="gap:4px;align-items:baseline">
        <span class="tile-value num">${value}</span><span class="small muted">${unit}</span>
      </div>
      <div class="small muted">${label}</div>
    </div>`;
}

function CalorieChart({ days, goal }) {
  const W = 340, H = 200, left = 34, bottom = 22, top = 10;
  const maxVal = Math.max(goal * 1.25, ...days.map((d) => d.n.kcal * 1.08), 500);
  const plotH = H - bottom - top;
  const y = (v) => top + plotH * (1 - v / maxVal);
  const slot = (W - left) / days.length;
  const barW = Math.min(slot * 0.62, 30);
  const step = maxVal > 3000 ? 1000 : 500;
  const ticks = [];
  for (let v = 0; v <= maxVal; v += step) ticks.push(v);

  return html`
    <svg class="chart" viewBox=${`0 0 ${W} ${H}`} role="img" aria-label=${t('progress.chart')}>
      ${ticks.map((v) => html`
        <line x1=${left} x2=${W} y1=${y(v)} y2=${y(v)} stroke="var(--sep)" stroke-width="1" />
        <text x=${left - 6} y=${y(v) + 4} text-anchor="end">${v >= 1000 ? `${v / 1000}k` : v}</text>`)}
      ${days.map((d, i) => {
        const h = Math.max(0, y(0) - y(d.n.kcal));
        const x = left + slot * i + (slot - barW) / 2;
        const over = d.n.kcal > goal * 1.05;
        const label = days.length <= 7
          ? parseDay(d.day).toLocaleDateString(locale(), { weekday: 'narrow' })
          : (i % 7 === 0 ? parseDay(d.day).toLocaleDateString(locale(), { month: 'short', day: 'numeric' }) : '');
        return html`
          ${h > 0 && html`<rect x=${x} y=${y(d.n.kcal)} width=${barW} height=${h} rx=${Math.min(6, barW / 3)}
            fill=${over ? 'var(--over)' : 'var(--accent)'}><title>${`${d.day}: ${kcal(d.n.kcal)} ${t('u.kcal')}`}</title></rect>`}
          ${label && html`<text x=${left + slot * i + slot / 2} y=${H - 5} text-anchor=${days.length <= 7 ? 'middle' : 'start'}>${label}</text>`}`;
      })}
      <line x1=${left} x2=${W} y1=${y(goal)} y2=${y(goal)} stroke="var(--text-2)" stroke-width="1.5" stroke-dasharray="5 4" />
    </svg>`;
}

export function Progress() {
  const s = useStore();
  const [range, setRange] = useState(7);
  const today = todayKey();
  const goal = s.goals.calories;

  const byDay = {};
  for (const e of s.entries) (byDay[e.day] ||= []).push(e);
  const days = Array.from({ length: range }, (_, i) => {
    const day = addDays(today, -(range - 1 - i));
    return { day, n: sum((byDay[day] || []).map(entryNutrition)) };
  });
  const logged = days.filter((d) => d.n.kcal > 0);
  const avg = logged.length ? scale(sum(logged.map((d) => d.n)), 1 / logged.length) : ZERO;
  const onTarget = logged.filter((d) => d.n.kcal <= goal * 1.05).length;

  let streak = 0;
  for (let k = today; ; k = addDays(k, -1)) {
    if (byDay[k]?.length) streak++;
    else if (k !== today) break;
    if (streak > 3650) break;
  }

  const counts = {};
  const inRange = new Set(days.map((d) => d.day));
  s.entries.filter((e) => inRange.has(e.day)).map(localizeItem).forEach((e) => { counts[e.name] = (counts[e.name] || 0) + 1; });
  const top = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5);

  const pk = avg.p * 4, ck = avg.c * 4, fk = avg.f * 9, tot = Math.max(pk + ck + fk, 1);

  return html`
    <main class="screen">
      <h1 class="large-title">${t('tab.progress')}</h1>
      <div class="stack">
        <${Seg} value=${range} onChange=${setRange} options=${[{ value: 7, label: t('progress.7') }, { value: 30, label: t('progress.30') }]} />

        <div class="tiles">
          <${Tile} icon="flame" color="#FF9500" value=${kcal(avg.kcal)} unit=${t('u.kcal')} label=${t('progress.avg')} />
          <${Tile} icon="bolt" color="var(--accent)" value=${streak} unit=${t('u.days', { n: streak })} label=${t('progress.streak')} />
          <${Tile} icon="target" color="var(--fat)" value=${`${onTarget}/${logged.length}`} unit=${t('u.days', { n: logged.length })} label=${t('progress.onTarget')} />
          <${Tile} icon="pulse" color="var(--protein)" value=${grams(avg.p)} unit=${t('u.g')} label=${t('progress.avgProtein')} />
        </div>

        <section class="card">
          <div class="row" style="justify-content:space-between;margin-bottom:10px">
            <div class="card-title" style="margin:0">${t('progress.calories')}</div>
            <div class="small muted row" style="gap:6px"><span style="width:14px;border-top:2px dashed var(--text-2)"></span>${t('progress.goal', { n: goal })}</div>
          </div>
          <${CalorieChart} days=${days} goal=${goal} />
        </section>

        <section class="card">
          <div class="card-title">${t('progress.macros')}</div>
          <div class="nutri">
            <${MacroDonut} n=${avg} size=${96} width=${14} />
            <div class="grow">
              ${[[t('m.protein'), avg.p, pk, 'var(--protein)'], [t('m.carbs'), avg.c, ck, 'var(--carbs)'], [t('m.fat'), avg.f, fk, 'var(--fat)']].map(([label, g, k, c]) => html`
                <div class="macro-line">
                  <span class="dot" style=${`background:${c}`}></span>
                  <span class="muted grow">${label}</span>
                  <b class="num">${grams(g)} ${t('u.g')}</b>
                  <span class="muted num" style="width:40px;text-align:right">${Math.round((k / tot) * 100)}%</span>
                </div>`)}
            </div>
          </div>
        </section>

        ${top.length > 0 && html`
          <section class="card">
            <div class="card-title">${t('progress.top')}</div>
            <div class="stack" style="gap:10px">
              ${top.map(([name, count], i) => html`
                <div class="row">
                  <span class="rank" style=${`background:var(--accent);opacity:${1 - i * 0.14}`}>${i + 1}</span>
                  <span class="grow ellipsis">${name}</span>
                  <span class="muted num">${count}×</span>
                </div>`)}
            </div>
          </section>`}
        ${logged.length === 0 && html`<div class="center muted" style="padding:20px">${t('progress.empty')}</div>`}
      </div>
    </main>`;
}
