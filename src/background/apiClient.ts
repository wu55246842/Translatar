import type { ActionType, ApiResponse, ExtensionOptions } from '../shared/types';

interface RequestMap {
  correct: { text: string; preserveFormatting: boolean };
  translate: { text: string; targetLang: string; sourceLang: string; preserveFormatting: boolean };
  rewrite: { text: string; style: 'concise' | 'formal' | 'casual'; preserveFormatting: boolean };
}



const POLLINATIONS_API_URL = 'https://gen.pollinations.ai/v1/chat/completions';
const API_TOKEN = 'sk_7DIvi93Ezkb2EVF7yyw9q7ghP7QkpbT2';

function getSystemPrompt(action: ActionType, options: ExtensionOptions, payload: any): string {
  if (action === 'correct') {
    return 'You are an English language expert. Your task is to correct the grammar, spelling, and punctuation of the provided text. Maintain the original meaning and tone. Only return the corrected text, no explanations.';
  }
  if (action === 'translate') {
    return `You are a professional translator. Translate the provided text into ${payload.targetLang || options.targetLang}. Ensure the translation is natural and accurate. Only return the translated text, no explanations.`;
  }
  if (action === 'rewrite') {
    const style = payload.style || options.rewriteStyleDefault;
    return `You are a professional writer. Rewrite the provided text in a ${style} style. Maintain the core message but adjust the tone and structure accordingly. Only return the rewritten text, no explanations.`;
  }
  return '';
}

export async function callApi<K extends ActionType>(
  action: K,
  payload: RequestMap[K],
  options: ExtensionOptions
): Promise<ApiResponse> {
  const systemPrompt = getSystemPrompt(action, options, payload);

  try {
    const response = await fetch(POLLINATIONS_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${API_TOKEN}`
      },
      body: JSON.stringify({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: payload.text }
        ],
        model: 'qwen-character',
        temperature: 0.3,
        max_tokens: 3000
      })
    });

    if (!response.ok) {
      return {
        ok: false,
        error: {
          code: 'HTTP_ERROR',
          message: `HTTP ${response.status}: ${response.statusText}`
        }
      };
    }

    const data: any = await response.json();
    const resultText = data.choices?.[0]?.message?.content?.trim();

    if (!resultText) {
      return {
        ok: false,
        error: {
          code: 'EMPTY_RESPONSE',
          message: 'The AI returned an empty response.'
        }
      };
    }

    return {
      ok: true,
      resultText
    };
  } catch (err) {
    return {
      ok: false,
      error: {
        code: 'NETWORK_ERROR',
        message: err instanceof Error ? err.message : 'Failed to connect to AI service.'
      }
    };
  }
}
