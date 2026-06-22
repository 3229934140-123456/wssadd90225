import { create } from 'zustand';
import Taro from '@tarojs/taro';
import type { AnesthesiaRecord, TaskStatus, Review } from '@/types';

const STORAGE_RECORDS_KEY = 'fuma_records';
const STORAGE_REVIEWS_KEY = 'fuma_reviews';

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = Taro.getStorageSync(key);
    if (raw) {
      return JSON.parse(raw as string) as T;
    }
  } catch (e) {
    console.error('[Store] Failed to load from storage:', key, e);
  }
  return fallback;
}

function saveToStorage<T>(key: string, data: T): void {
  try {
    Taro.setStorageSync(key, JSON.stringify(data));
  } catch (e) {
    console.error('[Store] Failed to save to storage:', key, e);
  }
}

interface TaskStore {
  records: AnesthesiaRecord[];
  reviews: Review[];
  hydrated: boolean;
  hydrate: () => void;
  addRecord: (record: AnesthesiaRecord) => void;
  updateRecordStatus: (id: string, status: TaskStatus) => void;
  updateRecordReview: (id: string, data: Partial<AnesthesiaRecord>) => void;
  deleteRecord: (id: string) => void;
  addReview: (review: Review) => void;
}

export const useTaskStore = create<TaskStore>((set, get) => ({
  records: [],
  reviews: [],
  hydrated: false,

  hydrate: () => {
    if (get().hydrated) return;
    const records = loadFromStorage<AnesthesiaRecord[]>(STORAGE_RECORDS_KEY, []);
    const reviews = loadFromStorage<Review[]>(STORAGE_REVIEWS_KEY, []);
    console.info('[Store] Hydrated from storage:', records.length, 'records,', reviews.length, 'reviews');
    set({ records, reviews, hydrated: true });
  },

  addRecord: (record) => {
    set((state) => {
      const next = [...state.records, record];
      saveToStorage(STORAGE_RECORDS_KEY, next);
      return { records: next };
    });
  },

  updateRecordStatus: (id, status) => {
    set((state) => {
      const next = state.records.map((r) =>
        r.id === id ? { ...r, status } : r
      );
      saveToStorage(STORAGE_RECORDS_KEY, next);
      return { records: next };
    });
  },

  updateRecordReview: (id, data) => {
    set((state) => {
      const next = state.records.map((r) =>
        r.id === id ? { ...r, ...data } : r
      );
      saveToStorage(STORAGE_RECORDS_KEY, next);
      return { records: next };
    });
  },

  deleteRecord: (id) => {
    set((state) => {
      const nextRecords = state.records.filter((r) => r.id !== id);
      const nextReviews = state.reviews.filter((r) => r.recordId !== id);
      saveToStorage(STORAGE_RECORDS_KEY, nextRecords);
      saveToStorage(STORAGE_REVIEWS_KEY, nextReviews);
      return { records: nextRecords, reviews: nextReviews };
    });
  },

  addReview: (review) => {
    set((state) => {
      const next = [...state.reviews, review];
      saveToStorage(STORAGE_REVIEWS_KEY, next);
      return { reviews: next };
    });
  },
}));
