# Tasks: MCQ Migration & SaaS UI Redesign

- [x] Install Frontend Dependencies
  - [x] Install `framer-motion` in `/frontend`
- [x] Backend Implementation (MCQ Format)
  - [x] Update `Session.ts` schema for MCQ fields (`options`, `userSelectedIndex`, `correctOptionIndex`, `isCorrect`, `explanation`)
  - [x] Update `interviewerAgent.ts` to request MCQ JSON format and update mock database
  - [x] Update `evaluatorAgent.ts` for instant index comparison evaluation
  - [x] Update `validation.ts` schema for `userSelectedIndex`
  - [x] Update `sessionRoutes.ts` (`/question/generate`, `/answer/submit`, `/session/:id/report`)
  - [x] Update `session.test.ts` for MCQ testing
  - [x] Verify `npm test` runs 100% green
- [x] Frontend Implementation (Framer Motion UI Redesign)
  - [x] Redesign `Login.tsx` & `Register.tsx` with Framer Motion animations & glassmorphic inputs
  - [x] Redesign `TopicSelection.tsx` (Topics grid + Difficulty selection cards + animated Start button)
  - [x] Redesign `Interview.tsx` (MCQ 4-option cards with A/B/C/D badges, selection state, suspenseful Next Question)
  - [x] Redesign `FinalReport.tsx` (Animated SVG score ring, counter, expandable MCQ accordions, and coaching summary)
  - [x] Verify frontend TS compilation (`npx tsc --noEmit`)
- [x] Visual Review & Demonstration
  - [x] Present Topic Selection, Difficulty Selection, MCQ Interview, and Final Report screens
