import type { CalculationInput, CalculationResult, PlanetPositions } from "../astro-calculation"
import { civilJulianDay, normalizeCalculationInput, resolvePlanetaryTime } from "./input"
import { interpolateTableFloor, meanLunarApogeeArcMinutes, modulo, PLANET_KEYS, PLANET_NUMBERS, SIGN_DURATIONS, SIGN_NAMES, SIGN_RULERS, solarIntradayUnits, thaloengSokReference } from "./math"
import { planetDignities } from "./dignities"
import { subdivisionLabels } from "./divisions"
import { calculateThaiLunarDate } from "./lunar-calendar"
import type { ThaiLunarDate } from "./lunar-calendar"
import { calculateSunrise } from "./sunrise"
import type { SunriseResult } from "./sunrise"

export type { ThaiLunarDate } from "./lunar-calendar"

export type PlanetKey = typeof PLANET_KEYS[number]
export type ChartPoint = keyof PlanetPositions

export interface DetailedPosition {
  /** Longitude from Aries in arcminutes, normalized to [0, 21600). */
  longitudeArcMinutes: number
  longitudeDegrees: number
  /** Zero-based zodiac sign: Aries = 0. */
  sign: number
  signName: string
  degrees: number
  /** Arcminutes within the degree. The ascendant can have fractional minutes. */
  minutes: number
  /** Whole-sign house, 1..12, relative to the ascendant. */
  house: number
  navamsaSign: number
  navamsaRuler: number
  navamsaSection: number
  navamsaName: string
  navamsaQuality: string | null
  drekkanaSign: number
  drekkanaRuler: number
  drekkanaSection: number
  drekkanaName: string
  drekkanaQuality: string | null
  /** นักษัตรเริ่มที่ index 0 */
  nakshatraIndex: number
  nakshatraQuarter: number
  nakshatraMinutes: number
  nakshatraName: string
  nakshatraQuarterName: string
  nakshatraQuality: string
  rerk: string
  /** ดาวมาตรฐานตาม profile นี้ ลัคนาและมฤตยูไม่มีป้ายมาตรฐาน */
  dignities: string[]
}

export interface SignRelationships {
  sign: number
  ruler: number
  conjunction: number[]
  opposition: number[]
  trines: [number[], number[]]
  squares: [number[], number[], number[]]
  sextiles: [number[], number[]]
  /** เลขดาวจากความสัมพันธ์ราศี ตัดเลขซ้ำและให้ผลเดิมเมื่อ input เดิม */
  numberCandidates: number[]
}

export interface DetailedCalculationResult extends CalculationResult {
  method: "suriyayatra"
  longitudes: Record<ChartPoint, DetailedPosition>
  calendar: {
    julianDayNumber: number
    horakhun: number
    chulaSakarat: number
    /** 1 = Sunday, ..., 7 = Saturday. */
    civilWeekday: number
    /** ใช้เลขวันแบบเดียวกัน แต่เปลี่ยนวันทางโหราศาสตร์ที่ 06:00 */
    astrologicalWeekday: number
    /** Geometric lunar phase; distinct from the Thai calendar's intercalation tables. */
    lunarPhase: "waxing" | "waning"
    lunarDay: number
    elongationDegrees: number
    /** คืน null เมื่ออยู่นอกช่วงปฏิทินที่รองรับ: พ.ศ. 2125..2619 */
    thaiLunarDate: ThaiLunarDate | null
  }
  ascendant: {
    method: "anto-birth-sun"
    localTimeCorrectionMinutes: number
    referenceTimeMinutes: number
    signStartTimesMinutes: number[]
    /** Present only when coordinate sunrise is explicitly selected. */
    sunrise?: SunriseResult & { status: "rise" }
  }
  relationships: SignRelationships[]
  divisionalCharts: {
    navamsa: { positions: PlanetPositions; channelOutputs: string[] }
    drekkana: { positions: PlanetPositions; channelOutputs: string[] }
  }
  tanusethDetails: {
    firstLord: number
    firstLordSign: number
    firstDistance: number
    secondLord: number
    secondLordSign: number
    secondDistance: number
  }
  /** ทักษาเปลี่ยนวันตอน 06:00 โดยไม่สลับพุธกลางคืนเป็นราหู */
  taksa: {
    method: "weekday-0600"
    boriwan: number
    ayu: number
    det: number
    si: number
    mula: number
    utsaha: number
    montri: number
    kalakini: number
    center: number
  }
  diagnostics: {
    meanSunArcMinutes: number
    meanRaviArcMinutes: number
    planetaryEpochArcMinutes: number
    solarCycleUnits: number
    /** Present only for an explicitly selected planetary clock; calendar/timing stay civil. */
    planetaryTime?: { horakhun: number; secondOfDay: number; dayOffset: number; civilUtcOffsetSeconds: number; referenceUtcOffsetSeconds: number }
  }
}

const SHADOW_TABLE = [0, 244, 427, 488]
const SUN_TABLE = [0, 35, 67, 94, 116, 129, 134]
const MOON_TABLE = [0, 77, 148, 209, 256, 286, 296]

function interpolate(arc: number, step: number, table: readonly number[]): number {
  const index = Math.floor(arc / step)
  if (index >= table.length - 1) return table[table.length - 1]
  return table[index] + (arc / step - index) * (table[index + 1] - table[index])
}

function quadrant(anomaly: number): { arc: number; coArc: number; direction: number; coDirection: number } {
  const a = modulo(anomaly, 21600)
  const q = Math.floor(a / 5400)
  const arc = [a, 10800 - a, a - 10800, 21600 - a][q]
  return { arc, coArc: 5400 - arc, direction: q < 2 ? -1 : 1, coDirection: q === 0 || q === 3 ? 1 : -1 }
}

function luminary(mean: number, anomaly: number, table: readonly number[]): number {
  const q = quadrant(anomaly)
  return modulo(mean + Math.floor(interpolate(q.arc, 900, table)) * q.direction, 21600)
}

interface PlanetModel {
  mean: number
  primaryBase: number
  anomalyOffset: number
  denominator: number
  scale?: number
  fixed?: number
}

// ปัดลงหรือตัดเศษในแต่ละขั้นตามหน่วยที่ใช้ อย่ารวมไปปัดเฉพาะผลสุดท้าย
function correctedPlanet(model: PlanetModel, meanRavi: number): number {
  const primary = quadrant(model.primaryBase - model.anomalyOffset)
  const primaryNumerator = interpolateTableFloor(primary.arc, 1800, SHADOW_TABLE, 60)
  const coCorrection = Math.floor(interpolate(primary.coArc, 1800, SHADOW_TABLE) + 0.5)
  const denominator = model.denominator + Math.floor(coCorrection / 2) * primary.coDirection
  const first = model.primaryBase + Math.floor(primaryNumerator * 60 / denominator) * primary.direction
  const secondary = quadrant(modulo(first, 21600) - (model.fixed === undefined ? meanRavi : model.mean))
  const secondaryNumerator = interpolateTableFloor(secondary.arc, 1800, SHADOW_TABLE, 60)
  const sineCorrection = Math.floor(Math.floor(secondaryNumerator / 60 + 0.5) / 3)
  const scaledDenominator = model.fixed ?? Math.floor(denominator * (model.scale as number))
  const secondaryCoCorrection = Math.floor(interpolate(secondary.coArc, 1800, SHADOW_TABLE) + 0.5)
  const divisor = sineCorrection + scaledDenominator + secondaryCoCorrection * secondary.coDirection
  if (denominator <= 0 || divisor <= 0) throw new RangeError("Invalid planetary correction denominator")
  return modulo(first + Math.floor(secondaryNumerator * 60 / divisor) * secondary.direction, 21600)
}

/** แยกลองจิจูดเป็นราศี ภพ นวางค์ ตรียางค์ และนักษัตร */
export function describeLongitude(longitudeArcMinutes: number, ascendantSign = 0): DetailedPosition {
  if (!Number.isFinite(longitudeArcMinutes)) throw new RangeError("Longitude must be finite")
  if (!Number.isInteger(ascendantSign) || ascendantSign < 0 || ascendantSign > 11) throw new RangeError("Ascendant sign must be between 0 and 11")
  const rawArc = modulo(longitudeArcMinutes, 21600)
  // Remove binary arithmetic noise at exact integer arcminutes without rounding displayed minutes.
  const nearestInteger = Math.round(rawArc)
  const arc = Math.abs(rawArc - nearestInteger) < 1e-9 ? modulo(nearestInteger, 21600) : rawArc
  const sign = Math.floor(arc / 1800)
  const withinSign = modulo(arc, 1800)
  const degrees = Math.floor(withinSign / 60)
  const navamsaSign = Math.floor(arc / 200) % 12
  const drekkanaSign = (sign + Math.floor(withinSign / 600) * 4) % 12
  const nakshatraIndex = Math.floor(arc / 800)
  const labels = subdivisionLabels(arc)
  return {
    longitudeArcMinutes: arc,
    longitudeDegrees: arc / 60,
    sign,
    signName: SIGN_NAMES[sign],
    degrees,
    minutes: withinSign - degrees * 60,
    house: modulo(sign - ascendantSign, 12) + 1,
    navamsaSign,
    navamsaRuler: SIGN_RULERS[navamsaSign],
    navamsaSection: Math.floor(withinSign / 200) + 1,
    navamsaName: labels.navamsaName,
    navamsaQuality: labels.navamsaQuality,
    drekkanaSign,
    drekkanaRuler: SIGN_RULERS[drekkanaSign],
    drekkanaSection: Math.floor(withinSign / 600) + 1,
    drekkanaName: labels.drekkanaName,
    drekkanaQuality: labels.drekkanaQuality,
    nakshatraIndex,
    nakshatraQuarter: Math.floor(modulo(arc, 800) / 200) + 1,
    nakshatraMinutes: Math.floor(modulo(arc, 800) * 60 / 800),
    nakshatraName: labels.nakshatraName,
    nakshatraQuarterName: labels.nakshatraQuarterName,
    nakshatraQuality: labels.nakshatraQuality,
    rerk: labels.rerk,
    dignities: [],
  }
}

function chartChannels(positions: PlanetPositions, tanuseth: number): string[] {
  const channels: string[] = Array(12).fill("")
  channels[positions.ascendant] = "ลั"
  const symbols = ["๑", "๒", "๓", "๔", "๕", "๖", "๗", "๘", "๙", "๐"]
  PLANET_KEYS.forEach((key, index) => {
    channels[positions[key]] += symbols[index] + (index < 7 && tanuseth === index + 1 ? "*" : "")
  })
  return channels
}

export function calculateSignRelationships(positions: PlanetPositions): SignRelationships[] {
  const occupants: number[][] = Array.from({ length: 12 }, () => [])
  for (const [index, key] of PLANET_KEYS.entries()) {
    const sign = positions[key]
    if (!Number.isInteger(sign) || sign < 0 || sign > 11) throw new RangeError(`Invalid sign for ${key}`)
    occupants[sign].push(PLANET_NUMBERS[index])
  }
  return occupants.map((conjunction, sign) => {
    const at = (offset: number): number[] => [...occupants[(sign + offset) % 12]]
    const opposition = at(6)
    const trines: [number[], number[]] = [at(4), at(8)]
    const squares: [number[], number[], number[]] = [at(3), at(6), at(9)]
    const sextiles: [number[], number[]] = [at(2), at(10)]
    const candidates = [...conjunction, ...(conjunction.length ? [] : [SIGN_RULERS[sign]]), ...opposition]
    if (trines.every(group => group.length)) candidates.push(...conjunction, ...trines.flat())
    if (squares.every(group => group.length)) candidates.push(...conjunction, ...squares.flat())
    candidates.push(...sextiles.flat())
    return { sign, ruler: SIGN_RULERS[sign], conjunction: [...conjunction], opposition, trines, squares, sextiles, numberCandidates: [...new Set(candidates)] }
  })
}

function ascendantLongitude(sun: number, timeMinutes: number, correction: number, sunriseTime?: number): { longitude: number; starts: number[] } {
  const sunSign = Math.floor(sun / 1800)
  const elapsedSun = SIGN_DURATIONS.slice(0, sunSign).reduce((sum: number, duration) => sum + duration, 0)
    + SIGN_DURATIONS[sunSign] * modulo(sun, 1800) / 1800
  const referenceTime = sunriseTime ?? 360 + correction
  // Preserve the original arithmetic order for the traditional correction, including fractions.
  const progression = modulo(sunriseTime === undefined ? elapsedSun + timeMinutes - 360 - correction : elapsedSun + timeMinutes - sunriseTime, 1440)
  let cumulative = 0
  let longitude = 0
  const starts: number[] = []
  for (const [sign, duration] of SIGN_DURATIONS.entries()) {
    starts.push(modulo(referenceTime - elapsedSun + cumulative, 1440))
    if (progression >= cumulative && progression < cumulative + duration) {
      longitude = sign * 1800 + (progression - cumulative) * 1800 / duration
    }
    cumulative += duration
  }
  return { longitude, starts }
}

/** คำนวณสุริยยาตร์ โดยคงหน่วยและจังหวะการปัดค่าของแต่ละขั้น */
export function calculateDetailedPositions(input: CalculationInput): DetailedCalculationResult {
  const normalized = normalizeCalculationInput(input)
  const { day, month, yearCe, yearBe, hour, minute, localTimeCorrectionMinutes } = normalized
  const sunrise = normalized.ascendantReference
    ? calculateSunrise({ yearCe, month, day, ...normalized.ascendantReference }) : undefined
  if (sunrise?.status === "no-rise") throw new RangeError("No sunrise on the requested civil date; use the traditional ascendant reference")
  // Published minute tables are a distinct time convention, not a more precise event model.
  // Keep the raw event and the omitted-option calculation intact; see https://aa.usno.navy.mil/data/RS_OneYear.
  const referenceTime = sunrise?.status === "rise"
    ? normalized.ascendantReference?.timePrecision === "minute" ? sunrise.roundedTimeMinutes : sunrise.timeMinutes
    : 360 + localTimeCorrectionMinutes
  const julianDayNumber = civilJulianDay(yearCe, month, day)
  // ใช้วันสากลเป็นฐาน เพื่อไม่ให้ timezone ของเครื่องเปลี่ยนวันคำนวณ
  const horakhun = julianDayNumber - 1954167
  const hours = hour + minute / 60
  const timeMinutes = hour * 60 + minute
  const planetaryTime = normalized.planetaryTimeReference ? resolvePlanetaryTime(normalized, horakhun) : undefined
  const shiftedTime = normalized.planetaryTimeReference?.civilUtcOffsetSeconds !== normalized.planetaryTimeReference?.referenceUtcOffsetSeconds ? planetaryTime : undefined
  const planetaryHorakhun = planetaryTime?.horakhun ?? horakhun
  const cs = yearBe - 1181
  const thaloeng = thaloengSokReference(cs)
  const civilSeconds = timeMinutes * 60
  const planetarySeconds = planetaryTime?.secondOfDay ?? civilSeconds
  // Exact seconds preserve the existing inclusive boundary for both civil and planetary clocks.
  const chulaSakarat = horakhun < thaloeng.horakhun || (horakhun === thaloeng.horakhun && civilSeconds <= thaloeng.fractionalDaySeconds) ? cs - 1 : cs
  const planetaryChulaSakarat = planetaryHorakhun < thaloeng.horakhun || (planetaryHorakhun === thaloeng.horakhun && planetarySeconds <= thaloeng.fractionalDaySeconds) ? cs - 1 : cs
  // Explicit frame uses integral seconds; the omitted-option path preserves published arithmetic.
  const solarUnits = shiftedTime ? Math.floor(shiftedTime.secondOfDay * 800 / 86400) : solarIntradayUnits(timeMinutes)
  const solarCycleUnits = modulo((planetaryHorakhun - 1) * 800 + solarUnits - 373, 292207)
  // Add birth-time units to the day's reduced base before staged longitude division.
  // The 292207-unit year and 12 * 24350-unit sign scale differ by seven units;
  // reducing the sum by the year period would change the intraday division phase.
  // Source convention and its limits: https://thanan4astro.blogspot.com/2015/02/blog-post_11.html.
  const solarLongitudeUnits = modulo((planetaryHorakhun - 1) * 800 - 373, 292207) + solarUnits
  const remainder = modulo(solarLongitudeUnits, 24350)
  const meanSun = modulo(Math.trunc(solarLongitudeUnits / 24350) * 1800 + Math.trunc(remainder / 811) * 60 + Math.trunc(modulo(remainder, 811) / 14) - 3, 21600)
  const meanRavi = modulo(meanSun - 23, 21600)
  const epoch = (planetaryChulaSakarat - (solarCycleUnits >= 364 ? 610 : 611)) * 21600 + meanRavi
  const sun = luminary(meanSun, meanSun - 4800, SUN_TABLE)
  const lunarUnits = shiftedTime ? Math.floor(shiftedTime.secondOfDay * 703 / 86400) : Math.trunc(hours * 703 / 24)
  const lunarCycle = modulo((planetaryHorakhun - 1) * 703 + 650 + lunarUnits, 20760)
  const meanMoon = modulo(Math.floor(lunarCycle / 692) * 720 + Math.trunc(1.04 * modulo(lunarCycle, 692)) - 40 + meanSun, 21600)
  const apogeeDayIndex = modulo(planetaryHorakhun - 1 - 621, 3232)
  const lunarAnomaly = shiftedTime ? Math.floor((apogeeDayIndex * 86400 + shiftedTime.secondOfDay) / 12928) + 2 : meanLunarApogeeArcMinutes(apogeeDayIndex, timeMinutes)
  const moon = luminary(meanMoon, meanMoon - lunarAnomaly, MOON_TABLE)
  const marsMean = modulo(Math.trunc(epoch / 2) + Math.floor(epoch * 16 / 505) + 5420, 21600)
  const mercuryMean = modulo(Math.trunc(epoch * 7 / 46) + Math.floor(epoch * 4) + 10642, 21600)
  const jupiterMean = modulo(Math.trunc(epoch / 12) + Math.floor(epoch / 1032) + 14297, 21600)
  const venusMean = modulo(Math.trunc(epoch * 5 / 3) - Math.floor(epoch * 10 / 243) + 10944, 21600)
  const saturnMean = modulo(Math.trunc(epoch / 30) + Math.floor(epoch * 6 / 10000) + 11944, 21600)
  const uranusMean = modulo(Math.trunc(epoch / 84) + Math.floor(epoch / 7224) + 16277, 21600)
  const asc = ascendantLongitude(sun, hours * 60, localTimeCorrectionMinutes, sunrise?.status === "rise" ? referenceTime : undefined)
  const arcs: Record<ChartPoint, number> = {
    ascendant: asc.longitude,
    sun,
    moon,
    mars: correctedPlanet({ mean: marsMean, primaryBase: marsMean, anomalyOffset: 7620, denominator: 2700, scale: 4 / 15 }, meanRavi),
    mercury: correctedPlanet({ mean: mercuryMean, primaryBase: meanRavi, anomalyOffset: 13200, denominator: 6000, fixed: 1260 }, meanRavi),
    jupiter: correctedPlanet({ mean: jupiterMean, primaryBase: jupiterMean, anomalyOffset: 10320, denominator: 5520, scale: 3 / 7 }, meanRavi),
    venus: correctedPlanet({ mean: venusMean, primaryBase: meanRavi, anomalyOffset: 4800, denominator: 19200, fixed: 660 }, meanRavi),
    saturn: correctedPlanet({ mean: saturnMean, primaryBase: saturnMean, anomalyOffset: 14820, denominator: 3780, scale: 7 / 6 }, meanRavi),
    uranus: correctedPlanet({ mean: uranusMean, primaryBase: uranusMean, anomalyOffset: 7440, denominator: 38640, scale: 3 / 7 }, meanRavi),
    rahu: modulo(15150 - modulo(Math.trunc(epoch / 20) + Math.floor(epoch / 265), 21600), 21600),
    // Thai Ketu has its own 679-day cycle; it is not Rahu + 180 degrees.
    ketu: modulo(21600 - (shiftedTime ? Math.floor((modulo(planetaryHorakhun - 1 - 344, 679) * 86400 + shiftedTime.secondOfDay) / 2716) : Math.trunc((modulo(horakhun - 1 - 344, 679) + hours / 24) * 21600 / 679)), 21600),
  }
  // Use the same boundary normalization for houses, rulers and the displayed ascendant.
  const ascSign = describeLongitude(asc.longitude).sign
  const longitudes = {} as Record<ChartPoint, DetailedPosition>
  const positions = {} as PlanetPositions
  for (const key of Object.keys(arcs) as ChartPoint[]) {
    longitudes[key] = describeLongitude(arcs[key], ascSign)
    positions[key] = longitudes[key].sign
    if (key !== "ascendant") longitudes[key].dignities = planetDignities(key, positions[key])
  }
  const firstLord = PLANET_KEYS[SIGN_RULERS[ascSign] - 1]
  const firstSign = positions[firstLord]
  const secondLord = PLANET_KEYS[SIGN_RULERS[firstSign] - 1]
  const firstDistance = modulo(firstSign - ascSign, 12) + 1
  const secondDistance = modulo(positions[secondLord] - firstSign, 12) + 1
  const tanuseth = modulo(firstDistance * secondDistance, 7) || 7
  const channelOutputs = chartChannels(positions, tanuseth)
  const navamsa = {} as PlanetPositions
  const drekkana = {} as PlanetPositions
  for (const key of Object.keys(longitudes) as ChartPoint[]) {
    navamsa[key] = longitudes[key].navamsaSign
    drekkana[key] = longitudes[key].drekkanaSign
  }
  const elongation = modulo(moon - sun, 21600)
  const lunarDay = Math.floor(elongation / 720) + 1
  const astrologicalWeekday = modulo(horakhun - (hour < 6 ? 1 : 0), 7) || 7
  const taksaCycle = [1, 2, 3, 4, 7, 5, 8, 6]
  const taksaStart = taksaCycle.indexOf(astrologicalWeekday)
  const taksaPlanet = (offset: number): number => taksaCycle[(taksaStart + offset) % 8]
  return {
    method: "suriyayatra", positions, tanuseth, channelOutputs,
    sunPosition: [longitudes.sun.degrees, longitudes.sun.minutes],
    longitudes,
    calendar: {
      julianDayNumber, horakhun, chulaSakarat,
      civilWeekday: modulo(horakhun, 7) || 7,
      astrologicalWeekday,
      lunarPhase: lunarDay <= 15 ? "waxing" : "waning",
      lunarDay: lunarDay <= 15 ? lunarDay : lunarDay - 15,
      elongationDegrees: elongation / 60,
      thaiLunarDate: calculateThaiLunarDate(horakhun, chulaSakarat, yearBe),
    },
    ascendant: { method: "anto-birth-sun", localTimeCorrectionMinutes, referenceTimeMinutes: modulo(referenceTime, 1440), signStartTimesMinutes: asc.starts, ...(sunrise?.status === "rise" ? { sunrise } : {}) },
    relationships: calculateSignRelationships(positions),
    divisionalCharts: { navamsa: { positions: navamsa, channelOutputs: chartChannels(navamsa, tanuseth) }, drekkana: { positions: drekkana, channelOutputs: chartChannels(drekkana, tanuseth) } },
    tanusethDetails: { firstLord: SIGN_RULERS[ascSign], firstLordSign: firstSign, firstDistance, secondLord: SIGN_RULERS[firstSign], secondLordSign: positions[secondLord], secondDistance },
    taksa: { method: "weekday-0600", boriwan: taksaPlanet(0), ayu: taksaPlanet(1), det: taksaPlanet(2), si: taksaPlanet(3), mula: taksaPlanet(4), utsaha: taksaPlanet(5), montri: taksaPlanet(6), kalakini: taksaPlanet(7), center: 9 },
    diagnostics: { meanSunArcMinutes: meanSun, meanRaviArcMinutes: meanRavi, planetaryEpochArcMinutes: epoch, solarCycleUnits, ...(planetaryTime && normalized.planetaryTimeReference ? { planetaryTime: { ...planetaryTime, ...normalized.planetaryTimeReference } } : {}) },
  }
}

export interface TransitCalculationResult {
  natal: DetailedCalculationResult
  transit: DetailedCalculationResult
  /** Transit locations in natal whole-sign houses and signed shortest motion since birth. */
  comparison: Record<PlanetKey, { natalHouse: number; longitudeDifferenceDegrees: number }>
}

/** ดวงกำเนิดและดวงจรใช้วันเวลาของตัวเอง ไม่อิงเวลาปัจจุบันของเครื่อง */
export function calculateTransits(natalInput: CalculationInput, transitInput: CalculationInput): TransitCalculationResult {
  const natal = calculateDetailedPositions(natalInput)
  const transit = calculateDetailedPositions(transitInput)
  const comparison = {} as TransitCalculationResult["comparison"]
  for (const key of PLANET_KEYS) {
    comparison[key] = {
      natalHouse: modulo(transit.positions[key] - natal.positions.ascendant, 12) + 1,
      longitudeDifferenceDegrees: (modulo(transit.longitudes[key].longitudeArcMinutes - natal.longitudes[key].longitudeArcMinutes + 10800, 21600) - 10800) / 60,
    }
  }
  return { natal, transit, comparison }
}
