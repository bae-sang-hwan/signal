type Translate = (key: string, params?: Record<string, string | number>) => string;

export function formatRelativeTime(date: Date | null, t: Translate): string {
  if (!date) return t('relativeTime.justNow');
  const diffSec = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));
  if (diffSec < 60) return t('relativeTime.justNow');
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return t('relativeTime.minutesAgo', { n: diffMin });
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return t('relativeTime.hoursAgo', { n: diffHour });
  const diffDay = Math.floor(diffHour / 24);
  return t('relativeTime.daysAgo', { n: diffDay });
}
