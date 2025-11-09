/**
 * Timezone helper functions for converting dates and formatting
 */

/**
 * Get UTC offset in minutes for a given date and timezone
 */
function getTimezoneOffset(date: Date, timeZone: string): number {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  const parts = dtf.formatToParts(date);
  const partValues: Record<string, string> = {};
  for (const { type, value } of parts) {
    partValues[type] = value;
  }

  const { year, month, day, hour, minute, second } = partValues;

  if (!year || !month || !day || !hour || !minute || !second) {
    throw new Error("Failed to determine timezone offset");
  }

  const asUTC = Date.UTC(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hour),
    Number(minute),
    Number(second)
  );

  return (asUTC - date.getTime()) / 60000;
}

/**
 * Convert date string (YYYY-MM-DD) in given timezone to UTC start/end range
 */
export function getUtcRangeForTimezoneDate(
  dateString: string,
  timezone: string
): { start: Date; end: Date } {
  const [year, month, day] = dateString.split("-").map(Number);

  if (!year || !month || !day) {
    throw new Error(`Invalid date string: ${dateString}`);
  }

  const reference = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
  const offsetMinutes = getTimezoneOffset(reference, timezone);
  const offsetMs = offsetMinutes * 60 * 1000;

  const localStartUtc = Date.UTC(year, month - 1, day, 0, 0, 0, 0);
  const localEndUtc = Date.UTC(year, month - 1, day, 23, 59, 59, 999);

  return {
    start: new Date(localStartUtc - offsetMs),
    end: new Date(localEndUtc - offsetMs),
  };
}

/**
 * Format date for display in given timezone
 * Returns formatted string like "Nov 8, 8:00pm"
 */
export function formatDateInTimezone(date: Date, timezone: string): string {
  const formatted = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);

  // Lowercase AM/PM to match previous style
  return formatted.replace("AM", "am").replace("PM", "pm");
}

/**
 * Get formatted list of supported timezones
 * Returns array of { value: string, label: string } objects
 */
export function getTimezoneList(): Array<{ value: string; label: string }> {
  const timezones = [
    { value: "America/Los_Angeles", label: "UTC−08:00 Pacific Time (US/Canada)" },
    { value: "America/Denver", label: "UTC−07:00 Mountain Time (US/Canada)" },
    { value: "America/Chicago", label: "UTC−06:00 Central Time (US/Canada)" },
    { value: "America/New_York", label: "UTC−05:00 Eastern Time (US/Canada)" },
    { value: "America/Halifax", label: "UTC−04:00 Atlantic Time (Canada)" },
    { value: "America/Sao_Paulo", label: "UTC−03:00 Brazil" },
    { value: "Europe/London", label: "UTC±00:00 UK" },
    { value: "Europe/Paris", label: "UTC+01:00 Central Europe" },
    { value: "Europe/Athens", label: "UTC+02:00 Eastern Europe / South Africa" },
    { value: "Asia/Riyadh", label: "UTC+03:00 Arabia" },
    { value: "Asia/Tehran", label: "UTC+03:30 Iran" },
    { value: "Asia/Dubai", label: "UTC+04:00 Gulf" },
    { value: "Asia/Kolkata", label: "UTC+05:30 India" },
    { value: "Asia/Bangkok", label: "UTC+07:00 SE Asia" },
    { value: "Asia/Singapore", label: "UTC+08:00 Singapore / Western Australia" },
    { value: "Asia/Tokyo", label: "UTC+09:00 Japan / Korea" },
    { value: "Australia/Sydney", label: "UTC+10:00 Eastern Australia" },
    { value: "Pacific/Auckland", label: "UTC+12:00 New Zealand" },
  ];

  return timezones;
}

