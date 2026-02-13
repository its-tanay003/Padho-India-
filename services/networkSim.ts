import { db, logActivity } from '../db';
import { NetworkMode } from '../types';

/**
 * Simulates a download process with a delay and progress updates.
 * Updates the local database upon completion.
 */
export const simulateDownload = async (courseId: number, onProgress?: (percent: number) => void): Promise<boolean> => {
  return new Promise((resolve) => {
    console.log(`Starting download for course ${courseId}...`);
    let progress = 0;
    const intervalTime = 300; // 300ms * 10 steps = 3 seconds total

    const interval = setInterval(async () => {
      progress += 10;
      if (onProgress) onProgress(progress);

      if (progress >= 100) {
        clearInterval(interval);
        try {
          await db.courses.update(courseId, { isDownloaded: true });
          await logActivity('COURSE_DOWNLOADED', { courseId });
          console.log(`Course ${courseId} download complete.`);
          resolve(true);
        } catch (e) {
          console.error("Download failed", e);
          resolve(false);
        }
      }
    }, intervalTime);
  });
};

/**
 * Checks for network connectivity and attempts to sync local logs to the "server".
 */
export const checkSyncStatus = async (): Promise<void> => {
  if (navigator.onLine) {
    const unsyncedLogs = await db.sync_logs.where('isSynced').equals(0).toArray(); // equals(0) checks for false/0

    if (unsyncedLogs.length > 0) {
      console.group("Syncing Data...");
      console.log(`Found ${unsyncedLogs.length} unsynced items.`);
      
      // Simulate API latency
      await new Promise(r => setTimeout(r, 1000));
      
      for (const log of unsyncedLogs) {
        console.log(`[UPLOADING] Action: ${log.action}`, log.data);
        if (log.id) {
           await db.sync_logs.update(log.id, { isSynced: true });
        }
      }
      console.log("Sync complete. All items uploaded.");
      console.groupEnd();
    } else {
      console.log("Sync Check: All systems up to date.");
    }
  } else {
    console.log("Sync Check: Offline. Sync paused.");
  }
};

/**
 * Detects network condition to suggest UI mode.
 * Returns 'Lite' for slow connections, 'Standard' otherwise.
 */
export const getNetworkMode = (): NetworkMode => {
  // @ts-ignore - Navigator connection API is not standard in all TS definitions
  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  
  if (connection) {
    // Check for Data Saver mode or slow effective connection type
    if (connection.saveData || connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g') {
      return 'Lite';
    }
  }
  return 'Standard';
};