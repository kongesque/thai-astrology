import { CITY_LOCATIONS, PROVINCE_SEAT_NAMES } from "./city-data"
import { createSunriseReference, getThaiAstrologyCountries, getThaiAstrologyProvinceLocations } from "./locations"
import { normalizeSunriseReference } from "./input"
import { resolveCivilTimeOffset } from "./civil-time"
import type { CivilDateTime, CivilTimeDisambiguation } from "./civil-time"
import type { SunriseReference } from "./sunrise"

export interface AstrologyLocation {
  id: string
  countryCode: string
  nameEnglish: string
  nameThai?: string
  province?: string
  latitude: number
  longitude: number
  timeZone: string
  coordinateKind: "province-seat" | "city"
  geonameId: number
}

export interface AstrologyLocationSearch {
  countryCode: string
  query?: string
  /** Default 50, maximum 100; use offset to page a country's results. */
  limit?: number
  offset?: number
}

export interface AstrologyLocationSearchResult {
  items: AstrologyLocation[]
  /** Matches before pagination; a country can have no starter-catalog locations. */
  total: number
}

export interface LocationSunriseSelection {
  locationId?: string
  countryCode?: string
  latitude?: number
  longitude?: number
  /** Overrides the selected location's zone; required for edited coordinates in automatic mode. */
  timeZone?: string
  /** An explicit offset takes precedence and bypasses the optional Intl adapter. */
  utcOffsetHours?: number
  /** Required for automatic timezone resolution. */
  civilTime?: CivilDateTime
  disambiguation?: CivilTimeDisambiguation
  timePrecision?: SunriseReference["timePrecision"]
}

const provinceEnglishNames = new Map(PROVINCE_SEAT_NAMES)
const locations: AstrologyLocation[] = [
  ...getThaiAstrologyProvinceLocations().map(row => ({
    id: `geonames:${row.geonameId}`, countryCode: row.countryCode,
    nameEnglish: provinceEnglishNames.get(row.geonameId) ?? row.province, nameThai: row.province, province: row.province,
    latitude: row.latitude, longitude: row.longitude, timeZone: row.timeZone,
    coordinateKind: row.coordinateKind, geonameId: row.geonameId,
  })),
  ...CITY_LOCATIONS.map(([geonameId, countryCode, nameEnglish, latitude, longitude, timeZone]) => ({
    id: `geonames:${geonameId}`, countryCode, nameEnglish, latitude, longitude, timeZone,
    coordinateKind: "city" as const, geonameId,
  })),
]
const byId = new Map(locations.map(row => [row.id, row]))
const countryCodes = new Set(getThaiAstrologyCountries().map(row => row.countryCode))
const searchText = (text: string): string => text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim()

/** Offline country-scoped search, with stable source order and fresh result records. */
export function searchThaiAstrologyLocations(input: AstrologyLocationSearch): AstrologyLocationSearchResult {
  if (typeof input !== "object" || input === null || Array.isArray(input)) throw new TypeError("Location search must be an object")
  if (!countryCodes.has(input.countryCode)) throw new RangeError("Unknown countryCode")
  if (input.query !== undefined && (typeof input.query !== "string" || input.query.length > 200)) throw new RangeError("query must be a string of at most 200 characters")
  const limit = input.limit ?? 50, offset = input.offset ?? 0
  if (!Number.isInteger(limit) || limit < 1 || limit > 100) throw new RangeError("limit must be an integer between 1 and 100")
  if (!Number.isSafeInteger(offset) || offset < 0) throw new RangeError("offset must be a nonnegative safe integer")
  const query = searchText(input.query ?? "")
  const matched = locations.filter(row => row.countryCode === input.countryCode && searchText(`${row.nameEnglish} ${row.nameThai ?? ""}`).includes(query))
  return { items: matched.slice(offset, offset + limit).map(row => ({ ...row })), total: matched.length }
}

/** Resolve an ID, country, precise coordinates and an explicit or date-aware civil offset. */
export function createSunriseReferenceForLocation(input: LocationSunriseSelection): SunriseReference {
  if (typeof input !== "object" || input === null || Array.isArray(input)) throw new TypeError("Location selection must be an object")
  const location = input.locationId === undefined ? undefined : byId.get(input.locationId)
  if (input.locationId !== undefined && !location) throw new RangeError("Unknown locationId")
  if (input.countryCode !== undefined && !countryCodes.has(input.countryCode)) throw new RangeError("Unknown countryCode")
  if (location && input.countryCode !== undefined && location.countryCode !== input.countryCode) throw new RangeError("locationId does not belong to the selected country")
  const precise = input.latitude !== undefined || input.longitude !== undefined
  if (precise && (input.latitude === undefined || input.longitude === undefined)) throw new RangeError("Supply both latitude and longitude")
  if (!precise && !location) throw new RangeError("Select a locationId or supply both coordinates")
  const latitude = precise ? input.latitude : location?.latitude
  const longitude = precise ? input.longitude : location?.longitude
  // Validate coordinates before attempting optional timezone resolution.
  normalizeSunriseReference({ method: "sunrise", latitude, longitude, utcOffsetHours: 0 })
  let utcOffsetHours = input.utcOffsetHours
  if (utcOffsetHours === undefined) {
    if (precise && input.timeZone === undefined) throw new RangeError("Edited coordinates require an explicit timeZone or utcOffsetHours; no geographic timezone lookup is performed")
    const timeZone = input.timeZone ?? location?.timeZone
    if (!timeZone || !input.civilTime) throw new RangeError("Automatic offset requires civilTime and a named timeZone")
    utcOffsetHours = resolveCivilTimeOffset(input.civilTime, timeZone, input.disambiguation).utcOffsetHours
  }
  return createSunriseReference({ latitude, longitude, utcOffsetHours, countryCode: input.countryCode ?? location?.countryCode, timePrecision: input.timePrecision })
}
