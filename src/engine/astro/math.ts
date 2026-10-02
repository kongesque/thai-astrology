/** คืนเศษในช่วง [0, divisor) แม้ค่าตั้งต้นติดลบ */
export function modulo(value: number, divisor: number): number {
  const remainder = value % divisor
  return remainder < 0 ? remainder + divisor : remainder === 0 ? 0 : remainder
}

export const SIGN_RULERS = [3, 6, 4, 2, 1, 4, 6, 3, 5, 7, 8, 5] as const
export const SIGN_DURATIONS = [120, 96, 72, 120, 144, 168, 168, 144, 120, 72, 96, 120] as const
export const PLANET_KEYS = ["sun", "moon", "mars", "mercury", "jupiter", "venus", "saturn", "rahu", "ketu", "uranus"] as const
export const PLANET_NUMBERS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 0] as const
export const SIGN_NAMES = ["เมษ", "พฤษภ", "เมถุน", "กรกฎ", "สิงห์", "กันย์", "ตุลย์", "พิจิก", "ธนู", "มังกร", "กุมภ์", "มีน"] as const
