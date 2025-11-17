import { Router, Request, Response } from 'express';
import logger from '../utils/logger';

/**
 * Learning Platform Service
 * Handles educational modules, quizzes, badges, and progress tracking
 */

interface Module {
  id: string;
  title: string;
  description: string;
  category: 'Beginner' | 'Intermediate' | 'Advanced';
  lessons: Lesson[];
  quizzes: Quiz[];
  estimatedTime: number; // minutes
  difficulty: number; // 1-5
  prerequisites: string[]; // Module IDs
  points: number; // Reward points for completion
}

interface Lesson {
  id: string;
  title: string;
  content: string; // HTML or markdown
  videoUrl?: string;
  order: number;
  estimatedTime: number; // minutes
  resources: Resource[];
}

interface Resource {
  id: string;
  title: string;
  type: 'article' | 'video' | 'documentation' | 'tool';
  url: string;
}

interface Quiz {
  id: string;
  title: string;
  questions: Question[];
  passingScore: number; // percentage
  order: number;
  rewards: number; // points
}

interface Question {
  id: string;
  type: 'multiple-choice' | 'true-false' | 'short-answer';
  question: string;
  options?: string[];
  correctAnswer: string | string[];
  explanation: string;
  points: number;
}

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  requirement: string; // Description of requirement
  category: 'Achievement' | 'Milestone' | 'Expert' | 'Special';
  unlockedAt?: number; // Timestamp
}

interface UserProgress {
  userId: string;
  moduleId: string;
  lessonProgress: Map<string, boolean>; // lessonId -> completed
  quizResults: QuizResult[];
  completedAt?: number;
  progressPercentage: number;
  currentStreak: number; // Days
  lastAccessedAt: number;
}

interface QuizResult {
  quizId: string;
  score: number;
  maxScore: number;
  attemptCount: number;
  lastAttempt: number;
  passed: boolean;
}

interface UserStats {
  userId: string;
  totalPoints: number;
  totalLessonsCompleted: number;
  totalQuizzesCompleted: number;
  totalModulesCompleted: number;
  badges: Badge[];
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: number;
  joinDate: number;
}

/**
 * Learning Module Definitions
 */
const MODULES: Module[] = [
  {
    id: 'intro-blockchain',
    title: 'Introduction to Blockchain',
    description: 'Learn the fundamentals of blockchain technology',
    category: 'Beginner',
    lessons: [
      {
        id: 'lesson-1-1',
        title: 'What is Blockchain?',
        content: '<p>Blockchain is a distributed ledger technology...</p>',
        order: 1,
        estimatedTime: 15,
        resources: [
          {
            id: 'res-1-1',
            title: 'Bitcoin Whitepaper',
            type: 'documentation',
            url: 'https://bitcoin.org/bitcoin.pdf'
          }
        ]
      }
    ],
    quizzes: [],
    estimatedTime: 120,
    difficulty: 1,
    prerequisites: [],
    points: 100
  },
  {
    id: 'flash-loans-101',
    title: 'Flash Loans 101',
    description: 'Master the art of flash loans',
    category: 'Intermediate',
    lessons: [],
    quizzes: [],
    estimatedTime: 180,
    difficulty: 3,
    prerequisites: ['intro-blockchain'],
    points: 250
  },
  {
    id: 'advanced-defi',
    title: 'Advanced DeFi Strategies',
    description: 'Advanced topics in decentralized finance',
    category: 'Advanced',
    lessons: [],
    quizzes: [],
    estimatedTime: 300,
    difficulty: 5,
    prerequisites: ['flash-loans-101'],
    points: 500
  }
];

/**
 * Badge Definitions
 */
const BADGES: Badge[] = [
  {
    id: 'first-lesson',
    name: 'First Steps',
    description: 'Complete your first lesson',
    icon: '👣',
    requirement: 'Complete any lesson',
    category: 'Achievement'
  },
  {
    id: 'module-master',
    name: 'Module Master',
    description: 'Complete an entire module',
    icon: '🎓',
    requirement: 'Complete a full module',
    category: 'Milestone'
  },
  {
    id: 'perfect-score',
    name: 'Perfect Scorer',
    description: 'Achieve 100% on a quiz',
    icon: '⭐',
    requirement: 'Score 100% on any quiz',
    category: 'Achievement'
  },
  {
    id: 'flash-loan-expert',
    name: 'Flash Loan Expert',
    description: 'Master flash loan concepts',
    icon: '⚡',
    requirement: 'Complete flash loan advanced module',
    category: 'Expert'
  },
  {
    id: '7-day-streak',
    name: '7-Day Learner',
    description: 'Complete learning activities for 7 consecutive days',
    icon: '🔥',
    requirement: 'Maintain 7-day learning streak',
    category: 'Milestone'
  }
];

/**
 * Learning Service Class
 */
export class LearningService {
  /**
   * Get all available modules
   */
  static getAllModules(): Module[] {
    return MODULES;
  }

  /**
   * Get module by ID
   */
  static getModuleById(moduleId: string): Module | null {
    return MODULES.find(m => m.id === moduleId) || null;
  }

  /**
   * Get modules by category
   */
  static getModulesByCategory(category: 'Beginner' | 'Intermediate' | 'Advanced'): Module[] {
    return MODULES.filter(m => m.category === category);
  }

  /**
   * Get recommended modules for user
   */
  static getRecommendedModules(userLevel: number, completedModules: string[]): Module[] {
    return MODULES.filter(m => {
      // Not already completed
      if (completedModules.includes(m.id)) return false;
      
      // Prerequisites met
      const prereqsMet = m.prerequisites.every(p => completedModules.includes(p));
      if (!prereqsMet) return false;
      
      // Appropriate difficulty
      return m.difficulty <= userLevel + 1;
    });
  }

  /**
   * Get quiz by ID
   */
  static getQuizById(moduleId: string, quizId: string): Quiz | null {
    const module = this.getModuleById(moduleId);
    if (!module) return null;
    return module.quizzes.find(q => q.id === quizId) || null;
  }

  /**
   * Evaluate quiz answer
   */
  static evaluateQuiz(quiz: Quiz, userAnswers: Map<string, any>): { score: number; maxScore: number; breakdown: any[] } {
    let score = 0;
    const maxScore = quiz.questions.reduce((sum, q) => sum + q.points, 0);
    const breakdown: any[] = [];

    for (const question of quiz.questions) {
      const userAnswer = userAnswers.get(question.id);
      let isCorrect = false;

      if (Array.isArray(question.correctAnswer)) {
        isCorrect = JSON.stringify(userAnswer) === JSON.stringify(question.correctAnswer);
      } else {
        isCorrect = userAnswer === question.correctAnswer;
      }

      if (isCorrect) {
        score += question.points;
      }

      breakdown.push({
        questionId: question.id,
        correct: isCorrect,
        earnedPoints: isCorrect ? question.points : 0,
        explanation: question.explanation
      });
    }

    return { score, maxScore, breakdown };
  }

  /**
   * Check if user unlocked a badge
   */
  static checkBadgeUnlock(badgeId: string, userStats: UserStats): boolean {
    const badge = BADGES.find(b => b.id === badgeId);
    if (!badge) return false;

    switch (badgeId) {
      case 'first-lesson':
        return userStats.totalLessonsCompleted >= 1;
      case 'module-master':
        return userStats.totalModulesCompleted >= 1;
      case 'perfect-score':
        // Would need quiz history
        return false;
      case 'flash-loan-expert':
        return userStats.totalModulesCompleted >= 2 && userStats.totalPoints >= 500;
      case '7-day-streak':
        return userStats.currentStreak >= 7;
      default:
        return false;
    }
  }

  /**
   * Get all available badges
   */
  static getAllBadges(): Badge[] {
    return BADGES;
  }

  /**
   * Get badge by ID
   */
  static getBadgeById(badgeId: string): Badge | null {
    return BADGES.find(b => b.id === badgeId) || null;
  }

  /**
   * Calculate user level based on points
   */
  static calculateUserLevel(totalPoints: number): number {
    // Level 1: 0-99, Level 2: 100-249, Level 3: 250-499, etc.
    return Math.floor(totalPoints / 250) + 1;
  }

  /**
   * Get leaderboard
   */
  static getLeaderboard(limit: number = 10): any[] {
    // This would query from database in production
    return [];
  }
}

/**
 * Learning Router
 */
export const learningRouter = Router();

/**
 * GET /learning/modules
 * Get all available modules
 */
learningRouter.get('/modules', (req: Request, res: Response) => {
  try {
    const category = req.query.category as string;
    const modules = category
      ? LearningService.getModulesByCategory(category as any)
      : LearningService.getAllModules();

    res.json({
      success: true,
      data: {
        modules,
        total: modules.length
      }
    });
  } catch (error) {
    logger.error('Error fetching modules', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch modules'
    });
  }
});

/**
 * GET /learning/modules/:moduleId
 * Get specific module with details
 */
learningRouter.get('/modules/:moduleId', (req: Request, res: Response) => {
  try {
    const module = LearningService.getModuleById(req.params.moduleId);
    if (!module) {
      return res.status(404).json({
        success: false,
        error: 'Module not found'
      });
    }

    res.json({
      success: true,
      data: module
    });
  } catch (error) {
    logger.error('Error fetching module', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch module'
    });
  }
});

/**
 * GET /learning/badges
 * Get all available badges
 */
learningRouter.get('/badges', (req: Request, res: Response) => {
  try {
    const badges = LearningService.getAllBadges();
    res.json({
      success: true,
      data: {
        badges,
        total: badges.length
      }
    });
  } catch (error) {
    logger.error('Error fetching badges', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch badges'
    });
  }
});

/**
 * POST /learning/quiz/:moduleId/:quizId/submit
 * Submit quiz answers
 */
learningRouter.post('/quiz/:moduleId/:quizId/submit', (req: Request, res: Response) => {
  try {
    const { moduleId, quizId } = req.params;
    const { answers } = req.body;

    const quiz = LearningService.getQuizById(moduleId, quizId);
    if (!quiz) {
      return res.status(404).json({
        success: false,
        error: 'Quiz not found'
      });
    }

    const userAnswersMap = new Map(Object.entries(answers));
    const result = LearningService.evaluateQuiz(quiz, userAnswersMap);
    const passed = result.score >= (quiz.passingScore / 100) * result.maxScore;

    res.json({
      success: true,
      data: {
        ...result,
        passed,
        rewards: passed ? quiz.rewards : 0,
        feedback: 'Quiz submitted successfully'
      }
    });
  } catch (error) {
    logger.error('Error submitting quiz', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to submit quiz'
    });
  }
});

/**
 * GET /learning/leaderboard
 * Get top learners leaderboard
 */
learningRouter.get('/leaderboard', (req: Request, res: Response) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 10, 100);
    const leaderboard = LearningService.getLeaderboard(limit);

    res.json({
      success: true,
      data: {
        leaderboard,
        total: leaderboard.length
      }
    });
  } catch (error) {
    logger.error('Error fetching leaderboard', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch leaderboard'
    });
  }
});

export default learningRouter;
