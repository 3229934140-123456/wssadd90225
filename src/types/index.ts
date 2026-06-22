export interface Project {
  id: string;
  name: string;
  defaultDuration: number;
  parts: string[];
  drugTypes: string[];
}

export type SkinCondition = 'normal' | 'sensitive' | 'damaged' | 'inflamed';

export type TaskStatus = 'pending' | 'counting' | 'warning_10min' | 'time_up' | 'overtime' | 'completed';

export type TimelineEventType = 'clockIn' | 'warning10min' | 'timeUp' | 'overtime' | 'completed' | 'reviewed';

export type TimelineProcessStatus = 'pending' | 'handled' | 'overtime';

export interface TimelineEvent {
  type: TimelineEventType;
  timestamp: number;
  note?: string;
  processStatus?: TimelineProcessStatus;
}

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
  comment?: string;
  timeline?: TimelineEvent[];
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

export interface UserStats {
  consecutiveNoOvertimeDays: number;
  standardRecordCount: number;
  anomalyReportCount: number;
  totalTasks: number;
  completedTasks: number;
  overtimeTasks: number;
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
