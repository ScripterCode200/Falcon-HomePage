export interface Question {
  id: number;
  category: string;
  categoryIcon: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  funFact: string;
}

export interface QuizProgress {
  date: string; // YYYY-MM-DD
  completed: boolean;
  score: number;
  totalQuestions: number;
  selectedAnswers: number[]; // User selected index per question
  completedAt: string;
}

export interface UserStats {
  currentStreak: number;
  highestStreak: number;
  totalQuizzesPlayed: number;
  totalCorrectAnswers: number;
  totalQuestionsAnswered: number;
  lastPlayedDate: string;
  history: Record<string, QuizProgress>; // Key is YYYY-MM-DD
}

export const QUESTION_BANK: Question[] = [
  {
    id: 1,
    category: 'Science & Cosmos',
    categoryIcon: 'Atom',
    difficulty: 'Easy',
    question: 'Which planet in our solar system has the most moons?',
    options: ['Jupiter', 'Saturn', 'Uranus', 'Neptune'],
    correctIndex: 1,
    explanation: 'Saturn leads the solar system with over 140 officially recognized moons, surpassing Jupiter.',
    funFact: 'Saturn’s largest moon, Titan, has a dense atmosphere and lakes of liquid methane and ethane.'
  },
  {
    id: 2,
    category: 'Technology & Code',
    categoryIcon: 'Cpu',
    difficulty: 'Medium',
    question: 'What does HTTP stand for in web terminology?',
    options: [
      'HyperText Transfer Protocol',
      'High-Tech Transmission Protocol',
      'Hyperlink Text Transfer Program',
      'Hybrid Text Tracking Process'
    ],
    correctIndex: 0,
    explanation: 'HTTP stands for HyperText Transfer Protocol, the foundational protocol used by the World Wide Web.',
    funFact: 'Tim Berners-Lee created HTTP along with HTML and the first web server at CERN in 1989.'
  },
  {
    id: 3,
    category: 'World History',
    categoryIcon: 'Landmark',
    difficulty: 'Medium',
    question: 'Which ancient wonder of the world is still standing today?',
    options: [
      'Hanging Gardens of Babylon',
      'Colossus of Rhodes',
      'Great Pyramid of Giza',
      'Lighthouse of Alexandria'
    ],
    correctIndex: 2,
    explanation: 'The Great Pyramid of Giza in Egypt is the only one of the Seven Ancient Wonders that remains intact.',
    funFact: 'It was the tallest man-made structure in the world for more than 3,800 years until Lincoln Cathedral in 1311.'
  },
  {
    id: 4,
    category: 'Nature & Biology',
    categoryIcon: 'Leaf',
    difficulty: 'Easy',
    question: 'What is the powerhouse organelle of the biological cell?',
    options: ['Ribosome', 'Mitochondria', 'Endoplasmic Reticulum', 'Golgi Apparatus'],
    correctIndex: 1,
    explanation: 'Mitochondria generate most of the chemical energy (ATP) needed to power the cell’s biochemical reactions.',
    funFact: 'Mitochondria have their own distinct DNA, inherited almost exclusively from maternal lineage.'
  },
  {
    id: 5,
    category: 'Geography',
    categoryIcon: 'Globe',
    difficulty: 'Medium',
    question: 'Which is the longest continental mountain range in the world?',
    options: ['The Himalayas', 'The Rocky Mountains', 'The Andes', 'The Alps'],
    correctIndex: 2,
    explanation: 'The Andes mountain range extends over 7,000 km (4,350 miles) along the western coast of South America.',
    funFact: 'The Andes span across seven South American countries: Venezuela, Colombia, Ecuador, Peru, Bolivia, Chile, and Argentina.'
  },
  {
    id: 6,
    category: 'Technology & Code',
    categoryIcon: 'Cpu',
    difficulty: 'Easy',
    question: 'Who is recognized as the creator of the Linux operating system kernel?',
    options: ['Linus Torvalds', 'Steve Wozniak', 'Bill Gates', 'Dennis Ritchie'],
    correctIndex: 0,
    explanation: 'Linus Torvalds released the first version of the Linux kernel in September 1991 as a college student in Helsinki.',
    funFact: 'Linus Torvalds also created Git, the world’s most popular version control system.'
  },
  {
    id: 7,
    category: 'Science & Cosmos',
    categoryIcon: 'Sparkles',
    difficulty: 'Hard',
    question: 'What is the speed of light in a vacuum approximately?',
    options: ['150,000 km/s', '300,000 km/s', '450,000 km/s', '3,000,000 km/s'],
    correctIndex: 1,
    explanation: 'Light travels at approximately 299,792 kilometers per second (about 186,282 miles per second) in a vacuum.',
    funFact: 'Light from the Sun takes roughly 8 minutes and 20 seconds to reach the Earth.'
  },
  {
    id: 8,
    category: 'Pop Culture & Art',
    categoryIcon: 'Film',
    difficulty: 'Easy',
    question: 'Who painted the famous masterpiece "The Starry Night"?',
    options: ['Pablo Picasso', 'Vincent van Gogh', 'Claude Monet', 'Salvador Dalí'],
    correctIndex: 1,
    explanation: 'Vincent van Gogh painted "The Starry Night" in June 1889 while at the Saint-Paul-de-Mausole asylum in France.',
    funFact: 'Van Gogh only sold one confirmed painting during his lifetime, "The Red Vineyard".'
  },
  {
    id: 9,
    category: 'World History',
    categoryIcon: 'Landmark',
    difficulty: 'Medium',
    question: 'In what year did the Apollo 11 mission successfully land the first humans on the Moon?',
    options: ['1965', '1969', '1972', '1959'],
    correctIndex: 1,
    explanation: 'Neil Armstrong and Buzz Aldrin landed the Apollo 11 Lunar Module on the Moon on July 20, 1969.',
    funFact: 'The Apollo 11 guidance computer had only 64 kilobytes of memory and operated at 0.043 MHz.'
  },
  {
    id: 10,
    category: 'Geography',
    categoryIcon: 'Globe',
    difficulty: 'Easy',
    question: 'What is the capital city of Australia?',
    options: ['Sydney', 'Melbourne', 'Canberra', 'Brisbane'],
    correctIndex: 2,
    explanation: 'Canberra was selected as the capital of Australia in 1908 as a compromise between rivals Sydney and Melbourne.',
    funFact: 'Canberra is an entirely planned city designed by American architects Walter Burley Griffin and Marion Mahony Griffin.'
  },
  {
    id: 11,
    category: 'Technology & Code',
    categoryIcon: 'Cpu',
    difficulty: 'Medium',
    question: 'Which programming language was originally called "Oak"?',
    options: ['Python', 'Java', 'Ruby', 'C++'],
    correctIndex: 1,
    explanation: 'Java was created by James Gosling at Sun Microsystems and was originally named "Oak" after an oak tree outside his office.',
    funFact: 'It was later renamed Java after Peet’s coffee, which the development team frequently enjoyed.'
  },
  {
    id: 12,
    category: 'Science & Cosmos',
    categoryIcon: 'Atom',
    difficulty: 'Medium',
    question: 'What is the most abundant chemical element in the observable universe?',
    options: ['Oxygen', 'Carbon', 'Hydrogen', 'Helium'],
    correctIndex: 2,
    explanation: 'Hydrogen constitutes roughly 75% of the baryonic mass of the universe and is the primary fuel for stars.',
    funFact: 'Hydrogen is also the simplest and lightest element, consisting of only one proton and one electron.'
  },
  {
    id: 13,
    category: 'Nature & Biology',
    categoryIcon: 'Leaf',
    difficulty: 'Easy',
    question: 'What is the largest living mammal on Earth?',
    options: ['African Elephant', 'Blue Whale', 'Sperm Whale', 'Colossal Squid'],
    correctIndex: 1,
    explanation: 'The Blue Whale is the largest animal known to have ever lived, reaching lengths up to 30 meters and weights over 180 tons.',
    funFact: 'A blue whale’s heart is the size of a small car and can beat only 2 times per minute when diving.'
  },
  {
    id: 14,
    category: 'Pop Culture & Art',
    categoryIcon: 'Film',
    difficulty: 'Easy',
    question: 'Which fictional company was founded by Bruce Wayne in DC Comics?',
    options: ['Stark Industries', 'Wayne Enterprises', 'LexCorp', 'Oscorp'],
    correctIndex: 1,
    explanation: 'Wayne Enterprises is the multibillion-dollar multinational conglomerate owned by Bruce Wayne (Batman).',
    funFact: 'Wayne Enterprises was first introduced in Batman #111 in October 1957.'
  },
  {
    id: 15,
    category: 'Brain Teasers & Logic',
    categoryIcon: 'Sparkles',
    difficulty: 'Medium',
    question: 'How many sides does a regular heptadecagon have?',
    options: ['15', '17', '19', '21'],
    correctIndex: 1,
    explanation: 'A heptadecagon (from Greek hepta + deka) is a 17-sided polygon.',
    funFact: 'Carl Friedrich Gauss proved in 1796 at age 19 that a regular 17-gon can be constructed using only a compass and straightedge.'
  },
  {
    id: 16,
    category: 'Technology & Code',
    categoryIcon: 'Cpu',
    difficulty: 'Easy',
    question: 'What is the term for a single binary unit of data (0 or 1)?',
    options: ['Byte', 'Bit', 'Nibble', 'Pixel'],
    correctIndex: 1,
    explanation: 'A bit is the most basic unit of information in digital computing and telecommunications.',
    funFact: 'The term "bit" is a portmanteau of "binary digit", coined by mathematician John Tukey in 1946.'
  },
  {
    id: 17,
    category: 'Geography',
    categoryIcon: 'Globe',
    difficulty: 'Hard',
    question: 'Which country has the most natural lakes in the world?',
    options: ['United States', 'Russia', 'Canada', 'Finland'],
    correctIndex: 2,
    explanation: 'Canada contains more than 50% of the entire world’s natural freshwater lakes, with an estimated 2 million lakes.',
    funFact: 'Over 9% of Canada’s total surface area is covered by fresh water.'
  },
  {
    id: 18,
    category: 'World History',
    categoryIcon: 'Landmark',
    difficulty: 'Medium',
    question: 'Who was the first female pilot to fly solo across the Atlantic Ocean?',
    options: ['Bessie Coleman', 'Amelia Earhart', 'Harriet Quimby', 'Valentina Tereshkova'],
    correctIndex: 1,
    explanation: 'Amelia Earhart flew non-stop across the Atlantic solo on May 20–21, 1932.',
    funFact: 'For this historic flight, Earhart received the United States Distinguished Flying Cross.'
  },
  {
    id: 19,
    category: 'Science & Cosmos',
    categoryIcon: 'Atom',
    difficulty: 'Hard',
    question: 'What particle is known as the "God Particle" in physics?',
    options: ['Neutrino', 'Higgs Boson', 'Quark', 'Graviton'],
    correctIndex: 1,
    explanation: 'The Higgs Boson, discovered at CERN’s Large Hadron Collider in 2012, gives other elementary particles their mass.',
    funFact: 'Physicist Leon Lederman originally titled his book "The Goddamn Particle" because it was so hard to find, which his publisher shortened.'
  },
  {
    id: 20,
    category: 'Technology & Code',
    categoryIcon: 'Cpu',
    difficulty: 'Easy',
    question: 'Which year was the first iPhone released to the public?',
    options: ['2005', '2007', '2009', '2011'],
    correctIndex: 1,
    explanation: 'Steve Jobs introduced the first iPhone on January 9, 2007, and it officially went on sale in June 2007.',
    funFact: 'The original iPhone had no App Store, no copy-paste functionality, and only supported 2G EDGE networks.'
  }
];

// Deterministic Pseudo-Random Number Generator (Mulberry32)
function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Convert date string YYYY-MM-DD to numerical seed
function dateToSeed(dateStr: string): number {
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    const char = dateStr.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

// Get deterministic 5 questions for a given date
export function getDailyQuestions(dateStr?: string): { questions: Question[]; date: string } {
  const targetDate = dateStr || getTodayDateString();
  const seed = dateToSeed(targetDate);
  const random = mulberry32(seed);

  // Clone array and shuffle deterministically
  const shuffled = [...QUESTION_BANK];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return {
    questions: shuffled.slice(0, 5),
    date: targetDate,
  };
}

// Get random questions for infinite practice mode
export function getRandomPracticeQuestions(count: number = 5): Question[] {
  const shuffled = [...QUESTION_BANK].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getTimeUntilMidnight(): { hours: number; minutes: number; seconds: number } {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);

  const diff = midnight.getTime() - now.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  return { hours, minutes, seconds };
}

// LocalStorage helpers for Stats & Streaks
const STATS_STORAGE_KEY = 'falcon_quiz_stats_v1';

export function loadUserQuizStats(): UserStats {
  if (typeof window === 'undefined') {
    return {
      currentStreak: 0,
      highestStreak: 0,
      totalQuizzesPlayed: 0,
      totalCorrectAnswers: 0,
      totalQuestionsAnswered: 0,
      lastPlayedDate: '',
      history: {},
    };
  }

  try {
    const data = localStorage.getItem(STATS_STORAGE_KEY);
    if (data) {
      return JSON.parse(data);
    }
  } catch {
    // Storage read error
  }

  return {
    currentStreak: 0,
    highestStreak: 0,
    totalQuizzesPlayed: 0,
    totalCorrectAnswers: 0,
    totalQuestionsAnswered: 0,
    lastPlayedDate: '',
    history: {},
  };
}

export function recordQuizCompletion(
  date: string,
  score: number,
  totalQuestions: number,
  selectedAnswers: number[]
): UserStats {
  const currentStats = loadUserQuizStats();
  const today = getTodayDateString();

  // Check if today already recorded
  const isAlreadyDone = !!currentStats.history[date]?.completed;

  // Calculate streak logic
  let newCurrentStreak = currentStats.currentStreak;

  if (!isAlreadyDone) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;

    if (currentStats.lastPlayedDate === yesterdayStr) {
      newCurrentStreak += 1;
    } else if (currentStats.lastPlayedDate === today) {
      // already played today
    } else {
      // Streak broken or brand new
      newCurrentStreak = 1;
    }
  }

  const newHighestStreak = Math.max(currentStats.highestStreak, newCurrentStreak);

  const updatedProgress: QuizProgress = {
    date,
    completed: true,
    score,
    totalQuestions,
    selectedAnswers,
    completedAt: new Date().toISOString(),
  };

  const updatedStats: UserStats = {
    ...currentStats,
    currentStreak: newCurrentStreak,
    highestStreak: newHighestStreak,
    totalQuizzesPlayed: isAlreadyDone ? currentStats.totalQuizzesPlayed : currentStats.totalQuizzesPlayed + 1,
    totalCorrectAnswers: currentStats.totalCorrectAnswers + score,
    totalQuestionsAnswered: currentStats.totalQuestionsAnswered + totalQuestions,
    lastPlayedDate: today,
    history: {
      ...currentStats.history,
      [date]: updatedProgress,
    },
  };

  if (typeof window !== 'undefined') {
    localStorage.setItem(STATS_STORAGE_KEY, JSON.stringify(updatedStats));
  }

  return updatedStats;
}
