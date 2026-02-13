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
    this.version(5).stores({
      users: '++id, phoneNumber, name, role',
      courses: '++id, title, subject',
      modules: '++id, courseId',
      teacher_uploads: '++id, teacherId',
      sync_logs: '++id, isSynced'
    });
  }
}

export const db = new EduDatabase();

// --- Helper Functions ---

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
    // Get current logged in user from local storage logic in a real app, 
    // but here we fall back to the first user or handle it in the UI layer context.
    // Ideally, we should pass userId to this function. 
    // For this offline-first simplified architecture, we often assume single-user per device
    // OR we will update this to fetch based on the 'active' session if possible.
    
    const userId = parseInt(localStorage.getItem('padho_user_id') || '0');
    let user;
    if (userId) {
        user = await db.users.get(userId);
    } else {
        // Fallback for seed/demo if no login
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
    
    // Note: We don't seed a default user anymore if we want the auth flow to be the primary entry,
    // BUT for the "Guest" experience if someone bypasses or for existing logic, we can keep the teacher.
    // We will let the AuthGateway handle creating the student user.
    if (userCount === 0) {
      await db.users.bulkAdd([
        { 
          name: 'Amit Sir (Teacher)', 
          phoneNumber: '9999999999',
          grade: '12',
          xp: 1000, 
          level: 10, 
          streak: 365, 
          role: 'teacher', 
          language: 'en',
          badges: ['Teacher of the Year'],
          quizzesPassed: 100
        }
      ]);
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