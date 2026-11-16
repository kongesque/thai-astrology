import { HoroscopeInputError, validateHoroscopeInput } from "./horoscope"
import type { HoroscopeInput, HoroscopeInputIssue } from "./horoscope"
import { createSunriseReferenceForLocation, getCatalogLocation } from "./engine/astro/location-search"
import type { LocationSunriseSelection } from "./engine/astro/location-search"
import { resolveCivilTimeOffset } from "./engine/astro/civil-time"
import type { CivilTimeDisambiguation } from "./engine/astro/civil-time"

export interface BirthplaceResolutionInput {
  date: HoroscopeInput["date"]
  time: HoroscopeInput["time"]
  location: Pick<LocationSunriseSelection, "locationId" | "countryCode" | "latitude" | "longitude" | "timeZone" | "utcOffsetHours">
  /** Repeated civil times require an explicit earlier/later choice; default reject. */
  disambiguation?: CivilTimeDisambiguation
  /** Planetary calculation frame, in seconds east of UTC. Default +06:42:04. */
  referenceUtcOffsetSeconds?: number
  /** Default minute, matching the structured horoscope's automatic sunrise precision. */
  timePrecision?: "minute" | "continuous"
}

export interface ResolvedBirthplace {
  /** Ready to pass to calculateThaiHoroscope or the calculate_horoscope tool. */
  input: HoroscopeInput
  location: {
    locationId?: string
    countryCode?: string
    nameEnglish?: string
    nameThai?: string
    latitude: number
    longitude: number
    timeZone?: string
    coordinateKind: "city" | "province-seat" | "coordinates"
  }
  civilTime: {
    source: "iana" | "explicit-offset"
    utcOffsetSeconds: number
    /** Null when an explicit offset bypassed IANA resolution. */
    ambiguous: boolean | null
    disambiguation?: CivilTimeDisambiguation
    utcEpochMilliseconds?: number
  }
}

export class BirthplaceResolutionError extends RangeError {
  readonly code: "INVALID_BIRTHPLACE" | "AMBIGUOUS_CIVIL_TIME"
  readonly issues: HoroscopeInputIssue[]
  constructor(code: BirthplaceResolutionError["code"], issues: HoroscopeInputIssue[]) {
    super(issues.map(issue => `${issue.field}: ${issue.message}`).join("; "))
    this.name = "BirthplaceResolutionError"
    this.code = code
    this.issues = issues
  }
}

const invalid = (field: string, message: string): never => {
  throw new BirthplaceResolutionError("INVALID_BIRTHPLACE", [{ field, code: "range", message }])
}

/** Resolve a birthplace and dated clock without guessing coordinates, DST or civil time. */
export function resolveHoroscopeBirthplace(input: BirthplaceResolutionInput): ResolvedBirthplace {
  if (typeof input !== "object" || input === null || Array.isArray(input)) return invalid("input", "Expected an object")
  const validation = validateHoroscopeInput({ date: input.date, time: input.time, referenceMode: "traditional" })
  if (!validation.valid) throw new HoroscopeInputError(validation.issues)
  const { yearCe, month, day } = validation.value.date
  if (yearCe < 1900 || yearCe > 2100) return invalid("date.year", "Birthplace sunrise and dated offsets support CE 1900..2100")
  if (typeof input.location !== "object" || input.location === null || Array.isArray(input.location)) return invalid("location", "Select a locationId or supply coordinates")
  const selection = input.location
  const manual = selection.utcOffsetHours !== undefined
  let reference
  try {
    // Validate catalog identity, country and coordinates before consulting timezone rules.
    reference = createSunriseReferenceForLocation({ ...selection, utcOffsetHours: manual ? selection.utcOffsetHours : 0, timePrecision: input.timePrecision ?? "minute" })
  } catch (error) {
    if (error instanceof RangeError || error instanceof TypeError) return invalid("location", error.message)
    throw error
  }
  const catalog = selection.locationId === undefined ? undefined : getCatalogLocation(selection.locationId)
  const precise = selection.latitude !== undefined || selection.longitude !== undefined
  const timeZone = selection.timeZone ?? (precise ? undefined : catalog?.timeZone)
  const civilTime: ResolvedBirthplace["civilTime"] = { source: "explicit-offset", utcOffsetSeconds: 0, ambiguous: null }
  if (!manual) {
    if (!timeZone) return invalid("location.timeZone", "Precise coordinates require an explicit IANA timeZone or utcOffsetHours; no geographic timezone lookup is performed")
    const choice = input.disambiguation ?? "reject"
    let resolved
    try {
      resolved = resolveCivilTimeOffset({ yearCe, month, day, hour: validation.value.time.hour, minute: validation.value.time.minute }, timeZone, choice === "reject" ? "earlier" : choice)
    } catch (error) {
      if (error instanceof RangeError) return invalid("location", error.message)
      throw error
    }
    if (choice === "reject" && resolved.ambiguous) {
      throw new BirthplaceResolutionError("AMBIGUOUS_CIVIL_TIME", [{ field: "disambiguation", code: "required", message: "Civil time occurs twice; choose earlier or later, or supply an explicit utcOffsetHours" }])
    }
    reference.utcOffsetHours = resolved.utcOffsetHours
    Object.assign(civilTime, { source: "iana", ambiguous: resolved.ambiguous, disambiguation: choice, utcEpochMilliseconds: resolved.utcEpochMilliseconds })
  } else if (input.disambiguation !== undefined) {
    return invalid("disambiguation", "An explicit utcOffsetHours already selects the civil offset; omit disambiguation")
  }
  const seconds = reference.utcOffsetHours * 3600
  civilTime.utcOffsetSeconds = Math.round(seconds)
  if (Math.abs(seconds - civilTime.utcOffsetSeconds) > 1e-7) return invalid("location.utcOffsetHours", "The civil UTC offset must resolve to whole seconds")
  const result: HoroscopeInput = {
    date: { year: input.date.year, era: input.date.era, month, day }, time: { hour: validation.value.time.hour, minute: validation.value.time.minute },
    ...(!precise && catalog?.provinceCode ? { location: { province: catalog.provinceCode } } : {}),
    ascendantReference: { ...reference, utcOffsetHours: civilTime.utcOffsetSeconds / 3600 },
    planetaryTimeReference: { civilUtcOffsetSeconds: civilTime.utcOffsetSeconds, referenceUtcOffsetSeconds: input.referenceUtcOffsetSeconds ?? 24124 },
  }
  const ready = validateHoroscopeInput(result)
  if (!ready.valid) throw new HoroscopeInputError(ready.issues)
  const countryCode = selection.countryCode ?? catalog?.countryCode
  return {
    input: result,
    location: {
      ...(catalog ? { locationId: catalog.id, nameEnglish: catalog.nameEnglish, ...(catalog.nameThai ? { nameThai: catalog.nameThai } : {}) } : {}),
      ...(countryCode ? { countryCode } : {}),
      latitude: reference.latitude, longitude: reference.longitude,
      ...(timeZone ? { timeZone } : {}),
      coordinateKind: precise ? "coordinates" : catalog?.coordinateKind ?? "coordinates",
    },
    civilTime,
  }
}
