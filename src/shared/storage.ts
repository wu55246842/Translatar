import { DEFAULT_OPTIONS } from './constants';
import type { ExtensionOptions } from './types';

export async function getOptions(): Promise<ExtensionOptions> {
  const stored = await chrome.storage.sync.get(DEFAULT_OPTIONS);
  return {
    apiBaseUrl: String(stored.apiBaseUrl ?? DEFAULT_OPTIONS.apiBaseUrl),
    targetLang: String(stored.targetLang ?? DEFAULT_OPTIONS.targetLang),
    sourceLang: String(stored.sourceLang ?? DEFAULT_OPTIONS.sourceLang),
    rewriteStyleDefault: stored.rewriteStyleDefault ?? DEFAULT_OPTIONS.rewriteStyleDefault,
    preserveFormatting: (stored.preserveFormatting as boolean | undefined) ?? DEFAULT_OPTIONS.preserveFormatting,
    showFloatingPanel: (stored.showFloatingPanel as boolean | undefined) ?? DEFAULT_OPTIONS.showFloatingPanel,
    replaceStrategyDefault: stored.replaceStrategyDefault ?? DEFAULT_OPTIONS.replaceStrategyDefault
  };
}

export async function setOptions(options: ExtensionOptions): Promise<void> {
  await chrome.storage.sync.set(options);
}
