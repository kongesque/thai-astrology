import { PROVINCE_SEATS } from "./location-data"

export interface MeanSolarTimeCorrectionInput {
  /** Longitude in degrees east of Greenwich; west is negative. */
  longitude: number
  /** Civil offset at the input date and time, including DST; fractional hours are allowed. */
  utcOffsetHours: number
}

/**
 * Civil clock minus local mean solar clock, in minutes; positive means the civil clock is ahead.
 * NOAA: true solar time = civil time + equation of time + 4 * longitude - 60 * offset.
 * Removing the equation of time gives the mean-solar relation used here.
 * https://gml.noaa.gov/grad/solcalc/solareqns.PDF
 * No rounding, date wrapping, timezone lookup or seasonal sunrise correction is applied.
 */
export function calculateMeanSolarTimeCorrection(input: MeanSolarTimeCorrectionInput): number {
  if (typeof input !== "object" || input === null || Array.isArray(input)) {
    throw new TypeError("Mean solar correction input must be an object")
  }
  const { longitude, utcOffsetHours } = input
  if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
    throw new RangeError("longitude must be finite and between -180 and 180")
  }
  if (!Number.isFinite(utcOffsetHours) || utcOffsetHours < -14 || utcOffsetHours > 14) {
    throw new RangeError("utcOffsetHours must be finite and between -14 and 14")
  }
  return 60 * utcOffsetHours - 4 * longitude
}

/** Traditional UTC+7 reference convention, rounded to whole minutes; not a dated civil offset. */
export function getProvinceTimeCorrectionMinutes(province: string): number | undefined {
  const seat = PROVINCE_SEATS.find(row => row[0] === province)
  return seat ? Math.round(calculateMeanSolarTimeCorrection({ longitude: seat[2], utcOffsetHours: 7 })) : undefined
}
