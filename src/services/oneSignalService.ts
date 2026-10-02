import { supabase, isSupabaseConfigured } from '../lib/supabase';

type OneSignalInstance = {
  init: (options: {
    appId: string;
    serviceWorkerPath?: string;
    serviceWorkerParam?: { scope: string };
  }) => Promise<void>;
  User: {
    addTag: (key: string, value: string) => Promise<void> | void;
    removeTag: (key: string) => Promise<void> | void;
  };
  Notifications: {
    permission: boolean;
    requestPermission: () => Promise<boolean>;
  };
};

declare global {
  interface Window {
    OneSignalDeferred?: Array<(oneSignal: OneSignalInstance) => void | Promise<void>>;
  }
}

const appId = String(import.meta.env.VITE_ONESIGNAL_APP_ID || '').trim();
const appIdPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const isConfigured = appIdPattern.test(appId);
const TECHNICIAN_TAG = 'scenery_role';
let oneSignalPromise: Promise<OneSignalInstance | null> | null = null;

const NOTIFICATION_FUNCTION_URL =
  'https://rimwhvvashgcaepyavjq.supabase.co/functions/v1/notify-technicians';
const NOTIFICATION_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpbXdodnZhc2hnY2FlcHlhdmpxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU1NjkwNzcsImV4cCI6MjEwMTE0NTA3N30.XAo8nJPSDHokoQIv4GkMcXghb3uBeV5I7Re4Wb0mxFw';

const getNotificationPermission = (): NotificationPermission => (
  typeof Notification === 'undefined' ? 'default' : Notification.permission
);

export const oneSignalService = {
  isConfigured,

  async getInstance(): Promise<OneSignalInstance | null> {
    if (!isConfigured || typeof window === 'undefined') return null;
    if (oneSignalPromise) return oneSignalPromise;

    oneSignalPromise = new Promise<OneSignalInstance | null>((resolve) => {
      window.OneSignalDeferred = window.OneSignalDeferred || [];
      let settled = false;
      const finish = (instance: OneSignalInstance | null) => {
        if (settled) return;
        settled = true;
        // Do not permanently cache a failed initialization. On slower mobile
        // connections the SDK script may finish loading after the first try.
        if (!instance) oneSignalPromise = null;
        resolve(instance);
      };

      window.OneSignalDeferred.push(async (oneSignal) => {
        try {
          // GitHub Pages hosts this app below an origin subpath. Use absolute
          // same-origin URLs so the SDK does not resolve the worker twice
          // relative to the current document URL.
          const basePath = new URL('.', document.baseURI).pathname.replace(/\/$/, '');
          const workerDirectory = `${basePath}/onesignal/`;
          const workerPath = `${workerDirectory}OneSignalSDKWorker.js`;

          await oneSignal.init({
            appId,
            serviceWorkerPath: workerPath,
            serviceWorkerParam: { scope: workerDirectory }
          });
          finish(oneSignal);
        } catch (error) {
          console.warn('[OneSignal] initialization failed:', error);
          finish(null);
        }
      });

      window.setTimeout(() => finish(null), 12000);
    });

    return oneSignalPromise;
  },

  async enableTechnicianNotifications(): Promise<'enabled' | 'denied' | 'unavailable'> {
    if (getNotificationPermission() === 'denied') return 'denied';

    const oneSignal = await this.getInstance();
    if (!oneSignal) {
      return getNotificationPermission() === 'denied' ? 'denied' : 'unavailable';
    }

    try {
      await oneSignal.User.addTag(TECHNICIAN_TAG, 'technician');
      const permission = await oneSignal.Notifications.requestPermission();
      return permission ? 'enabled' : 'denied';
    } catch (error) {
      console.warn('[OneSignal] permission request failed:', error);
      return getNotificationPermission() === 'denied' ? 'denied' : 'unavailable';
    }
  },

  async setTechnicianRole(isTechnician: boolean): Promise<void> {
    const oneSignal = await this.getInstance();
    if (!oneSignal) return;

    try {
      if (isTechnician) {
        await oneSignal.User.addTag(TECHNICIAN_TAG, 'technician');
      } else {
        await oneSignal.User.removeTag(TECHNICIAN_TAG);
      }
    } catch (error) {
      console.warn('[OneSignal] role tag update failed:', error);
    }
  },

  async notifyTechnicians(ticket: {
    id: string;
    requestId: string;
    title?: string;
    department?: string;
    location?: string;
    priority?: string;
  }): Promise<boolean> {
    if (!isConfigured) return false;

    try {
      const response = await fetch(NOTIFICATION_FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${NOTIFICATION_ANON_KEY}`,
          'apikey': NOTIFICATION_ANON_KEY
        },
        body: JSON.stringify({
          ticketId: ticket.id,
          requestId: ticket.requestId,
          ticket: {
            id: ticket.id,
            requestId: ticket.requestId,
            title: ticket.title || 'รายการแจ้งซ่อม',
            department: ticket.department || '',
            location: ticket.location || '',
            priority: ticket.priority || 'normal'
          }
        })
      });

      if (!response.ok) {
        console.warn('[OneSignal] notification function HTTP error:', response.status);
        return false;
      }

      const data = await response.json();
      console.log('[OneSignal] Notification successfully sent:', data);
      return Boolean(data?.sent);
    } catch (error) {
      console.warn('[OneSignal] notification request failed:', error);
      return false;
    }
  },

  async testPushNotification(): Promise<{ ok: boolean; message: string; notificationId?: string }> {
    try {
      const oneSignal = await this.getInstance();
      if (oneSignal) {
        try {
          await oneSignal.User.addTag(TECHNICIAN_TAG, 'technician');
        } catch (e) {
          console.warn('[OneSignal] test tag add error:', e);
        }
      }

      const response = await fetch(NOTIFICATION_FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${NOTIFICATION_ANON_KEY}`,
          'apikey': NOTIFICATION_ANON_KEY
        },
        body: JSON.stringify({
          ticket: {
            id: 'test-' + Date.now(),
            requestId: 'TEST-' + Math.floor(100 + Math.random() * 900),
            title: 'ทดสอบแจ้งเตือนมือถือช่าง 🔔',
            department: '84 ซ่อมบำรุง',
            location: 'ระบบแจ้งเตือน OneSignal',
            priority: 'high'
          }
        })
      });

      const data = await response.json().catch(() => ({}));
      if (response.ok && data?.sent) {
        return {
          ok: true,
          message: `ยิงแจ้งเตือน OneSignal สำเร็จ (ID: ${data.notificationId || 'OK'})`,
          notificationId: data.notificationId
        };
      }
      return {
        ok: false,
        message: data?.error || 'เซิร์ฟเวอร์แจ้งเตือนตอบกลับว่าไม่สำเร็จ'
      };
    } catch (error: any) {
      return {
        ok: false,
        message: error?.message || 'เชื่อมต่อเซิร์ฟเวอร์แจ้งเตือนไม่สำเร็จ'
      };
    }
  },

  getPermission(): NotificationPermission {
    return getNotificationPermission();
  }
};
