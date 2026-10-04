import { civilJulianDay, normalizeCalculationInput } from "./input"

export interface CivilDateTime {
  yearCe: number
  month: number
  day: number
  hour: number
  minute: number
}

export type CivilTimeDisambiguation = "reject" | "earlier" | "later"

export interface CivilTimeOffset {
  timeZone: string
  utcOffsetHours: number
  utcEpochMilliseconds: number
  ambiguous: boolean
}

const HOUR_MS = 3600000
const wallMilliseconds = (year: number, month: number, day: number, hour: number, minute: number, second = 0): number =>
  (civilJulianDay(year, month, day) - 2440588) * 86400000 + hour * HOUR_MS + minute * 60000 + second * 1000

/**
 * Optional Intl/IANA adapter. Core calculations retain explicit numeric offsets.
 * Rules come from the runtime's timezone database; no host timezone or current clock is used.
 * https://tc39.es/ecma402/#sec-intl.datetimeformat.prototype.formattoparts
 */
export function resolveCivilTimeOffset(input: CivilDateTime, timeZone: string, disambiguation: CivilTimeDisambiguation = "reject"): CivilTimeOffset {
  if (typeof input !== "object" || input === null || Array.isArray(input)) throw new TypeError("Civil time must be an object")
  normalizeCalculationInput({ yearBc: input.yearCe, monthTh: input.month, day: input.day, hour: input.hour, minute: input.minute, province: "ไม่ใช้จังหวัด" })
  if (input.yearCe < 1900 || input.yearCe > 2100) throw new RangeError("Civil timezone selection supports CE 1900..2100")
  if (!["reject", "earlier", "later"].includes(disambiguation)) throw new RangeError("Use reject, earlier or later for disambiguation")
  if (typeof timeZone !== "string" || !timeZone.length || /^[+-]/.test(timeZone)) throw new RangeError("Supply a named IANA timeZone")
  if (typeof Intl === "undefined" || typeof Intl.DateTimeFormat !== "function") throw new RangeError("Intl timezone support is unavailable; supply utcOffsetHours explicitly")
  let formatter: Intl.DateTimeFormat
  try {
    const options: Intl.DateTimeFormatOptions & { calendar: string; numberingSystem: string; hourCycle: "h23" } = {
      timeZone, calendar: "gregory", numberingSystem: "latn", hourCycle: "h23",
      year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit",
    }
    formatter = new Intl.DateTimeFormat("en-GB", options)
  } catch {
    throw new RangeError("Unsupported IANA timeZone; supply a supported zone or utcOffsetHours explicitly")
  }
  const formattedWall = (utc: number): number => {
    const parts: Record<string, number> = {}
    for (const part of formatter.formatToParts(utc)) if (part.type !== "literal") parts[part.type] = Number(part.value)
    if (!["year", "month", "day", "hour", "minute", "second"].every(key => Number.isInteger(parts[key]))) {
      throw new RangeError("Intl did not provide Gregorian civil-time parts")
    }
    return wallMilliseconds(parts.year, parts.month, parts.day, parts.hour, parts.minute, parts.second)
  }
  const wanted = wallMilliseconds(input.yearCe, input.month, input.day, input.hour, input.minute)
  // Enumerate nearby offset regimes, then verify the inverse mapping exactly.
  // A bounded search fails closed; no nonexistent civil time is shifted into existence.
  const offsets = new Set<number>()
  for (let hour = -48; hour <= 48; hour++) {
    const utc = wanted + hour * HOUR_MS
    offsets.add(formattedWall(utc) - utc)
  }
  const candidates = [...offsets].map(offset => ({ offset, utc: wanted - offset }))
    .filter(candidate => formattedWall(candidate.utc) === wanted).sort((a, b) => a.utc - b.utc)
  if (!candidates.length) throw new RangeError("Civil time does not exist in this timezone (clock gap or skipped date)")
  const ambiguous = candidates.length > 1
  if (ambiguous && disambiguation === "reject") throw new RangeError("Civil time is ambiguous; select earlier or later, or supply utcOffsetHours")
  const selected = disambiguation === "later" ? candidates[candidates.length - 1] : candidates[0]
  const utcOffsetHours = selected.offset / HOUR_MS
  if (Math.abs(utcOffsetHours) > 14) throw new RangeError("Resolved civil offset is outside the supported -14..14 range")
  return { timeZone, utcOffsetHours, utcEpochMilliseconds: selected.utc, ambiguous }
}
