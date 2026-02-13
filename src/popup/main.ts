import type { ActionType } from '../shared/types';

const app = document.getElementById('app');
if (!app) throw new Error('App root not found');

app.setAttribute('style', 'padding:12px;width:220px;font-family:sans-serif;background:#0f172a;color:#e2e8f0');
app.innerHTML = `
  <h3 style="margin:0 0 10px;font-size:14px;">Translatar</h3>
  <div style="display:grid;gap:8px;">
    <button data-action="correct">Correct English (Alt+E)</button>
    <button data-action="translate">Translate (Alt+T)</button>
    <button data-action="rewrite">Rewrite (Alt+R)</button>
  </div>
`;

async function trigger(action: ActionType): Promise<void> {
  await chrome.runtime.sendMessage({ type: 'trigger-action', action });
  window.close();
}

app.querySelectorAll('button[data-action]').forEach((button) => {
  button.addEventListener('click', () => {
    const action = button.getAttribute('data-action') as ActionType;
    void trigger(action);
  });
});
