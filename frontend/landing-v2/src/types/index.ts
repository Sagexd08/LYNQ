export interface Lesson {
  id: string;
  title: string;
  description: string;
  content: string;
  duration: string;
  reputation: number;
  quiz?: QuizQuestion[];
  sandboxTask?: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface UserProgress {
  completedLessons: string[];
  currentLesson: string | null;
  reputation: number;
  quizScores: Record<string, number>;
}

export interface SandboxTransaction {
  id: string;
  type: 'supply' | 'borrow' | 'repay' | 'withdraw';
  asset: string;
  amount: number;
  timestamp: number;
  status: 'pending' | 'success' | 'failed';
}
