import AsyncStorage from '@react-native-async-storage/async-storage';
import api from './api';

const QUEUE_KEY = '@offline_queue';
const CACHE_PREFIX = '@cache_';

interface QueuedRequest {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  url: string;
  data?: unknown;
  timestamp: number;
}

export const queueRequest = async (
  method: QueuedRequest['method'],
  url: string,
  data?: unknown,
): Promise<void> => {
  const existing = await AsyncStorage.getItem(QUEUE_KEY);
  const queue: QueuedRequest[] = existing ? JSON.parse(existing) : [];
  queue.push({ method, url, data, timestamp: Date.now() });
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
};

export const syncPendingRequests = async (): Promise<void> => {
  const existing = await AsyncStorage.getItem(QUEUE_KEY);
  if (!existing) return;
  const queue: QueuedRequest[] = JSON.parse(existing);
  const failed: QueuedRequest[] = [];
  for (const req of queue) {
    try {
      await api.request({
        method: req.method,
        url: req.url,
        data: req.data,
      });
    } catch {
      failed.push(req);
    }
  }
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(failed));
};

export const cacheData = async (key: string, data: unknown): Promise<void> => {
  await AsyncStorage.setItem(`${CACHE_PREFIX}${key}`, JSON.stringify(data));
};

export const getCachedData = async <T>(key: string): Promise<T | null> => {
  const raw = await AsyncStorage.getItem(`${CACHE_PREFIX}${key}`);
  if (!raw) return null;
  return JSON.parse(raw) as T;
};

export const clearCache = async (): Promise<void> => {
  const keys = await AsyncStorage.getAllKeys();
  const cacheKeys = keys.filter((k) => k.startsWith(CACHE_PREFIX));
  if (cacheKeys.length > 0) {
    await AsyncStorage.multiRemove(cacheKeys);
  }
  await AsyncStorage.removeItem(QUEUE_KEY);
};

export const getPendingCount = async (): Promise<number> => {
  const existing = await AsyncStorage.getItem(QUEUE_KEY);
  if (!existing) return 0;
  const queue: QueuedRequest[] = JSON.parse(existing);
  return queue.length;
};
