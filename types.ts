
export type UserRole = 'student' | 'teacher';
export type ModuleType = 'video' | 'quiz';

export interface User {
  id?: number;
  phoneNumber?: string;
  email?: string;
  pin?: string; // Hashed PIN
  grade?: string;
  name: string;
  xp: number;
  level: number;
  streak: number;
  role: UserRole;
  language?: string; // 'en', 'hi', etc.
  badges: string[];
  quizzesPassed: number;
  showDailyGyan?: boolean;
  darkMode?: boolean;
  avatar?: string; // Custom profile image (URL or Base64)
}

export interface Course {
  id?: number;
  title: string;
  subject: string;
  description: string;
  thumbnail: string;
  isDownloaded: boolean;
  language: string;
  totalModules: number;
  completedModules: number;
}

export interface Module {
  id?: number;
  courseId: number;
  title: string;
  videoUrl?: string; 
  audioUrl?: string;
  youtubeVideoId?: string; // Added for YouTube support
  offlineVideoBlob?: Blob; // Added for offline support
  content?: string; // Kept for text content support
  type: ModuleType;
  isCompleted: boolean;
  quiz?: Quiz;
  captions?: { language: string; label: string; src: string }[];
}

export interface TeacherUpload {
  id?: number;
  teacherId: number;
  title: string;
  fileType: string;
  date: number; // Timestamp
}

export interface SyncLog {
  id?: number;
  action: string;
  data: any;
  timestamp: number;
  isSynced: boolean;
}

export type NetworkMode = 'Lite' | 'Standard';

export interface Quiz {
  question: string;
  options: string[];
  correctIndex: number;
}

export enum GeminiModel {
  FLASH_LITE = 'gemini-flash-lite-latest',
  FLASH_3 = 'gemini-3-flash-preview',
  PRO_3 = 'gemini-3-pro-preview',
  IMAGE_FLASH = 'gemini-2.5-flash-image',
  IMAGE_PRO = 'gemini-3-pro-image-preview',
  VEO_FAST = 'veo-3.1-fast-generate-preview',
  TTS = 'gemini-2.5-flash-preview-tts',
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}
