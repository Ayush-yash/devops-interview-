import Anthropic from '@anthropic-ai/sdk';
import { claudeRequestCounter, claudeDurationHistogram } from '../../middleware/metrics';

// Check if Anthropic key is configured properly
const isKeyConfigured = (): boolean => {
  const key = process.env.ANTHROPIC_API_KEY;
  return !!key && key !== 'your_anthropic_api_key_here' && key.trim() !== '';
};

// Initialize Anthropic client if key is configured
let anthropic: Anthropic | null = null;
if (isKeyConfigured()) {
  anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });
}

// Clean JSON response from Claude (handles markdown code fences)
export const cleanJsonResponse = (text: string): string => {
  let cleaned = text.trim();
  
  // Remove markdown code fences if present
  if (cleaned.startsWith('```')) {
    // Find the first newline to strip ```json or ```
    const firstNewlineIndex = cleaned.indexOf('\n');
    if (firstNewlineIndex !== -1) {
      cleaned = cleaned.substring(firstNewlineIndex + 1);
    } else {
      cleaned = cleaned.substring(3);
    }
    
    // Strip trailing ```
    if (cleaned.endsWith('```')) {
      cleaned = cleaned.substring(0, cleaned.length - 3);
    }
  }
  
  return cleaned.trim();
};

export const callClaudeAndParseJSON = async <T>(
  systemPrompt: string,
  userPrompt: string,
  fallbackGenerator: () => T,
  agentRole: string = 'unknown'
): Promise<T> => {
  const start = process.hrtime();

  if (!isKeyConfigured() || !anthropic) {
    console.warn('[Claude Client] Anthropic API Key is not configured. Falling back to structured mock data.');
    claudeRequestCounter.labels(agentRole, 'mock').inc();
    return fallbackGenerator();
  }

  try {
    console.log(`[Claude Client] Sending request to Anthropic API for role: ${agentRole}...`);
    const message = await anthropic.messages.create({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 2048,
      temperature: 0.1, // Low temperature for consistent JSON structured replies
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    });

    const rawResponse = message.content[0]?.type === 'text' ? message.content[0].text : '';
    console.log('[Claude Client] Raw Response Received.');

    try {
      const cleaned = cleanJsonResponse(rawResponse);
      const parsed = JSON.parse(cleaned) as T;
      
      const diff = process.hrtime(start);
      const durationInSeconds = diff[0] + diff[1] / 1e9;
      claudeRequestCounter.labels(agentRole, 'success').inc();
      claudeDurationHistogram.labels(agentRole, 'success').observe(durationInSeconds);

      return parsed;
    } catch (parseError) {
      console.warn('[Claude Client] JSON Parse failed. Retrying once with error feedback...', parseError);
      
      // Retry once with error feedback
      const retryMessage = await anthropic.messages.create({
        model: 'claude-3-5-haiku-20241022',
        max_tokens: 2048,
        temperature: 0.1,
        system: systemPrompt,
        messages: [
          { role: 'user', content: userPrompt },
          { role: 'assistant', content: rawResponse },
          { role: 'user', content: 'Your response was not valid JSON. Please reply with ONLY valid JSON and no markdown wrapping.' }
        ],
      });

      const retryRawResponse = retryMessage.content[0]?.type === 'text' ? retryMessage.content[0].text : '';
      const retryCleaned = cleanJsonResponse(retryRawResponse);
      const parsed = JSON.parse(retryCleaned) as T;

      const diff = process.hrtime(start);
      const durationInSeconds = diff[0] + diff[1] / 1e9;
      claudeRequestCounter.labels(agentRole, 'success').inc();
      claudeDurationHistogram.labels(agentRole, 'success').observe(durationInSeconds);

      return parsed;
    }
  } catch (error: any) {
    console.error('[Claude Client] Anthropic API Error:', error);
    console.log('[Claude Client] Returning mock data fallback due to API error.');
    
    claudeRequestCounter.labels(agentRole, 'error').inc();
    
    const diff = process.hrtime(start);
    const durationInSeconds = diff[0] + diff[1] / 1e9;
    claudeDurationHistogram.labels(agentRole, 'error').observe(durationInSeconds);

    return fallbackGenerator();
  }
};
