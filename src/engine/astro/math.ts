/** คืนเศษในช่วง [0, divisor) แม้ค่าตั้งต้นติดลบ */
export function modulo(value: number, divisor: number): number {
  const remainder = value % divisor
  return remainder < 0 ? remainder + divisor : remainder === 0 ? 0 : remainder
}

/** Integer-node table interpolation: scale before dividing, then floor once. */
export function interpolateTableFloor(arc: number, step: number, table: readonly number[], scale: number): number {
  const index = Math.floor(arc / step)
  if (index >= table.length - 1) return table[table.length - 1] * scale
  // Keep the numerator integral; dividing first can turn an exact integer into n - epsilon.
  // The classical callers supply whole arcminutes and small, safe-integer table values.
  const numerator = table[index] * step + (arc - index * step) * (table[index + 1] - table[index])
  return Math.floor(numerator * scale / step)
}

/** Whole solar units for validated civil minutes, preserving the original truncation stage. */
export function solarIntradayUnits(timeMinutes: number): number {
  // 800 units/day: m * 800/1440 = m * 5/9; keep the numerator integral.
  return Math.floor(timeMinutes * 5 / 9)
}

/** Mean lunar apogee in arcminutes; day index 0..3231, civil minutes 0..1439. */
export function meanLunarApogeeArcMinutes(dayIndex: number, timeMinutes: number): number {
  // 21600/1440 = 15. Numerator < 70 million: no intermediate fractional day.
  // The inherited 3232-day cycle and +2′ term are described in Eade, Appendix A.
  return Math.floor((dayIndex * 1440 + timeMinutes) * 15 / 3232) + 2
}

export const SIGN_RULERS = [3, 6, 4, 2, 1, 4, 6, 3, 5, 7, 8, 5] as const
export const SIGN_DURATIONS = [120, 96, 72, 120, 144, 168, 168, 144, 120, 72, 96, 120] as const
export const PLANET_KEYS = ["sun", "moon", "mars", "mercury", "jupiter", "venus", "saturn", "rahu", "ketu", "uranus"] as const
export const PLANET_NUMBERS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 0] as const
export const SIGN_NAMES = ["เมษ", "พฤษภ", "เมถุน", "กรกฎ", "สิงห์", "กันย์", "ตุลย์", "พิจิก", "ธนู", "มังกร", "กุมภ์", "มีน"] as const
