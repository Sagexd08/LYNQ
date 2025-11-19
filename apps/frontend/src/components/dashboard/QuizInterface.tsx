import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import './QuizInterface.css';

interface Question {
  id: string;
  question: string;
  type: 'multiple-choice' | 'true-false' | 'short-answer';
  options?: string[];
  explanation?: string;
  points: number;
}

interface QuizProps {
  moduleId: string;
  quizId: string;
  title: string;
  questions: Question[];
  passingScore: number;
  rewards: number;
  onComplete?: (result: QuizResult) => void;
}

export interface QuizResult {
  score: number;
  maxScore: number;
  passed: boolean;
  percentScore: number;
  rewards: number;
  breakdown: QuestionBreakdown[];
}

interface QuestionBreakdown {
  questionId: string;
  correct: boolean;
  earnedPoints: number;
  explanation: string;
}

export const QuizInterface: React.FC<QuizProps> = ({
  moduleId,
  quizId,
  title,
  questions,
  passingScore,
  onComplete
}) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Map<string, any>>(new Map());
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<QuizResult | null>(null);
  const [timeLeft, setTimeLeft] = useState(30 * 60); // 30 minutes
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (submitted) return;
    const timer = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 0) {
          handleSubmitQuiz();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [submitted]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAnswerChange = (questionId: string, answer: any) => {
    const newAnswers = new Map(userAnswers);
    newAnswers.set(questionId, answer);
    setUserAnswers(newAnswers);
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const handleSubmitQuiz = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/learning/quiz/${moduleId}/${quizId}/submit`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            answers: Object.fromEntries(userAnswers)
          })
        }
      );

      const data = await response.json();
      if (data.success) {
        setResult(data.data);
        setSubmitted(true);
        onComplete?.(data.data);
      }
    } catch (error) {
      console.error('Failed to submit quiz:', error);
    } finally {
      setLoading(false);
    }
  };

  if (submitted && result) {
    const passed = result.passed;
    return (
      <motion.div
        className="quiz-results"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <div className={`results-container ${passed ? 'passed' : 'failed'}`}>
          <div className="results-icon">
            {passed ? '🎉' : '📚'}
          </div>

          <h2>{passed ? 'Great Job!' : 'Keep Learning'}</h2>

          <div className="results-stats">
            <div className="result-stat">
              <span className="stat-label">Score</span>
              <span className="stat-value">{result.percentScore.toFixed(1)}%</span>
            </div>
            <div className="result-stat">
              <span className="stat-label">Points Earned</span>
              <span className="stat-value">{result.rewards}</span>
            </div>
            <div className="result-stat">
              <span className="stat-label">Questions Correct</span>
              <span className="stat-value">
                {result.breakdown.filter(b => b.correct).length}/{questions.length}
              </span>
            </div>
          </div>

          <div className="score-bar">
            <div
              className={`score-fill ${passed ? 'passed' : 'failed'}`}
              style={{ width: `${Math.min(result.percentScore, 100)}%` }}
            />
            <span className="passing-line" style={{ left: `${passingScore}%` }}>
              Passing: {passingScore}%
            </span>
          </div>

          <button className="btn-continue" onClick={() => window.history.back()}>
            Continue Learning
          </button>
        </div>

        {/* Answer Breakdown */}
        <div className="answer-breakdown">
          <h3>Answer Review</h3>
          {result.breakdown.map((item, index) => {
            const question = questions.find(q => q.id === item.questionId);
            return (
              <motion.div
                key={item.questionId}
                className={`breakdown-item ${item.correct ? 'correct' : 'incorrect'}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="breakdown-header">
                  <span className="question-number">Q{index + 1}</span>
                  <span className={`result-badge ${item.correct ? 'correct' : 'incorrect'}`}>
                    {item.correct ? '✓' : '✗'}
                  </span>
                  <span className="points-badge">
                    {item.earnedPoints}/{question?.points}
                  </span>
                </div>
                <div className="breakdown-question">{question?.question}</div>
                {item.explanation && (
                  <div className="breakdown-explanation">{item.explanation}</div>
                )}
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    );
  }

  const question = questions[currentQuestion];

  if (!question) {
    return <div>No question available</div>;
  }

  return (
    <motion.div
      className="quiz-interface"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {/* Quiz Header */}
      <div className="quiz-header">
        <div className="quiz-info">
          <h2>{title}</h2>
          <p>Question {currentQuestion + 1} of {questions.length}</p>
        </div>
        <div className={`quiz-timer ${timeLeft < 300 ? 'warning' : ''}`}>
          <span>⏱️ {formatTime(timeLeft)}</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="quiz-progress">
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
          />
        </div>
        <span className="progress-text">
          {currentQuestion + 1} of {questions.length} questions
        </span>
      </div>

      {/* Question Container */}
      <motion.div
        className="question-container"
        key={question.id}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
      >
        <div className="question-header">
          <h3>{question.question}</h3>
          <span className="points-info">+{question.points} points</span>
        </div>

        {/* Question Type: Multiple Choice */}
        {question.type === 'multiple-choice' && question.options && (
          <div className="options-list">
            {question.options.map((option, index) => (
              <label key={index} className="option-item">
                <input
                  type="radio"
                  name={question.id}
                  value={option}
                  checked={userAnswers.get(question.id) === option}
                  onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                />
                <span className="option-text">{option}</span>
              </label>
            ))}
          </div>
        )}

        {/* Question Type: True/False */}
        {question.type === 'true-false' && (
          <div className="options-list">
            {['True', 'False'].map(option => (
              <label key={option} className="option-item">
                <input
                  type="radio"
                  name={question.id}
                  value={option}
                  checked={userAnswers.get(question.id) === option}
                  onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                />
                <span className="option-text">{option}</span>
              </label>
            ))}
          </div>
        )}

        {/* Question Type: Short Answer */}
        {question.type === 'short-answer' && (
          <textarea
            className="short-answer-input"
            placeholder="Type your answer here..."
            value={userAnswers.get(question.id) || ''}
            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
          />
        )}
      </motion.div>

      {/* Navigation Buttons */}
      <div className="quiz-navigation">
        <button
          className="btn-nav"
          onClick={handlePrevious}
          disabled={currentQuestion === 0}
        >
          ← Previous
        </button>

        <div className="answer-indicators">
          {questions.map((q, index) => (
            <button
              key={q.id}
              className={`indicator ${
                userAnswers.has(q.id) ? 'answered' : 'unanswered'
              } ${index === currentQuestion ? 'current' : ''}`}
              onClick={() => setCurrentQuestion(index)}
            />
          ))}
        </div>

        {currentQuestion === questions.length - 1 ? (
          <button
            className="btn-submit"
            onClick={handleSubmitQuiz}
            disabled={loading || userAnswers.size === 0}
          >
            {loading ? 'Submitting...' : 'Submit Quiz'}
          </button>
        ) : (
          <button className="btn-nav" onClick={handleNext}>
            Next →
          </button>
        )}
      </div>
    </motion.div>
  );
};

export default QuizInterface;
