import { Router, Request, Response } from 'express';
import { z } from 'zod';
import logger from '../utils/logger';
import { LearningService } from '../services/learningService';

/**
 * Learning Platform API Routes
 */

const learningRouter = Router();

/**
 * GET /api/learning/modules
 * Get all learning modules with optional category filter
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
 * GET /api/learning/modules/:moduleId
 * Get specific module with all details
 */
learningRouter.get('/modules/:moduleId', (req: Request, res: Response) => {
  try {
    const { moduleId } = req.params;
    const module = LearningService.getModuleById(moduleId);

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
 * GET /api/learning/badges
 * Get all available badges
 */
learningRouter.get('/badges', (_req: Request, res: Response) => {
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
 * GET /api/learning/stats
 * Get user learning statistics (mock implementation)
 */
learningRouter.get('/stats', (req: Request, res: Response) => {
  try {
    // In production, this would fetch from database using user ID
    const mockStats = {
      totalPoints: 1250,
      level: 3,
      streak: 7,
      lessonsCompleted: 12,
      quizzesCompleted: 5,
      badgesEarned: 3,
      joinDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    };

    res.json({
      success: true,
      data: mockStats
    });
  } catch (error) {
    logger.error('Error fetching stats', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch stats'
    });
  }
});

/**
 * POST /api/learning/quiz/:moduleId/:quizId/submit
 * Submit quiz answers and get results
 */
learningRouter.post('/quiz/:moduleId/:quizId/submit', (req: Request, res: Response) => {
  try {
    const { moduleId, quizId } = req.params;
    const { answers } = req.body;

    // Validate input
    if (!answers || typeof answers !== 'object') {
      return res.status(400).json({
        success: false,
        error: 'Invalid answers format'
      });
    }

    const quiz = LearningService.getQuizById(moduleId, quizId);
    if (!quiz) {
      return res.status(404).json({
        success: false,
        error: 'Quiz not found'
      });
    }

    const userAnswersMap = new Map(Object.entries(answers));
    const evaluationResult = LearningService.evaluateQuiz(quiz, userAnswersMap);
    const passed = evaluationResult.score >= (quiz.passingScore / 100) * evaluationResult.maxScore;
    const earnedRewards = passed ? quiz.rewards : Math.floor((evaluationResult.score / evaluationResult.maxScore) * quiz.rewards * 0.5);

    res.json({
      success: true,
      data: {
        score: evaluationResult.score,
        maxScore: evaluationResult.maxScore,
        percentScore: (evaluationResult.score / evaluationResult.maxScore) * 100,
        passed,
        rewards: earnedRewards,
        breakdown: evaluationResult.breakdown,
        feedback: passed
          ? 'Excellent work! You passed the quiz.'
          : 'Keep practicing. Try again to pass the quiz.'
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
 * GET /api/learning/leaderboard
 * Get top learners leaderboard
 */
learningRouter.get('/leaderboard', (req: Request, res: Response) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 10, 100);

    // Mock leaderboard data
    const mockLeaderboard = [
      {
        rank: 1,
        userId: 'user1',
        username: 'Alice',
        totalPoints: 5000,
        level: 10,
        badgesEarned: 15
      },
      {
        rank: 2,
        userId: 'user2',
        username: 'Bob',
        totalPoints: 4500,
        level: 9,
        badgesEarned: 12
      },
      {
        rank: 3,
        userId: 'user3',
        username: 'Charlie',
        totalPoints: 4000,
        level: 8,
        badgesEarned: 11
      }
    ].slice(0, limit);

    res.json({
      success: true,
      data: {
        leaderboard: mockLeaderboard,
        total: mockLeaderboard.length
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

/**
 * GET /api/learning/recommended
 * Get recommended modules for user
 */
learningRouter.get('/recommended', (req: Request, res: Response) => {
  try {
    // In production, would get user level and completed modules from database
    const userLevel = 2;
    const completedModules: string[] = [];

    const recommended = LearningService.getRecommendedModules(userLevel, completedModules);

    res.json({
      success: true,
      data: {
        recommended: recommended.slice(0, 5),
        total: recommended.length
      }
    });
  } catch (error) {
    logger.error('Error fetching recommended modules', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch recommended modules'
    });
  }
});

/**
 * POST /api/learning/progress/:moduleId/lesson/:lessonId/complete
 * Mark a lesson as completed
 */
learningRouter.post('/progress/:moduleId/lesson/:lessonId/complete', (req: Request, res: Response) => {
  try {
    const { moduleId, lessonId } = req.params;

    // In production, save to database
    logger.info('Lesson marked as complete', { moduleId, lessonId });

    res.json({
      success: true,
      data: {
        message: 'Lesson marked as completed',
        points: 10,
        moduleProgress: 50
      }
    });
  } catch (error) {
    logger.error('Error completing lesson', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to mark lesson as complete'
    });
  }
});

/**
 * GET /api/learning/progress/:userId/:moduleId
 * Get user progress for specific module
 */
learningRouter.get('/progress/:userId/:moduleId', (req: Request, res: Response) => {
  try {
    const { userId, moduleId } = req.params;

    // Mock progress data
    const mockProgress = {
      userId,
      moduleId,
      progressPercentage: 65,
      lessonsCompleted: 4,
      totalLessons: 6,
      quizzesCompleted: 1,
      totalQuizzes: 2,
      completedAt: null,
      startedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      lastAccessedAt: new Date().toISOString(),
      earnedPoints: 150
    };

    res.json({
      success: true,
      data: mockProgress
    });
  } catch (error) {
    logger.error('Error fetching progress', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch progress'
    });
  }
});

/**
 * GET /api/learning/badges/:userId
 * Get badges earned by user
 */
learningRouter.get('/badges/:userId', (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    // Mock user badges
    const mockBadges = LearningService.getAllBadges().slice(0, 3).map(badge => ({
      ...badge,
      unlockedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    }));

    res.json({
      success: true,
      data: {
        userId,
        badges: mockBadges,
        total: mockBadges.length,
        nextBadges: LearningService.getAllBadges().slice(3, 5)
      }
    });
  } catch (error) {
    logger.error('Error fetching user badges', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch badges'
    });
  }
});

/**
 * POST /api/learning/enroll/:userId/:moduleId
 * Enroll user in a learning module
 */
learningRouter.post('/enroll/:userId/:moduleId', (req: Request, res: Response) => {
  try {
    const { userId, moduleId } = req.params;

    const module = LearningService.getModuleById(moduleId);
    if (!module) {
      return res.status(404).json({
        success: false,
        error: 'Module not found'
      });
    }

    // In production, save enrollment to database
    logger.info('User enrolled in module', { userId, moduleId });

    res.json({
      success: true,
      data: {
        message: 'Successfully enrolled in module',
        module: {
          id: moduleId,
          title: module.title,
          lessonsCount: module.lessons.length,
          quizzesCount: module.quizzes.length
        }
      }
    });
  } catch (error) {
    logger.error('Error enrolling in module', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to enroll in module'
    });
  }
});

export default learningRouter;
