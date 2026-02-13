import type { ActionType } from '../shared/types';
import { getOptions } from '../shared/storage';

const app = document.getElementById('app');
if (!app) {
  console.error('App root not found');
  throw new Error('App root not found');
}

// State
let currentAction: ActionType = 'correct';

async function init() {
  const options = await getOptions();

  // Try to get selected text from active tab
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  let initialText = '';
  if (tab?.id) {
    try {
      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => window.getSelection()?.toString() || '',
      });
      initialText = results[0].result || '';
    } catch (e) {
      console.error('Failed to get selection:', e);
    }
  }

  if (!app) return;
  app.innerHTML = `
    <style>
      :host, .root {
        width: 380px;
        background: #0f172a;
        color: #f1f5f9;
        font-family: 'Inter', -apple-system, system-ui, sans-serif;
        padding: 16px;
        box-sizing: border-box;
      }
      .header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;
      }
      .title {
        font-size: 18px;
        font-weight: 700;
        background: linear-gradient(135deg, #60a5fa, #c084fc);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
      }
      .tabs {
        display: flex;
        background: #1e293b;
        padding: 4px;
        border-radius: 8px;
        margin-bottom: 16px;
      }
      .tab {
        flex: 1;
        padding: 6px;
        text-align: center;
        font-size: 13px;
        cursor: pointer;
        border-radius: 6px;
        transition: all 0.2s;
        color: #94a3b8;
      }
      .tab.active {
        background: #334155;
        color: #f8fafc;
        box-shadow: 0 1px 3px rgba(0,0,0,0.2);
      }
      .field-group {
        margin-bottom: 12px;
      }
      .label {
        font-size: 12px;
        font-weight: 600;
        color: #94a3b8;
        margin-bottom: 4px;
        display: block;
      }
      textarea {
        width: 100%;
        background: #1e293b;
        border: 1px solid #334155;
        border-radius: 8px;
        color: #f1f5f9;
        padding: 10px;
        font-size: 14px;
        resize: none;
        box-sizing: border-box;
        font-family: inherit;
        transition: border-color 0.2s;
      }
      textarea:focus {
        outline: none;
        border-color: #60a5fa;
      }
      .controls {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 12px;
      }
      select {
        background: #1e293b;
        border: 1px solid #334155;
        border-radius: 6px;
        color: #f1f5f9;
        padding: 4px 8px;
        font-size: 12px;
      }
      .btn-primary {
        width: 100%;
        background: #2563eb;
        color: white;
        border: none;
        border-radius: 8px;
        padding: 10px;
        font-weight: 600;
        cursor: pointer;
        transition: background 0.2s;
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 8px;
      }
      .btn-primary:hover {
        background: #1d4ed8;
      }
      .btn-primary:disabled {
        background: #334155;
        cursor: not-allowed;
        opacity: 0.7;
      }
      .output-group {
        margin-top: 16px;
        position: relative;
      }
      .output-area {
        min-height: 80px;
        background: #111827;
        border: 1px solid #1e293b;
        border-radius: 8px;
        padding: 10px;
        font-size: 14px;
        color: #e2e8f0;
        white-space: pre-wrap;
      }
      .output-area.error {
        color: #fca5a5;
        border-color: #7f1d1d;
      }
      .copy-btn {
        position: absolute;
        top: 28px;
        right: 8px;
        background: #334155;
        color: #f1f5f9;
        border: none;
        border-radius: 4px;
        padding: 4px 8px;
        font-size: 11px;
        cursor: pointer;
      }
      .copy-btn:hover {
        background: #475569;
      }
      .loader {
        width: 16px;
        height: 16px;
        border: 2px solid #ffffff33;
        border-top: 2px solid white;
        border-radius: 50%;
        animation: spin 1s linear infinite;
      }
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      [hidden] { display: none !important; }
    </style>
    <div class="root">
      <div class="header">
        <div class="title">Translatar</div>
      </div>

      <div class="tabs">
        <div class="tab active" data-action="correct">Correct</div>
        <div class="tab" data-action="translate">Translate</div>
        <div class="tab" data-action="rewrite">Rewrite</div>
      </div>

      <div class="field-group">
        <label class="label">Input</label>
        <textarea id="inputText" rows="4" placeholder="Type or paste text here...">${initialText}</textarea>
      </div>

      <div class="controls" id="translateControls" hidden>
        <label class="label" style="margin:0">To:</label>
        <select id="targetLang">
          <option value="zh-Hans">Chinese (Simplified)</option>
          <option value="en">English</option>
          <option value="ja">Japanese</option>
          <option value="ko">Korean</option>
          <option value="fr">French</option>
          <option value="es">Spanish</option>
        </select>
      </div>

      <div class="controls" id="rewriteControls" hidden>
        <label class="label" style="margin:0">Style:</label>
        <select id="rewriteStyle">
          <option value="concise">Concise</option>
          <option value="formal">Formal</option>
          <option value="casual">Casual</option>
        </select>
      </div>

      <button id="processBtn" class="btn-primary">
        <span>Correct English</span>
      </button>

      <div class="output-group">
        <label class="label">Result</label>
        <button id="copyBtn" class="copy-btn" hidden>Copy</button>
        <div id="outputArea" class="output-area">No result yet...</div>
      </div>
    </div>
  `;

  // UI Elements
  const tabs = document.querySelectorAll('.tab');
  const inputText = document.getElementById('inputText') as HTMLTextAreaElement;
  const processBtn = document.getElementById('processBtn') as HTMLButtonElement;
  const btnText = processBtn.querySelector('span')!;
  const outputArea = document.getElementById('outputArea') as HTMLDivElement;
  const translateControls = document.getElementById('translateControls')!;
  const rewriteControls = document.getElementById('rewriteControls')!;
  const targetLangSelect = document.getElementById('targetLang') as HTMLSelectElement;
  const rewriteStyleSelect = document.getElementById('rewriteStyle') as HTMLSelectElement;
  const copyBtn = document.getElementById('copyBtn') as HTMLButtonElement;

  // Set initial target lang from options
  targetLangSelect.value = options.targetLang;
  rewriteStyleSelect.value = options.rewriteStyleDefault;

  // Tab switching
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentAction = tab.getAttribute('data-action') as ActionType;

      // Update UI for mode
      translateControls.hidden = currentAction !== 'translate';
      rewriteControls.hidden = currentAction !== 'rewrite';

      const label = currentAction === 'correct' ? 'Correct English' :
        currentAction === 'translate' ? 'Translate Text' : 'Rewrite Text';
      btnText.textContent = label;
    });
  });

  // Processing
  processBtn.addEventListener('click', async () => {
    const text = inputText.value.trim();
    if (!text) return;

    processBtn.disabled = true;
    const originalBtnContent = processBtn.innerHTML;
    processBtn.innerHTML = '<div class="loader"></div> Processing...';
    outputArea.classList.remove('error');
    outputArea.textContent = 'Processing...';
    copyBtn.hidden = true;

    // Temporarily override options for this request if in Translate/Rewrite mode
    const requestOptions = { ...options };
    if (currentAction === 'translate') requestOptions.targetLang = targetLangSelect.value;
    if (currentAction === 'rewrite') requestOptions.rewriteStyleDefault = rewriteStyleSelect.value as any;

    chrome.runtime.sendMessage({
      type: 'process-request',
      action: currentAction,
      text
    }, (response: { ok: boolean; resultText?: string; errorMessage?: string }) => {
      processBtn.disabled = false;
      processBtn.innerHTML = originalBtnContent;

      if (response?.ok) {
        outputArea.textContent = response.resultText || 'Success (no text returned)';
        copyBtn.hidden = false;
      } else {
        outputArea.classList.add('error');
        outputArea.textContent = response?.errorMessage || 'An error occurred.';
      }
    });
  });

  // Copy
  copyBtn.addEventListener('click', () => {
    navigator.clipboard.writeText(outputArea.textContent || '');
    const originalText = copyBtn.textContent;
    copyBtn.textContent = 'Copied!';
    setTimeout(() => copyBtn.textContent = originalText, 1500);
  });
}

void init();
