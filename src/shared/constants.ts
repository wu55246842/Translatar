import type { ExtensionOptions } from './types';

export const DEFAULT_OPTIONS: ExtensionOptions = {
  apiBaseUrl: 'http://localhost:8787',
  targetLang: 'zh-Hans',
  sourceLang: 'auto',
  rewriteStyleDefault: 'concise',
  preserveFormatting: true,
  showFloatingPanel: true,
  replaceStrategyDefault: 'selection'
};

export const MENU_IDS = {
  correct: 'translatar-correct',
  translate: 'translatar-translate',
  rewrite: 'translatar-rewrite'
} as const;
