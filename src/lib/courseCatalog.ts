import fs from 'fs';
import path from 'path';

export interface LessonInfo {
  id: string;
  courseTitle: string;
  courseFolder: string;
  fileName: string;
  fullPath: string;
  lessonNumber: number;
  totalLessons: number;
  startPage: number;
  endPage: number;
  pageRangeLabel: string;
  categoryIcon: 'Cpu' | 'Atom' | 'FileText' | 'Sparkles';
}

export interface CourseData {
  folder: string;
  title: string;
  categoryIcon: 'Cpu' | 'Atom' | 'FileText' | 'Sparkles';
  lessons: LessonInfo[];
}

// Clean and standardize human-readable course titles
export function formatCourseTitle(folderName: string): { title: string; icon: 'Cpu' | 'Atom' | 'FileText' | 'Sparkles' } {
  let clean = folderName.replace(/\(Parts\)/gi, '').trim();
  const lower = clean.toLowerCase();

  if (lower.includes('machine learning')) {
    return { title: 'SAS Visual Machine Learning', icon: 'Cpu' };
  }
  if (lower.includes('statistics') || lower.includes('stats')) {
    return { title: 'Applied Statistics for ML', icon: 'Atom' };
  }
  if (lower.includes('text analytics') || lower.includes('text')) {
    return { title: 'SAS Visual Text Analytics', icon: 'FileText' };
  }

  return { title: clean, icon: 'Sparkles' };
}

// Dynamically discover all courses and lesson PDFs in public/SAS_Learn Data
export function getCourseCatalog(): CourseData[] {
  const baseDir = path.join(process.cwd(), 'public', 'SAS_Learn Data');
  if (!fs.existsSync(baseDir)) return [];

  const entries = fs.readdirSync(baseDir);
  const courses: CourseData[] = [];

  for (const entry of entries) {
    const fullFolderPath = path.join(baseDir, entry);
    if (!fs.statSync(fullFolderPath).isDirectory()) continue;

    const { title, icon } = formatCourseTitle(entry);

    // Filter PDFs, ignoring non-course files (like fee receipts)
    const pdfFiles = fs
      .readdirSync(fullFolderPath)
      .filter((file) => {
        const lower = file.toLowerCase();
        return lower.endsWith('.pdf') && !lower.includes('recipt') && !lower.includes('receipt');
      })
      .map((file) => {
        // Extract page range like CPML52-1-117.pdf or EVST152-7-89.pdf
        const match = file.match(/-(\d+)-(\d+)\.pdf$/i) || file.match(/(\d+)-(\d+)/);
        const startPage = match ? parseInt(match[1], 10) : 1;
        const endPage = match ? parseInt(match[2], 10) : 100;
        return { file, startPage, endPage };
      })
      // Sort numerically by starting page
      .sort((a, b) => a.startPage - b.startPage);

    const lessons: LessonInfo[] = pdfFiles.map((l, index) => ({
      id: `${entry.replace(/\s+/g, '-').toLowerCase()}-lesson-${index + 1}`,
      courseTitle: title,
      courseFolder: entry,
      fileName: l.file,
      fullPath: path.join(fullFolderPath, l.file),
      lessonNumber: index + 1,
      totalLessons: pdfFiles.length,
      startPage: l.startPage,
      endPage: l.endPage,
      pageRangeLabel: `Pages ${l.startPage}–${l.endPage}`,
      categoryIcon: icon,
    }));

    if (lessons.length > 0) {
      courses.push({
        folder: entry,
        title,
        categoryIcon: icon,
        lessons,
      });
    }
  }

  // Sort courses consistently (Machine Learning, Statistics, Text Analytics, then any newly added)
  courses.sort((a, b) => a.folder.localeCompare(b.folder));
  return courses;
}

// Generate the interleaved sequential schedule across all courses and lessons
export function getSequentialLessonSchedule(): LessonInfo[] {
  const courses = getCourseCatalog();
  if (courses.length === 0) return [];

  const maxLessons = Math.max(...courses.map((c) => c.lessons.length));
  const schedule: LessonInfo[] = [];

  // Round-robin interleaved:
  // Round 0: Course A Lesson 1, Course B Lesson 1, Course C Lesson 1
  // Round 1: Course A Lesson 2, Course B Lesson 2, Course C Lesson 2
  // etc.
  for (let r = 0; r < maxLessons; r++) {
    for (const course of courses) {
      if (r < course.lessons.length) {
        schedule.push(course.lessons[r]);
      }
    }
  }

  return schedule;
}

// Anchor epoch date: 2026-09-25 is Day 0 (Cycle 1)
const EPOCH_DATE = new Date('2026-09-25T00:00:00Z').getTime();
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

// Deterministically pick today's lesson based on the 6:00 PM cycleKey
export function getLessonForCycleKey(cycleKey: string): LessonInfo | null {
  const schedule = getSequentialLessonSchedule();
  if (schedule.length === 0) return null;

  try {
    const cycleDate = new Date(`${cycleKey}T00:00:00Z`).getTime();
    const dayDiff = Math.floor((cycleDate - EPOCH_DATE) / ONE_DAY_MS);
    const positiveDayIndex = ((dayDiff % schedule.length) + schedule.length) % schedule.length;
    return schedule[positiveDayIndex];
  } catch {
    return schedule[0];
  }
}

// Extract lecture text sample from target PDF to provide Gemini with ground truth
export async function extractLessonContextText(lesson: LessonInfo, maxChars = 12000): Promise<string> {
  try {
    if (!fs.existsSync(lesson.fullPath)) {
      return '';
    }
    const { PDFParse } = await import('pdf-parse');
    const parser = new (PDFParse as any)({ url: lesson.fullPath, verbosity: 0 });
    await (parser as any).load();
    const textObj = await (parser as any).getText();
    const raw = (typeof textObj === 'string' ? textObj : textObj?.text || '').trim();
    // Clean redundant whitespace
    const cleaned = raw.replace(/\r\n/g, '\n').replace(/\n{3,}/g, '\n\n');
    return cleaned.substring(0, maxChars);
  } catch (err) {
    console.warn(`[extractLessonContextText] Could not parse ${lesson.fileName}:`, err);
    return '';
  }
}
