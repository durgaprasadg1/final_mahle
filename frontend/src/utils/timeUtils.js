/**
 * Utility functions for time and date management
 */

/**
 * Get interval in minutes
 */
export const getIntervalMinutes = (interval = "hourwise") => {
  if (interval === "halfhourwise" || interval === "30minutes") return 30;
  return 60;
};

/**
 * Format clock time from total minutes
 */
export const formatClock = (minutesTotal) => {
  const hour = Math.floor(minutesTotal / 60) % 24;
  const minute = minutesTotal % 60;
  return `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
};

/**
 * Generate time slots based on start time, end time, and interval
 */
export const generateTimeSlots = (start, end, interval) => {
  if (!start || !end) return [];

  const stepMinutes = getIntervalMinutes(interval);
  const [startHour, startMin] = start.split(":").map(Number);
  const [endHour, endMin] = end.split(":").map(Number);

  let startTotal = startHour * 60 + startMin;
  let endTotal = endHour * 60 + endMin;
  if (endTotal <= startTotal) {
    endTotal += 24 * 60;
  }

  const slots = [];
  let current = startTotal;

  while (current < endTotal) {
    const next = Math.min(current + stepMinutes, endTotal);
    slots.push({
      value: `${formatClock(current)}|${formatClock(next)}`,
      label: `${formatClock(current)} - ${formatClock(next)}`,
      startTime: formatClock(current),
      endTime: formatClock(next),
    });
    current = next;
  }

  return slots;
};

/**
 * Convert time value to time string (HH:MM:SS)
 */
export const toTimeString = (timeValue) => {
  if (!timeValue) return null;
  return timeValue.length === 5 ? `${timeValue}:00` : timeValue;
};

/**
 * Format time value to HH:MM
 */
export const formatSlotStart = (timeValue) => {
  if (!timeValue) return "";
  const parts = String(timeValue).split("|");
  if (parts.length > 1) return parts[0];
  return String(timeValue).substring(0, 5);
};
