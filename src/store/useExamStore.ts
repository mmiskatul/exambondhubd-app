import { create } from 'zustand';
import { mobileApi } from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface ExamState {
  activeAttempt: any | null;
  currentQuestionIndex: number;
  remainingSeconds: number;
  answersMap: Record<string, string>; // questionId -> optionId
  flaggedMap: Record<string, boolean>; // questionId -> boolean
  isSubmitting: boolean;

  setAttempt: (attempt: any) => void;
  setCurrentIndex: (index: number) => void;
  decrementTimer: () => void;
  selectOption: (questionId: string, optionId: string) => Promise<void>;
  toggleFlag: (questionId: string) => Promise<void>;
  clearExam: () => void;
}

export const useExamStore = create<ExamState>((set, get) => ({
  activeAttempt: null,
  currentQuestionIndex: 0,
  remainingSeconds: 0,
  answersMap: {},
  flaggedMap: {},
  isSubmitting: false,

  setAttempt: (attempt) => {
    const answers: Record<string, string> = {};
    const flagged: Record<string, boolean> = {};

    attempt.questions?.forEach((q: any) => {
      if (q.selectedOptionId) {
        answers[q.question.id] = q.selectedOptionId;
      }
      if (q.isFlagged) {
        flagged[q.question.id] = true;
      }
    });

    set({
      activeAttempt: attempt,
      remainingSeconds: attempt.remainingSeconds,
      answersMap: answers,
      flaggedMap: flagged,
      currentQuestionIndex: 0,
    });
  },

  setCurrentIndex: (index) => set({ currentQuestionIndex: index }),

  decrementTimer: () => {
    const current = get().remainingSeconds;
    if (current > 0) {
      set({ remainingSeconds: current - 1 });
    }
  },

  selectOption: async (questionId, optionId) => {
    const { activeAttempt, answersMap } = get();
    const updatedAnswers = { ...answersMap, [questionId]: optionId };
    set({ answersMap: updatedAnswers });

    // Cache locally
    if (activeAttempt) {
      AsyncStorage.setItem(`answers_${activeAttempt.id}`, JSON.stringify(updatedAnswers)).catch(
        () => {},
      );

      // Auto-save to backend API
      mobileApi(`/attempts/${activeAttempt.id}/answers`, {
        method: 'POST',
        body: JSON.stringify({ questionId, optionId }),
      }).catch((err) => console.log('Offline queue will sync later:', err));
    }
  },

  toggleFlag: async (questionId) => {
    const { activeAttempt, flaggedMap } = get();
    const isFlagged = !flaggedMap[questionId];
    const updatedFlags = { ...flaggedMap, [questionId]: isFlagged };
    set({ flaggedMap: updatedFlags });

    if (activeAttempt) {
      mobileApi(`/attempts/${activeAttempt.id}/answers`, {
        method: 'POST',
        body: JSON.stringify({ questionId, isFlagged }),
      }).catch(() => {});
    }
  },

  clearExam: () =>
    set({
      activeAttempt: null,
      currentQuestionIndex: 0,
      remainingSeconds: 0,
      answersMap: {},
      flaggedMap: {},
    }),
}));
