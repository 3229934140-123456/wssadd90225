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

export function generateId(): string {
  return `rec_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
}

export function computeStats(records: import('@/types').AnesthesiaRecord[]) {
  const completedRecords = records.filter((r) => r.status === 'completed');
  const overtimeRecords = records.filter((r) => r.status === 'overtime');
  const standardRecords = completedRecords.filter(
    (r) => r.customerFeeling && r.rednessLevel
  );

  const sortedByTime = [...records]
    .filter((r) => r.status === 'completed' || r.status === 'overtime')
    .sort((a, b) => a.startTime - b.startTime);

  let consecutiveNoOvertimeDays = 0;
  if (sortedByTime.length > 0) {
    const daySet = new Set<string>();
    sortedByTime.forEach((r) => {
      const d = new Date(r.startTime);
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      if (r.status !== 'overtime') {
        daySet.add(key);
      }
    });
    const today = new Date();
    let checkDate = new Date(today);
    let consecutive = 0;
    while (true) {
      const key = `${checkDate.getFullYear()}-${checkDate.getMonth()}-${checkDate.getDate()}`;
      const dayRecords = sortedByTime.filter((r) => {
        const d = new Date(r.startTime);
        return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}` === key;
      });
      const hasOvertime = dayRecords.some((r) => r.status === 'overtime');
      if (dayRecords.length === 0) {
        if (consecutive > 0) break;
        checkDate.setDate(checkDate.getDate() - 1);
        if (checkDate.getTime() < sortedByTime[0].startTime) break;
        continue;
      }
      if (hasOvertime) break;
      consecutive++;
      checkDate.setDate(checkDate.getDate() - 1);
      if (checkDate.getTime() < sortedByTime[0].startTime) break;
    }
    consecutiveNoOvertimeDays = consecutive;
  }

  return {
    consecutiveNoOvertimeDays,
    standardRecordCount: standardRecords.length,
    anomalyReportCount: overtimeRecords.length,
    totalTasks: records.length,
    completedTasks: completedRecords.length,
    overtimeTasks: overtimeRecords.length,
  };
}
