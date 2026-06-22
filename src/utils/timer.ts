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

export function getTaskPhase(startTime: number, durationMinutes: number): 'safe' | 'warning_10min' | 'time_up' | 'overtime' {
  const remaining = getRemainingTime(startTime, durationMinutes);
  const tenMinMs = 10 * 60 * 1000;
  if (remaining <= 0) return 'overtime';
  if (remaining <= tenMinMs) return 'time_up';
  if (remaining <= tenMinMs * 2) return 'warning_10min';
  return 'safe';
}

export function generateId(): string {
  return `rec_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
}
