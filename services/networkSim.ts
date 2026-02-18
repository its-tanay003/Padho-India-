
import { db, logActivity } from '../db';
import { NetworkMode, User } from '../types';
import { supabase } from './supabaseClient';

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
 * Checks for network connectivity and attempts to sync local logs to Supabase.
 * Maps local logs to Supabase DB updates.
 */
export const checkSyncStatus = async (): Promise<void> => {
  if (navigator.onLine) {
    // Get unsynced logs from IndexedDB
    const unsyncedLogs = await db.sync_logs.where('isSynced').equals(0).toArray();

    if (unsyncedLogs.length > 0) {
      console.group("Syncing Data to Supabase...");
      
      try {
        for (const log of unsyncedLogs) {
            const { action, data } = log;
            
            // --- SYNC STRATEGY ---
            // We interpret the log action to update the correct Supabase table/column.
            // Assuming 'users' table exists in Supabase.
            
            if (action === 'USER_REGISTERED_GOOGLE') {
                // Upsert User
                await supabase.from('users').upsert({
                    email: data.email,
                    name: data.name,
                    pin: data.pin,
                    role: 'student',
                    xp: 0,
                    level: 1,
                    badges: ['New Explorer']
                }, { onConflict: 'email' });
            }
            
            else if (action === 'USER_UPDATE') {
                // Generic User Update (Avatar, Settings, Name)
                if (data.userId && data.updates) {
                    const user = await db.users.get(data.userId);
                    if (user && user.email) {
                        // Map local keys to snake_case if needed, but for now assuming JS keys or auto-mapping
                        const payload: any = {};
                        if (data.updates.avatar) payload.avatar = data.updates.avatar;
                        if (data.updates.darkMode !== undefined) payload.dark_mode = data.updates.darkMode;
                        if (data.updates.showDailyGyan !== undefined) payload.show_daily_gyan = data.updates.showDailyGyan;
                        if (data.updates.language) payload.language = data.updates.language;
                        if (data.updates.name) payload.name = data.updates.name;
                        
                        if (Object.keys(payload).length > 0) {
                             await supabase.from('users').update(payload).eq('email', user.email);
                        }
                    }
                }
            }
            
            else if (action === 'XP_GAINED') {
                const user = await db.users.get(data.userId);
                if (user && user.email) {
                    await supabase.from('users').update({
                        xp: data.newXP,
                        level: data.level
                    }).eq('email', user.email);
                }
            }

            else if (action === 'BADGE_EARNED') {
                const user = await db.users.get(data.userId);
                if (user && user.email) {
                    await supabase.from('users').update({
                        badges: data.badges // Send complete array
                    }).eq('email', user.email);
                }
            }
            
            else if (action === 'QUIZ_PASSED') {
                 const user = await db.users.get(data.userId);
                 if (user && user.email) {
                     await supabase.from('users').update({
                         quizzes_passed: data.totalPassed
                     }).eq('email', user.email);
                 }
            }

            // Mark as synced locally
            await db.sync_logs.update(log.id!, { isSynced: true });
        }

        console.log(`Synced ${unsyncedLogs.length} items to Cloud.`);
      } catch (err) {
        console.error("Supabase Sync Failed:", err);
      }
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
