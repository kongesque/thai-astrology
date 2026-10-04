import { COUNTRIES, PROVINCE_SEATS } from "./location-data"
import { normalizeSunriseReference } from "./input"
import type { SunriseReference } from "./sunrise"

/** A representative provincial-seat point, not a province-wide birthplace. */
export interface ThaiProvinceLocation {
  province: string
  countryCode: "TH"
  latitude: number
  longitude: number
  timeZone: "Asia/Bangkok"
  coordinateKind: "province-seat"
  /** Public GeoNames record, useful for inspecting the selected point. */
  geonameId: number
}

/** Country/territory labels for an optional dropdown; no implied coordinates or offset. */
export interface AstrologyCountry {
  countryCode: string
  nameEnglish: string
}

export interface SunriseReferenceSelection {
  /** Select a Thai provincial seat when precise coordinates are unavailable. */
  province?: string
  /** Optional country/territory label; does not infer a timezone or check borders. */
  countryCode?: string
  /** Supply both coordinates to override a provincial seat, or select a foreign location. */
  latitude?: number
  longitude?: number
  /** Civil offset on the chart date, including DST. Required even for Thailand. */
  utcOffsetHours: number
  timePrecision?: SunriseReference["timePrecision"]
}

/** Fresh province records, suitable for filling editable latitude/longitude fields. */
export function getThaiAstrologyProvinceLocations(): ThaiProvinceLocation[] {
  return PROVINCE_SEATS.map(([province, latitude, longitude, geonameId]) => ({
    province, countryCode: "TH", latitude, longitude, timeZone: "Asia/Bangkok", coordinateKind: "province-seat", geonameId,
  }))
}

/** Fresh country/territory records; selecting a country alone is not a location. */
export function getThaiAstrologyCountries(): AstrologyCountry[] {
  return COUNTRIES.map(([countryCode, nameEnglish]) => ({ countryCode, nameEnglish }))
}

/** Resolve a location into the existing sunrise option; the chart supplies its own date. */
export function createSunriseReference(selection: SunriseReferenceSelection): SunriseReference {
  if (typeof selection !== "object" || selection === null || Array.isArray(selection)) throw new TypeError("Sunrise selection must be an object")
  const { province, countryCode, latitude, longitude, utcOffsetHours, timePrecision } = selection
  if (countryCode !== undefined && (typeof countryCode !== "string" || !COUNTRIES.some(row => row[0] === countryCode))) {
    throw new RangeError("Unknown countryCode; use a code from getThaiAstrologyCountries()")
  }
  const seat = province === undefined ? undefined : PROVINCE_SEATS.find(row => row[0] === province)
  if (province !== undefined && (typeof province !== "string" || !seat)) throw new RangeError("Unknown Thai province")
  if (seat && countryCode !== undefined && countryCode !== "TH") throw new RangeError("A Thai province requires countryCode TH or no countryCode")
  const precise = latitude !== undefined || longitude !== undefined
  if (precise && (latitude === undefined || longitude === undefined)) throw new RangeError("Supply both latitude and longitude")
  if (!precise && !seat) throw new RangeError("Supply a Thai province or both latitude and longitude; a country alone is insufficient")
  return normalizeSunriseReference({
    method: "sunrise",
    latitude: precise ? latitude : seat?.[1],
    longitude: precise ? longitude : seat?.[2],
    utcOffsetHours,
    timePrecision,
  })
}
