import { civilJulianDay, normalizeCalculationInput } from "./input"
import { modulo } from "./math"

export interface SunriseLocation {
  latitude: number
  /** Degrees east of Greenwich; west is negative. */
  longitude: number
  /** Civil hours east of UTC, including any daylight-saving offset. Required. */
  utcOffsetHours: number
}

/** Opt into seasonal sunrise as the reference for the classical ascendant. */
export interface SunriseReference extends SunriseLocation {
  method: "sunrise"
}

export interface SunriseInput extends SunriseLocation {
  yearCe: number
  month: number
  day: number
}

export type SunriseResult = {
  model: "noaa-meeus"
  /** Sea-level upper-limb convention: 16′ solar radius plus 34′ refraction. */
  horizonAltitudeDegrees: number
} & ({
  status: "rise"
  /** Unrounded minutes from the requested local civil midnight, in [0, 1440). */
  timeMinutes: number
  /** Display only: nearest minute, possibly 1440 (24:00). */
  roundedTimeMinutes: number
  /** Numerical solver residual; not a physical accuracy estimate. */
  altitudeResidualDegrees: number
} | { status: "no-rise" })

const RAD = Math.PI / 180
const HORIZON = -50 / 60
const TIME_TOLERANCE = 0.00001 // minutes; numerical precision, not observational accuracy
const sin = (degrees: number): number => Math.sin(degrees * RAD)
const cos = (degrees: number): number => Math.cos(degrees * RAD)

// NOAA's public Meeus implementation, independently checked against the original:
// https://gml.noaa.gov/grad/solcalc/main.js
// UTC approximates UT1 for this minute-scale event model; no classical clock shift.
function solarCoordinates(julianDay: number): { declination: number; equationMinutes: number } {
  const t = (julianDay - 2451545) / 36525
  const meanLongitude = modulo(280.46646 + t * (36000.76983 + 0.0003032 * t), 360)
  const anomaly = 357.52911 + t * (35999.05029 - 0.0001537 * t)
  const eccentricity = 0.016708634 - t * (0.000042037 + 0.0000001267 * t)
  const center = sin(anomaly) * (1.914602 - t * (0.004817 + 0.000014 * t))
    + sin(2 * anomaly) * (0.019993 - 0.000101 * t) + sin(3 * anomaly) * 0.000289
  const omega = 125.04 - 1934.136 * t
  const longitude = meanLongitude + center - 0.00569 - 0.00478 * sin(omega)
  const obliquity = 23 + (26 + (21.448 - t * (46.815 + t * (0.00059 - t * 0.001813))) / 60) / 60 + 0.00256 * cos(omega)
  const declination = Math.asin(sin(obliquity) * sin(longitude)) / RAD
  const y = Math.tan(obliquity * RAD / 2) ** 2
  const equationMinutes = 4 / RAD * (y * sin(2 * meanLongitude) - 2 * eccentricity * sin(anomaly)
    + 4 * eccentricity * y * sin(anomaly) * cos(2 * meanLongitude)
    - 0.5 * y * y * sin(4 * meanLongitude) - 1.25 * eccentricity ** 2 * sin(2 * anomaly))
  return { declination, equationMinutes }
}

// Refine both maxima and minima so a short polar day/night is not lost between samples.
function extremum(altitude: (minutes: number) => number, left: number, right: number, maximum: boolean): number {
  const ratio = (Math.sqrt(5) - 1) / 2
  let a = right - ratio * (right - left)
  let b = left + ratio * (right - left)
  let fa = altitude(a)
  let fb = altitude(b)
  for (let iteration = 0; iteration < 64 && right - left > TIME_TOLERANCE; iteration++) {
    if (maximum ? fa > fb : fa < fb) {
      right = b; b = a; fb = fa
      a = right - ratio * (right - left); fa = altitude(a)
    } else {
      left = a; a = b; fa = fb
      b = left + ratio * (right - left); fb = altitude(b)
    }
  }
  if (right - left > TIME_TOLERANCE) throw new RangeError("Sunrise extremum did not converge")
  return (left + right) / 2
}

/** Earliest rising upper-limb event on a civil date, CE 1900..2100; no host Date or timezone lookup. */
export function calculateSunrise(input: SunriseInput): SunriseResult {
  const normalized = normalizeCalculationInput({
    yearBc: input.yearCe, monthTh: input.month, day: input.day, hour: 0, minute: 0, province: "ไม่ใช้จังหวัด",
    ascendantReference: { method: "sunrise", latitude: input.latitude, longitude: input.longitude, utcOffsetHours: input.utcOffsetHours },
  })
  const location = normalized.ascendantReference as SunriseReference
  const midnightUtc = civilJulianDay(normalized.yearCe, normalized.month, normalized.day) - 0.5 - location.utcOffsetHours / 24
  const altitude = (minutes: number): number => {
    const sun = solarCoordinates(midnightUtc + minutes / 1440)
    const hourAngle = (minutes + sun.equationMinutes + 4 * location.longitude - 60 * location.utcOffsetHours) / 4 - 180
    const sineAltitude = sin(location.latitude) * sin(sun.declination) + cos(location.latitude) * cos(sun.declination) * cos(hourAngle)
    return Math.asin(Math.max(-1, Math.min(1, sineAltitude))) / RAD
  }
  const points: number[] = []
  const samples = Array.from({ length: 99 }, (_, index) => ({ time: (index - 1) * 15, value: altitude((index - 1) * 15) }))
  for (let index = 1; index < samples.length - 1; index++) {
    const [before, at, after] = samples.slice(index - 1, index + 2)
    points.push(at.time)
    const maximum = at.value > before.value && at.value > after.value
    const minimum = at.value < before.value && at.value < after.value
    if (maximum || minimum) {
      const peak = extremum(altitude, before.time, after.time, maximum)
      if (peak > 0 && peak < 1440) points.push(peak)
    }
  }
  points.sort((a, b) => a - b)
  const common = { model: "noaa-meeus" as const, horizonAltitudeDegrees: HORIZON }
  for (let index = 1; index < points.length; index++) {
    let left = points[index - 1]
    let right = points[index]
    const low = altitude(left) - HORIZON
    const high = altitude(right) - HORIZON
    if (low > 0 || high < 0 || high <= low) continue
    for (let iteration = 0; iteration < 48 && right - left > TIME_TOLERANCE; iteration++) {
      const middle = (left + right) / 2
      if (altitude(middle) < HORIZON) left = middle
      else right = middle
    }
    // Use the upper root bound so an event at exactly 24:00 cannot leak into this date.
    const timeMinutes = low === 0 ? points[index - 1] : right
    const residual = altitude(timeMinutes) - HORIZON
    if (right - left > TIME_TOLERANCE || Math.abs(residual) > 0.00001) throw new RangeError("Sunrise root did not converge")
    if (timeMinutes >= 1440 || altitude(timeMinutes + 0.01) <= altitude(timeMinutes - 0.01)) continue
    return { ...common, status: "rise", timeMinutes, roundedTimeMinutes: Math.round(timeMinutes), altitudeResidualDegrees: residual }
  }
  return { ...common, status: "no-rise" }
}
