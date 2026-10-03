import { calculateDetailedPositions, calculateTransits } from "./engine/astro/suriyayatra"
import type { ChartPoint, DetailedCalculationResult, DetailedPosition, PlanetKey, TransitCalculationResult } from "./engine/astro/suriyayatra"
import type { CalculationInput, PlanetPositions } from "./engine/astro-calculation"
import { normalizeCalculationInput } from "./engine/astro/input"
import { modulo, PLANET_KEYS, PLANET_NUMBERS, SIGN_NAMES, SIGN_RULERS } from "./engine/astro/math"
import { PROVINCE_TIME_OFFSETS } from "./engine/astro/provinces"

/** Civil Gregorian date, with an explicit year era. No timezone conversion is implied. */
export interface HoroscopeInput {
  date: { year: number; era: "BE" | "CE"; month: number; day: number }
  time: { hour: number; minute: number }
  /** Omit for zero province correction. An explicit correction overrides the province. */
  location?: { province?: string; localTimeCorrectionMinutes?: number }
}

export interface NormalizedHoroscopeInput {
  date: { yearBe: number; yearCe: number; month: number; day: number }
  time: { hour: number; minute: number; convention: "civil-local" }
  location: { province: string; localTimeCorrectionMinutes: number }
}

export interface HoroscopeInputIssue {
  field: string
  code: "required" | "type" | "range" | "unknown"
  message: string
}

export type HoroscopeInputValidation =
  | { valid: true; value: NormalizedHoroscopeInput }
  | { valid: false; issues: HoroscopeInputIssue[] }

export class HoroscopeInputError extends RangeError {
  readonly issues: HoroscopeInputIssue[]
  constructor(issues: HoroscopeInputIssue[]) {
    super(issues.map(issue => `${issue.field}: ${issue.message}`).join("; "))
    this.name = "HoroscopeInputError"
    this.issues = issues
  }
}

const object = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null && !Array.isArray(value)

/** Safe form/API validation: no coercion of strings, no host Date parsing, no thrown input errors. */
export function validateHoroscopeInput(input: unknown): HoroscopeInputValidation {
  const issues: HoroscopeInputIssue[] = []
  const issue = (field: string, code: HoroscopeInputIssue["code"], message: string): void => { issues.push({ field, code, message }) }
  if (!object(input)) return { valid: false, issues: [{ field: "input", code: "type", message: "Expected an object" }] }
  const date = object(input.date) ? input.date : {}
  const time = object(input.time) ? input.time : {}
  const location = object(input.location) ? input.location : {}
  if (!object(input.date)) issue("date", "required", "A civil date is required")
  if (!object(input.time)) issue("time", "required", "A local time is required")
  if (input.location !== undefined && !object(input.location)) issue("location", "type", "Expected an object")
  const integer = (value: unknown, field: string, min: number, max: number): void => {
    if (value === undefined) issue(field, "required", "Required")
    else if (typeof value !== "number" || !Number.isInteger(value)) issue(field, "type", "Expected a finite integer")
    else if (value < min || value > max) issue(field, "range", `Must be between ${min} and ${max}`)
  }
  if (date.era !== "BE" && date.era !== "CE") issue("date.era", "unknown", "Use BE or CE")
  integer(date.year, "date.year", date.era === "BE" ? 544 : 1, date.era === "BE" ? 10542 : 9999)
  integer(date.month, "date.month", 1, 12)
  integer(date.day, "date.day", 1, 31)
  integer(time.hour, "time.hour", 0, 23)
  integer(time.minute, "time.minute", 0, 59)
  if (location.province !== undefined && (typeof location.province !== "string" || !location.province.length)) issue("location.province", "type", "Expected a non-empty Thai province name")
  const correction = location.localTimeCorrectionMinutes
  if (correction !== undefined && (typeof correction !== "number" || !Number.isFinite(correction) || Math.abs(correction) > 1440)) issue("location.localTimeCorrectionMinutes", "range", "Expected finite minutes between -1440 and 1440")
  const province = location.province === undefined ? "ไม่ใช้จังหวัด" : location.province as string
  if (typeof province === "string" && province.length && province !== "ไม่ระบุจังหวัด" && province !== "ไม่ใช้จังหวัด" && !Object.prototype.hasOwnProperty.call(PROVINCE_TIME_OFFSETS, province) && correction === undefined) {
    issue("location.province", "unknown", "Unknown province; provide an explicit local-time correction")
  }
  if (!issues.some(value => value.field === "date" || value.field.startsWith("date."))) {
    try {
      normalizeCalculationInput({
        day: date.day as number, monthTh: date.month as number,
        ...(date.era === "BE" ? { yearBe: date.year as number } : { yearBc: date.year as number }),
        hour: 0, minute: 0, province: "ไม่ใช้จังหวัด",
      })
    } catch (error) {
      issue("date.day", "range", error instanceof Error ? error.message : "Invalid civil date")
    }
  }
  if (issues.length) return { valid: false, issues }
  const typed = input as unknown as HoroscopeInput
  try {
    const normalized = normalizeCalculationInput({
      day: typed.date.day, monthTh: typed.date.month,
      ...(typed.date.era === "BE" ? { yearBe: typed.date.year } : { yearBc: typed.date.year }),
      hour: typed.time.hour, minute: typed.time.minute,
      province, localTimeCorrectionMinutes: correction as number | undefined,
    })
    return { valid: true, value: {
      date: { yearBe: normalized.yearBe, yearCe: normalized.yearCe, month: normalized.month, day: normalized.day },
      time: { hour: normalized.hour, minute: normalized.minute, convention: "civil-local" },
      location: { province, localTimeCorrectionMinutes: normalized.localTimeCorrectionMinutes },
    } }
  } catch (error) {
    return { valid: false, issues: [{ field: "date.day", code: "range", message: error instanceof Error ? error.message : "Invalid civil date" }] }
  }
}

export interface HoroscopePoint extends DetailedPosition {
  key: ChartPoint
  nameThai: string
  /** Thai planet identifier. Uranus = 0; the ascendant has no planet identifier. */
  number: number | null
  ruledHouses: number[]
}

export interface HoroscopeHouse {
  number: number
  nameThai: string
  sign: number
  signNameThai: string
  ruler: { key: PlanetKey; number: number; nameThai: string; house: number }
  occupants: PlanetKey[]
  containsAscendant: boolean
}

export interface HoroscopeChart {
  positions: PlanetPositions
  channels: { arabic: string[]; thai: string[] }
}

export interface ThaiHoroscope {
  schemaVersion: "1.0"
  profile: {
    method: "suriyayatra"
    ascendant: "anto-birth-sun"
    houseSystem: "whole-sign"
    referenceYearRangeCe: [number, number]
    thaiLunarYearRangeBe: [number, number]
  }
  input: NormalizedHoroscopeInput
  points: Record<ChartPoint, HoroscopePoint>
  houses: HoroscopeHouse[]
  charts: { rasi: HoroscopeChart; navamsa: HoroscopeChart; drekkana: HoroscopeChart }
  factors: {
    ascendantRuler: PlanetKey
    tanuseth: { key: PlanetKey; number: number; nameThai: string; calculation: DetailedCalculationResult["tanusethDetails"] }
    /** Planets occupying the ascendant sign; separate from its sign ruler. */
    ascendantOccupants: PlanetKey[]
  }
  calendar: DetailedCalculationResult["calendar"]
  taksa: DetailedCalculationResult["taksa"]
  relationships: DetailedCalculationResult["relationships"]
  timing: DetailedCalculationResult["ascendant"]
  diagnostics: DetailedCalculationResult["diagnostics"]
}

const POINT_NAMES: Record<ChartPoint, string> = {
  ascendant: "ลัคนา", sun: "อาทิตย์", moon: "จันทร์", mars: "อังคาร", mercury: "พุธ", jupiter: "พฤหัสบดี",
  venus: "ศุกร์", saturn: "เสาร์", rahu: "ราหู", ketu: "เกตุ", uranus: "มฤตยู",
}
// เรียงภพจากลัคนา ไม่ใช่เรียงจากราศีเมษ
const HOUSE_NAMES = ["ตนุ", "กดุมภะ", "สหัชชะ", "พันธุ", "ปุตตะ", "อริ", "ปัตนิ", "มรณะ", "ศุภะ", "กัมมะ", "ลาภะ", "วินาศะ"]

function calculationInput(input: NormalizedHoroscopeInput): CalculationInput {
  return { day: input.date.day, monthTh: input.date.month, yearBe: input.date.yearBe, hour: input.time.hour, minute: input.time.minute, ...input.location, method: "suriyayatra" }
}

function requireInput(input: HoroscopeInput): NormalizedHoroscopeInput {
  const validation = validateHoroscopeInput(input)
  if (!validation.valid) throw new HoroscopeInputError(validation.issues)
  return validation.value
}

function chart(positions: PlanetPositions, channels: string[]): HoroscopeChart {
  return { positions, channels: { thai: [...channels], arabic: channels.map(value => value.replace(/[๐-๙]/g, digit => String("๐๑๒๓๔๕๖๗๘๙".indexOf(digit)))) } }
}

function horoscope(input: NormalizedHoroscopeInput, result: DetailedCalculationResult): ThaiHoroscope {
  const ascendantSign = result.positions.ascendant
  const houses: HoroscopeHouse[] = Array.from({ length: 12 }, (_, index) => {
    const sign = modulo(ascendantSign + index, 12)
    const rulerNumber = SIGN_RULERS[sign]
    const key = PLANET_KEYS[rulerNumber - 1]
    return {
      number: index + 1, nameThai: HOUSE_NAMES[index], sign, signNameThai: SIGN_NAMES[sign],
      ruler: { key, number: rulerNumber, nameThai: POINT_NAMES[key], house: result.longitudes[key].house },
      occupants: PLANET_KEYS.filter(planet => result.positions[planet] === sign), containsAscendant: index === 0,
    }
  })
  const points = {} as ThaiHoroscope["points"]
  for (const key of ["ascendant", ...PLANET_KEYS] as ChartPoint[]) {
    const planetIndex = PLANET_KEYS.indexOf(key as PlanetKey)
    points[key] = { ...result.longitudes[key], key, nameThai: POINT_NAMES[key], number: planetIndex < 0 ? null : PLANET_NUMBERS[planetIndex], ruledHouses: houses.filter(house => house.ruler.key === key).map(house => house.number) }
  }
  const tanusethKey = PLANET_KEYS[result.tanuseth - 1]
  return {
    schemaVersion: "1.0",
    profile: { method: "suriyayatra", ascendant: result.ascendant.method, houseSystem: "whole-sign", referenceYearRangeCe: [1900, 2100], thaiLunarYearRangeBe: [2125, 2619] },
    input, points, houses,
    charts: {
      rasi: chart(result.positions, result.channelOutputs),
      navamsa: chart(result.divisionalCharts.navamsa.positions, result.divisionalCharts.navamsa.channelOutputs),
      drekkana: chart(result.divisionalCharts.drekkana.positions, result.divisionalCharts.drekkana.channelOutputs),
    },
    factors: { ascendantRuler: houses[0].ruler.key, tanuseth: { key: tanusethKey, number: result.tanuseth, nameThai: POINT_NAMES[tanusethKey], calculation: result.tanusethDetails }, ascendantOccupants: [...houses[0].occupants] },
    calendar: result.calendar, taksa: result.taksa, relationships: result.relationships, timing: result.ascendant, diagnostics: result.diagnostics,
  }
}

/** JSON-serializable deterministic natal factors for web forms, charts and interpretation rules. */
export function calculateThaiHoroscope(input: HoroscopeInput): ThaiHoroscope {
  const normalized = requireInput(input)
  return horoscope(normalized, calculateDetailedPositions(calculationInput(normalized)))
}

export interface HoroscopeTransitResult {
  natal: ThaiHoroscope
  transit: ThaiHoroscope
  comparison: TransitCalculationResult["comparison"]
}

export function calculateHoroscopeTransits(natalInput: HoroscopeInput, transitInput: HoroscopeInput): HoroscopeTransitResult {
  const natal = requireInput(natalInput)
  const transit = requireInput(transitInput)
  const result = calculateTransits(calculationInput(natal), calculationInput(transit))
  return { natal: horoscope(natal, result.natal), transit: horoscope(transit, result.transit), comparison: result.comparison }
}

/** Fresh records for province dropdowns; callers cannot modify the engine's lookup table. */
export function getThaiAstrologyProvinces(): { province: string; localTimeCorrectionMinutes: number }[] {
  return Object.entries(PROVINCE_TIME_OFFSETS).map(([province, localTimeCorrectionMinutes]) => ({ province, localTimeCorrectionMinutes }))
}
