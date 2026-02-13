import { DEFAULT_OPTIONS } from '../shared/constants';
import { getOptions, setOptions } from '../shared/storage';
import type { ExtensionOptions } from '../shared/types';

const app = document.getElementById('app');
if (!app) throw new Error('App root not found');

app.setAttribute('style', 'max-width:720px;margin:24px auto;font-family:sans-serif;line-height:1.5');
app.innerHTML = `
  <h1>Translatar Options</h1>
  <label>API Base URL<input id="apiBaseUrl" /></label>
  <label>Target Lang<input id="targetLang" /></label>
  <label>Source Lang<input id="sourceLang" /></label>
  <label>Rewrite Style
    <select id="rewriteStyleDefault">
      <option value="concise">concise</option>
      <option value="formal">formal</option>
      <option value="casual">casual</option>
    </select>
  </label>
  <label>Replace Strategy
    <select id="replaceStrategyDefault">
      <option value="selection">selection</option>
      <option value="all">all</option>
    </select>
  </label>
  <label><input type="checkbox" id="preserveFormatting"/> Preserve formatting</label>
  <label><input type="checkbox" id="showFloatingPanel"/> Show floating panel</label>
  <div style="margin-top:12px;">
    <button id="saveBtn">Save</button>
    <span id="status" style="margin-left:8px;"></span>
  </div>
  <style>
    label{display:block;margin:12px 0;}
    input,select{display:block;width:100%;max-width:480px;padding:8px;margin-top:4px;}
  </style>
`;

function byId<T extends HTMLElement>(id: string): T {
  const el = document.getElementById(id);
  if (!el) throw new Error(`Missing element: ${id}`);
  return el as T;
}

const apiBaseUrl = byId<HTMLInputElement>('apiBaseUrl');
const targetLang = byId<HTMLInputElement>('targetLang');
const sourceLang = byId<HTMLInputElement>('sourceLang');
const rewriteStyleDefault = byId<HTMLSelectElement>('rewriteStyleDefault');
const replaceStrategyDefault = byId<HTMLSelectElement>('replaceStrategyDefault');
const preserveFormatting = byId<HTMLInputElement>('preserveFormatting');
const showFloatingPanel = byId<HTMLInputElement>('showFloatingPanel');
const saveBtn = byId<HTMLButtonElement>('saveBtn');
const status = byId<HTMLSpanElement>('status');

function readForm(): ExtensionOptions {
  return {
    apiBaseUrl: apiBaseUrl.value,
    targetLang: targetLang.value,
    sourceLang: sourceLang.value,
    rewriteStyleDefault: rewriteStyleDefault.value as ExtensionOptions['rewriteStyleDefault'],
    preserveFormatting: preserveFormatting.checked,
    showFloatingPanel: showFloatingPanel.checked,
    replaceStrategyDefault: replaceStrategyDefault.value as ExtensionOptions['replaceStrategyDefault']
  };
}

function writeForm(options: ExtensionOptions): void {
  apiBaseUrl.value = options.apiBaseUrl;
  targetLang.value = options.targetLang;
  sourceLang.value = options.sourceLang;
  rewriteStyleDefault.value = options.rewriteStyleDefault;
  replaceStrategyDefault.value = options.replaceStrategyDefault;
  preserveFormatting.checked = options.preserveFormatting;
  showFloatingPanel.checked = options.showFloatingPanel;
}

void getOptions().then((options) => writeForm({ ...DEFAULT_OPTIONS, ...options }));

saveBtn.addEventListener('click', async () => {
  await setOptions(readForm());
  status.textContent = 'Saved';
  window.setTimeout(() => {
    status.textContent = '';
  }, 1500);
});
