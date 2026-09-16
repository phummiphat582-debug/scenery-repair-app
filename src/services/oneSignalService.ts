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
        resolve(instance);
      };

      window.OneSignalDeferred.push(async (oneSignal) => {
        try {
          const basePath = new URL('.', document.baseURI).pathname;
          const workerDirectory = `${basePath.replace(/\/$/, '')}/onesignal/`;
          const workerPath = `${workerDirectory}OneSignalSDKWorker.js`.replace(/^\//, '');

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
    const oneSignal = await this.getInstance();
    if (!oneSignal) return 'unavailable';

    try {
      await oneSignal.User.addTag(TECHNICIAN_TAG, 'technician');
      const permission = await oneSignal.Notifications.requestPermission();
      return permission ? 'enabled' : 'denied';
    } catch (error) {
      console.warn('[OneSignal] permission request failed:', error);
      return 'unavailable';
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

  async notifyTechnicians(ticket: { id: string; requestId: string }): Promise<boolean> {
    if (!isConfigured || !isSupabaseConfigured || !supabase) return false;

    try {
      const { data, error } = await supabase.functions.invoke('notify-technicians', {
        body: { ticketId: ticket.id, requestId: ticket.requestId }
      });
      if (error) {
        console.warn('[OneSignal] notification function failed:', error);
        return false;
      }
      return Boolean(data?.sent);
    } catch (error) {
      console.warn('[OneSignal] notification request failed:', error);
      return false;
    }
  }
};
