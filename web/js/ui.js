// Shared UI pieces: icons, rings, bars, sheets, toasts.
import { html, useState, useEffect, useRef, useLayoutEffect } from '../vendor/preact-htm.js';
import { kcal, grams } from './store.js';

// ---------- Icons (stroke icons, 24×24) ----------
const PATHS = {
  plus: 'M12 5v14M5 12h14',
  x: 'M18 6 6 18M6 6l12 12',
  check: 'M20 6 9 17l-5-5',
  'chevron-left': 'm15 18-6-6 6-6',
  'chevron-right': 'm9 18 6-6-6-6',
  'chevron-down': 'm6 9 6 6 6-6',
  search: 'M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM21 21l-4.3-4.3',
  trash: 'M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v6M14 11v6',
  camera: 'M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3zM12 16a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
  sparkles: 'M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9zM19 3v4M17 5h4M5 17v3M3.5 18.5h3',
  chart: 'M3 3v18h18M8 17v-6M13 17V7M18 17v-4',
  sliders: 'M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6',
  utensils: 'M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2M7 2v20M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3zm0 0v7',
  flame: 'M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.07-2.14-.22-4.05 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.15.43-2.29 1-3a2.5 2.5 0 0 0 2.5 2.5z',
  flag: 'M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1zM4 22v-7',
  leaf: 'M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10zM2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12',
  globe: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z',
  user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0',
  key: 'M7.5 21a5.5 5.5 0 1 0 0-11 5.5 5.5 0 0 0 0 11zM21 2l-9.6 9.6M15.5 7.5l3 3L22 7l-3-3',
  info: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 16v-4M12 8h.01',
  target: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 18a6 6 0 1 0 0-12 6 6 0 0 0 0 12zM12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4z',
  bolt: 'M13 2 3 14h9l-1 8 10-12h-9l1-8z',
  pulse: 'M22 12h-4l-3 9L9 3l-3 9H2',
  wand: 'M15 4V2M15 16v-2M8 9h2M20 9h2M17.8 11.8 19 13M15 9h.01M17.8 6.2 19 5M3 21l9-9M12.2 6.2 11 5',
  repeat: 'm17 1 4 4-4 4M3 11V9a4 4 0 0 1 4-4h14M7 23l-4-4 4-4M21 13v2a4 4 0 0 1-4 4H3',
  image: 'M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zM9 11a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM21 15l-5-5L5 21',
  share: 'M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8M16 6l-4-4-4 4M12 2v13',
  download: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3',
  upload: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12',
  alert: 'M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0zM12 9v4M12 17h.01',
  wifi: 'M5 12.55a11 11 0 0 1 14.08 0M1.42 9a16 16 0 0 1 21.16 0M8.53 16.11a6 6 0 0 1 6.95 0M12 20h.01',
  barcode: 'M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2M7 8v8M10.5 8v8M14 8v8M17 8v8',
  flashlight: 'M18 6c0 2-2 2-2 4v10a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2V10c0-2-2-2-2-4V2h12zM6 6h12M12 12v2',
};

export function Icon({ name, class: cls = '', style }) {
  return html`<svg class=${'icon ' + cls} style=${style} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d=${PATHS[name] || ''} /></svg>`;
}

// ---------- Rings & bars ----------
export function CalorieRing({ eaten, goal }) {
  const remaining = goal - eaten;
  const over = remaining < 0;
  const progress = goal > 0 ? Math.min(eaten / goal, 1) : 0;
  const r = 70, c = 2 * Math.PI * r;
  return html`
    <div class="ring-wrap" role="img" aria-label=${`${kcal(Math.abs(remaining))} calories ${over ? 'over' : 'remaining'}`}>
      <svg viewBox="0 0 164 164">
        <defs>
          <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="var(--accent-2)" />
            <stop offset="100%" stop-color="var(--accent)" />
          </linearGradient>
        </defs>
        <circle cx="82" cy="82" r=${r} fill="none" stroke="var(--accent-soft)" stroke-width="18" />
        <circle class="ring-progress" cx="82" cy="82" r=${r} fill="none"
          stroke=${over ? 'var(--over)' : 'url(#ringGrad)'} stroke-width="18" stroke-linecap="round"
          stroke-dasharray=${c} stroke-dashoffset=${c * (1 - progress)} />
      </svg>
      <div class="ring-center">
        <div class="ring-value num">${kcal(Math.abs(remaining))}</div>
        <div class="ring-label" style=${over ? 'color: var(--over)' : ''}>${over ? 'kcal over' : 'kcal left'}</div>
      </div>
    </div>`;
}

export function MacroBar({ title, value, goal, color }) {
  const pct = goal > 0 ? Math.min(value / goal, 1) * 100 : 0;
  return html`
    <div>
      <div class="macro-title">${title}</div>
      <div class="bar" style=${`background: color-mix(in srgb, ${color} 18%, transparent)`}>
        <div style=${`width: ${pct}%; background: ${color}`}></div>
      </div>
      <div class="macro-val num"><b>${grams(value)}</b><span class="muted"> / ${Math.round(goal)} g</span></div>
    </div>`;
}

export function MacroDonut({ n, size = 104, width = 10, children }) {
  const p = n.p * 4, cc = n.c * 4, f = n.f * 9;
  const total = p + cc + f;
  const r = (size - width) / 2, circ = 2 * Math.PI * r;
  let offset = 0;
  const parts = total > 0 ? [[p / total, 'var(--protein)'], [cc / total, 'var(--carbs)'], [f / total, 'var(--fat)']] : [];
  return html`
    <div class="donut" style=${`width:${size}px;height:${size}px`}>
      <svg viewBox=${`0 0 ${size} ${size}`}>
        <circle cx=${size / 2} cy=${size / 2} r=${r} fill="none" stroke="var(--field)" stroke-width=${width} />
        ${parts.map(([share, color]) => {
          const el = html`<circle cx=${size / 2} cy=${size / 2} r=${r} fill="none" stroke=${color} stroke-width=${width}
            stroke-dasharray=${`${share * circ} ${circ}`} stroke-dashoffset=${-offset * circ} />`;
          offset += share;
          return el;
        })}
      </svg>
      <div class="donut-center">${children}</div>
    </div>`;
}

export function Pills({ n }) {
  return html`
    <div class="pills num">
      <span class="pill"><span class="dot" style="background: var(--protein)"></span>P ${grams(n.p)}g</span>
      <span class="pill"><span class="dot" style="background: var(--carbs)"></span>C ${grams(n.c)}g</span>
      <span class="pill"><span class="dot" style="background: var(--fat)"></span>F ${grams(n.f)}g</span>
    </div>`;
}

export function Seg({ options, value, onChange }) {
  return html`
    <div class="seg" role="tablist">
      ${options.map((o) => html`
        <button role="tab" aria-selected=${o.value === value} class=${o.value === value ? 'on' : ''}
          onClick=${() => onChange(o.value)}>${o.label}</button>`)}
    </div>`;
}

export function Toggle({ checked, onChange, label }) {
  return html`<input type="checkbox" class="toggle" aria-label=${label} checked=${checked}
    onChange=${(e) => onChange(e.currentTarget.checked)} />`;
}

// ---------- Scroll wheel picker (iOS-style) ----------
const ROW = 40;

/** Scroll or tap to choose a value. `values` is an array; `format` renders each one. */
export function Wheel({ values, value, onChange, format = (v) => v, label }) {
  const ref = useRef();
  const nearest = () => {
    let best = 0;
    values.forEach((v, i) => { if (Math.abs(v - value) < Math.abs(values[best] - value)) best = i; });
    return best;
  };
  const [active, setActive] = useState(nearest);
  const timer = useRef();

  // Position on mount, and when the value changes from outside (not from our own scrolling).
  useLayoutEffect(() => {
    const i = nearest();
    if (Math.round(ref.current.scrollTop / ROW) !== i) ref.current.scrollTop = i * ROW;
    setActive(i);
  }, [value, values.length]);

  const onScroll = () => {
    const i = Math.max(0, Math.min(values.length - 1, Math.round(ref.current.scrollTop / ROW)));
    if (i !== active) { setActive(i); navigator.vibrate?.(3); }
    clearTimeout(timer.current);
    timer.current = setTimeout(() => { if (values[i] !== value) onChange(values[i]); }, 120);
  };

  const pick = (i) => ref.current.scrollTo({ top: i * ROW, behavior: 'smooth' });

  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      pick(Math.max(0, Math.min(values.length - 1, active + (e.key === 'ArrowDown' ? 1 : -1))));
    }
  };

  return html`
    <div class="wheel" role="listbox" aria-label=${label} tabindex="0" onKeyDown=${onKeyDown}>
      <div class="wheel-band"></div>
      <div class="wheel-scroll" ref=${ref} onScroll=${onScroll}>
        ${values.map((v, i) => html`
          <div key=${v} class=${'wheel-item num' + (i === active ? ' on' : '')} role="option" aria-selected=${i === active}
            onClick=${() => pick(i)}>${format(v)}</div>`)}
      </div>
    </div>`;
}

export const range = (from, to, step = 1) => Array.from({ length: Math.floor((to - from) / step) + 1 }, (_, i) => from + i * step);

// ---------- Bottom sheet ----------
/** Full-height bottom sheet. `render(close)` draws the content so it can animate itself closed. */
export function Sheet({ onClose, render }) {
  const [closing, setClosing] = useState(false);
  const close = () => { setClosing(true); setTimeout(onClose, 230); };

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => e.key === 'Escape' && close();
    window.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = prev; window.removeEventListener('keydown', onKey); };
  }, []);

  return html`
    <div class=${'sheet-backdrop' + (closing ? ' closing' : '')} onClick=${close}></div>
    <div class=${'sheet' + (closing ? ' closing' : '')} role="dialog" aria-modal="true">
      <div class="sheet-grabber"></div>
      ${render(close)}
    </div>`;
}

// ---------- Toast ----------
let toastSetter = null;
let toastTimer = null;
export function toast(message) {
  if (!toastSetter) return;
  toastSetter(message);
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastSetter(null), 1800);
  navigator.vibrate?.(10);
}
export function ToastHost() {
  const [msg, setMsg] = useState(null);
  useEffect(() => { toastSetter = setMsg; return () => { toastSetter = null; }; }, []);
  return msg ? html`<div class="toast" role="status"><${Icon} name="check" />${msg}</div>` : null;
}
