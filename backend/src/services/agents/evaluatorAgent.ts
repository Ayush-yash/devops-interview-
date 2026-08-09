export interface EvaluationData {
  isCorrect: boolean;
  marks: number;
  explanation: string;
}

export const evaluateAnswer = (
  userSelectedIndex: number,
  correctOptionIndex: number,
  explanation: string
): EvaluationData => {
  const isCorrect = Number(userSelectedIndex) === Number(correctOptionIndex);
  return {
    isCorrect,
    marks: isCorrect ? 10 : 0,
    explanation
  };
};
