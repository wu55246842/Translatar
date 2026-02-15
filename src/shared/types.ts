export type ActionType = 'correct' | 'translate' | 'rewrite';
export type RewriteStyle = 'concise' | 'formal' | 'casual';
export type SourceLang = 'auto' | string;
export type ReplaceStrategy = 'selection' | 'all';

export interface ExtensionOptions {
  apiBaseUrl: string;
  targetLang: string;
  sourceLang: SourceLang;
  rewriteStyleDefault: RewriteStyle;
  preserveFormatting: boolean;
  showFloatingPanel: boolean;
  replaceStrategyDefault: ReplaceStrategy;
}

export interface ApiSuccess {
  ok: true;
  resultText: string;
  detectedSourceLang?: string;
}

export interface ApiErrorResponse {
  ok: false;
  error: {
    code: string;
    message: string;
  };
}

export type ApiResponse = ApiSuccess | ApiErrorResponse;

export interface TextContext {
  text: string;
  canReplace: boolean;
}

export interface ProcessRequestMessage {
  type: 'process-request';
  action: ActionType;
  text: string;
  targetLang?: string;
  sourceLang?: string;
  style?: RewriteStyle;
}

export interface ProcessResultMessage {
  type: 'process-result';
  action: ActionType;
  ok: boolean;
  resultText?: string;
  errorMessage?: string;
}

export interface TriggerActionMessage {
  type: 'trigger-action';
  action: ActionType;
}

export interface CollectTextMessage {
  type: 'collect-text';
  action: ActionType;
}

export interface OptionsChangedMessage {
  type: 'options-changed';
}

export type BackgroundMessage = ProcessRequestMessage | TriggerActionMessage | CollectTextMessage;
