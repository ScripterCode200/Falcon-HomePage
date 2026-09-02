'use client';

import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  Sparkles,
  Flame,
  Clock,
  CheckCircle2,
  XCircle,
  ArrowRight,
  RotateCcw,
  Share2,
  Trophy,
  HelpCircle,
  Atom,
  Cpu,
  Landmark,
  Globe,
  Leaf,
  Film,
  Volume2,
  VolumeX,
} from 'lucide-react';
import {
  Question,
  UserStats,
  getDailyQuestions,
  getRandomPracticeQuestions,
  getTodayDateString,
  getTimeUntilMidnight,
  loadUserQuizStats,
  recordQuizCompletion,
} from '@/lib/quizData';
import { sounds } from '@/lib/soundEffects';
import { useAuth } from '@/context/AuthContext';

export const DailyQuizPanel: React.FC = () => {
  const { user, syncCloudData } = useAuth();
  const [todayDate, setTodayDate] = useState<string>('');
  const [stats, setStats] = useState<UserStats>({
    currentStreak: 0,
    highestStreak: 0,
    totalQuizzesPlayed: 0,
    totalCorrectAnswers: 0,
    totalQuestionsAnswered: 0,
    lastPlayedDate: '',
    history: {},
  });

  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [hasAnswered, setHasAnswered] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);
  const [userAnswers, setUserAnswers] = useState<number[]>([]);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [isPracticeMode, setIsPracticeMode] = useState<boolean>(false);
  const [copiedShare, setCopiedShare] = useState<boolean>(false);
  const [timeRemaining, setTimeRemaining] = useState({ hours: 0, minutes: 0, seconds: 0 });
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [showReview, setShowReview] = useState<boolean>(false);

  // Initialize data on client load
  useEffect(() => {
    const today = getTodayDateString();
    setTodayDate(today);

    const loadedStats = loadUserQuizStats();
    setStats(loadedStats);
    setIsMuted(sounds.getIsMuted());

    // Check if user already finished today's daily quiz
    const todayHistory = loadedStats.history[today];
    if (todayHistory && todayHistory.completed) {
      const { questions: dailyQ } = getDailyQuestions(today);
      setQuestions(dailyQ);
      setScore(todayHistory.score);
      setUserAnswers(todayHistory.selectedAnswers || []);
      setIsCompleted(true);
    } else {
      const { questions: dailyQ } = getDailyQuestions(today);
      setQuestions(dailyQ);
      setCurrentIndex(0);
      setScore(0);
      setUserAnswers([]);
      setIsCompleted(false);
    }

    // Countdown timer until midnight
    setTimeRemaining(getTimeUntilMidnight());
    const interval = setInterval(() => {
      setTimeRemaining(getTimeUntilMidnight());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Category Icon mapper
  const renderCategoryIcon = (iconName: string) => {
    switch (iconName) {
      case 'Atom':
        return <Atom size={14} />;
      case 'Cpu':
        return <Cpu size={14} />;
      case 'Landmark':
        return <Landmark size={14} />;
      case 'Globe':
        return <Globe size={14} />;
      case 'Leaf':
        return <Leaf size={14} />;
      case 'Film':
        return <Film size={14} />;
      default:
        return <Sparkles size={14} />;
    }
  };

  // Option selection
  const handleSelectOption = (index: number) => {
    if (hasAnswered) return;

    setSelectedOption(index);
    setHasAnswered(true);

    const currentQ = questions[currentIndex];
    const isCorrect = index === currentQ.correctIndex;

    if (isCorrect) {
      sounds.playCorrect();
      setScore((prev) => prev + 1);
    } else {
      sounds.playWrong();
    }

    setUserAnswers((prev) => [...prev, index]);
  };

  // Next question or complete
  const handleNext = () => {
    sounds.playClick();
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedOption(null);
      setHasAnswered(false);
    } else {
      // Quiz finished!
      finishQuiz();
    }
  };

  const finishQuiz = () => {
    const finalScore = score + (selectedOption === questions[currentIndex].correctIndex ? 0 : 0);
    setIsCompleted(true);

    if (!isPracticeMode) {
      const updated = recordQuizCompletion(todayDate, score, questions.length, [...userAnswers]);
      setStats(updated);
      syncCloudData(undefined, updated);
    }

    sounds.playCelebration();

    // Trigger Confetti!
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#4285F4', '#EA4335', '#FBBC05', '#34A853'],
    });
  };

  // Start Practice Mode (endless practice questions)
  const startPracticeMode = () => {
    sounds.playClick();
    const practiceQ = getRandomPracticeQuestions(5);
    setQuestions(practiceQ);
    setCurrentIndex(0);
    setSelectedOption(null);
    setHasAnswered(false);
    setScore(0);
    setUserAnswers([]);
    setIsCompleted(false);
    setIsPracticeMode(true);
    setShowReview(false);
  };

  // Reset back to today's daily quiz view
  const returnToDailyQuiz = () => {
    sounds.playClick();
    setIsPracticeMode(false);
    setShowReview(false);
    const { questions: dailyQ } = getDailyQuestions(todayDate);
    setQuestions(dailyQ);

    const todayHistory = stats.history[todayDate];
    if (todayHistory && todayHistory.completed) {
      setScore(todayHistory.score);
      setUserAnswers(todayHistory.selectedAnswers || []);
      setIsCompleted(true);
    } else {
      setCurrentIndex(0);
      setSelectedOption(null);
      setHasAnswered(false);
      setScore(0);
      setUserAnswers([]);
      setIsCompleted(false);
    }
  };

  // Share score
  const handleShareScore = () => {
    sounds.playClick();
    const message = `Falcon Daily Quiz 🎯\nScore: ${score}/${questions.length} | Streak: ${stats.currentStreak} 🔥\nTest your knowledge: ${window.location.origin}`;
    navigator.clipboard.writeText(message);
    setCopiedShare(true);
    setTimeout(() => setCopiedShare(false), 2000);
  };

  const toggleMute = () => {
    const muted = sounds.toggleMute();
    setIsMuted(muted);
  };

  const currentQ = questions[currentIndex];
  const progressPercent = questions.length > 0 ? ((currentIndex + (hasAnswered ? 1 : 0)) / questions.length) * 100 : 0;

  return (
    <div className="quiz-section-wrapper" aria-label="Daily Quiz Challenge">
      <div className="quiz-card">
        {/* Header */}
        <div className="quiz-header">
          <div className="quiz-title-group">
            <h2 className="quiz-title">
              <Sparkles size={18} style={{ color: 'var(--google-yellow)' }} />
              {isPracticeMode ? 'Practice Trivia Challenge' : 'Daily Trivia Challenge'}
            </h2>

            {!isPracticeMode && stats.currentStreak > 0 && (
              <span className="streak-badge" title={`${stats.currentStreak} day streak!`}>
                <Flame size={14} />
                {stats.currentStreak} Day Streak
              </span>
            )}
          </div>

          <div className="quiz-header-actions">
            <button
              type="button"
              className="tool-icon-btn"
              onClick={toggleMute}
              title={isMuted ? 'Unmute audio' : 'Mute audio'}
            >
              {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </button>
          </div>
        </div>

        {/* Quiz Flow: In Progress */}
        {!isCompleted && currentQ && (
          <div>
            {/* Progress Bar */}
            <div className="quiz-progress-bar-bg">
              <div className="quiz-progress-bar-fill" style={{ width: `${progressPercent}%` }} />
            </div>

            {/* Question Meta */}
            <div className="question-meta">
              <span className="category-tag" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                {renderCategoryIcon(currentQ.categoryIcon)}
                {currentQ.category}
              </span>
              <span className="question-counter">
                Question {currentIndex + 1} of {questions.length}
              </span>
            </div>

            {/* Question Title */}
            <h3 className="question-text">{currentQ.question}</h3>

            {/* Options List */}
            <div className="options-list">
              {currentQ.options.map((opt, idx) => {
                const isSelected = selectedOption === idx;
                const isCorrect = idx === currentQ.correctIndex;
                const letter = String.fromCharCode(65 + idx);

                let optionClass = 'option-btn';
                if (hasAnswered) {
                  if (isSelected) {
                    optionClass += isCorrect ? ' selected-correct' : ' selected-wrong';
                  } else if (isCorrect) {
                    optionClass += ' reveal-correct';
                  }
                }

                return (
                  <button
                    key={idx}
                    type="button"
                    className={optionClass}
                    onClick={() => handleSelectOption(idx)}
                    disabled={hasAnswered}
                  >
                    <span className="option-badge">{letter}</span>
                    <span style={{ flex: 1 }}>{opt}</span>
                    {hasAnswered && isSelected && isCorrect && <CheckCircle2 size={18} style={{ color: 'var(--google-green)' }} />}
                    {hasAnswered && isSelected && !isCorrect && <XCircle size={18} style={{ color: 'var(--google-red)' }} />}
                  </button>
                );
              })}
            </div>

            {/* Explanation card after answering */}
            {hasAnswered && (
              <div className="explanation-box">
                <div className="explanation-title">
                  {selectedOption === currentQ.correctIndex ? '✨ Correct!' : '💡 Explanation'}
                </div>
                <p className="explanation-text">{currentQ.explanation}</p>
                {currentQ.funFact && <p className="funFact-text">⚡ Did you know? {currentQ.funFact}</p>}
              </div>
            )}

            {/* Next Action Button */}
            {hasAnswered && (
              <div className="quiz-footer-actions">
                <button type="button" className="primary-action-btn" onClick={handleNext}>
                  {currentIndex < questions.length - 1 ? (
                    <>
                      Next Question <ArrowRight size={16} />
                    </>
                  ) : (
                    <>
                      Complete Quiz <Trophy size={16} />
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Quiz Flow: Completed Screen */}
        {isCompleted && (
          <div className="quiz-complete-card">
            <span className="trophy-badge" role="img" aria-label="Trophy">
              {score >= 4 ? '🏆' : score >= 2 ? '🌟' : '💡'}
            </span>

            <h3 className="score-headline">
              {isPracticeMode ? 'Practice Complete!' : "Today's Challenge Completed!"}
            </h3>

            <p className="score-subtitle">
              You scored <strong style={{ color: 'var(--google-blue)' }}>{score}</strong> out of{' '}
              <strong>{questions.length}</strong> correct!
            </p>

            {/* Next Daily Quiz Countdown (when in daily challenge mode) */}
            {!isPracticeMode && (
              <div className="next-timer-box">
                <Clock size={15} />
                <span>
                  Next Daily Quiz in: {String(timeRemaining.hours).padStart(2, '0')}h{' '}
                  {String(timeRemaining.minutes).padStart(2, '0')}m {String(timeRemaining.seconds).padStart(2, '0')}s
                </span>
              </div>
            )}

            {/* Performance Metrics */}
            <div className="score-metrics-grid">
              <div className="metric-box">
                <div className="metric-val">{Math.round((score / Math.max(questions.length, 1)) * 100)}%</div>
                <div className="metric-lbl">Accuracy</div>
              </div>
              <div className="metric-box">
                <div className="metric-val">🔥 {stats.currentStreak}</div>
                <div className="metric-lbl">Current Streak</div>
              </div>
              <div className="metric-box">
                <div className="metric-val">⭐ {stats.highestStreak}</div>
                <div className="metric-lbl">Best Streak</div>
              </div>
            </div>

            {/* Review Answers Accordion */}
            {showReview && (
              <div style={{ textAlign: 'left', marginBottom: '24px' }}>
                <h4 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '12px' }}>Review Questions:</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {questions.map((q, qIdx) => {
                    const userAnsIdx = userAnswers[qIdx];
                    const isCorrect = userAnsIdx === q.correctIndex;
                    return (
                      <div
                        key={q.id}
                        style={{
                          background: 'var(--bg-secondary)',
                          padding: '12px 14px',
                          borderRadius: '10px',
                          border: '1px solid var(--card-border)',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                          {isCorrect ? (
                            <CheckCircle2 size={16} style={{ color: 'var(--google-green)' }} />
                          ) : (
                            <XCircle size={16} style={{ color: 'var(--google-red)' }} />
                          )}
                          <span style={{ fontSize: '14px', fontWeight: 600 }}>{q.question}</span>
                        </div>
                        <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>
                          Answer: <strong>{q.options[q.correctIndex]}</strong>
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '4px' }}>
                          {q.explanation}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <button type="button" className="google-btn" onClick={handleShareScore}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <Share2 size={14} />
                  {copiedShare ? 'Copied to Clipboard!' : 'Share Score'}
                </span>
              </button>

              <button
                type="button"
                className="google-btn"
                onClick={() => setShowReview(!showReview)}
              >
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <HelpCircle size={14} />
                  {showReview ? 'Hide Review' : 'Review Answers'}
                </span>
              </button>

              {isPracticeMode ? (
                <button type="button" className="primary-action-btn" onClick={returnToDailyQuiz}>
                  <RotateCcw size={15} />
                  Back to Today&apos;s Quiz
                </button>
              ) : (
                <button type="button" className="primary-action-btn" onClick={startPracticeMode}>
                  <Sparkles size={15} />
                  Play Practice Quiz
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
