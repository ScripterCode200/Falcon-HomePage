'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import confetti from 'canvas-confetti';
import {
  Sparkles,
  Flame,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Share2,
  Trophy,
  HelpCircle,
  Atom,
  Cpu,
  FileText,
  Volume2,
  VolumeX,
  Brain,
  BookOpen,
  ChevronDown,
  ChevronUp,
  X,
  History,
  Info,
} from 'lucide-react';
import {
  Question,
  UserStats,
  getCurrentCycleKey,
  loadUserQuizStats,
  recordQuizCompletion,
  fetchDailyQuiz,
  submitQuizAttempt,
  fetchQuizHistory,
  LearningNode,
} from '@/lib/quizData';
import { SAS_CERTIFICATION_20_BANK } from '@/lib/sasKnowledgeBase';
import { sounds } from '@/lib/soundEffects';
import { useAuth } from '@/context/AuthContext';

interface LessonMeta {
  courseTitle: string;
  courseFolder: string;
  fileName: string;
  lessonNumber: number;
  totalLessons: number;
  pageRangeLabel: string;
  categoryIcon: string;
}

export const DailyQuizPanel: React.FC = () => {
  const { user, syncCloudData } = useAuth();

  // Core quiz state
  const [cycleKey, setCycleKey] = useState('');
  const [stats, setStats] = useState<UserStats>({
    currentStreak: 0,
    highestStreak: 0,
    totalQuizzesPlayed: 0,
    totalCorrectAnswers: 0,
    totalQuestionsAnswered: 0,
    lastPlayedDate: '',
    history: {},
  });
  const [questions, setQuestions] = useState<Question[]>(() => SAS_CERTIFICATION_20_BANK.slice(0, 20));
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [userAnswers, setUserAnswers] = useState<number[]>([]);
  const [isCompleted, setIsCompleted] = useState(false);
  const [quizSource, setQuizSource] = useState<'gemini' | 'curated'>('curated');
  const [lessonInfo, setLessonInfo] = useState<LessonMeta | null>(null);

  // UI state
  const [copiedShare, setCopiedShare] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [expandedLearning, setExpandedLearning] = useState<number | null>(null);

  // Modals
  const [showScheduleInfo, setShowScheduleInfo] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [historyData, setHistoryData] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [quizJustCompleted, setQuizJustCompleted] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Initialize
  useEffect(() => {
    const key = getCurrentCycleKey();
    setCycleKey(key);
    const loadedStats = loadUserQuizStats();
    setStats(loadedStats);
    setIsMuted(sounds.getIsMuted());

    const cycleHistory = loadedStats.history[key];
    if (cycleHistory && cycleHistory.completed) {
      setScore(cycleHistory.score);
      setUserAnswers(cycleHistory.selectedAnswers || []);
      setIsCompleted(true);
    }

    fetchDailyQuiz()
      .then((qs) => {
        if (qs && Array.isArray(qs.questions) && qs.questions.length > 0) {
          if (!hasAnswered && currentIndex === 0) {
            setQuestions(qs.questions);
            setQuizSource(qs.source);
          }
        }
        if (qs && qs.lessonInfo) {
          setLessonInfo(qs.lessonInfo);
        }
      })
      .catch(() => {});
  }, []);

  // Poll for background iterative enrichment (4 questions at a time)
  useEffect(() => {
    if (!cycleKey || isCompleted) return;

    const unEnrichedCount = questions.filter(
      (q) => !q.learningNode?.comprehensiveNote?.overview
    ).length;

    if (unEnrichedCount === 0) return; // All 20 already enriched

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/quiz/enrich?cycleKey=${cycleKey}`);
        if (res.ok) {
          const data = await res.json();
          if (data.success && Array.isArray(data.questions)) {
            setQuestions((prev) =>
              prev.map((oldQ, idx) => {
                const updatedQ = data.questions[idx];
                if (updatedQ && updatedQ.learningNode?.comprehensiveNote?.overview) {
                  return {
                    ...oldQ,
                    learningNode: updatedQ.learningNode,
                  };
                }
                return oldQ;
              })
            );

            if (data.enrichedCount >= (data.totalQuestions || 20) || !data.isEnriching) {
              clearInterval(interval);
            }
          }
        }
      } catch {
        // Silently continue
      }
    }, 3500);

    return () => clearInterval(interval);
  }, [cycleKey, isCompleted, questions]);

  const renderCategoryIcon = (iconName: string) => {
    switch (iconName) {
      case 'Cpu':
        return <Cpu size={14} />;
      case 'Atom':
        return <Atom size={14} />;
      case 'FileText':
        return <FileText size={14} />;
      default:
        return <Sparkles size={14} />;
    }
  };

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

  const handleNext = () => {
    sounds.playClick();
    setExpandedLearning(null);
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedOption(null);
      setHasAnswered(false);
    } else {
      finishQuiz();
    }
  };

  const finishQuiz = async () => {
    const finalScore = score;
    setIsCompleted(true);

    const updated = recordQuizCompletion(cycleKey, finalScore, questions.length, [...userAnswers]);
    setStats(updated);
    syncCloudData(undefined, updated);

    submitQuizAttempt({
      cycleKey,
      track: lessonInfo?.courseFolder || 'sequential',
      score: finalScore,
      totalQuestions: questions.length,
      accuracy: Math.round((finalScore / questions.length) * 100),
      userAnswers: [...userAnswers],
    });

    sounds.playCelebration();
    confetti({
      particleCount: 100,
      spread: 80,
      origin: { y: 0.6 },
      colors: ['#4285F4', '#EA4335', '#FBBC05', '#34A853'],
    });

    // Show celebratory "done for today" screen after 2s
    setTimeout(() => setQuizJustCompleted(true), 2000);
  };

  const handleShareScore = () => {
    sounds.playClick();
    const message = `Falcon SAS Daily Quiz 🎯\nLesson: ${lessonInfo?.courseTitle || 'SAS Certification'} (${lessonInfo?.pageRangeLabel || 'Daily'})\nScore: ${score}/${questions.length} (${Math.round(
      (score / questions.length) * 100
    )}%)\nStreak: ${stats.currentStreak} 🔥\n${window.location.origin}`;
    navigator.clipboard.writeText(message);
    setCopiedShare(true);
    setTimeout(() => setCopiedShare(false), 2000);
  };

  const toggleMute = () => {
    setIsMuted(sounds.toggleMute());
  };

  const handleOpenHistory = async () => {
    setShowHistory(true);
    setHistoryLoading(true);

    // Immediately populate from localStorage so it's never empty right after quiz
    const localStats = loadUserQuizStats();
    const localHistory = Object.entries(localStats.history)
      .filter(([, v]) => v.completed)
      .map(([cycleKey, v]) => ({
        cycleKey,
        score: v.score,
        totalQuestions: v.totalQuestions,
        accuracy: Math.round((v.score / v.totalQuestions) * 100),
        track: lessonInfo?.courseFolder || 'SAS Certification',
        completedAt: v.completedAt,
      }))
      .sort((a, b) => b.cycleKey.localeCompare(a.cycleKey));

    if (localHistory.length > 0) {
      setHistoryData(localHistory);
      setHistoryLoading(false);
    }

    // Also fetch from API (may have more records from other devices)
    try {
      const apiData = await fetchQuizHistory();
      if (apiData && apiData.length > 0) {
        setHistoryData(apiData);
      }
    } catch { /* keep local data */ }
    setHistoryLoading(false);
  };

  const toggleLearningNode = (qIndex: number) => {
    setExpandedLearning(expandedLearning === qIndex ? null : qIndex);
  };

  const currentQ = questions[currentIndex];
  const progressPercent =
    questions.length > 0 ? ((currentIndex + (hasAnswered ? 1 : 0)) / questions.length) * 100 : 0;

  // Resolve learning node with robust fallback so it never fails
  const getNodeForQuestion = (q?: Question): LearningNode => {
    if (q?.learningNode && q.learningNode.conceptSummary) {
      return q.learningNode;
    }
    return {
      conceptSummary:
        q?.explanation ||
        'This question covers core principles of SAS Viya analytics and model assessment.',
      terminologies: [
        {
          term: q?.category || 'SAS Viya',
          definition: 'Cloud-native analytics platform combining in-memory execution with visual modeling.',
        },
        {
          term: 'CAS (Cloud Analytic Services)',
          definition: 'Distributed server engine in SAS Viya providing in-memory distributed data processing.',
        },
      ],
      certificationTakeaway:
        q?.funFact ||
        'Remember to review option contrasts and specific statistical criteria tested on the exam.',
    };
  };

  const currentLearningNode = currentQ ? getNodeForQuestion(currentQ) : null;
  const isLearningExpanded = expandedLearning === currentIndex;

  return (
    <div className="quiz-section-wrapper" aria-label="SAS Daily Quiz">
      <div className="quiz-card">
        {/* Header */}
        <div className="quiz-header">
          <div className="quiz-title-group">
            <h2 className="quiz-title">
              <Brain size={20} style={{ color: 'var(--falcon-accent)' }} />
              <span>Daily SAS Quiz</span>
            </h2>
            {stats.currentStreak > 0 && (
              <span className="streak-badge" title={`${stats.currentStreak} day streak!`}>
                <Flame size={14} />
                {stats.currentStreak}
              </span>
            )}
          </div>

          <div className="quiz-header-actions">
            <div className="gemini-brain-badge">
              <span className="gemini-brain-dot" />
              <span>{quizSource === 'gemini' ? 'Gemini AI' : 'Curated'}</span>
            </div>
            <button
              type="button"
              className="tool-icon-btn"
              onClick={handleOpenHistory}
              title="Score History"
            >
              <History size={16} />
            </button>
            <button
              type="button"
              className="tool-icon-btn"
              onClick={() => setShowScheduleInfo(true)}
              title="Curriculum Schedule Info"
            >
              <Info size={16} />
            </button>
            <button
              type="button"
              className="tool-icon-btn"
              onClick={toggleMute}
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="quiz-progress-bar-bg">
          <div className="quiz-progress-bar-fill" style={{ width: `${progressPercent}%` }} />
        </div>

        {/* Active Quiz Question */}
        {!isCompleted && currentQ && (
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
            {/* Minimal Course & Lesson Breadcrumb Indicator */}
            <div className="quiz-course-breadcrumb">
              <div className="course-breadcrumb-chip">
                {renderCategoryIcon(lessonInfo?.categoryIcon || currentQ.categoryIcon)}
                <span className="course-breadcrumb-folder">
                  {lessonInfo?.courseFolder || currentQ.category}
                </span>
                {lessonInfo && (
                  <>
                    <span className="course-breadcrumb-dot">•</span>
                    <span className="course-breadcrumb-lesson">
                      Lesson {lessonInfo.lessonNumber}/{lessonInfo.totalLessons} ({lessonInfo.pageRangeLabel})
                    </span>
                  </>
                )}
              </div>
              <span className="question-counter">
                {currentIndex + 1} / {questions.length}
              </span>
            </div>

            {/* Question Text */}
            <h3 className="question-text">{currentQ.question}</h3>

            {/* Answer Options List */}
            <div className="options-list" role="radiogroup">
              {currentQ.options.map((option, idx) => {
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
                    <span style={{ flex: 1 }}>{option}</span>
                    {hasAnswered && isSelected && isCorrect && (
                      <CheckCircle2 size={18} style={{ color: 'var(--success-color)' }} />
                    )}
                    {hasAnswered && isSelected && !isCorrect && (
                      <XCircle size={18} style={{ color: 'var(--error-color)' }} />
                    )}
                    {hasAnswered && !isSelected && isCorrect && (
                      <CheckCircle2 size={18} style={{ color: 'var(--success-color)', opacity: 0.8 }} />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Answer Feedback & Actions */}
            {hasAnswered && (
              <div style={{ marginTop: '4px', marginBottom: '14px' }}>
                <div className="explanation-box">
                  <div className="explanation-title">
                    {selectedOption === currentQ.correctIndex ? '✨ Correct!' : '💡 Explanation'}
                  </div>
                  <p className="explanation-text">{currentQ.explanation}</p>
                  {currentQ.funFact && (
                    <p className="funFact-text">⚡ Exam Tip: {currentQ.funFact}</p>
                  )}
                </div>

                {/* Next Question / Complete Quiz Button */}
                <div className="quiz-footer-actions" style={{ marginTop: '12px', marginBottom: '16px' }}>
                  <button type="button" className="primary-action-btn" onClick={handleNext}>
                    <span>{currentIndex < questions.length - 1 ? 'Next Question' : 'Complete Quiz'}</span>
                    <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            )}

            {/* "Learn about it" Expandable Section at Bottom of Question */}
            {currentLearningNode && (
              <div className="learning-node-section">
                <button
                  type="button"
                  className={`learn-about-btn ${isLearningExpanded ? 'active' : ''}`}
                  onClick={() => toggleLearningNode(currentIndex)}
                  aria-expanded={isLearningExpanded}
                >
                  <div className="learn-about-btn-left">
                    <BookOpen size={16} className="learn-icon" />
                    <span className="learn-btn-text">Learn about it</span>
                  </div>
                  <div className="learn-about-btn-right">
                    <span className="learn-btn-hint">
                      {isLearningExpanded ? 'Hide concept breakdown' : 'Concept & complex terms'}
                    </span>
                    {isLearningExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </div>
                </button>

                {isLearningExpanded && (
                  <div className="learning-node-tab">
                    {/* Concept Breakdown / Comprehensive Masterclass Note */}
                    <div className="learning-block">
                      <div className="learning-block-title">
                        <Sparkles size={15} style={{ color: 'var(--falcon-accent)' }} />
                        <span>Comprehensive Concept Breakdown</span>
                        {currentLearningNode.comprehensiveNote?.overview && (
                          <span className="enrichment-progress-pill" style={{ marginLeft: 'auto' }}>
                            Masterclass Note
                          </span>
                        )}
                      </div>
                      <div className="learning-concept-card">
                        {(currentLearningNode.comprehensiveNote?.overview || currentLearningNode.conceptSummary)
                          .split(/\n\s*\n|\n/)
                          .map((paragraph, pIdx) => {
                            const trimmed = paragraph.trim();
                            if (!trimmed) return null;
                            return (
                              <p key={pIdx} className="learning-paragraph">
                                {trimmed}
                              </p>
                            );
                          })}
                      </div>
                    </div>

                    {/* How SAS Viya Executes This (Under the Hood) */}
                    {currentLearningNode.comprehensiveNote?.coreMechanism && (
                      <div className="mechanism-box">
                        <div className="mechanism-title">
                          ⚙️ How SAS Viya Executes This (Under the Hood)
                        </div>
                        <div className="mechanism-content-wrapper">
                          {currentLearningNode.comprehensiveNote.coreMechanism
                            .split(/\n\s*\n|\n/)
                            .map((mechP, mIdx) => {
                              const trimmed = mechP.trim();
                              if (!trimmed) return null;
                              const isStep = /^[0-9]+[.)]|^-|^\*/.test(trimmed);
                              return (
                                <p key={mIdx} className={isStep ? 'mechanism-step-item' : 'mechanism-paragraph'}>
                                  {trimmed}
                                </p>
                              );
                            })}
                        </div>
                      </div>
                    )}

                    {/* Deep Dive Sections (Parameters, Diagnostics, Formulas) */}
                    {currentLearningNode.comprehensiveNote?.deepDiveSections &&
                      currentLearningNode.comprehensiveNote.deepDiveSections.length > 0 && (
                        <div className="learning-block">
                          <div className="deep-dive-grid">
                            {currentLearningNode.comprehensiveNote.deepDiveSections.map((sec, sIdx) => (
                              <div key={sIdx} className="deep-dive-card">
                                <span className="deep-dive-card-heading">{sec.heading}</span>
                                <span className="deep-dive-card-body">{sec.content}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                    {/* Key Terminologies with Clean Typography */}
                    {currentLearningNode.terminologies && currentLearningNode.terminologies.length > 0 && (
                      <div className="learning-block">
                        <div className="learning-block-title">
                          <Brain size={14} style={{ color: 'var(--falcon-accent)' }} />
                          <span>Complex Terminologies Defined</span>
                        </div>
                        <div className="terms-glossary-grid">
                          {currentLearningNode.terminologies.map((tItem, tIdx) => (
                            <div key={tIdx} className="glossary-term-item">
                              <span className="glossary-term-name">{tItem.term}</span>
                              <span className="glossary-term-def">{tItem.definition}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Certification Exam Takeaway / Traps */}
                    {(() => {
                      const traps =
                        currentLearningNode.comprehensiveNote?.examTrapsAndTips ||
                        currentLearningNode.certificationTakeaway;
                      if (!traps) return null;

                      let formattedTraps: string[] = [];
                      if (Array.isArray(traps)) {
                        formattedTraps = traps.map((item: any) =>
                          typeof item === 'string'
                            ? item
                            : item?.tip || item?.trap || item?.text || JSON.stringify(item)
                        );
                      } else if (typeof traps === 'object') {
                        const obj = traps as any;
                        formattedTraps = [obj.tip || obj.trap || obj.text || JSON.stringify(obj)];
                      } else {
                        formattedTraps = [String(traps)];
                      }

                      return (
                        <div className="learning-block certification-takeaway-block">
                          <div className="learning-block-title takeaway-title">
                            <Trophy size={14} />
                            <span>Exam Traps & Certification Takeaway</span>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            {formattedTraps.map((text, idx) => (
                              <p key={idx} className="takeaway-text">
                                {text}
                              </p>
                            ))}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Completed State */}
        {isCompleted && (
          <div className="quiz-complete-card">
            {quizJustCompleted ? (
              /* ── Quiz Done For Today ── */
              <>
                <span className="trophy-badge" role="img" aria-label="Done">
                  {score >= 16 ? '🏆' : score >= 10 ? '🌟' : '💡'}
                </span>
                <h3 className="score-headline" style={{ fontSize: '22px' }}>Quiz Complete for Today!</h3>
                <p style={{ fontSize: '15px', color: 'var(--text-secondary)', lineHeight: 1.7, maxWidth: '320px', textAlign: 'center', margin: '0 auto 18px' }}>
                  You scored <strong style={{ color: 'var(--falcon-accent)' }}>{score}/{questions.length}</strong> ({Math.round((score / questions.length) * 100)}%). Come back tomorrow at <strong>6:00 PM</strong> for a new lesson.
                </p>
                {lessonInfo && (
                  <div className="completed-lesson-pill" style={{ marginBottom: '20px' }}>
                    {renderCategoryIcon(lessonInfo.categoryIcon)}
                    <span>{lessonInfo.courseFolder} • Lesson {lessonInfo.lessonNumber}/{lessonInfo.totalLessons}</span>
                  </div>
                )}
                <div className="score-metrics-grid">
                  <div className="metric-box">
                    <div className="metric-val">{stats.currentStreak} 🔥</div>
                    <div className="metric-lbl">Daily Streak</div>
                  </div>
                  <div className="metric-box">
                    <div className="metric-val">{stats.totalQuizzesPlayed}</div>
                    <div className="metric-lbl">Total Quizzes</div>
                  </div>
                  <div className="metric-box">
                    <div className="metric-val">
                      {stats.totalQuestionsAnswered > 0
                        ? `${Math.round((stats.totalCorrectAnswers / stats.totalQuestionsAnswered) * 100)}%`
                        : '100%'}
                    </div>
                    <div className="metric-lbl">Accuracy</div>
                  </div>
                </div>
                <p style={{ fontSize: '13px', color: 'var(--text-tertiary)', marginTop: '4px', marginBottom: '16px', textAlign: 'center', letterSpacing: '0.01em' }}>
                  🔁 Next lesson unlocks tomorrow at 6:00 PM IST
                </p>
              </>
            ) : (
              /* ── Brief Score Card (first 2 seconds) ── */
              <>
                <span className="trophy-badge" role="img" aria-label="Trophy">
                  {score >= 16 ? '🏆' : score >= 10 ? '🌟' : '💡'}
                </span>
                <h3 className="score-headline">Quiz Completed!</h3>
                <p className="score-subtitle">
                  You scored <strong style={{ color: 'var(--falcon-accent)' }}>{score}</strong> out of{' '}
                  <strong>{questions.length}</strong> ({Math.round((score / questions.length) * 100)}%)
                </p>
                {lessonInfo && (
                  <div className="completed-lesson-pill">
                    {renderCategoryIcon(lessonInfo.categoryIcon)}
                    <span>{lessonInfo.courseFolder} • Lesson {lessonInfo.lessonNumber}/{lessonInfo.totalLessons}</span>
                  </div>
                )}
                <div className="score-metrics-grid">
                  <div className="metric-box">
                    <div className="metric-val">{stats.currentStreak} 🔥</div>
                    <div className="metric-lbl">Daily Streak</div>
                  </div>
                  <div className="metric-box">
                    <div className="metric-val">{stats.totalQuizzesPlayed}</div>
                    <div className="metric-lbl">Total Quizzes</div>
                  </div>
                  <div className="metric-box">
                    <div className="metric-val">
                      {stats.totalQuestionsAnswered > 0
                        ? `${Math.round((stats.totalCorrectAnswers / stats.totalQuestionsAnswered) * 100)}%`
                        : '100%'}
                    </div>
                    <div className="metric-lbl">Accuracy</div>
                  </div>
                </div>
              </>
            )}

            <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <button type="button" className="google-btn" onClick={handleShareScore}>
                <Share2 size={14} />
                <span style={{ marginLeft: '6px' }}>{copiedShare ? 'Copied!' : 'Share Score'}</span>
              </button>
              <button
                type="button"
                className="google-btn"
                onClick={() => setShowReview(!showReview)}
              >
                <HelpCircle size={14} />
                <span style={{ marginLeft: '6px' }}>{showReview ? 'Hide Review' : 'Review Questions'}</span>
              </button>
            </div>

            {/* Review Section */}
            {showReview && (
              <div style={{ textAlign: 'left', marginTop: '24px', width: '100%', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <h4 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Answer Review & Learning Points
                </h4>
                {questions.map((q, idx) => {
                  const userAnswer = userAnswers[idx];
                  const isUserCorrect = userAnswer === q.correctIndex;
                  const node = getNodeForQuestion(q);
                  return (
                    <div
                      key={idx}
                      style={{
                        background: 'var(--bg-secondary)',
                        padding: '14px 16px',
                        borderRadius: '12px',
                        border: `1px solid ${isUserCorrect ? 'var(--success-border)' : 'var(--error-border)'}`,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        {isUserCorrect ? (
                          <CheckCircle2 size={16} style={{ color: 'var(--success-color)' }} />
                        ) : (
                          <XCircle size={16} style={{ color: 'var(--error-color)' }} />
                        )}
                        <span style={{ fontSize: '14px', fontWeight: 600 }}>{q.question}</span>
                      </div>
                      <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                        Your answer:{' '}
                        <strong style={{ color: isUserCorrect ? 'var(--success-color)' : 'var(--error-color)' }}>
                          {userAnswer !== undefined ? q.options[userAnswer] : 'Skipped'}
                        </strong>
                      </div>
                      {!isUserCorrect && (
                        <div style={{ fontSize: '13px', color: 'var(--success-color)', marginBottom: '6px' }}>
                          Correct answer: <strong>{q.options[q.correctIndex]}</strong>
                        </div>
                      )}
                      <p style={{ fontSize: '12.5px', color: 'var(--text-tertiary)', lineHeight: 1.5, marginTop: '4px' }}>
                        {q.explanation}
                      </p>

                      {node && (
                        <div style={{ marginTop: '10px', padding: '12px 14px', background: 'var(--card-bg)', borderRadius: '10px', border: '1px solid var(--card-border)' }}>
                          <p style={{ fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--falcon-accent)', marginBottom: '6px' }}>
                            Concept & Takeaway:
                          </p>
                          <p style={{ fontSize: '13px', lineHeight: 1.68, color: 'var(--text-secondary)' }}>
                            {node.comprehensiveNote?.overview || node.conceptSummary}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Schedule Info Modal - Portaled to document.body */}
        {showScheduleInfo && mounted && createPortal(
          <div className="modal-overlay" onClick={() => setShowScheduleInfo(false)}>
            <div className="modal-card" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3 className="modal-title">Daily Sequential Curriculum</h3>
                <button type="button" className="tool-icon-btn" onClick={() => setShowScheduleInfo(false)}>
                  <X size={18} />
                </button>
              </div>

              <div className="modal-body">
                <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '16px' }}>
                  The quiz advances <strong>sequentially one lesson per day</strong> through your course materials. Every day at 6:00 PM IST, questions refresh for the next chapter in round-robin order.
                </p>

                <div className="curriculum-info-box">
                  <div className="curriculum-item-row">
                    <span className="curriculum-label">Today&apos;s Folder:</span>
                    <span className="curriculum-val">{lessonInfo?.courseFolder || 'Machine Learning using sas viya (Parts)'}</span>
                  </div>
                  <div className="curriculum-item-row">
                    <span className="curriculum-label">Lesson Part:</span>
                    <span className="curriculum-val">
                      {lessonInfo ? `Lesson ${lessonInfo.lessonNumber} of ${lessonInfo.totalLessons}` : 'Lesson 1'}
                    </span>
                  </div>
                  <div className="curriculum-item-row">
                    <span className="curriculum-label">Pages Covered:</span>
                    <span className="curriculum-val">{lessonInfo?.pageRangeLabel || 'Pages 1–117'}</span>
                  </div>
                  <div className="curriculum-item-row">
                    <span className="curriculum-label">Source File:</span>
                    <span className="curriculum-val" style={{ fontFamily: 'monospace' }}>
                      {lessonInfo?.fileName || 'CPML52-1-117.pdf'}
                    </span>
                  </div>
                  <div className="curriculum-item-row">
                    <span className="curriculum-label">Refresh Time:</span>
                    <span className="curriculum-val">Daily at 6:00 PM IST</span>
                  </div>
                </div>

                <p style={{ fontSize: '12.5px', color: 'var(--text-tertiary)', marginTop: '16px', lineHeight: 1.5 }}>
                  New folders added to <code style={{ color: 'var(--falcon-accent)' }}>public/SAS_Learn Data/</code> are automatically indexed and incorporated into the daily sequential rotation.
                </p>
              </div>

              <div className="modal-footer" style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="primary-action-btn"
                  onClick={() => setShowScheduleInfo(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

        {/* History Modal - Portaled to document.body */}
        {showHistory && mounted && createPortal(
          <div className="modal-overlay" onClick={() => setShowHistory(false)}>
            <div className="modal-card" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3 className="modal-title">Past Quiz Attempts</h3>
                <button type="button" className="tool-icon-btn" onClick={() => setShowHistory(false)}>
                  <X size={18} />
                </button>
              </div>

              <div className="modal-body">
                {historyLoading ? (
                  <p style={{ textAlign: 'center', padding: '20px', color: 'var(--text-secondary)' }}>
                    Loading history...
                  </p>
                ) : historyData.length === 0 ? (
                  <p style={{ textAlign: 'center', padding: '20px', color: 'var(--text-secondary)' }}>
                    No previous quiz records found. Complete today&apos;s quiz to log your first score!
                  </p>
                ) : (
                  <div className="history-list">
                    {historyData.map((item, idx) => (
                      <div key={idx} className="history-item-row">
                        <div className="history-item-left">
                          <span className="history-cycle-date">{item.cycleKey}</span>
                          <span className="history-track-name">
                            {item.track?.replace(/\(Parts\)/gi, '')}
                          </span>
                        </div>
                        <div className="history-item-right">
                          <span className="history-score-tag">
                            {item.score}/{item.totalQuestions}
                          </span>
                          <span className="history-acc-tag">{item.accuracy}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="modal-footer" style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="primary-action-btn"
                  onClick={() => setShowHistory(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
      </div>
    </div>
  );
};
