require('dotenv').config();

const { GoogleGenAI } = require('@google/genai');

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.warn(
    'WARNING: GEMINI_API_KEY is not configured in backend/.env'
  );
}

const ai = apiKey
  ? new GoogleGenAI({ apiKey })
  : null;

// Gemini model fallback chain
// Start with lightweight model for better availability.
const AI_MODELS = [
  process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite',
  'gemini-3.6-flash',
  'gemini-3.7-flash',
  'gemini-3.8-flash',
];

console.log(
  'Gemini API Key loaded:',
  apiKey ? 'YES' : 'NO'
);

console.log(
  'Gemini AI models:',
  AI_MODELS.join(' → ')
);

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function isTemporaryError(error) {
  const status = error?.status || error?.code;

  const message =
    error?.message?.toLowerCase() || '';

  return (
    status === 503 ||
    status === 429 ||
    message.includes('high demand') ||
    message.includes('temporarily unavailable') ||
    message.includes('unavailable') ||
    message.includes('resource exhausted') ||
    message.includes('overloaded')
  );
}

async function generateAIResponse(prompt, options = {}) {
  if (!ai) {
    throw new Error(
      'Gemini AI is not configured. Please add GEMINI_API_KEY to backend/.env'
    );
  }

  if (!prompt || typeof prompt !== 'string') {
    throw new Error(
      'A valid AI prompt is required.'
    );
  }

  const {
    maxOutputTokens = 1000,
    systemInstruction = '',
  } = options;

  let lastError = null;

  for (const model of AI_MODELS) {
    console.log(
      `\nTrying Gemini model: ${model}`
    );

    // Retry each model twice
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const response =
          await ai.models.generateContent({
            model,

            contents: prompt,

            config: {
              maxOutputTokens,

              ...(systemInstruction
                ? {
                    systemInstruction,
                  }
                : {}),
            },
          });

        const text = response.text;

        if (!text || !text.trim()) {
          throw new Error(
            `Gemini model ${model} returned an empty response.`
          );
        }

        console.log(
          `Gemini response generated successfully using ${model}`
        );

        return text.trim();
      } catch (error) {
        lastError = error;

        console.error(
          `Gemini error using ${model} ` +
            `(attempt ${attempt}/2):`,
          error?.message || error
        );

        /*
         * If Gemini is temporarily overloaded,
         * wait and retry the same model once.
         */
        if (
          isTemporaryError(error) &&
          attempt === 1
        ) {
          console.log(
            `Temporary Gemini issue with ${model}. ` +
              `Retrying in 2 seconds...`
          );

          await sleep(2000);

          continue;
        }

        // Move to next model
        break;
      }
    }
  }

  console.error(
    '\nAll Gemini models failed.',
    lastError
  );

  if (isTemporaryError(lastError)) {
    throw new Error(
      'Gemini AI is temporarily experiencing high demand. ' +
        'All configured Gemini models are currently unavailable. ' +
        'Please try again shortly.'
    );
  }

  throw new Error(
    lastError?.message ||
      'Gemini AI service is temporarily unavailable.'
  );
}

module.exports = {
  generateAIResponse,
  AI_MODELS,
};