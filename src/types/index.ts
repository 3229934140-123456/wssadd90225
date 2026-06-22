export interface Project {
  id: string;
  name: string;
  defaultDuration: number;
  parts: string[];
  drugTypes: string[];
}

export type SkinCondition = 'normal' | 'sensitive' | 'damaged' | 'inflamed';

export type TaskStatus = 'pending' | 'counting' | 'warning_10min' | 'time_up' | 'overtime' | 'completed';

export interface AnesthesiaRecord {
  id: string;
  projectId: string;
  projectName: string;
  part: string;
  drugType: string;
  skinCondition: SkinCondition;
  photoUrl: string;
  startTime: number;
  duration: number;
  status: TaskStatus;
  customerFeeling?: string;
  rednessLevel?: 'none' | 'mild' | 'moderate' | 'severe';
  extended?: boolean;
  reviewId?: string;
}

export interface KnowledgeTip {
  id: string;
  projectId: string;
  category: string;
  title: string;
  content: string;
  icon: string;
}

export type ReviewRating = 'time_accurate' | 'record_complete' | 'communication_good' | 'emergency_correct';

export interface Review {
  id: string;
  recordId: string;
  mentorName: string;
  ratings: ReviewRating[];
  comment: string;
  createdAt: string;
}

export interface UserProfile {
  id: string;
  name: string;
  avatar: string;
  level: string;
  consecutiveNoOvertimeDays: number;
  standardRecordCount: number;
  anomalyReportCount: number;
  totalTasks: number;
  completedTasks: number;
}

export interface GrowthRankItem {
  id: string;
  name: string;
  avatar: string;
  consecutiveNoOvertimeDays: number;
  standardRecordCount: number;
  anomalyReportCount: number;
  score: number;
}
