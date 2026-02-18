
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
  try {
    // 1. Try Local First (Offline First)
    let user = await db.users.where('email').equals(email).first();
    
    // 2. If not found locally but online, fetch from Supabase
    if (!user && navigator.onLine) {
        try {
            const { data, error } = await supabase.from('users').select('*').eq('email', email).single();
            
            if (error) {
                // If user not found in supabase, it returns an error, we can ignore if it's just 'Row not found'
                if (error.code !== 'PGRST116') { // PGRST116 is 'JSON object requested, multiple (or no) rows returned'
                   console.warn("Supabase Fetch Error:", error.message);
                }
                return null;
            }

            if (data) {
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
                
                // Save to local IndexedDB for future offline access
                const id = await db.users.add(remoteUser);
                user = { ...remoteUser, id: id as number };
            }
        } catch (e) {
            console.warn("Cloud fetch failed due to network exception", e);
            throw new Error("Unable to connect to cloud database.");
        }
    }
    return user;
  } catch (error) {
      console.error("Database Error:", error);
      throw error;
  }
};

export const updateUser = async (id: number, updates: Partial<User>) => {
  await db.users.update(id, updates);
  await logActivity('USER_UPDATE', { userId: id, updates });
};

export const registerUserWithGoogle = async (name: string, email: string, pin: string) => {
  const hashedPin = await hashPin(pin);
  const newUser = {
    name,
    email,
    pin: hashedPin,
    role: 'student' as const,
    grade: '10', 
    xp: 0,
    level: 1,
    streak: 1,
    badges: ['New Explorer'],
    quizzesPassed: 0,
    language: 'en'
  };

  const id = await db.users.add(newUser);

  // Sync to Supabase immediately if online
  if (navigator.onLine) {
      try {
          const { error } = await supabase.from('users').upsert({
            email: newUser.email,
            name: newUser.name,
            pin: newUser.pin,
            role: newUser.role,
            grade: newUser.grade,
            xp: newUser.xp,
            level: newUser.level,
            streak: newUser.streak,
            badges: newUser.badges,
            quizzes_passed: newUser.quizzesPassed,
            language: newUser.language
          }, { onConflict: 'email' });

          if (error) throw new Error(error.message);

      } catch (e) {
          console.warn("Immediate Supabase sync failed, queuing for background sync", e);
          await logActivity('USER_REGISTERED_GOOGLE', { id, ...newUser });
      }
  } else {
      await logActivity('USER_REGISTERED_GOOGLE', { id, ...newUser });
  }

  return id;
};

export const registerUserManual = async (name: string, email: string, pin: string) => {
  const hashedPin = await hashPin(pin);
  const newUser = {
    name,
    email,
    pin: hashedPin,
    role: 'student' as const,
    grade: '10',
    xp: 0,
    level: 1,
    streak: 1,
    badges: ['New Explorer'],
    quizzesPassed: 0,
    language: 'en'
  };

  const id = await db.users.add(newUser);

  if (navigator.onLine) {
      try {
          const { error } = await supabase.from('users').upsert({
            email: newUser.email,
            name: newUser.name,
            pin: newUser.pin,
            role: newUser.role,
            grade: newUser.grade,
            xp: newUser.xp,
            level: newUser.level,
            streak: newUser.streak,
            badges: newUser.badges,
            quizzes_passed: newUser.quizzesPassed,
            language: newUser.language
          }, { onConflict: 'email' });
          
          if (error) throw new Error(error.message);

      } catch (e) {
          console.warn("Immediate Supabase sync failed", e);
          await logActivity('USER_REGISTERED_EMAIL', { id, ...newUser });
      }
  } else {
      await logActivity('USER_REGISTERED_EMAIL', { id, ...newUser });
  }
  
  return id;
};

export const createGuestAccount = async () => {
  const email = 'guest@padhoindia.com';
  const existing = await findUserByEmail(email);
  if (existing) return existing.id!;
  return await registerUserWithGoogle('Guest Student', email, '0000');
};

export const logActivity = async (action: string, data: any, isSynced: boolean = false) => {
  try {
    await db.sync_logs.add({
      action,
      data,
      timestamp: Date.now(),
      isSynced: isSynced
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

export const seedDatabase = async () => {
  try {
    // @ts-ignore
    await db.transaction('rw', db.courses, db.modules, async () => {
      if ((await db.courses.count()) > 0) return; 

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
          isDownloaded: true, 
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
              type: 'video', 
              isCompleted: false,
              content: 'Talking about daily habits.'
            }
          ]
        }
      ];

      for (const courseData of seedCourses) {
          const { modules, ...courseInfo } = courseData;
          // @ts-ignore
          const courseId = await db.courses.add(courseInfo);
          const modulesWithId = modules.map(m => ({ ...m, courseId: courseId as number }));
          // @ts-ignore
          await db.modules.bulkAdd(modulesWithId);
      }
      console.log("Database Seeded");
    });
  } catch (e) {
      console.error("Database Seeding Error", e);
  }
};
