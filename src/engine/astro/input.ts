import type { CalculationInput } from "../astro-calculation"
import { PROVINCE_TIME_OFFSETS } from "./provinces"

export interface NormalizedCalculationInput {
  day: number
  month: number
  yearCe: number
  yearBe: number
  hour: number
  minute: number
  localTimeCorrectionMinutes: number
}

const integerInRange = (value: number, name: string, min: number, max: number): number => {
  if (!Number.isInteger(value) || value < min || value > max) {
    throw new RangeError(`\`${name}\` must be an integer between ${min} and ${max}`)
  }
  return value
}

/** Validate civil Gregorian dates without Date's timezone or year-0..99 coercions. */
export function normalizeCalculationInput(input: CalculationInput, strictProvince = true): NormalizedCalculationInput {
  if (input.yearBe === undefined && input.yearBc === undefined) {
    throw new TypeError("Either `yearBe` or `yearBc` must be provided")
  }
  if (input.yearBe !== undefined) integerInRange(input.yearBe, "yearBe", 544, 10542)
  if (input.method !== undefined && input.method !== "legacy" && input.method !== "suriyayatra") {
    throw new RangeError("Unknown calculation method")
  }
  const yearBe = input.yearBe ?? (input.yearBc as number) + 543
  const yearCe = integerInRange(yearBe - 543, "Gregorian year", 1, 9999)
  if (input.yearBc !== undefined) {
    integerInRange(input.yearBc, "yearBc", 1, 9999)
    if (input.yearBe !== undefined && input.yearBe !== input.yearBc + 543) {
      throw new RangeError("`yearBe` and `yearBc` must describe the same year")
    }
  }
  const month = integerInRange(input.monthTh, "monthTh", 1, 12)
  const leapYear = yearCe % 4 === 0 && (yearCe % 100 !== 0 || yearCe % 400 === 0)
  const daysInMonth = [31, leapYear ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month - 1]
  const day = integerInRange(input.day, "day", 1, daysInMonth)
  const hour = integerInRange(input.hour, "hour", 0, 23)
  const minute = integerInRange(input.minute, "minute", 0, 59)
  if (typeof input.province !== "string" || input.province.length === 0) {
    throw new TypeError("`province` must be a non-empty string")
  }
  const provinceOffset = Object.prototype.hasOwnProperty.call(PROVINCE_TIME_OFFSETS, input.province)
    ? PROVINCE_TIME_OFFSETS[input.province]
    : strictProvince && input.province === "ไม่ใช้จังหวัด" ? 0 : undefined
  const offset = input.localTimeCorrectionMinutes ?? provinceOffset
  if (strictProvince && offset === undefined) {
    throw new RangeError("Unknown province; supply a Thai province or `localTimeCorrectionMinutes`")
  }
  if (offset !== undefined && (!Number.isFinite(offset) || Math.abs(offset) > 1440)) {
    throw new RangeError("`localTimeCorrectionMinutes` must be finite and between -1440 and 1440")
  }
  return { day, month, yearCe, yearBe, hour, minute, localTimeCorrectionMinutes: offset ?? 18 }
}

/** Integer Julian day number for a proleptic Gregorian civil date (no timezone conversion). */
export function civilJulianDay(year: number, month: number, day: number): number {
  const y = month > 2 ? year : year - 1
  const m = month > 2 ? month + 1 : month + 13
  const century = Math.floor(y / 100)
  return Math.floor(y * 365.25) + Math.floor(m * 30.6) + day + 1720997 - century + Math.floor(century / 4)
}
