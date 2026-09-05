// Thin wrapper around an LLM provider for the two mandatory AI features.
// CRITICAL SAFETY: the LLM only ever returns structured JSON intent.
// It NEVER touches MongoDB directly — callers (negotiationEngine) validate
// and apply everything through the deterministic business engines.
//
// If ANTHROPIC_API_KEY is not set, or the call fails for any reason,
// callers must fall back to their deterministic rule-based logic.
// The app must never crash or hang because the AI API is unavailable.

const MODEL = 'claude-sonnet-4-6';

async function callStructuredLLM({ systemPrompt, userPrompt }) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return { ok: false, reason: 'no_api_key' };
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 500,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }]
      }),
      signal: controller.signal
    });
    clearTimeout(timeout);

    if (!response.ok) {
      return { ok: false, reason: `http_${response.status}` };
    }

    const data = await response.json();
    const textBlock = (data.content || []).find(b => b.type === 'text');
    if (!textBlock) return { ok: false, reason: 'no_text_block' };

    const cleaned = textBlock.text.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(cleaned);
    return { ok: true, data: parsed };
  } catch (err) {
    return { ok: false, reason: err.message };
  }
}

module.exports = { callStructuredLLM };
