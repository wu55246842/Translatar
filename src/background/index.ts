import { MENU_IDS } from '../shared/constants';
import { getOptions } from '../shared/storage';
import type { ActionType, CollectTextMessage, ProcessRequestMessage, TriggerActionMessage } from '../shared/types';
import { callApi } from './apiClient';

let requestChain: Promise<void> = Promise.resolve();

function queueTask<T>(task: () => Promise<T>): Promise<T> {
  const run = requestChain.then(task, task);
  requestChain = run.then(
    () => undefined,
    () => undefined
  );
  return run;
}

function menuToAction(menuId: string): ActionType | null {
  if (menuId === MENU_IDS.correct) return 'correct';
  if (menuId === MENU_IDS.translate) return 'translate';
  if (menuId === MENU_IDS.rewrite) return 'rewrite';
  return null;
}

async function sendTriggerToTab(tabId: number, action: ActionType): Promise<void> {
  await chrome.tabs.sendMessage(tabId, { type: 'trigger-action', action } satisfies TriggerActionMessage);
}

async function triggerOnActiveTab(action: ActionType): Promise<void> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) return;
  await sendTriggerToTab(tab.id, action);
}

function initContextMenus(): void {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({ id: MENU_IDS.correct, title: 'Correct English', contexts: ['selection'] });
    chrome.contextMenus.create({ id: MENU_IDS.translate, title: 'Translate', contexts: ['selection'] });
    chrome.contextMenus.create({ id: MENU_IDS.rewrite, title: 'Rewrite', contexts: ['selection'] });
  });
}

chrome.runtime.onInstalled.addListener(() => {
  initContextMenus();
});

chrome.contextMenus.onClicked.addListener(async (info: any, tab: any) => {
  const action = menuToAction(String(info.menuItemId));
  if (!action || !tab?.id) return;
  await sendTriggerToTab(tab.id, action);
});

chrome.commands.onCommand.addListener(async (command: string) => {
  if (command === 'correct-english') await triggerOnActiveTab('correct');
  if (command === 'translate') await triggerOnActiveTab('translate');
  if (command === 'rewrite') await triggerOnActiveTab('rewrite');
});

chrome.runtime.onMessage.addListener((message: TriggerActionMessage | ProcessRequestMessage | CollectTextMessage, sender: any, sendResponse: (response?: any) => void) => {
  if (message.type === 'trigger-action') {
    if (sender.tab?.id) {
      sendTriggerToTab(sender.tab.id, message.action)
        .then(() => sendResponse({ ok: true }))
        .catch((err: unknown) => sendResponse({ ok: false, error: String(err) }));
      return true;
    }

    triggerOnActiveTab(message.action)
      .then(() => sendResponse({ ok: true }))
      .catch((err: unknown) => sendResponse({ ok: false, error: String(err) }));
    return true;
  }

  if (message.type === 'process-request') {
    queueTask(async () => {
      const options = await getOptions();
      if (!message.text.trim()) {
        sendResponse({ ok: false, errorMessage: 'No text selected or focused.' });
        return;
      }

      try {
        if (message.action === 'correct') {
          const result = await callApi(
            'correct',
            { text: message.text, preserveFormatting: options.preserveFormatting },
            options
          );
          if (result.ok) sendResponse({ ok: true, resultText: result.resultText });
          else sendResponse({ ok: false, errorMessage: `${result.error.code}: ${result.error.message}` });
          return;
        }

        if (message.action === 'translate') {
          const result = await callApi(
            'translate',
            {
              text: message.text,
              targetLang: message.targetLang || options.targetLang,
              sourceLang: message.sourceLang || options.sourceLang,
              preserveFormatting: options.preserveFormatting
            },
            options
          );
          if (result.ok) sendResponse({ ok: true, resultText: result.resultText });
          else sendResponse({ ok: false, errorMessage: `${result.error.code}: ${result.error.message}` });
          return;
        }

        const result = await callApi(
          'rewrite',
          {
            text: message.text,
            style: message.style || options.rewriteStyleDefault,
            preserveFormatting: options.preserveFormatting
          },
          options
        );
        if (result.ok) sendResponse({ ok: true, resultText: result.resultText });
        else sendResponse({ ok: false, errorMessage: `${result.error.code}: ${result.error.message}` });
      } catch (error) {
        sendResponse({ ok: false, errorMessage: error instanceof Error ? error.message : 'Unknown error' });
      }
    });

    return true;
  }

  return false;
});
