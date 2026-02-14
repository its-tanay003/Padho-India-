import { db, logActivity } from '../db';
import { NetworkMode } from '../types';

/**
 * Simulates a download process with a delay.
 * Now actually stores a dummy Blob in the modules to test offline player capabilities.
 */
export const simulateDownload = async (courseId: number): Promise<boolean> => {
  return new Promise((resolve) => {
    console.log(`Starting download for course ${courseId}...`);
    setTimeout(async () => {
      try {
        // 1. Mark Course as Downloaded
        await db.courses.update(courseId, { isDownloaded: true });
        
        // 2. Mock Download Video Blobs for Modules
        const modules = await db.modules.where('courseId').equals(courseId).toArray();
        for (const mod of modules) {
            if (mod.type === 'video') {
                // In a real app, we would fetch(mod.videoUrl).then(res => res.blob())
                // Here we create a dummy blob to prove the architecture works
                const mockBlob = new Blob(["Simulated Video Data"], { type: 'video/mp4' });
                await db.modules.update(mod.id!, { offlineVideoBlob: mockBlob });
            }
        }

        await logActivity('COURSE_DOWNLOADED', { courseId });
        console.log(`Course ${courseId} download complete.`);
        resolve(true);
      } catch (e) {
        console.error("Download failed", e);
        resolve(false);
      }
    }, 3000); // 3 seconds delay
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