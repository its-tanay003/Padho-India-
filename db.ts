
import Dexie, { type Table } from 'dexie';
import { User, Course, Module, TeacherUpload, SyncLog } from './types';
import { getLevelInfo } from './gamification';

export class EduDatabase extends Dexie {
  users!: Table<User>;
  courses!: Table<Course>;
  modules!: Table<Module>;
  teacher_uploads!: Table<TeacherUpload>;
  sync_logs!: Table<SyncLog>;

  constructor() {
    super('PadhoIndiaDB');
    // @ts-ignore
    this.version(6).stores({
      users: '++id, phoneNumber, email, name, role',
      courses: '++id, title, subject',
      modules: '++id, courseId',
      teacher_uploads: '++id, teacherId',
      sync_logs: '++id, isSynced'
    });
  }
}

export const db = new EduDatabase();

// --- Crypto Helpers ---

export const hashPin = async (pin: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(pin);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
};

export const verifyPin = async (inputPin: string, storedHash: string): Promise<boolean> => {
  const inputHash = await hashPin(inputPin);
  return inputHash === storedHash;
};

// --- Helper Functions ---

export const findUserByEmail = async (email: string) => {
  return await db.users.where('email').equals(email).first();
};

export const registerUserWithGoogle = async (name: string, email: string, pin: string) => {
  const hashedPin = await hashPin(pin);
  const id = await db.users.add({
    name,
    email,
    pin: hashedPin,
    role: 'student',
    grade: '10', // Default
    xp: 0,
    level: 1,
    streak: 1,
    badges: ['New Explorer'],
    quizzesPassed: 0,
    language: 'en'
  });
  await logActivity('USER_REGISTERED_GOOGLE', { id, name });
  return id;
};

export const createGuestAccount = async () => {
  const email = 'guest@padhoindia.com';
  const existing = await findUserByEmail(email);
  if (existing) return existing.id!;
  
  // Create with default PIN 0000
  return await registerUserWithGoogle('Guest Student', email, '0000');
};

export const logActivity = async (action: string, data: any) => {
  try {
    await db.sync_logs.add({
      action,
      data,
      timestamp: Date.now(),
      isSynced: false
    });
  } catch (e) {
    console.error("Failed to log activity", e);
  }
};

// --- Logic Functions ---

export const addXP = async (amount: number) => {
  try {
    const userId = parseInt(localStorage.getItem('padho_user_id') || '0');
    let user;
    if (userId) {
        user = await db.users.get(userId);
    } else {
        user = await db.users.orderBy('id').first();
    }

    if (user && user.id) {
      const newXP = user.xp + amount;
      const levelInfo = getLevelInfo(newXP);
      
      await db.users.update(user.id, {
        xp: newXP,
        level: levelInfo.level
      });
      
      await logActivity('XP_GAINED', { userId: user.id, amount, newXP, level: levelInfo.level });

      return { newXP, newLevel: levelInfo.level, leveledUp: levelInfo.level > user.level };
    }
  } catch (error) {
    console.error("Failed to add XP:", error);
  }
  return null;
};

export const incrementQuizCount = async () => {
    try {
        const userId = parseInt(localStorage.getItem('padho_user_id') || '0');
        let user;
        if (userId) user = await db.users.get(userId);
        else user = await db.users.orderBy('id').first();

        if (user && user.id) {
            await db.users.update(user.id, { quizzesPassed: (user.quizzesPassed || 0) + 1 });
            await logActivity('QUIZ_PASSED', { userId: user.id, totalPassed: (user.quizzesPassed || 0) + 1 });
        }
    } catch (error) {
        console.error("Failed to increment quiz count:", error);
    }
}

export const addBadge = async (badge: string) => {
    try {
        const userId = parseInt(localStorage.getItem('padho_user_id') || '0');
        let user;
        if (userId) user = await db.users.get(userId);
        else user = await db.users.orderBy('id').first();

        if (user && user.id && !user.badges.includes(badge)) {
            await db.users.update(user.id, { badges: [...user.badges, badge] });
            await logActivity('BADGE_EARNED', { userId: user.id, badge });
            return true;
        }
    } catch (error) {
        console.error("Failed to add badge:", error);
    }
    return false;
}

export const toggleLanguage = async (lang: string) => {
  const userId = parseInt(localStorage.getItem('padho_user_id') || '0');
  if (userId) {
    await db.users.update(userId, { language: lang });
    return lang;
  }
  return 'en';
};

// --- Seeder Function ---

export const seedDatabase = async () => {
  try {
    const userCount = await db.users.count();
    
    if (userCount === 0) {
      // Keep only one seed user for demo if needed, but Google Auth is primary now
      // Not adding seed user to force login flow on fresh start
    }

    // 2. Seed Courses & Modules
    const courseCount = await db.courses.count();
    if (courseCount === 0) {
      // Course 1: Vedic Math
      const id1 = await db.courses.add({
        title: 'Vedic Math',
        subject: 'Mathematics',
        description: 'Ancient tricks for super-fast calculations.',
        thumbnail: 'https://picsum.photos/400/200?random=1',
        isDownloaded: false,
        language: 'en',
        totalModules: 2,
        completedModules: 0
      });

      await db.modules.bulkAdd([
        {
          courseId: id1 as number,
          title: 'Sutra 1: Ekadhikena Purvena',
          videoUrl: 'sim_vedic_1.mp4',
          type: 'video',
          isCompleted: false,
          content: 'Square numbers ending in 5 instantly.'
        },
        {
          courseId: id1 as number,
          title: 'Math Quiz',
          type: 'quiz',
          isCompleted: false,
          quiz: {
            question: 'What is the square of 25?',
            options: ['625', '225', '525', '600'],
            correctIndex: 0
          }
        }
      ]);

      // Course 2: Basic Science
      const id2 = await db.courses.add({
        title: 'Basic Science',
        subject: 'Science',
        description: 'Understanding the world around us.',
        thumbnail: 'https://picsum.photos/400/200?random=2',
        isDownloaded: true, // Simulated download
        language: 'en',
        totalModules: 1,
        completedModules: 0
      });

      await db.modules.add({
        courseId: id2 as number,
        title: 'Photosynthesis',
        videoUrl: 'sim_science_1.mp4',
        type: 'video',
        isCompleted: false,
        content: 'How plants make food using sunlight.'
      });

      // Course 3: English Grammar
      const id3 = await db.courses.add({
        title: 'English Grammar',
        subject: 'English',
        description: 'Master tenses and sentence structure.',
        thumbnail: 'https://picsum.photos/400/200?random=3',
        isDownloaded: false,
        language: 'en',
        totalModules: 1,
        completedModules: 0
      });

      await db.modules.add({
        courseId: id3 as number,
        title: 'Present Tense',
        audioUrl: 'sim_grammar_1.mp3',
        type: 'video', // Using video type for simplicity in UI, though audioUrl is present
        isCompleted: false,
        content: 'Talking about daily habits.'
      });
    }
  } catch (e) {
      console.error("Database Seeding Error", e);
  }
};
