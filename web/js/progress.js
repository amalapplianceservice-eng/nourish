import { html, useState } from '../vendor/preact-htm.js';
import { useStore, todayKey, addDays, parseDay, entryNutrition, sum, kcal, grams, scale, ZERO } from './store.js';
import { Icon, MacroDonut, Seg } from './ui.js';

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
    <svg class="chart" viewBox=${`0 0 ${W} ${H}`} role="img" aria-label="Daily calories chart">
      ${ticks.map((t) => html`
        <line x1=${left} x2=${W} y1=${y(t)} y2=${y(t)} stroke="var(--sep)" stroke-width="1" />
        <text x=${left - 6} y=${y(t) + 4} text-anchor="end">${t >= 1000 ? `${t / 1000}k` : t}</text>`)}
      ${days.map((d, i) => {
        const h = Math.max(0, y(0) - y(d.n.kcal));
        const x = left + slot * i + (slot - barW) / 2;
        const over = d.n.kcal > goal * 1.05;
        const label = days.length <= 7
          ? parseDay(d.day).toLocaleDateString(undefined, { weekday: 'narrow' })
          : (i % 7 === 0 ? parseDay(d.day).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '');
        return html`
          ${h > 0 && html`<rect x=${x} y=${y(d.n.kcal)} width=${barW} height=${h} rx=${Math.min(6, barW / 3)}
            fill=${over ? 'var(--over)' : 'var(--accent)'}><title>${`${d.day}: ${kcal(d.n.kcal)} kcal`}</title></rect>`}
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
  s.entries.filter((e) => inRange.has(e.day)).forEach((e) => { counts[e.name] = (counts[e.name] || 0) + 1; });
  const top = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5);

  const pk = avg.p * 4, ck = avg.c * 4, fk = avg.f * 9, tot = Math.max(pk + ck + fk, 1);

  return html`
    <main class="screen">
      <h1 class="large-title">Progress</h1>
      <div class="stack">
        <${Seg} value=${range} onChange=${setRange} options=${[{ value: 7, label: '7 days' }, { value: 30, label: '30 days' }]} />

        <div class="tiles">
          <${Tile} icon="flame" color="#FF9500" value=${kcal(avg.kcal)} unit="kcal" label="Daily average" />
          <${Tile} icon="bolt" color="var(--accent)" value=${streak} unit=${streak === 1 ? 'day' : 'days'} label="Logging streak" />
          <${Tile} icon="target" color="var(--fat)" value=${`${onTarget}/${logged.length}`} unit="days" label="On target" />
          <${Tile} icon="pulse" color="var(--protein)" value=${grams(avg.p)} unit="g" label="Avg protein" />
        </div>

        <section class="card">
          <div class="row" style="justify-content:space-between;margin-bottom:10px">
            <div class="card-title" style="margin:0">Calories</div>
            <div class="small muted row" style="gap:6px"><span style="width:14px;border-top:2px dashed var(--text-2)"></span>Goal ${goal}</div>
          </div>
          <${CalorieChart} days=${days} goal=${goal} />
        </section>

        <section class="card">
          <div class="card-title">Average macros</div>
          <div class="nutri">
            <${MacroDonut} n=${avg} size=${96} width=${14} />
            <div class="grow">
              ${[['Protein', avg.p, pk, 'var(--protein)'], ['Carbs', avg.c, ck, 'var(--carbs)'], ['Fat', avg.f, fk, 'var(--fat)']].map(([t, g, k, c]) => html`
                <div class="macro-line">
                  <span class="dot" style=${`background:${c}`}></span>
                  <span class="muted grow">${t}</span>
                  <b class="num">${grams(g)} g</b>
                  <span class="muted num" style="width:40px;text-align:right">${Math.round((k / tot) * 100)}%</span>
                </div>`)}
            </div>
          </div>
        </section>

        ${top.length > 0 && html`
          <section class="card">
            <div class="card-title">Most logged</div>
            <div class="stack" style="gap:10px">
              ${top.map(([name, count], i) => html`
                <div class="row">
                  <span class="rank" style=${`background:var(--accent);opacity:${1 - i * 0.14}`}>${i + 1}</span>
                  <span class="grow ellipsis">${name}</span>
                  <span class="muted num">${count}×</span>
                </div>`)}
            </div>
          </section>`}
        ${logged.length === 0 && html`<div class="center muted" style="padding:20px">Log a few meals and your trends will appear here.</div>`}
      </div>
    </main>`;
}
