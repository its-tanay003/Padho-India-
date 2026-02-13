
export type Language = 'en' | 'hi' | 'ta';

export interface User {
  name: string;
  email: string;
  mobile: string;
  village: string;
  level: number;
  xp: number;
  rank: string;
  badges: Badge[];
  streak: number;
}

export interface Badge {
  id: string;
  name: string;
  icon: string;
  earnedAt: string;
}

export interface Course {
  id: string;
  title: string;
  subject: string;
  thumbnail: string;
  progress: number;
  lessons: Lesson[];
}

export interface Lesson {
  id: string;
  title: string;
  type: 'video' | 'audio' | 'text';
  isDownloaded: boolean;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
}

export interface StudentStats {
  id: string;
  name: string;
  lastActive: string;
  score: number;
  status: 'active' | 'struggling' | 'inactive';
}
