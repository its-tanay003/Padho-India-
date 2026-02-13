export const XP_VALUES = {
  WATCH_VIDEO: 20,
  PASS_QUIZ: 50,
  DAILY_LOGIN: 10
};

export const BADGES = {
  STREAK_MASTER: "Streak Master",
  QUIZ_WIZARD: "Quiz Wizard",
  FAST_LEARNER: "Fast Learner"
};

export interface LevelInfo {
  level: number;
  title: string;
  progress: number; // 0 to 100 percent
  nextLevelXp: number;
}

export const getLevelInfo = (xp: number): LevelInfo => {
  // Logic: Level 1 starts at 0. Level up every 100 XP.
  const level = Math.floor(xp / 100) + 1;
  const currentLevelBaseXp = (level - 1) * 100;
  const nextLevelXp = level * 100;
  
  // Calculate progress percentage to next level
  const xpInCurrentLevel = xp - currentLevelBaseXp;
  const progress = (xpInCurrentLevel / 100) * 100;

  let title = "Beginner Explorer";
  if (level >= 10) title = "Learning Champion";
  else if (level >= 5) title = "Knowledge Warrior";

  return {
    level,
    title,
    progress,
    nextLevelXp
  };
};

export const checkNewBadges = (
  currentBadges: string[],
  stats: { streak: number; quizzesPassed: number; lastModuleDurationSeconds?: number }
): string[] => {
  const newBadges: string[] = [];

  // Badge: Streak Master (Streak >= 5)
  if (stats.streak >= 5 && !currentBadges.includes(BADGES.STREAK_MASTER)) {
    newBadges.push(BADGES.STREAK_MASTER);
  }

  // Badge: Quiz Wizard (Quizzes Passed >= 3)
  if (stats.quizzesPassed >= 3 && !currentBadges.includes(BADGES.QUIZ_WIZARD)) {
    newBadges.push(BADGES.QUIZ_WIZARD);
  }

  // Badge: Fast Learner (Module completed in < 5 mins / 300 seconds)
  // Note: This requires the calling component to track duration.
  if (stats.lastModuleDurationSeconds && stats.lastModuleDurationSeconds < 300 && !currentBadges.includes(BADGES.FAST_LEARNER)) {
    newBadges.push(BADGES.FAST_LEARNER);
  }

  return newBadges;
};