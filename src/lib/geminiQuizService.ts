import { Question, ComprehensiveNote } from './quizData';
import { SAS_CERTIFICATION_20_BANK } from './sasKnowledgeBase';
import type { LessonInfo } from './courseCatalog';

interface GenerateQuizOptions {
  lesson: LessonInfo;
  lessonText: string; // Pre-extracted PDF text
  count?: number;
  previousQuestions?: string[]; // RAG memory: past generated questions for anti-duplication
}

function buildQuizPrompt(
  lesson: LessonInfo,
  lessonText: string,
  count: number,
  previousQuestions: string[] = []
): string {
  const hasLessonText = lessonText && lessonText.length > 100;
  const lessonCtx = hasLessonText
    ? `\n\n--- ACTUAL LESSON CONTENT (ground truth material) ---\n${lessonText.substring(0, 10000)}\n--- END OF LESSON CONTENT ---\n`
    : '';

  // RAG anti-duplication block
  let ragAntiDupBlock = '';
  if (previousQuestions.length > 0) {
    const list = previousQuestions
      .slice(-35)
      .map((q, i) => `${i + 1}. "${q.replace(/"/g, "'")}"`)
      .join('\n');
    ragAntiDupBlock = `\n==================================================
RAG MEMORY: PREVIOUSLY GENERATED QUESTIONS (DO NOT DUPLICATE)
The following ${previousQuestions.length} questions were ALREADY asked in previous cycles for this exact lesson (${lesson.courseTitle} - Lesson ${lesson.lessonNumber}):
${list}

STRICT ANTI-DUPLICATION MANDATE:
- You MUST NOT repeat, paraphrase, or ask about the exact same scenarios/facts listed above.
- Focus questions on DIFFERENT topics, procedures, code options, parameters, and concepts from the lesson material.
==================================================\n`;
  }

  return `You are a SAS Global Certification expert professor creating a precise exam study session.

Today's lesson is:
- Course: "${lesson.courseTitle}"
- Folder: "${lesson.courseFolder}"
- Lesson: ${lesson.lessonNumber} of ${lesson.totalLessons}
- Pages covered: ${lesson.pageRangeLabel}
- File: ${lesson.fileName}
${lessonCtx}
${ragAntiDupBlock}
Generate EXACTLY ${count} certification-exam-quality multiple-choice questions based SPECIFICALLY on today's lesson content above.

RULES:
1. Questions MUST be grounded in the lesson content. Do NOT ask off-topic or generic questions.
2. Mix difficulties: 30% Easy, 40% Medium, 30% Hard.
3. Each question has exactly 4 distinct, plausible options (no A/B/C/D prefixes).
4. "correctIndex" = 0–3 index of correct answer.
5. "explanation": 2–3 sentences explaining WHY the answer is correct with reference to SAS concepts.
6. "funFact": A practical SAS Viya exam tip or real-world application hint.
7. Base "learningNode":
   - "conceptSummary": 2–3 sentences. Precisely explain what this SAS concept/procedure/option does, how SAS Viya executes it, and what it affects. Use SAS terminology directly — no analogies, no storytelling.
   - "terminologies": Array of 2–4 objects {term, definition} — exact SAS/statistical definitions for every technical term or acronym in the question.
   - "certificationTakeaway": One crisp sentence: the exact fact, rule, default value, or parameter that the exam tests on this concept.
8. "categoryIcon": "Cpu" (ML), "Atom" (Statistics), "FileText" (Text Analytics), "Sparkles" (other).
9. "category": exact domain name.

Return ONLY a valid JSON array. No markdown fences, no text outside JSON.

Schema per question:
{
  "id": 1,
  "category": "SAS Visual Machine Learning",
  "categoryIcon": "Cpu",
  "difficulty": "Medium",
  "question": "...",
  "options": ["...", "...", "...", "..."],
  "correctIndex": 0,
  "explanation": "...",
  "funFact": "...",
  "learningNode": {
    "conceptSummary": "...",
    "terminologies": [{"term": "...", "definition": "..."}],
    "certificationTakeaway": "..."
  }
}`;
}

export async function generateLessonQuizWithGemini(
  options: GenerateQuizOptions
): Promise<{ questions: Question[]; source: 'gemini' | 'curated'; modelUsed?: string }> {
  const { lesson, lessonText, count = 20, previousQuestions = [] } = options;

  const apiKey = process.env.GEMINI_API_KEY || '';
  const model = process.env.GEMINI_MODEL || 'gemini-flash-lite-latest';

  if (!apiKey) {
    console.warn('[GeminiQuiz] No API Key — using curated fallback.');
    return { questions: getFallbackQuestions(count), source: 'curated' };
  }

  const prompt = buildQuizPrompt(lesson, lessonText, count, previousQuestions);

  try {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 35000);

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.75,
          responseMimeType: 'application/json',
        },
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errText = await response.text();
      console.error(`[GeminiQuiz] API ${response.status}:`, errText.substring(0, 200));
      return { questions: getFallbackQuestions(count), source: 'curated' };
    }

    const data = await response.json();
    const rawContent = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!rawContent) {
      console.warn('[GeminiQuiz] Empty response from Gemini');
      return { questions: getFallbackQuestions(count), source: 'curated' };
    }

    const cleaned = rawContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsedQuestions = JSON.parse(cleaned);

    if (Array.isArray(parsedQuestions) && parsedQuestions.length > 0) {
      const formatted: Question[] = parsedQuestions.map((q: any, idx: number) => ({
        id: Date.now() + idx,
        category: q.category || lesson.courseTitle,
        categoryIcon: q.categoryIcon || lesson.categoryIcon || 'Sparkles',
        difficulty: (['Easy', 'Medium', 'Hard'].includes(q.difficulty) ? q.difficulty : 'Medium') as 'Easy' | 'Medium' | 'Hard',
        question: q.question || '',
        options: Array.isArray(q.options) ? q.options.slice(0, 4) : ['Option A', 'Option B', 'Option C', 'Option D'],
        correctIndex: typeof q.correctIndex === 'number' && q.correctIndex >= 0 && q.correctIndex <= 3 ? q.correctIndex : 0,
        explanation: q.explanation || 'Refer to the SAS documentation for this concept.',
        funFact: q.funFact || 'SAS Viya leverages CAS (Cloud Analytic Services) for in-memory computation.',
        learningNode: q.learningNode
          ? {
              conceptSummary: q.learningNode.conceptSummary || '',
              terminologies: Array.isArray(q.learningNode.terminologies)
                ? q.learningNode.terminologies.map((t: any) => ({
                    term: t.term || '',
                    definition: t.definition || '',
                  }))
                : [],
              certificationTakeaway: q.learningNode.certificationTakeaway || '',
            }
          : undefined,
      }));

      console.log(`[GeminiQuiz] Generated ${formatted.length} questions for "${lesson.courseTitle}" Lesson ${lesson.lessonNumber}`);
      return { questions: formatted, source: 'gemini', modelUsed: model };
    }
  } catch (error: any) {
    console.warn('[GeminiQuiz] Error, using curated fallback:', error.message);
  }

  return { questions: getFallbackQuestions(count), source: 'curated' };
}

// -------------------------------------------------------------
// Iterative Detailed Note Generation (4 questions at a time)
// -------------------------------------------------------------
export interface BatchEnrichmentResult {
  questionId: number;
  comprehensiveNote: ComprehensiveNote;
  terminologies?: { term: string; definition: string }[];
}

export async function generateDetailedNotesForBatch(
  batchQuestions: Question[],
  lesson: LessonInfo,
  lessonText: string
): Promise<Record<number, { comprehensiveNote: ComprehensiveNote; terminologies?: { term: string; definition: string }[] }>> {
  const apiKey = process.env.GEMINI_API_KEY || '';
  const model = process.env.GEMINI_MODEL || 'gemini-flash-lite-latest';
  if (!apiKey || batchQuestions.length === 0) return {};

  const questionsContext = batchQuestions
    .map(
      (q, idx) => `
[QUESTION #${idx + 1} - ID: ${q.id}]
Question: ${q.question}
Correct Option: ${q.options[q.correctIndex]}
Other Options: ${q.options.filter((_, i) => i !== q.correctIndex).join(' | ')}
Initial Brief Explanation: ${q.explanation}
`
    )
    .join('\n');

  const prompt = `You are a SAS Viya technical instructor writing precise, concise study notes for the SAS Global Certification Exam.

Lesson Context:
- Course: "${lesson.courseTitle}"
- Lesson: ${lesson.lessonNumber} (${lesson.pageRangeLabel})
- Content snippet: ${lessonText.substring(0, 3500)}

Below are ${batchQuestions.length} specific questions from this lesson:
${questionsContext}

TASK:
For EACH question above, write a focused technical study note. Be concise and precise — no analogies, no storytelling, no filler. Only accurate SAS Viya technical content grounded in the lesson.

For EACH question, return an object with:
- "id": The EXACT question ID (integer).
- "overview": 2 short, dense paragraphs:
  1. What this concept, procedure, or parameter does in SAS Viya — its exact purpose, scope, and default behaviour.
  2. Where in the SAS Viya workflow it is used, what it produces or modifies, and any key constraints.
- "coreMechanism": Numbered steps describing how SAS Viya executes this — referencing specific CAS actions, PROC syntax, algorithmic steps, or data processing flow. Use exact SAS terminology.
- "deepDiveSections": Array of 2–3 sections [{ "heading": "...", "content": "..." }] covering:
  - Exact syntax, options, or parameters with their default values and valid inputs
  - How to interpret the specific output, statistic, or diagnostic produced
  - Specific conditions where this method is preferred or not applicable (rule-based)
- "terminologies": Array of 3–5 objects [{ "term": "...", "definition": "..." }] — precise, document-accurate definitions of every SAS/statistical term or acronym in the concept.
- "examTrapsAndTips": 2–3 exam tips as direct factual statements — exact values, Boolean behaviours, or documented rules that the exam commonly tests or where candidates make errors.

Return ONLY a valid JSON array of ${batchQuestions.length} objects. No markdown formatting outside JSON.`;

  try {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000);

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.65,
          responseMimeType: 'application/json',
        },
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.warn(`[GeminiBatchNotes] API error: ${response.status}`);
      return {};
    }

    const data = await response.json();
    const rawContent = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawContent) return {};

    const cleaned = rawContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(cleaned);

    const result: Record<number, { comprehensiveNote: ComprehensiveNote; terminologies?: { term: string; definition: string }[] }> = {};

    if (Array.isArray(parsed)) {
      parsed.forEach((item: any, i: number) => {
        // Fallback to batchQuestions[i].id if id doesn't match
        const qId = item.id || batchQuestions[i]?.id;
        if (!qId) return;

        result[qId] = {
          comprehensiveNote: {
            overview: item.overview || 'Comprehensive concept overview.',
            coreMechanism: item.coreMechanism || '',
            deepDiveSections: Array.isArray(item.deepDiveSections)
              ? item.deepDiveSections.map((s: any) => ({
                  heading: s.heading || 'Key Detail',
                  content: s.content || '',
                }))
              : [],
            examTrapsAndTips: item.examTrapsAndTips || '',
            isGenerating: false,
          },
          terminologies: Array.isArray(item.terminologies)
            ? item.terminologies.map((t: any) => ({
                term: t.term || '',
                definition: t.definition || '',
              }))
            : undefined,
        };
      });
    }

    return result;
  } catch (err: any) {
    console.warn('[GeminiBatchNotes] Batch error:', err.message);
    return {};
  }
}

function getFallbackQuestions(count: number): Question[] {
  const shuffled = [...SAS_CERTIFICATION_20_BANK].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

export async function generateSasQuizWithGemini(
  options: { track?: string; difficulty?: string; count?: number } = {}
): Promise<{ questions: Question[]; source: 'gemini' | 'curated'; modelUsed?: string }> {
  return {
    questions: getFallbackQuestions(options.count || 20),
    source: 'curated',
  };
}
