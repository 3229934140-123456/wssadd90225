import type { AnesthesiaRecord, TaskStatus, TimelineEvent } from '@/types';

export const OVERTIME_GRACE_MS = 2 * 60 * 1000;

export function formatCountdown(remainingMs: number): string {
  if (remainingMs <= 0) return '00:00';
  const totalSeconds = Math.floor(remainingMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export function getRemainingTime(startTime: number, durationMinutes: number): number {
  const elapsed = Date.now() - startTime;
  const total = durationMinutes * 60 * 1000;
  return total - elapsed;
}

export function getTaskPhase(
  startTime: number,
  durationMinutes: number
): 'safe' | 'warning_10min' | 'time_up' | 'overtime' {
  const remaining = getRemainingTime(startTime, durationMinutes);
  const tenMinMs = 10 * 60 * 1000;
  if (remaining <= -OVERTIME_GRACE_MS) return 'overtime';
  if (remaining <= 0) return 'time_up';
  if (remaining <= tenMinMs) return 'warning_10min';
  return 'safe';
}

export function getEffectiveStatus(record: AnesthesiaRecord): TaskStatus {
  if (record.status === 'completed' || record.status === 'pending') return record.status;
  const phase = getTaskPhase(record.startTime, record.duration);
  if (phase === 'overtime') return 'overtime';
  if (phase === 'time_up') return 'time_up';
  if (phase === 'warning_10min') return 'warning_10min';
  return 'counting';
}

export function generateId(): string {
  return `rec_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
}

export const TIMELINE_LABELS: Record<string, string> = {
  clockIn: '开麻打卡',
  warning10min: '10分钟预警',
  timeUp: '准点到点',
  overtime: '超时',
  completed: '揭麻完成',
  reviewed: '点评提交',
};

export const TIMELINE_ICONS: Record<string, string> = {
  clockIn: '🟢',
  warning10min: '🟡',
  timeUp: '🟠',
  overtime: '🔴',
  completed: '✅',
  reviewed: '💬',
};

export function getTimelineLabel(type: string): string {
  return TIMELINE_LABELS[type] || type;
}

export function getTimelineIcon(type: string): string {
  return TIMELINE_ICONS[type] || '⚪';
}

export function ensureTimeline(record: AnesthesiaRecord): TimelineEvent[] {
  const events: TimelineEvent[] = record.timeline ? [...record.timeline] : [];
  if (!events.find((e) => e.type === 'clockIn')) {
    events.push({ type: 'clockIn', timestamp: record.startTime });
  }
  events.sort((a, b) => a.timestamp - b.timestamp);
  return events;
}

export type StatsTimeRange = 'today' | 'week' | 'month' | 'all';

export function filterRecordsByRange(
  records: AnesthesiaRecord[],
  range: StatsTimeRange
): AnesthesiaRecord[] {
  if (range === 'all') return records;
  const now = Date.now();
  let start: number;
  switch (range) {
    case 'today': {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      start = d.getTime();
      break;
    }
    case 'week':
      start = now - 7 * 24 * 60 * 60 * 1000;
      break;
    case 'month':
      start = now - 30 * 24 * 60 * 60 * 1000;
      break;
    default:
      return records;
  }
  return records.filter((r) => r.startTime >= start);
}

export function computeStats(records: AnesthesiaRecord[]) {
  const enriched = records.map((r) => ({
    ...r,
    effectiveStatus: getEffectiveStatus(r),
  }));

  const completedRecords = enriched.filter((r) => r.effectiveStatus === 'completed');
  const overtimeRecords = enriched.filter((r) => r.effectiveStatus === 'overtime');
  const standardRecords = completedRecords.filter(
    (r) => r.customerFeeling && r.rednessLevel
  );

  const settledRecords = enriched.filter(
    (r) => r.effectiveStatus === 'completed' || r.effectiveStatus === 'overtime'
  );

  let consecutiveNoOvertimeDays = 0;
  if (settledRecords.length > 0) {
    const today = new Date();
    let checkDate = new Date(today);
    let consecutive = 0;
    const earliest = Math.min(...settledRecords.map((r) => r.startTime));
    while (true) {
      const key = `${checkDate.getFullYear()}-${checkDate.getMonth()}-${checkDate.getDate()}`;
      const dayRecords = settledRecords.filter((r) => {
        const d = new Date(r.startTime);
        return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}` === key;
      });
      const hasOvertime = dayRecords.some((r) => r.effectiveStatus === 'overtime');
      if (dayRecords.length === 0) {
        if (consecutive > 0) break;
        checkDate.setDate(checkDate.getDate() - 1);
        if (checkDate.getTime() < earliest) break;
        continue;
      }
      if (hasOvertime) break;
      consecutive++;
      checkDate.setDate(checkDate.getDate() - 1);
      if (checkDate.getTime() < earliest) break;
    }
    consecutiveNoOvertimeDays = consecutive;
  }

  return {
    consecutiveNoOvertimeDays,
    standardRecordCount: standardRecords.length,
    anomalyReportCount: overtimeRecords.length,
    totalTasks: enriched.length,
    completedTasks: completedRecords.length,
    overtimeTasks: overtimeRecords.length,
  };
}

export function computeStatsInRange(
  records: AnesthesiaRecord[],
  range: StatsTimeRange
) {
  const filtered = filterRecordsByRange(records, range);
  return computeStats(filtered);
}
