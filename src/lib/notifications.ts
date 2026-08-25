import { getStorageJson, setStorageJson } from '@/lib/local-storage';

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  timestampIso: string;
  read: boolean;
  type: 'info' | 'success' | 'warning';
}

function notifKey(userId: string): string {
  return `skillworth:notifications:${userId}`;
}

export function getNotifications(userId: string): AppNotification[] {
  if (!userId) return [];
  return getStorageJson<AppNotification[]>(notifKey(userId), []);
}

export function addNotification(userId: string, notif: Omit<AppNotification, 'id' | 'timestampIso' | 'read'>): AppNotification {
  const current = getNotifications(userId);
  const newNotif: AppNotification = {
    ...notif,
    id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    timestampIso: new Date().toISOString(),
    read: false,
  };
  const updated = [newNotif, ...current].slice(0, 50); // keep last 50
  setStorageJson(notifKey(userId), updated);
  return newNotif;
}

export function markNotificationAsRead(userId: string, id: string): AppNotification[] {
  const current = getNotifications(userId);
  const updated = current.map(n => (n.id === id ? { ...n, read: true } : n));
  setStorageJson(notifKey(userId), updated);
  return updated;
}

export function clearAllNotifications(userId: string): void {
  setStorageJson(notifKey(userId), []);
}
