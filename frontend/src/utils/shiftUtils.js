/**
 * Utility functions for shift management
 */

export const VALID_SHIFT_TYPES = ["morning", "afternoon", "night"];

export const DEFAULT_SHIFT_CONFIGS = [
  {
    id: "shift-morning",
    name: "Morning",
    startTime: "06:00",
    endTime: "14:00",
    timeInterval: "hourwise",
    backendShift: "morning",
    isActive: true,
  },
  {
    id: "shift-afternoon",
    name: "Afternoon",
    startTime: "14:00",
    endTime: "22:00",
    timeInterval: "hourwise",
    backendShift: "afternoon",
    isActive: true,
  },
  {
    id: "shift-night",
    name: "Night",
    startTime: "22:00",
    endTime: "06:00",
    timeInterval: "hourwise",
    backendShift: "night",
    isActive: true,
  },
];

/**
 * Resolve shift type from shift configuration
 */
export const resolveShiftType = (shiftConfig = {}) => {
  const shiftLabel = String(
    shiftConfig.shiftType || shiftConfig.type || shiftConfig.name || "",
  )
    .toLowerCase()
    .trim();

  if (VALID_SHIFT_TYPES.includes(shiftLabel)) {
    return shiftLabel;
  }

  if (shiftLabel.includes("morn")) return "morning";
  if (shiftLabel.includes("after")) return "afternoon";
  if (shiftLabel.includes("night")) return "night";

  const [startHour] = String(shiftConfig.startTime || "")
    .split(":")
    .map(Number);
  if (Number.isFinite(startHour)) {
    if (startHour < 12) return "morning";
    if (startHour < 19) return "afternoon";
    return "night";
  }

  return "morning";
};

/**
 * Load shift configurations from localStorage
 */
export const loadBatchShiftConfigs = () => {
  try {
    const rawShifts = localStorage.getItem("shifts");
    if (!rawShifts) return DEFAULT_SHIFT_CONFIGS;

    const parsedShifts = JSON.parse(rawShifts);
    if (!Array.isArray(parsedShifts) || parsedShifts.length === 0) {
      return DEFAULT_SHIFT_CONFIGS;
    }

    const mapped = parsedShifts
      .filter((shift) => shift?.isActive !== false)
      .map((shift, index) => ({
        id: shift.id || `${shift.name || "shift"}-${index}`,
        name: shift.name || "Shift",
        description: shift.description || "",
        startTime: shift.startTime || "",
        endTime: shift.endTime || "",
        timeInterval: shift.timeInterval || "hourwise",
        backendShift: resolveShiftType(shift),
        isActive: shift.isActive !== false,
      }));

    return mapped.length > 0 ? mapped : DEFAULT_SHIFT_CONFIGS;
  } catch (error) {
    return DEFAULT_SHIFT_CONFIGS;
  }
};

/**
 * Get shift label with time range
 */
export const getShiftLabel = (shiftConfig) => {
  const timeText =
    shiftConfig.startTime && shiftConfig.endTime
      ? ` (${shiftConfig.startTime} - ${shiftConfig.endTime})`
      : "";
  return `${shiftConfig.name}${timeText}`;
};
