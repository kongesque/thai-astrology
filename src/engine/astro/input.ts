import type { CalculationInput, PlanetaryTimeReference } from "../astro-calculation"
import { PROVINCE_TIME_OFFSETS } from "./provinces"
import type { SunriseReference } from "./sunrise"

export interface NormalizedCalculationInput {
  day: number
  month: number
  yearCe: number
  yearBe: number
  hour: number
  minute: number
  localTimeCorrectionMinutes: number
  ascendantReference?: SunriseReference
  planetaryTimeReference?: PlanetaryTimeReference
}

/** Validate explicit offset seconds without assigning a meridian or selecting a timezone. */
export function normalizePlanetaryTimeReference(value: unknown): PlanetaryTimeReference {
  if (typeof value !== "object" || value === null || Array.isArray(value)) throw new TypeError("`planetaryTimeReference` must be an object")
  const reference = value as Record<string, unknown>
  for (const name of ["civilUtcOffsetSeconds", "referenceUtcOffsetSeconds"] as const) {
    if (typeof reference[name] !== "number" || !Number.isInteger(reference[name]) || Math.abs(reference[name] as number) > 50400) {
      throw new RangeError(`\`planetaryTimeReference.${name}\` must be an integer between -50400 and 50400`)
    }
  }
  return { civilUtcOffsetSeconds: reference.civilUtcOffsetSeconds as number, referenceUtcOffsetSeconds: reference.referenceUtcOffsetSeconds as number }
}

/** Preserve the instant when changing offset frames; seconds and day carry stay integral. */
export function resolvePlanetaryTime(input: NormalizedCalculationInput, civilHorakhun: number): { horakhun: number; secondOfDay: number; dayOffset: number } {
  const reference = input.planetaryTimeReference
  const total = input.hour * 3600 + input.minute * 60 + (reference ? reference.referenceUtcOffsetSeconds - reference.civilUtcOffsetSeconds : 0)
  const dayOffset = Math.floor(total / 86400)
  const horakhun = civilHorakhun + dayOffset
  if (horakhun < civilJulianDay(1, 1, 1) - 1954167 || horakhun > civilJulianDay(9999, 12, 31) - 1954167) {
    throw new RangeError("Planetary reference date must remain within CE 1..9999")
  }
  return { horakhun, secondOfDay: total - dayOffset * 86400, dayOffset }
}

/** Validate an explicit reference without coercing coordinates or guessing a timezone. */
export function normalizeSunriseReference(value: unknown): SunriseReference {
  if (typeof value !== "object" || value === null || Array.isArray(value)) throw new TypeError("`ascendantReference` must be an object")
  const reference = value as Record<string, unknown>
  if (reference.method !== "sunrise") throw new RangeError("`ascendantReference.method` must be sunrise")
  if (reference.timePrecision !== undefined && reference.timePrecision !== "continuous" && reference.timePrecision !== "minute") {
    throw new RangeError("`ascendantReference.timePrecision` must be continuous or minute")
  }
  for (const [name, min, max] of [["latitude", -90, 90], ["longitude", -180, 180], ["utcOffsetHours", -14, 14]] as const) {
    const number = reference[name]
    if (typeof number !== "number" || !Number.isFinite(number) || number < min || number > max) {
      throw new RangeError(`\`ascendantReference.${name}\` must be finite and between ${min} and ${max}`)
    }
  }
  return { method: "sunrise", latitude: reference.latitude as number, longitude: reference.longitude as number, utcOffsetHours: reference.utcOffsetHours as number,
    ...(reference.timePrecision !== undefined ? { timePrecision: reference.timePrecision } : {}) }
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
  const reference = input.ascendantReference === undefined ? undefined : normalizeSunriseReference(input.ascendantReference)
  const planetaryTimeReference = input.planetaryTimeReference === undefined ? undefined : normalizePlanetaryTimeReference(input.planetaryTimeReference)
  if (planetaryTimeReference && (!strictProvince || input.method === "legacy")) throw new RangeError("Planetary time reference requires the suriyayatra method")
  if (reference && planetaryTimeReference && Math.abs(reference.utcOffsetHours * 3600 - planetaryTimeReference.civilUtcOffsetSeconds) > 1e-8) {
    throw new RangeError("Sunrise and planetary time reference must use the same civil UTC offset")
  }
  if (reference && (!strictProvince || input.method === "legacy")) throw new RangeError("Coordinate sunrise requires the suriyayatra method")
  if (reference && (yearCe < 1900 || yearCe > 2100)) throw new RangeError("Coordinate sunrise supports CE 1900..2100")
  if (reference && input.localTimeCorrectionMinutes !== undefined && input.localTimeCorrectionMinutes !== 0) {
    throw new RangeError("Coordinate sunrise already includes longitude and UTC offset; omit localTimeCorrectionMinutes")
  }
  if (typeof input.province !== "string" || input.province.length === 0) {
    throw new TypeError("`province` must be a non-empty string")
  }
  const provinceOffset = Object.prototype.hasOwnProperty.call(PROVINCE_TIME_OFFSETS, input.province)
    ? PROVINCE_TIME_OFFSETS[input.province]
    : strictProvince && (input.province === "ไม่ระบุจังหวัด" || input.province === "ไม่ใช้จังหวัด") ? 0 : undefined
  const offset = reference ? 0 : input.localTimeCorrectionMinutes ?? provinceOffset
  if (strictProvince && offset === undefined) {
    throw new RangeError("Unknown province; supply a Thai province or `localTimeCorrectionMinutes`")
  }
  if (offset !== undefined && (!Number.isFinite(offset) || Math.abs(offset) > 1440)) {
    throw new RangeError("`localTimeCorrectionMinutes` must be finite and between -1440 and 1440")
  }
  const normalized = { day, month, yearCe, yearBe, hour, minute, localTimeCorrectionMinutes: offset ?? 18, ...(reference ? { ascendantReference: reference } : {}), ...(planetaryTimeReference ? { planetaryTimeReference } : {}) }
  if (planetaryTimeReference) resolvePlanetaryTime(normalized, civilJulianDay(yearCe, month, day) - 1954167)
  return normalized
}

/** Integer Julian day number for a proleptic Gregorian civil date (no timezone conversion). */
export function civilJulianDay(year: number, month: number, day: number): number {
  const y = month > 2 ? year : year - 1
  const m = month > 2 ? month + 1 : month + 13
  const century = Math.floor(y / 100)
  return Math.floor(y * 365.25) + Math.floor(m * 30.6) + day + 1720997 - century + Math.floor(century / 4)
}
