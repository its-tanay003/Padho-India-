
import Dexie, { type Table } from 'dexie';
import { User, Course, Module, TeacherUpload, SyncLog } from './types';
import { getLevelInfo } from './gamification';
import { supabase } from './services/supabaseClient';

export class EduDatabase extends Dexie {
  users!: Table<User>;
  courses!: Table<Course>;
  modules!: Table<Module>;
  teacher_uploads!: Table<TeacherUpload>;
  sync_logs!: Table<SyncLog>;

  constructor() {
    super('PadhoIndiaDB');
    // @ts-ignore
    this.version(7).stores({
      users: '++id, phoneNumber, email, name, role',
      courses: '++id, title, subject',
      modules: '++id, courseId',
      teacher_uploads: '++id, teacherId',
      sync_logs: '++id, isSynced, action'
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
  // 1. Try Local First (Offline First)
  let user = await db.users.where('email').equals(email).first();
  
  // 2. If not found and online, Try Cloud (Sync/Restore)
  if (!user && navigator.onLine) {
     try {
         const { data, error } = await supabase.from('users').select('*').eq('email', email).single();
         if (data && !error) {
            // Map Cloud DB columns to Local DB types
            const remoteUser: User = {
                name: data.name,
                email: data.email,
                pin: data.pin,
                phoneNumber: data.phone_number,
                role: data.role || 'student',
                grade: data.grade,
                xp: data.xp || 0,
                level: data.level || 1,
                streak: data.streak || 0,
                badges: data.badges || [],
                quizzesPassed: data.quizzes_passed || 0,
                language: data.language || 'en',
                avatar: data.avatar,
                darkMode: data.dark_mode,
                showDailyGyan: data.show_daily_gyan
            };
            
            // Hydrate Local DB
            const id = await db.users.add(remoteUser);
            user = { ...remoteUser, id: id as number };
            console.log("User restored from Cloud");
         }
     } catch (e) {
         console.warn("Cloud fetch failed", e);
     }
  }
  return user;
};

export const updateUser = async (id: number, updates: Partial<User>) => {
  await db.users.update(id, updates);
  // Log for Sync
  await logActivity('USER_UPDATE', { userId: id, updates });
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
  // Log specifically as REGISTER so we know to INSERT vs UPDATE
  await logActivity('USER_REGISTERED_GOOGLE', { id, name, email, pin: hashedPin });
  return id;
};

export const registerUserManual = async (name: string, email: string, pin: string) => {
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
  // Log specifically as REGISTER EMAIL so we know to INSERT vs UPDATE
  await logActivity('USER_REGISTERED_EMAIL', { id, name, email, pin: hashedPin });
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
            const newBadges = [...user.badges, badge];
            await db.users.update(user.id, { badges: newBadges });
            await logActivity('BADGE_EARNED', { userId: user.id, badge, badges: newBadges });
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
    await updateUser(userId, { language: lang });
    return lang;
  }
  return 'en';
};

export const logModuleCompletion = async (moduleId: number, courseId: number, type: string, title: string) => {
    await logActivity('MODULE_COMPLETED', { moduleId, courseId, type, title });
};

export const captureUnloggedCompletions = async () => {
    try {
        // Find modules marked as completed
        // Fix: Use filter() since 'isCompleted' is not an indexed property
        const completedModules = await db.modules.filter(m => m.isCompleted === true).toArray();
        
        // Find existing completion logs to avoid duplicates
        const logs = await db.sync_logs.where('action').equals('MODULE_COMPLETED').toArray();
        const loggedIds = new Set(logs.map(l => l.data.moduleId));

        let count = 0;
        for (const mod of completedModules) {
            if (mod.id && !loggedIds.has(mod.id)) {
                await logModuleCompletion(mod.id, mod.courseId, mod.type, mod.title);
                count++;
            }
        }
        if (count > 0) console.log(`[Sync] Backfilled ${count} completion logs.`);
    } catch (e) {
        console.error("Error capturing unlogged completions:", e);
    }
};

// --- Seeder Function ---

export const seedDatabase = async () => {
  try {
    // Transaction ensures consistency when checking and adding courses
    // Fix: cast db to any to resolve missing 'transaction' property TypeScript error
    await (db as any).transaction('rw', db.courses, db.modules, async () => {
      const seedCourses = [
        {
          title: 'Vedic Math',
          subject: 'Mathematics',
          description: 'Ancient tricks for super-fast calculations.',
          thumbnail: 'https://picsum.photos/400/200?random=1',
          isDownloaded: false,
          language: 'en',
          totalModules: 2,
          completedModules: 0,
          modules: [
            {
              title: 'Sutra 1: Ekadhikena Purvena',
              videoUrl: 'sim_vedic_1.mp4',
              type: 'video',
              isCompleted: false,
              content: 'Square numbers ending in 5 instantly.'
            },
            {
              title: 'Math Quiz',
              type: 'quiz',
              isCompleted: false,
              quiz: {
                question: 'What is the square of 25?',
                options: ['625', '225', '525', '600'],
                correctIndex: 0
              }
            }
          ]
        },
        {
          title: 'Basic Science',
          subject: 'Science',
          description: 'Understanding the world around us.',
          thumbnail: 'https://picsum.photos/400/200?random=2',
          isDownloaded: true, // Simulated download
          language: 'en',
          totalModules: 1,
          completedModules: 0,
          modules: [
            {
              title: 'Photosynthesis',
              videoUrl: 'sim_science_1.mp4',
              type: 'video',
              isCompleted: false,
              content: 'How plants make food using sunlight.'
            }
          ]
        },
        {
          title: 'English Grammar',
          subject: 'English',
          description: 'Master tenses and sentence structure.',
          thumbnail: 'https://picsum.photos/400/200?random=3',
          isDownloaded: false,
          language: 'en',
          totalModules: 1,
          completedModules: 0,
          modules: [
            {
              title: 'Present Tense',
              audioUrl: 'sim_grammar_1.mp3',
              type: 'video', // Using video type for simplicity in UI, though audioUrl is present
              isCompleted: false,
              content: 'Talking about daily habits.'
            }
          ]
        }
      ];

      for (const courseData of seedCourses) {
        // Robust check: Does this course title already exist?
        const existingCourse = await db.courses.where('title').equals(courseData.title).first();

        if (!existingCourse) {
          // Destructure modules out, add course first to get ID
          const { modules, ...courseInfo } = courseData;
          // @ts-ignore
          const courseId = await db.courses.add(courseInfo);

          // Prepare modules with the new courseId
          const modulesWithId = modules.map(m => ({ ...m, courseId: courseId as number }));
          
          // @ts-ignore
          await db.modules.bulkAdd(modulesWithId);
          console.log(`Seeded course: ${courseInfo.title}`);
        } else {
            // Optional: Check if modules are missing for existing course (partial seed recovery)
            const modulesCount = await db.modules.where('courseId').equals(existingCourse.id!).count();
            if (modulesCount === 0 && courseData.modules.length > 0) {
                 console.log(`Recovering modules for course: ${existingCourse.title}`);
                 const modulesWithId = courseData.modules.map(m => ({ ...m, courseId: existingCourse.id! }));
                 // @ts-ignore
                 await db.modules.bulkAdd(modulesWithId);
            }
        }
      }
    });

  } catch (e) {
      console.error("Database Seeding Error", e);
  }
};
