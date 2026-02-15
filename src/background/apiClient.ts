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
    return `You are a professional English editor and linguist. 
Your task is to correct the grammar, spelling, and punctuation of the provided text while strictly maintaining the original meaning and tone.
Instructions:
1. Fix all grammatical errors.
2. Ensure natural phrasing for a native speaker.
3. Preserve the original line breaks and indentation if possible.
4. Output ONLY the corrected text. Do not provide any explanations, notes, or meta-talk.`;
  }
  if (action === 'translate') {
    const from = payload.sourceLang === 'auto' ? 'original language' : payload.sourceLang;
    const to = payload.targetLang;
    return `You are a high-level professional translator with expertise in contextual nuance. 
Translate the provided text from ${from} to ${to}.
Instructions:
1. Ensure the translation is idiomatic and culturally appropriate.
2. Maintain the formatting, tone, and intended impact of the source text.
3. If the input is a single word or short phrase, provide the most common translation unless clear context suggests otherwise.
4. Output ONLY the translated text. Do not include transliterations, explanations, or quotes.`;
  }
  if (action === 'rewrite') {
    const style = payload.style || options.rewriteStyleDefault;
    return `You are an expert content writer and editor. 
Rewrite the provided text in a ${style} style. 
Instructions:
1. Adjust vocabulary and sentence structure to match the ${style} tone.
2. Keep the core message intact and ensure clarity.
3. If style is "concise", reduce word count significantly without losing information.
4. If style is "formal", use professional and sophisticated language.
5. If style is "casual", use friendly, conversational language.
6. Output ONLY the rewritten text.`;
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
        model: 'nova-fast',
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
