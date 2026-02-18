
import { db, logActivity } from '../db';

const SESSION_KEY = 'padho_user_id';

export const requestOTP = async (phoneNumber: string): Promise<string> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(`OTP sent to ${phoneNumber}`);
    }, 1500);
  });
};

export const verifyOTP = async (code: string): Promise<boolean> => {
  // Simulating server verification. Hardcoded for testing.
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(code === '1234');
    }, 500);
  });
};

export const checkUserExists = async (phoneNumber: string) => {
  try {
    const user = await db.users.where('phoneNumber').equals(phoneNumber).first();
    return user || null;
  } catch (e) {
    console.error("Error checking user:", e);
    throw new Error("Unable to check user existence. Please verify your connection or try again later.");
  }
};

export const registerUser = async (phoneNumber: string, name: string, grade: string) => {
  try {
    const existing = await checkUserExists(phoneNumber);
    if (existing) {
        throw new Error("A user with this phone number already exists. Please log in.");
    }

    const id = await db.users.add({
      phoneNumber,
      name,
      grade,
      role: 'student',
      xp: 0,
      level: 1,
      streak: 1, // Start with 1 day streak for signing up!
      badges: ['New Explorer'],
      quizzesPassed: 0,
      language: 'en'
    });
    
    await logActivity('USER_REGISTERED', { id, name });
    return id;
  } catch (e: any) {
    console.error("Error registering user:", e);
    if (e.message) throw e;
    throw new Error("Registration failed due to a database error. Please ensure you have sufficient storage space.");
  }
};

export const loginUser = (userId: number) => {
  localStorage.setItem(SESSION_KEY, userId.toString());
};

export const logoutUser = () => {
  localStorage.removeItem(SESSION_KEY);
};

export const getSessionId = (): number | null => {
  const id = localStorage.getItem(SESSION_KEY);
  return id ? parseInt(id) : null;
};

export const isAuthenticated = (): boolean => {
  return !!localStorage.getItem(SESSION_KEY);
};
