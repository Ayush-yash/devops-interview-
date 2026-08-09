import mongoose, { Document, Schema } from 'mongoose';

export interface ISessionQuestion {
  _id?: any;
  question: string;
  options: string[];
  correctOptionIndex: number;
  explanation: string;
  userSelectedIndex?: number;
  isCorrect?: boolean;
  marks?: number;
  // Backward compatibility fields
  referenceAnswer?: string;
  keyPointsExpected?: string[];
  userAnswer?: string;
  verdict?: 'correct' | 'partially_correct' | 'incorrect';
  pointsCovered?: string[];
  pointsMissed?: string[];
}

export interface ISession extends Document {
  candidateId: mongoose.Types.ObjectId;
  topic: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  totalQuestions: number;
  questionsAnswered: number;
  totalMarks: number;
  isCompleted: boolean;
  questions: ISessionQuestion[];
  coachingSummary?: {
    overallFeedback: string;
    strengths: string[];
    weakAreas: string[];
    recommendedResources: string[];
    nextSteps: string;
  };
  createdAt: Date;
}

const sessionQuestionSchema = new Schema<ISessionQuestion>({
  question: { type: String, required: true },
  options: { type: [String], required: true },
  correctOptionIndex: { type: Number, required: true },
  explanation: { type: String, required: true },
  userSelectedIndex: { type: Number },
  isCorrect: { type: Boolean },
  marks: { type: Number, min: 0, max: 10, default: 0 },
  // Backward compatibility
  referenceAnswer: { type: String },
  keyPointsExpected: { type: [String] },
  userAnswer: { type: String },
  verdict: { type: String, enum: ['correct', 'partially_correct', 'incorrect'] },
  pointsCovered: { type: [String] },
  pointsMissed: { type: [String] }
});

const sessionSchema = new Schema<ISession>({
  candidateId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  topic: { type: String, required: true },
  difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'], required: true },
  totalQuestions: { type: Number, required: true, default: 5 },
  questionsAnswered: { type: Number, required: true, default: 0 },
  totalMarks: { type: Number, required: true, default: 0 },
  isCompleted: { type: Boolean, required: true, default: false },
  questions: [sessionQuestionSchema],
  coachingSummary: {
    overallFeedback: { type: String },
    strengths: { type: [String] },
    weakAreas: { type: [String] },
    recommendedResources: { type: [String] },
    nextSteps: { type: String }
  },
  createdAt: { type: Date, default: Date.now }
});

export const Session = mongoose.model<ISession>('Session', sessionSchema);
