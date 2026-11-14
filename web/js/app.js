import { html, render, useState } from '../vendor/preact-htm.js';
import { useStore, todayKey, suggestedMeal, getState } from './store.js';
import { t, lang } from './i18n.js';
import { Icon, Sheet, ToastHost } from './ui.js';
import { Diary } from './diary.js';
import { AddFood } from './add.js';
import { FoodDetail } from './detail.js';
import { Progress } from './progress.js';
import { Settings } from './settings.js';
import { Onboarding } from './goals.js';

const TABS = [
  { id: 'diary', icon: 'utensils' },
  { id: 'progress', icon: 'chart' },
  { id: 'settings', icon: 'sliders' },
];

function App() {
  const s = useStore();
  const [tab, setTab] = useState('diary');
  const [day, setDay] = useState(todayKey());
  const [sheet, setSheet] = useState(null);
  document.documentElement.lang = lang();

  if (!s.onboarded) return html`<${Onboarding} /><${ToastHost} />`;

  const openAdd = (meal) => setSheet({ type: 'add', meal: meal || (day === todayKey() ? suggestedMeal() : 'snacks') });
  const editing = sheet?.type === 'edit' ? s.entries.find((e) => e.id === sheet.id) : null;

  return html`
    <div class="app">
      ${tab === 'diary' && html`<${Diary} day=${day} setDay=${setDay} onAdd=${openAdd} onEdit=${(e) => setSheet({ type: 'edit', id: e.id })} />`}
      ${tab === 'progress' && html`<${Progress} />`}
      ${tab === 'settings' && html`<${Settings} />`}

      ${tab === 'diary' && html`
        <button class="fab" aria-label=${t('diary.addFood')} onClick=${() => openAdd()}><${Icon} name="plus" /></button>`}

      <nav class="tabbar">
        <div class="tabbar-inner">
          ${TABS.map((tb) => html`
            <button class=${'tab' + (tab === tb.id ? ' active' : '')} onClick=${() => { setTab(tb.id); window.scrollTo(0, 0); }}
              aria-current=${tab === tb.id ? 'page' : undefined}>
              <${Icon} name=${tb.icon} />${t(`tab.${tb.id}`)}
            </button>`)}
        </div>
      </nav>

      ${sheet?.type === 'add' && html`
        <${Sheet} onClose=${() => setSheet(null)}
          render=${(close) => html`<${AddFood} day=${day} initialMeal=${sheet.meal} close=${close} />`} />`}
      ${editing && html`
        <${Sheet} onClose=${() => setSheet(null)}
          render=${(close) => html`<${FoodDetail} mode="edit" entry=${editing} onBack=${close} onDone=${close} />`} />`}
      <${ToastHost} />
    </div>`;
}

render(html`<${App} />`, document.getElementById('app'));

// Expose for debugging in the console.
window.nourish = { getState };
