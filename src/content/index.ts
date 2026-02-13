import { getOptions } from '../shared/storage';
import type { ActionType } from '../shared/types';

let lastFocusedEditable: HTMLElement | null = null;
let panelHost: HTMLDivElement | null = null;

document.addEventListener('focusin', (event) => {
  const target = event.target;
  if (target instanceof HTMLElement && isEditable(target)) {
    lastFocusedEditable = target;
  }
});

function isEditable(el: HTMLElement): boolean {
  return el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || el.isContentEditable;
}

function getSelectedText(): string {
  const selection = window.getSelection();
  return selection?.toString().trim() || '';
}

function getTextFromFocused(optionsReplace: 'selection' | 'all'): { text: string; canReplace: boolean } {
  const el = lastFocusedEditable;
  if (!el) return { text: '', canReplace: false };

  if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
    const value = el.value;
    const start = el.selectionStart ?? 0;
    const end = el.selectionEnd ?? 0;
    if (start !== end) {
      return { text: value.slice(start, end), canReplace: true };
    }
    if (optionsReplace === 'all') return { text: value, canReplace: true };
    return { text: value, canReplace: true };
  }

  const selected = window.getSelection()?.toString().trim();
  if (selected) return { text: selected, canReplace: true };
  return { text: el.textContent?.trim() || '', canReplace: true };
}

function replaceText(newText: string): void {
  const el = lastFocusedEditable;
  if (!el) return;

  if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
    const start = el.selectionStart ?? 0;
    const end = el.selectionEnd ?? 0;
    const replaceStart = start === end ? 0 : start;
    const replaceEnd = start === end ? el.value.length : end;
    el.value = `${el.value.slice(0, replaceStart)}${newText}${el.value.slice(replaceEnd)}`;
    el.dispatchEvent(new Event('input', { bubbles: true }));
    return;
  }

  if (el.isContentEditable) {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0 && !selection.isCollapsed) {
      selection.deleteFromDocument();
      selection.getRangeAt(0).insertNode(document.createTextNode(newText));
    } else {
      el.textContent = newText;
    }
    el.dispatchEvent(new Event('input', { bubbles: true }));
  }
}

function copyText(text: string): Promise<void> {
  return navigator.clipboard.writeText(text);
}

function panelPosition(): { x: number; y: number } {
  const selection = window.getSelection();
  if (selection && selection.rangeCount > 0) {
    const rect = selection.getRangeAt(0).getBoundingClientRect();
    if (rect.width || rect.height) {
      return { x: rect.left + window.scrollX, y: rect.bottom + window.scrollY + 8 };
    }
  }

  if (lastFocusedEditable) {
    const rect = lastFocusedEditable.getBoundingClientRect();
    return { x: rect.left + window.scrollX, y: rect.bottom + window.scrollY + 8 };
  }

  return { x: window.scrollX + 20, y: window.scrollY + 20 };
}

function closePanel(): void {
  panelHost?.remove();
  panelHost = null;
}

function showPanel(initialTitle: string, canReplace: boolean): {
  setLoading: (loading: boolean) => void;
  setError: (message: string) => void;
  setResult: (result: string) => void;
} {
  closePanel();
  panelHost = document.createElement('div');
  panelHost.style.position = 'absolute';
  panelHost.style.zIndex = '2147483647';
  const pos = panelPosition();
  panelHost.style.left = `${pos.x}px`;
  panelHost.style.top = `${pos.y}px`;

  const shadow = panelHost.attachShadow({ mode: 'open' });
  shadow.innerHTML = `
    <style>
      .card { width: 320px; background: #111827; color: #f9fafb; border-radius: 10px; padding: 12px; box-shadow: 0 8px 28px rgba(0,0,0,0.35); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
      .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
      .title { font-size: 13px; font-weight: 700; }
      .close { border: none; background: transparent; color: #9ca3af; cursor: pointer; font-size: 16px; }
      .status { font-size: 12px; color: #93c5fd; margin-bottom: 8px; }
      .error { color: #fca5a5; font-size: 12px; white-space: pre-wrap; }
      .result { white-space: pre-wrap; font-size: 13px; line-height: 1.4; max-height: 180px; overflow: auto; background: #1f2937; border-radius: 8px; padding: 8px; }
      .actions { display: flex; gap: 8px; margin-top: 10px; }
      button { border: none; border-radius: 8px; padding: 6px 10px; cursor: pointer; font-size: 12px; }
      .primary { background: #2563eb; color: white; }
      .secondary { background: #374151; color: #f9fafb; }
    </style>
    <div class="card">
      <div class="header"><div class="title">${initialTitle}</div><button class="close">×</button></div>
      <div class="status">Loading...</div>
      <div class="error" hidden></div>
      <div class="result" hidden></div>
      <div class="actions" hidden>
        <button class="secondary copy">Copy</button>
        <button class="primary replace" ${canReplace ? '' : 'hidden'}>Replace</button>
      </div>
    </div>
  `;

  const status = shadow.querySelector('.status') as HTMLDivElement;
  const error = shadow.querySelector('.error') as HTMLDivElement;
  const result = shadow.querySelector('.result') as HTMLDivElement;
  const actions = shadow.querySelector('.actions') as HTMLDivElement;
  const copyButton = shadow.querySelector('.copy') as HTMLButtonElement;
  const replaceButton = shadow.querySelector('.replace') as HTMLButtonElement;

  shadow.querySelector('.close')?.addEventListener('click', closePanel);

  let currentResult = '';
  copyButton.addEventListener('click', async () => {
    await copyText(currentResult);
    copyButton.textContent = 'Copied';
    setTimeout(() => {
      copyButton.textContent = 'Copy';
    }, 1200);
  });

  replaceButton?.addEventListener('click', () => {
    replaceText(currentResult);
    closePanel();
  });

  document.documentElement.appendChild(panelHost);

  return {
    setLoading(loading: boolean) {
      status.hidden = !loading;
      if (loading) status.textContent = 'Loading...';
    },
    setError(message: string) {
      status.hidden = true;
      error.hidden = false;
      error.textContent = message;
      result.hidden = true;
      actions.hidden = true;
    },
    setResult(resultText: string) {
      currentResult = resultText;
      status.hidden = true;
      error.hidden = true;
      result.hidden = false;
      result.textContent = resultText;
      actions.hidden = false;
    }
  };
}

function titleForAction(action: ActionType): string {
  if (action === 'correct') return 'Correct English';
  if (action === 'translate') return 'Translate';
  return 'Rewrite';
}

async function processAction(action: ActionType): Promise<void> {
  const options = await getOptions();
  const selectedText = getSelectedText();
  const fallback = getTextFromFocused(options.replaceStrategyDefault);
  const text = selectedText || fallback.text;
  const canReplace = fallback.canReplace;

  if (!options.showFloatingPanel) {
    chrome.runtime.sendMessage({ type: 'process-request', action, text }, (response: any) => {
      if (response?.ok && canReplace) replaceText(response.resultText);
    });
    return;
  }

  const panel = showPanel(titleForAction(action), canReplace);
  panel.setLoading(true);

  chrome.runtime.sendMessage({ type: 'process-request', action, text }, (response: any) => {
    if (chrome.runtime.lastError) {
      panel.setError(chrome.runtime.lastError.message);
      return;
    }

    if (!response?.ok) {
      panel.setError(response?.errorMessage || 'Request failed.');
      return;
    }

    panel.setResult(String(response.resultText || ''));
  });
}

chrome.runtime.onMessage.addListener((message: { type: string; action?: ActionType }, _sender: any, sendResponse: (response?: any) => void) => {
  if (message.type === 'trigger-action' && message.action) {
    processAction(message.action)
      .then(() => sendResponse({ ok: true }))
      .catch((error: unknown) => sendResponse({ ok: false, error: String(error) }));
    return true;
  }
  return false;
});
