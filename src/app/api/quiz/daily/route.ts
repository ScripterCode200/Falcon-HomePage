import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { DailyQuiz } from '@/models/DailyQuiz';
import { LessonQuestionBank } from '@/models/LessonQuestionBank';
import { generateLessonQuizWithGemini, generateDetailedNotesForBatch } from '@/lib/geminiQuizService';
import { getCurrentCycleKey, Question } from '@/lib/quizData';
import { getLessonForCycleKey, extractLessonContextText, LessonInfo } from '@/lib/courseCatalog';
import { SAS_CERTIFICATION_20_BANK } from '@/lib/sasKnowledgeBase';

export const dynamic = 'force-dynamic';

import { memoryCache } from '@/lib/quizCache';

// Background iterative enrichment queue tracker to prevent duplicate concurrent runs
const activeEnrichments = new Set<string>();

export async function GET(request: NextRequest) {
  try {
    const cycleKey = getCurrentCycleKey();
    const cacheKey = cycleKey;

    // 1. Instant return from in-memory cache if available
    if (memoryCache[cacheKey]) {
      return NextResponse.json({
        success: true,
        questions: memoryCache[cacheKey].questions,
        cycleKey,
        source: memoryCache[cacheKey].source,
        model: memoryCache[cacheKey].model,
        lessonInfo: memoryCache[cacheKey].lessonInfo,
        enrichedCount: memoryCache[cacheKey].enrichedCount || 0,
        isEnriching: memoryCache[cacheKey].isEnriching || false,
        cached: true,
        fastCache: true,
      });
    }

    // 2. Determine today's lesson from sequential schedule
    const lesson = getLessonForCycleKey(cycleKey);

    let dbConnected = false;
    try {
      await connectToDatabase();
      dbConnected = true;
    } catch (dbErr: any) {
      console.warn('[/api/quiz/daily] MongoDB offline:', dbErr.message);
    }

    // 3. Check MongoDB for already-generated quiz for this cycle
    if (dbConnected && lesson) {
      try {
        const existing = await DailyQuiz.findOne({ cycleKey }).lean();
        if (existing && existing.questions && existing.questions.length > 0) {
          const enrichedCount = existing.questions.filter(
            (q: any) => q?.learningNode?.comprehensiveNote?.overview
          ).length;

          memoryCache[cacheKey] = {
            questions: existing.questions as Question[],
            source: existing.source,
            model: existing.modelUsed,
            lessonInfo: existing.lessonInfo || lesson,
            enrichedCount,
            isEnriching: enrichedCount < existing.questions.length,
          };

          // If not all 20 are enriched yet, trigger background enrichment for remaining batches
          if (enrichedCount < existing.questions.length && !activeEnrichments.has(cycleKey)) {
            triggerBackgroundEnrichment(cycleKey, lesson, existing.questions as Question[]);
          }

          return NextResponse.json({
            success: true,
            questions: existing.questions,
            cycleKey: existing.cycleKey,
            source: existing.source,
            model: existing.modelUsed,
            lessonInfo: existing.lessonInfo || lesson,
            enrichedCount,
            cached: true,
            dbStatus: 'connected',
          });
        }
      } catch (findErr: any) {
        console.warn('[/api/quiz/daily] DB find error:', findErr.message);
      }
    }

    // 4. Retrieve RAG anti-duplication memory (all questions already asked for this course & lesson)
    let previousQuestions: string[] = [];
    if (dbConnected && lesson) {
      try {
        const pastDocs = await LessonQuestionBank.find({
          courseFolder: lesson.courseFolder,
          lessonNumber: lesson.lessonNumber,
        })
          .select('questionText')
          .lean();

        previousQuestions = pastDocs.map((d: any) => d.questionText).filter(Boolean);
        console.log(
          `[/api/quiz/daily] RAG memory retrieved ${previousQuestions.length} past questions for "${lesson.courseTitle}" Lesson ${lesson.lessonNumber}`
        );
      } catch (ragErr: any) {
        console.warn('[/api/quiz/daily] Failed to query LessonQuestionBank:', ragErr.message);
      }
    }

    // 5. Generate initial 20 questions with 4.5s race timeout
    const fallbackResult = {
      questions: SAS_CERTIFICATION_20_BANK.slice(0, 20),
      source: 'curated' as const,
      modelUsed: 'instant-curated',
    };

    let result: { questions: Question[]; source: 'gemini' | 'curated'; modelUsed?: string };
    let lessonText = '';

    if (lesson) {
      const timeoutPromise = new Promise<typeof fallbackResult>((resolve) =>
        setTimeout(() => resolve(fallbackResult), 4500)
      );

      const generatePromise = (async () => {
        lessonText = await extractLessonContextText(lesson, 11000);
        return await generateLessonQuizWithGemini({
          lesson,
          lessonText,
          count: 20,
          previousQuestions,
        });
      })();

      result = await Promise.race([generatePromise, timeoutPromise]);
    } else {
      result = fallbackResult;
    }

    const lessonMeta = lesson
      ? {
          courseTitle: lesson.courseTitle,
          courseFolder: lesson.courseFolder,
          fileName: lesson.fileName,
          lessonNumber: lesson.lessonNumber,
          totalLessons: lesson.totalLessons,
          pageRangeLabel: lesson.pageRangeLabel,
          categoryIcon: lesson.categoryIcon,
        }
      : null;

    // Put into memory cache
    memoryCache[cacheKey] = {
      questions: result.questions,
      source: result.source,
      model: result.modelUsed,
      lessonInfo: lessonMeta,
      enrichedCount: 0,
      isEnriching: result.source === 'gemini',
    };

    // 6. Save newly generated questions to MongoDB (awaited so document exists before enrichment writes)
    if (dbConnected) {
      try {
        await DailyQuiz.findOneAndUpdate(
          { cycleKey, track: 'sequential' },
          {
            $setOnInsert: {
              cycleKey,
              track: 'sequential',
              difficulty: 'Mixed',
              totalQuestions: result.questions.length,
              questions: result.questions,
              source: result.source,
              modelUsed: result.modelUsed || 'curated',
              lessonInfo: lessonMeta,
            },
          },
          { upsert: true, new: true }
        );
        console.log(`[/api/quiz/daily] Saved ${result.questions.length} questions to DB for cycleKey: ${cycleKey}`);
      } catch (saveErr: any) {
        console.warn('[/api/quiz/daily] MongoDB save failed:', saveErr.message);
      }

      // RAG Memory: Save question texts to LessonQuestionBank to prevent future repeats
      if (lesson && result.source === 'gemini') {
        for (const q of result.questions) {
          if (q.question) {
            LessonQuestionBank.updateOne(
              {
                courseFolder: lesson.courseFolder,
                lessonNumber: lesson.lessonNumber,
                questionText: q.question.trim(),
              },
              {
                $setOnInsert: {
                  courseFolder: lesson.courseFolder,
                  courseTitle: lesson.courseTitle,
                  lessonNumber: lesson.lessonNumber,
                  questionText: q.question.trim(),
                  cycleKey,
                },
              },
              { upsert: true }
            ).catch(() => {});
          }
        }
      }
    }

    // 7. Trigger Iterative Detailed Note Generation (4 questions at a time) in background
    // Document is now guaranteed to exist in DB before enrichment starts its updateOne calls
    if (lesson && result.source === 'gemini') {
      triggerBackgroundEnrichment(cycleKey, lesson, result.questions, lessonText);
    }

    return NextResponse.json({
      success: true,
      questions: result.questions,
      cycleKey,
      source: result.source,
      model: result.modelUsed,
      lessonInfo: lessonMeta,
      enrichedCount: 0,
      isEnriching: result.source === 'gemini',
      cached: false,
      dbStatus: dbConnected ? 'connected' : 'offline',
    });
  } catch (error: any) {
    console.error('[/api/quiz/daily] Error:', error);
    return NextResponse.json({
      success: true,
      questions: SAS_CERTIFICATION_20_BANK.slice(0, 20),
      cycleKey: getCurrentCycleKey(),
      source: 'curated',
      fallback: true,
    });
  }
}

// -------------------------------------------------------------
// Background Iterative Enrichment: 4 questions at a time
// -------------------------------------------------------------
async function triggerBackgroundEnrichment(
  cycleKey: string,
  lesson: LessonInfo,
  questions: Question[],
  preloadedLessonText?: string
) {
  if (activeEnrichments.has(cycleKey)) return;
  activeEnrichments.add(cycleKey);

  (async () => {
    try {
      const lessonText =
        preloadedLessonText || (await extractLessonContextText(lesson, 8000));
      const currentList: Question[] = [...questions];
      const BATCH_SIZE = 4;
      const totalBatches = Math.ceil(currentList.length / BATCH_SIZE);

      console.log(
        `[IterativeNotes] Starting enrichment for ${currentList.length} questions in ${totalBatches} batches (4 per batch)`
      );

      for (let b = 0; b < totalBatches; b++) {
        const start = b * BATCH_SIZE;
        const end = Math.min(start + BATCH_SIZE, currentList.length);
        const batchSlice = currentList.slice(start, end);

        // Check if all questions in this batch already have comprehensive notes
        const needsWork = batchSlice.some(
          (q) => !q.learningNode?.comprehensiveNote?.overview
        );

        if (needsWork) {
          console.log(
            `[IterativeNotes] Generating detailed notes for Batch ${b + 1}/${totalBatches} (Questions ${start + 1}–${end})...`
          );

          const notesMap = await generateDetailedNotesForBatch(
            batchSlice,
            lesson,
            lessonText
          );

          // Merge generated detailed notes into currentList
          for (let i = start; i < end; i++) {
            const q = currentList[i];
            const enriched = notesMap[q.id];
            if (enriched) {
              currentList[i] = {
                ...q,
                learningNode: {
                  conceptSummary:
                    q.learningNode?.conceptSummary || enriched.comprehensiveNote.overview.substring(0, 180),
                  terminologies:
                    enriched.terminologies && enriched.terminologies.length > 0
                      ? enriched.terminologies
                      : q.learningNode?.terminologies || [],
                  certificationTakeaway:
                    q.learningNode?.certificationTakeaway || enriched.comprehensiveNote.examTrapsAndTips || '',
                  comprehensiveNote: enriched.comprehensiveNote,
                },
              };
            }
          }

          // Count total enriched so far
          const enrichedCount = currentList.filter(
            (q) => q.learningNode?.comprehensiveNote?.overview
          ).length;

          // Update in-memory cache instantly
          if (memoryCache[cycleKey]) {
            memoryCache[cycleKey].questions = [...currentList];
            memoryCache[cycleKey].enrichedCount = enrichedCount;
            memoryCache[cycleKey].isEnriching = enrichedCount < currentList.length;
          }

          // Persist batch update to MongoDB
          try {
            await connectToDatabase();
            await DailyQuiz.updateOne(
              { cycleKey },
              { $set: { questions: currentList } }
            );
          } catch (dbErr: any) {
            console.warn(`[IterativeNotes] DB batch save error:`, dbErr.message);
          }

          console.log(
            `[IterativeNotes] Batch ${b + 1}/${totalBatches} done. Enriched ${enrichedCount}/${currentList.length} questions.`
          );

          // Small 300ms pause between batches to be respectful to API rate limits
          await new Promise((r) => setTimeout(r, 300));
        }
      }

      console.log(`[IterativeNotes] All 20 questions fully enriched with detailed notes!`);
    } catch (err: any) {
      console.warn('[IterativeNotes] Background enrichment error:', err.message);
    } finally {
      activeEnrichments.delete(cycleKey);
      if (memoryCache[cycleKey]) {
        memoryCache[cycleKey].isEnriching = false;
      }
    }
  })();
}
