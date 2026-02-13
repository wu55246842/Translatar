import type { ActionType, ApiResponse, ExtensionOptions } from '../shared/types';

interface RequestMap {
  correct: { text: string; preserveFormatting: boolean };
  translate: { text: string; targetLang: string; sourceLang: string; preserveFormatting: boolean };
  rewrite: { text: string; style: 'concise' | 'formal' | 'casual'; preserveFormatting: boolean };
}

function endpointFor(action: ActionType): string {
  if (action === 'correct') return '/english/correct';
  if (action === 'translate') return '/translate';
  return '/rewrite';
}

export async function callApi<K extends ActionType>(
  action: K,
  payload: RequestMap[K],
  options: ExtensionOptions
): Promise<ApiResponse> {
  const base = options.apiBaseUrl.replace(/\/$/, '');
  const response = await fetch(`${base}${endpointFor(action)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  let data: unknown;
  try {
    data = await response.json();
  } catch {
    return { ok: false, error: { code: 'INVALID_JSON', message: 'Server returned invalid JSON.' } };
  }

  if (!response.ok) {
    return {
      ok: false,
      error: {
        code: 'HTTP_ERROR',
        message: `HTTP ${response.status}: ${response.statusText}`
      }
    };
  }

  const parsed = data as ApiResponse;
  if (typeof parsed?.ok !== 'boolean') {
    return { ok: false, error: { code: 'INVALID_SHAPE', message: 'Unexpected API response shape.' } };
  }

  return parsed;
}
