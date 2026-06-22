import { create } from 'zustand';
import type { AnesthesiaRecord, TaskStatus } from '@/types';

interface TaskStore {
  records: AnesthesiaRecord[];
  addRecord: (record: AnesthesiaRecord) => void;
  updateRecordStatus: (id: string, status: TaskStatus) => void;
  updateRecordReview: (id: string, data: Partial<AnesthesiaRecord>) => void;
  deleteRecord: (id: string) => void;
}

export const useTaskStore = create<TaskStore>((set) => ({
  records: [],
  addRecord: (record) =>
    set((state) => ({
      records: [...state.records, record],
    })),
  updateRecordStatus: (id, status) =>
    set((state) => ({
      records: state.records.map((r) =>
        r.id === id ? { ...r, status } : r
      ),
    })),
  updateRecordReview: (id, data) =>
    set((state) => ({
      records: state.records.map((r) =>
        r.id === id ? { ...r, ...data } : r
      ),
    })),
  deleteRecord: (id) =>
    set((state) => ({
      records: state.records.filter((r) => r.id !== id),
    })),
}));
