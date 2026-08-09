import { callClaudeAndParseJSON } from './claudeClient';

export interface SessionQuestion {
  question: string;
  userAnswer: string;
  verdict: 'correct' | 'partially_correct' | 'incorrect';
  marks: number;
}

export interface SessionData {
  topicName: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  history: SessionQuestion[];
}

export interface CoachingSummaryData {
  overallFeedback: string;
  strengths: string[];
  weakAreas: string[];
  recommendedResources: string[];
  nextSteps: string;
}

export const generateCoachingSummary = async (
  sessionData: SessionData
): Promise<CoachingSummaryData> => {
  const systemPrompt = `You are an expert DevOps Career Coach. Your job is to analyze a candidate's completed interview session and provide a personalized feedback and study path.

Analyze:
- The topic: ${sessionData.topicName}
- The difficulty: ${sessionData.difficulty}
- The full session Q&A history, grades, and verdicts: ${JSON.stringify(sessionData.history)}

Output Format:
You must return your output strictly in JSON format. Do not write any markdown commentary outside the JSON object.
The JSON object must have exactly these keys:
{
  "overallFeedback": "Your summary feedback of their performance and potential",
  "strengths": ["list of areas they demonstrated good competence in", "..."],
  "weakAreas": ["list of concepts they struggled with or missed", "..."],
  "recommendedResources": ["list of specific recommended books, docs, courses, or guides for this topic", "..."],
  "nextSteps": "Actionable next steps they should execute to improve"
}`;

  const userPrompt = `Generate a career coaching report based on the attached session history.`;

  // Fallback function in case Claude API fails or is not configured
  const getFallbackCoachingSummary = (): CoachingSummaryData => {
    const totalScore = sessionData.history.reduce((sum, item) => sum + item.marks, 0);
    const maxScore = sessionData.history.length * 10;
    const percentage = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;

    let overallFeedback = '';
    let strengths: string[] = [];
    let weakAreas: string[] = [];
    let recommendedResources: string[] = [];
    let nextSteps = '';

    if (percentage >= 80) {
      overallFeedback = `Outstanding performance on ${sessionData.topicName} at ${sessionData.difficulty} level! You demonstrated a deep understanding of core systems and execution methodologies.`;
      strengths = [`Excellent understanding of ${sessionData.topicName} concepts`, 'Strong technical precision', 'Detailed step-by-step explanations'];
      weakAreas = ['Minor edge case detailing'];
      recommendedResources = [
        `Official ${sessionData.topicName} Documentation`,
        'Advanced DevOps Systems Engineering Handbooks'
      ];
      nextSteps = 'Begin preparing for advanced architecture assessments and system design loops.';
    } else if (percentage >= 50) {
      overallFeedback = `Solid foundational knowledge of ${sessionData.topicName} at ${sessionData.difficulty} level, but you missed several critical components needed for a senior or production-ready role.`;
      strengths = ['Good grasp of fundamental concepts', 'Clear terminology usage'];
      weakAreas = ['Omission of production-grade configuration details', 'Lacked deep dive into security or failure recovery'];
      recommendedResources = [
        `Official ${sessionData.topicName} Best Practices Guide`,
        'Interactive Lab exercises and playground environments'
      ];
      nextSteps = `Re-read the reference answers, set up local sandboxes, and configure intermediate scenarios on ${sessionData.topicName}.`;
    } else {
      overallFeedback = `Your performance shows significant knowledge gaps in ${sessionData.topicName} at ${sessionData.difficulty} level. Focus on rebuilding your fundamentals before attempting scenario assessments.`;
      strengths = ['Attempted all challenges'];
      weakAreas = ['Struggled with core syntax/architecture definitions', 'Incorrect or missing command parameters'];
      recommendedResources = [
        `Beginner courses on ${sessionData.topicName}`,
        'Core fundamentals interactive sandboxes'
      ];
      nextSteps = `Focus on junior-level exercises and complete building basic projects in ${sessionData.topicName} before re-attempting this difficulty.`;
    }

    return {
      overallFeedback,
      strengths,
      weakAreas,
      recommendedResources,
      nextSteps
    };
  };

  return callClaudeAndParseJSON<CoachingSummaryData>(systemPrompt, userPrompt, getFallbackCoachingSummary, 'coach');
};
