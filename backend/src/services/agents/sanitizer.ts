/**
 * Sanitizes candidate answer text to prevent prompt injection attempts 
 * from being interpreted as system instructions by the Claude API.
 */
export const sanitizePromptInput = (input: string): string => {
  if (!input) return '';

  let sanitized = input;

  // 1. Remove dangerous injection phrases (case-insensitive)
  const injectionPhrases = [
    /ignore\s+all\s+previous\s+instructions/gi,
    /ignore\s+previous\s+instructions/gi,
    /ignore\s+instructions/gi,
    /ignore\s+the\s+above/gi,
    /forget\s+all\s+previous\s+instructions/gi,
    /forget\s+your\s+system\s+instructions/gi,
    /override\s+system\s+prompt/gi,
    /system\s+prompt\s+override/gi,
    /you\s+must\s+now\s+act\s+as/gi,
    /new\s+role/gi,
    /dan\s+mode/gi
  ];

  injectionPhrases.forEach(phrase => {
    sanitized = sanitized.replace(phrase, '[REDACTED_INJECTION_ATTEMPT]');
  });

  // 2. Escape special characters like double quotes or backslashes that could break JSON prompts
  // Note: JSON.stringify handles this automatically when building payload, 
  // but we can strip raw system block boundaries like system tags or XML blocks.
  const xmlBlockRegex = /<\/?(system|user|assistant|instruction|prompt)>/gi;
  sanitized = sanitized.replace(xmlBlockRegex, '[BLOCK_TAG_REMOVED]');

  // Limit input length to prevent DOS (extremely large payloads overloading token limits)
  const MAX_CHARACTERS = 8000;
  if (sanitized.length > MAX_CHARACTERS) {
    sanitized = sanitized.substring(0, MAX_CHARACTERS) + '\n[TRUNCATED_DUE_TO_LENGTH]';
  }

  return sanitized;
};
