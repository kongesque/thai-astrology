// Thai Astrological Calculations - TypeScript Version

export interface PlanetPositions {
  ascendant: number
  sun: number
  moon: number
  mars: number
  mercury: number
  jupiter: number
  venus: number
  saturn: number
  rahu: number
  ketu: number
  uranus: number
}

export interface CalculationInput {
  day: number
  monthTh: number
  yearBe?: number
  yearBc?: number
  hour: number
  minute: number
  province: string
}

export interface CalculationResult {
  positions: PlanetPositions
  tanuseth: number
  channelOutputs: string[]
  sunPosition: [number, number] // [degrees, minutes]
}

const ensureMonthTh = (monthTh: number): number => {
  if (!Number.isInteger(monthTh) || monthTh < 1 || monthTh > 12) {
    throw new RangeError("`monthTh` must be an integer between 1 and 12")
  }
  return monthTh
}

const ensureInteger = (value: number, label: string): number => {
  if (!Number.isFinite(value) || !Number.isInteger(value)) {
    throw new RangeError(`\`${label}\` must be a finite integer`)
  }
  return value
}

const resolveYearBe = (yearBe?: number, yearBc?: number): number => {
  if (yearBe !== undefined) {
    return ensureInteger(yearBe, "yearBe")
  }

  if (yearBc !== undefined) {
    const normalizedYearBc = ensureInteger(yearBc, "yearBc")
    return normalizedYearBc + 543
  }

  throw new TypeError("Either `yearBe` or `yearBc` must be provided")
}

const QUADRANT_ADJUST_TABLE: Record<number, number> = { 0: 0, 1: 244, 2: 427, 3: 488 }

const PROVINCE_TIME_OFFSETS: Record<string, number> = {
  กระบี่: 24,
  กรุงเทพมหานคร: 18,
  กาญจนบุรี: 22,
  กาฬสินธุ์: 6,
  กำแพงเพชร: 22,
  ขอนแก่น: 9,
  จันทบุรี: 12,
  ฉะเชิงเทรา: 16,
  ชลบุรี: 16,
  ชัยนาท: 19,
  ชัยภูมิ: 12,
  ชุมพร: 23,
  เชียงราย: 21,
  เชียงใหม่: 24,
  ตรัง: 22,
  ตราด: 10,
  ตาก: 23,
  นครนายก: 15,
  นครปฐม: 20,
  นครพนม: 1,
  นครราชสีมา: 12,
  นครศรีธรรมราช: 20,
  นครสวรรค์: 20,
  นนทบุรี: 18,
  นราธิวาส: 13,
  น่าน: 17,
  บึงกาฬ: 5,
  บุรีรัมย์: 8,
  ปทุมธานี: 18,
  ประจวบคีรีขันธ์: 21,
  ปราจีนบุรี: 15,
  ปัตตานี: 15,
  พระนครศรีอยุธยา: 18,
  พะเยา: 20,
  พังงา: 26,
  พัทลุง: 20,
  พิจิตร: 19,
  พิษณุโลก: 19,
  เพชรบุรี: 20,
  เพชรบูรณ์: 15,
  แพร่: 19,
  ภูเก็ต: 27,
  มหาสารคาม: 7,
  มุกดาหาร: 1,
  แม่ฮ่องสอน: 28,
  ยโสธร: 3,
  ยะลา: 15,
  ร้อยเอ็ด: 5,
  ระนอง: 26,
  ระยอง: 15,
  ราชบุรี: 21,
  ลพบุรี: 17,
  ลำปาง: 22,
  ลำพูน: 24,
  เลย: 13,
  ศรีสะเกษ: 3,
  สกลนคร: 3,
  สงขลา: 18,
  สตูล: 20,
  สมุทรปราการ: 18,
  สมุทรสงคราม: 20,
  สมุทรสาคร: 19,
  สระแก้ว: 12,
  สระบุรี: 16,
  สิงห์บุรี: 18,
  สุโขทัย: 21,
  สุพรรณบุรี: 20,
  สุราษฎร์ธานี: 23,
  สุรินทร์: 6,
  หนองคาย: 9,
  หนองบัวลำภู: 10,
  อ่างทอง: 18,
  อำนาจเจริญ: 1,
  อุดรธานี: 9,
  อุตรดิตถ์: 20,
  อุทัยธานี: 20,
  อุบลราชธานี: 1,
}

const SIGN_DURATIONS_MINUTES = [120.0, 96.0, 72.0, 120.0, 144.0, 168.0, 168.0, 144.0, 120.0, 72.0, 96.0, 120.0]

const SIGN_PLANETS: Record<number, string> = {
  1: "อาทิตย์",
  2: "จันทร์",
  3: "อังคาร",
  4: "พุธ",
  5: "พฤหัสบดี",
  6: "ศุกร์",
  7: "เสาร์",
  8: "ราหู",
  9: "เกตุ",
  0: "มฤตยู",
}

const MAP_PLANETS: Record<number, number> = {
  0: 3,
  1: 6,
  2: 4,
  3: 2,
  4: 1,
  5: 4,
  6: 6,
  7: 3,
  8: 5,
  9: 7,
  10: 8,
  11: 5,
}

const PLANET_SYMBOLS: Record<string, [string, number | null]> = {
  ascendant: ["ลั", null],
  sun: ["๑", 1],
  moon: ["๒", 2],
  mars: ["๓", 3],
  mercury: ["๔", 4],
  jupiter: ["๕", 5],
  venus: ["๖", 6],
  saturn: ["๗", 7],
  rahu: ["๘", null],
  ketu: ["๙", null],
  uranus: ["๐", null],
}

interface SolarBaseValues {
  relativeJulianDay: number
  timeOfDayHours: number
  solarCycleBaseMinutes: number
  solarLongitudeCorrected: number
  solarLongitudeMean: number
}

interface PlanetAdjustmentConstants {
  primaryOffsetBaseline: number
  primaryDenominatorBase: number
  secondaryScaleFactor: number
}

// Helper Functions
function wrap21600(value: number): number {
  const modValue = value % 21600
  return modValue >= 0 ? modValue : modValue + 21600
}

function calculateBaseValues(
  monthTh: number,
  yearBe: number,
  day: number,
  hour: number,
  minute: number,
): SolarBaseValues {
  const monthNum = ensureMonthTh(monthTh)
  const yearAd = yearBe - 543

  const julianYear = monthNum > 2 ? yearAd : yearAd - 1
  const julianMonth = monthNum > 2 ? monthNum + 1 : monthNum + 13
  const centuryComponent = Math.floor(julianYear * 0.01)
  const julianDayBase =
    Math.floor(julianYear * 365.25) +
    Math.floor(julianMonth * 30.6) +
    day +
    1720997 -
    centuryComponent +
    Math.floor(centuryComponent * 0.25)

  let julianDayInteger: number
  let fractionalDayBase: number
  if (hour < 12) {
    julianDayInteger = julianDayBase - 1
    fractionalDayBase = hour / 24 - 0.5 + 1.5
  } else {
    julianDayInteger = julianDayBase
    fractionalDayBase = hour / 24 - 0.5
  }

  const fractionalDayOffset = (hour / 60 + minute) / 60 / 60 / 24
  const fractionalJulianDay = fractionalDayBase + fractionalDayOffset
  const julianDay = julianDayInteger + fractionalJulianDay

  const relativeJulianDay = Math.round(julianDay - 1954167.5)
  const timeOfDayHours = hour + minute / 60
  const relativeYearFrom1181 = yearBe - 1181

  const solarCalendarCeiling = Math.ceil((292207 * relativeYearFrom1181 + 373) / 800)

  const solarEquationCorrection =
    relativeYearFrom1181 * 0.25875 +
    Math.trunc(relativeYearFrom1181 / 100 + 0.38) -
    Math.trunc(relativeYearFrom1181 / 4 + 0.5) -
    Math.trunc(relativeYearFrom1181 / 400 + 0.595) -
    5.53375
  const solarCorrectionDays = Math.trunc(solarEquationCorrection)
  const solarCorrectionHours = Math.trunc((solarEquationCorrection - solarCorrectionDays) * 24)
  const solarCorrectionMinutes = Math.trunc(
    ((solarEquationCorrection - solarCorrectionDays) * 24 - solarCorrectionHours) * 60,
  )

  const currentTimeMinutes = hour * 60 + minute / 60
  const solarCorrectionMinutesTotal = solarCorrectionHours * 60 + solarCorrectionMinutes / 60
  const solarCorrectionComparison = currentTimeMinutes > solarCorrectionMinutesTotal ? 1 : 2

  let solarCycleYear: number
  if (
    relativeJulianDay < solarCalendarCeiling ||
    (relativeJulianDay === solarCalendarCeiling && solarCorrectionComparison === 2)
  ) {
    solarCycleYear = relativeYearFrom1181 - 1
  } else {
    solarCycleYear = relativeYearFrom1181
  }

  const solarCyclePosition =
    ((relativeJulianDay - 1) * 800 + Math.trunc((timeOfDayHours * 800) / 24) - 373) % 292207
  const solarCycleRemainder = solarCyclePosition % 24350
  const solarCycleTurns = Math.floor(solarCyclePosition / 24350)
  const solarCycleDegrees = Math.floor(solarCycleRemainder / 811)
  const solarCycleDegreeRemainder = solarCycleRemainder % 811
  const solarCycleMinutes = Math.floor(solarCycleDegreeRemainder / 14) - 3
  const solarMeanLongitudeRaw =
    solarCycleTurns * 1800 + solarCycleDegrees * 60 + solarCycleMinutes

  const solarLongitudeMean = wrap21600(solarMeanLongitudeRaw)
  const solarLongitudeCorrected = wrap21600(solarLongitudeMean - 23)

  const solarCycleBaseOffset = solarCyclePosition >= 364 ? solarCycleYear - 610 : solarCycleYear - 611
  const solarCycleBaseMinutes = solarCycleBaseOffset * 21600 + solarLongitudeCorrected

  return {
    relativeJulianDay,
    timeOfDayHours,
    solarCycleBaseMinutes,
    solarLongitudeCorrected,
    solarLongitudeMean,
  }
}

function describeQuadrant(value: number): {
  quadrantIndex: number
  quadrantArcMinutes: number
  directionMultiplier: number
} {
  const normalizedValue = wrap21600(value)
  const quadrantIndex = Math.floor(normalizedValue / 5400) + 1
  const directionMultiplier = [1, 2].includes(quadrantIndex) ? -1 : 1

  let quadrantArcMinutes: number
  if (quadrantIndex === 1) quadrantArcMinutes = normalizedValue
  else if (quadrantIndex === 2) quadrantArcMinutes = 10800 - normalizedValue
  else if (quadrantIndex === 3) quadrantArcMinutes = normalizedValue - 10800
  else quadrantArcMinutes = 21600 - normalizedValue

  return { quadrantIndex, quadrantArcMinutes, directionMultiplier }
}

function lookupQuadrantAdjustment(quadrantArcMinutes: number): number {
  const baseIndex = Math.floor(quadrantArcMinutes / 1800)
  const lowerValue = QUADRANT_ADJUST_TABLE[baseIndex % 4]
  const upperValue = QUADRANT_ADJUST_TABLE[(baseIndex + 1) % 4]
  const interpolationFactor = quadrantArcMinutes / 1800 - baseIndex
  const interpolated = interpolationFactor * (upperValue - lowerValue) + lowerValue
  return Math.round(interpolated * 60)
}

function getSecondaryAdjustmentParameters(value: number): {
  halfAdjustment: number
  secondaryDirection: number
  interpolatedAdjustment: number
} {
  const normalizedValue = wrap21600(value)
  const quadrantIndex = Math.floor(normalizedValue / 5400) + 1

  let secondaryArcMinutes: number
  if (quadrantIndex === 1) secondaryArcMinutes = 5400 - normalizedValue
  else if (quadrantIndex === 2) secondaryArcMinutes = normalizedValue - 5400
  else if (quadrantIndex === 3) secondaryArcMinutes = 16200 - normalizedValue
  else secondaryArcMinutes = normalizedValue - 16200

  const baseIndex = Math.floor(secondaryArcMinutes / 1800)
  const lowerValue = QUADRANT_ADJUST_TABLE[baseIndex % 4]
  const upperValue = QUADRANT_ADJUST_TABLE[(baseIndex + 1) % 4]
  const interpolationFactor = secondaryArcMinutes / 1800 - baseIndex
  const interpolatedAdjustment = Math.round(interpolationFactor * (upperValue - lowerValue) + lowerValue + 0.5)
  const halfAdjustment = Math.floor(interpolatedAdjustment / 2)
  const secondaryDirection = [1, 4].includes(quadrantIndex) ? 1 : -1

  return { halfAdjustment, secondaryDirection, interpolatedAdjustment }
}

function applyPlanetaryAdjustments(
  initialPos: number,
  baseCalcVal: number,
  constants: PlanetAdjustmentConstants,
): number {
  // First Adjustment Cycle
  const primaryOffset = initialPos - constants.primaryOffsetBaseline
  const { quadrantArcMinutes: primaryQuadrantArc, directionMultiplier: primaryDirection } = describeQuadrant(primaryOffset)
  const primaryTableAdjustment = lookupQuadrantAdjustment(primaryQuadrantArc)
  const {
    halfAdjustment: primaryHalfAdjustment,
    secondaryDirection: primarySecondaryDirection,
  } = getSecondaryAdjustmentParameters(wrap21600(primaryOffset))
  const primaryDenominator =
    constants.primaryDenominatorBase + primaryHalfAdjustment * primarySecondaryDirection
  const primaryAdjustment = primaryDenominator !== 0 ? Math.round((primaryTableAdjustment * 60) / primaryDenominator) : 0
  const positionAfterPrimaryAdjustment = initialPos + primaryAdjustment * primaryDirection

  // Second Adjustment Cycle
  const secondaryOffset = wrap21600(positionAfterPrimaryAdjustment) - baseCalcVal
  const { quadrantArcMinutes: secondaryQuadrantArc, directionMultiplier: secondaryDirection } = describeQuadrant(secondaryOffset)
  const secondaryTableAdjustment = lookupQuadrantAdjustment(secondaryQuadrantArc)
  const roundedSecondaryAdjustment = Math.round(Math.round(secondaryTableAdjustment / 60) / 3)
  const scaledPrimaryDenominator = Math.round(primaryDenominator * constants.secondaryScaleFactor)
  const secondaryNumeratorBase = roundedSecondaryAdjustment + scaledPrimaryDenominator
  const {
    secondaryDirection: interpolationDirection,
    interpolatedAdjustment: secondaryInterpolatedAdjustment,
  } = getSecondaryAdjustmentParameters(wrap21600(secondaryOffset))
  const secondaryDenominator = secondaryNumeratorBase + secondaryInterpolatedAdjustment * interpolationDirection
  const secondaryAdjustment =
    secondaryDenominator !== 0 ? Math.round((secondaryTableAdjustment * 60) / secondaryDenominator) : 0
  const finalPos = wrap21600(positionAfterPrimaryAdjustment) + secondaryAdjustment * secondaryDirection

  return wrap21600(finalPos)
}

function getSignIndex(finalPos: number): number {
  const signIndex = Math.floor(Math.trunc(finalPos / 1800))
  return signIndex === 12 ? 0 : signIndex
}

function calculateSunPrecisePosition(
  monthTh: number,
  yearBe: number,
  day: number,
  hour: number,
  minute: number,
): number {
  const G_VALS_SUN: Record<number, number> = { 0: 0.0, 1: 35.0, 2: 67.0, 3: 94.0, 4: 116.0, 5: 129.0, 6: 134.0 }
  const { solarLongitudeMean } = calculateBaseValues(monthTh, yearBe, day, hour, minute)
  const meanAnomalyRaw = solarLongitudeMean - 4800
  const meanAnomaly = wrap21600(meanAnomalyRaw)
  const quadrantIndex = Math.floor(Math.trunc(meanAnomaly / 5400)) + 1
  const directionMultiplier = [1, 2].includes(quadrantIndex) ? -1 : 1

  let quadrantArcMinutes: number
  if (quadrantIndex === 1) quadrantArcMinutes = meanAnomaly
  else if (quadrantIndex === 2) quadrantArcMinutes = 10800 - meanAnomaly
  else if (quadrantIndex === 3) quadrantArcMinutes = meanAnomaly - 10800
  else quadrantArcMinutes = 21600 - meanAnomaly

  const tableIndexFloor = Math.floor(Math.trunc(quadrantArcMinutes / 900))
  const tableIndexCeil = tableIndexFloor + 1
  const tableValueFloor = G_VALS_SUN[tableIndexFloor] ?? G_VALS_SUN[6]
  const tableValueCeil = G_VALS_SUN[tableIndexCeil] ?? G_VALS_SUN[6]
  const interpolationFactor = quadrantArcMinutes / 900 - tableIndexFloor
  const quadrantAdjustment = Math.floor(
    Math.trunc(interpolationFactor * (tableValueCeil - tableValueFloor) + tableValueFloor),
  )
  const adjustedLongitude = solarLongitudeMean + quadrantAdjustment * directionMultiplier
  const preciseLongitude = wrap21600(adjustedLongitude)

  return preciseLongitude
}

// Planet calculation functions
export function calculateUranus(monthTh: number, yearBe: number, day: number, hour: number, minute: number): number {
  const { solarCycleBaseMinutes, solarLongitudeCorrected } = calculateBaseValues(
    monthTh,
    yearBe,
    day,
    hour,
    minute,
  )
  const primaryCycleComponent = Math.floor(Math.trunc(solarCycleBaseMinutes / 84))
  const secondaryCycleComponent = Math.floor(solarCycleBaseMinutes / 7224)
  const meanLongitude = (primaryCycleComponent + secondaryCycleComponent + 16277) % 21600
  const uranusAdjustmentConstants: PlanetAdjustmentConstants = {
    primaryOffsetBaseline: 7440,
    primaryDenominatorBase: 38640,
    secondaryScaleFactor: 3 / 7,
  }
  const adjustedLongitude = applyPlanetaryAdjustments(meanLongitude, solarLongitudeCorrected, uranusAdjustmentConstants)
  return getSignIndex(adjustedLongitude)
}

export function calculateKetu(monthTh: number, yearBe: number, day: number, hour: number, minute: number): number {
  const { relativeJulianDay, timeOfDayHours } = calculateBaseValues(monthTh, yearBe, day, hour, minute)
  const lunarNodeCycleOffset = (relativeJulianDay - 1 - 344) % 679
  const normalizedCyclePosition = Math.trunc(((lunarNodeCycleOffset + timeOfDayHours / 24) * 21600) / 679)
  const positionWithinCycle = normalizedCyclePosition % 21600
  const finalLongitude = wrap21600(21600 - positionWithinCycle)
  return getSignIndex(finalLongitude)
}

export function calculateRahu(monthTh: number, yearBe: number, day: number, hour: number, minute: number): number {
  const { solarCycleBaseMinutes } = calculateBaseValues(monthTh, yearBe, day, hour, minute)
  const primaryComponent = Math.floor(solarCycleBaseMinutes / 20)
  const secondaryComponent = Math.floor(solarCycleBaseMinutes / 265)
  const meanLongitude = primaryComponent + secondaryComponent
  const wrappedLongitude = meanLongitude % 21600
  const finalLongitude = wrap21600(15150 - wrappedLongitude)
  return getSignIndex(finalLongitude)
}

export function calculateSaturn(monthTh: number, yearBe: number, day: number, hour: number, minute: number): number {
  const { solarCycleBaseMinutes, solarLongitudeCorrected } = calculateBaseValues(
    monthTh,
    yearBe,
    day,
    hour,
    minute,
  )
  const primaryCycleComponent = Math.floor(Math.trunc(solarCycleBaseMinutes / 30))
  const secondaryCycleComponent = Math.floor((solarCycleBaseMinutes * 6) / 10000)
  const meanLongitude = (primaryCycleComponent + secondaryCycleComponent + 11944) % 21600
  const saturnAdjustmentConstants: PlanetAdjustmentConstants = {
    primaryOffsetBaseline: 14820,
    primaryDenominatorBase: 3780,
    secondaryScaleFactor: 7 / 6,
  }
  const adjustedLongitude = applyPlanetaryAdjustments(meanLongitude, solarLongitudeCorrected, saturnAdjustmentConstants)
  return getSignIndex(adjustedLongitude)
}

export function calculateVenus(monthTh: number, yearBe: number, day: number, hour: number, minute: number): number {
  const { solarCycleBaseMinutes, solarLongitudeCorrected } = calculateBaseValues(
    monthTh,
    yearBe,
    day,
    hour,
    minute,
  )
  const primaryCycleComponent = Math.floor(Math.trunc((solarCycleBaseMinutes * 5) / 3))
  const secondaryCycleComponent = Math.floor((solarCycleBaseMinutes * 10) / 243)
  const venusMeanLongitude = (primaryCycleComponent - secondaryCycleComponent + 10944) % 21600
  const primaryOffset = solarLongitudeCorrected - 4800
  const { quadrantArcMinutes: primaryQuadrantArc, directionMultiplier: primaryDirection } = describeQuadrant(primaryOffset)
  const primaryTableAdjustment = lookupQuadrantAdjustment(primaryQuadrantArc)
  const {
    halfAdjustment: primaryHalfAdjustment,
    secondaryDirection: primarySecondaryDirection,
  } = getSecondaryAdjustmentParameters(wrap21600(primaryOffset))
  const primaryDenominator = 19200 + primaryHalfAdjustment * primarySecondaryDirection
  const primaryAdjustment =
    primaryDenominator !== 0 ? Math.round((primaryTableAdjustment * 60) / primaryDenominator) : 0
  const positionAfterPrimaryAdjustment = solarLongitudeCorrected + primaryAdjustment * primaryDirection
  const secondaryOffset = wrap21600(positionAfterPrimaryAdjustment) - venusMeanLongitude
  const { quadrantArcMinutes: secondaryQuadrantArc, directionMultiplier: secondaryDirection } =
    describeQuadrant(secondaryOffset)
  const secondaryTableAdjustment = lookupQuadrantAdjustment(secondaryQuadrantArc)
  const roundedSecondaryAdjustment = Math.round(Math.round(secondaryTableAdjustment / 60) / 3)
  const fixedVenusAdjustment = 60 * 11
  const secondaryNumeratorBase = roundedSecondaryAdjustment + fixedVenusAdjustment
  const {
    secondaryDirection: interpolationDirection,
    interpolatedAdjustment: secondaryInterpolatedAdjustment,
  } = getSecondaryAdjustmentParameters(wrap21600(secondaryOffset))
  const secondaryDenominator = secondaryNumeratorBase + secondaryInterpolatedAdjustment * interpolationDirection
  const secondaryAdjustment =
    secondaryDenominator !== 0 ? Math.round((secondaryTableAdjustment * 60) / secondaryDenominator) : 0
  const finalLongitude = wrap21600(positionAfterPrimaryAdjustment) + secondaryAdjustment * secondaryDirection
  return getSignIndex(wrap21600(finalLongitude))
}

export function calculateJupiter(monthTh: number, yearBe: number, day: number, hour: number, minute: number): number {
  const { solarCycleBaseMinutes, solarLongitudeCorrected } = calculateBaseValues(
    monthTh,
    yearBe,
    day,
    hour,
    minute,
  )
  const primaryCycleComponent = Math.floor(Math.trunc(solarCycleBaseMinutes / 12))
  const secondaryCycleComponent = Math.floor(solarCycleBaseMinutes / 1032)
  const meanLongitude = (primaryCycleComponent + secondaryCycleComponent + 14297) % 21600
  const jupiterAdjustmentConstants: PlanetAdjustmentConstants = {
    primaryOffsetBaseline: 10320,
    primaryDenominatorBase: 5520,
    secondaryScaleFactor: 3 / 7,
  }
  const adjustedLongitude = applyPlanetaryAdjustments(meanLongitude, solarLongitudeCorrected, jupiterAdjustmentConstants)
  return getSignIndex(adjustedLongitude)
}

export function calculateMercury(monthTh: number, yearBe: number, day: number, hour: number, minute: number): number {
  const { solarCycleBaseMinutes, solarLongitudeCorrected } = calculateBaseValues(
    monthTh,
    yearBe,
    day,
    hour,
    minute,
  )
  const primaryCycleComponent = Math.floor(Math.trunc((solarCycleBaseMinutes * 7) / 46))
  const secondaryCycleComponent = Math.floor(solarCycleBaseMinutes * 4)
  const mercuryMeanLongitude = (primaryCycleComponent + secondaryCycleComponent + 10642) % 21600
  const primaryOffset = solarLongitudeCorrected - 13200
  const { quadrantArcMinutes: primaryQuadrantArc, directionMultiplier: primaryDirection } = describeQuadrant(primaryOffset)
  const primaryTableAdjustment = lookupQuadrantAdjustment(primaryQuadrantArc)
  const {
    halfAdjustment: primaryHalfAdjustment,
    secondaryDirection: primarySecondaryDirection,
  } = getSecondaryAdjustmentParameters(wrap21600(primaryOffset))
  const primaryDenominator = 6000 + primaryHalfAdjustment * primarySecondaryDirection
  const primaryAdjustment =
    primaryDenominator !== 0 ? Math.round((primaryTableAdjustment * 60) / primaryDenominator) : 0
  const positionAfterPrimaryAdjustment = solarLongitudeCorrected + primaryAdjustment * primaryDirection
  const secondaryOffset = wrap21600(positionAfterPrimaryAdjustment) - mercuryMeanLongitude
  const { quadrantArcMinutes: secondaryQuadrantArc, directionMultiplier: secondaryDirection } =
    describeQuadrant(secondaryOffset)
  const secondaryTableAdjustment = lookupQuadrantAdjustment(secondaryQuadrantArc)
  const roundedSecondaryAdjustment = Math.round(Math.round(secondaryTableAdjustment / 60) / 3)
  const fixedMercuryAdjustment = 60 * 21
  const secondaryNumeratorBase = roundedSecondaryAdjustment + fixedMercuryAdjustment
  const {
    secondaryDirection: interpolationDirection,
    interpolatedAdjustment: secondaryInterpolatedAdjustment,
  } = getSecondaryAdjustmentParameters(wrap21600(secondaryOffset))
  const secondaryDenominator = secondaryNumeratorBase + secondaryInterpolatedAdjustment * interpolationDirection
  const secondaryAdjustment =
    secondaryDenominator !== 0 ? Math.round((secondaryTableAdjustment * 60) / secondaryDenominator) : 0
  const finalLongitude = wrap21600(positionAfterPrimaryAdjustment) + secondaryAdjustment * secondaryDirection
  return getSignIndex(wrap21600(finalLongitude))
}

export function calculateMars(monthTh: number, yearBe: number, day: number, hour: number, minute: number): number {
  const { solarCycleBaseMinutes, solarLongitudeCorrected } = calculateBaseValues(
    monthTh,
    yearBe,
    day,
    hour,
    minute,
  )
  const primaryCycleComponent = Math.floor(Math.trunc(solarCycleBaseMinutes / 2))
  const secondaryCycleComponent = Math.floor((solarCycleBaseMinutes * 16) / 505)
  const meanLongitude = (primaryCycleComponent + secondaryCycleComponent + 5420) % 21600
  const marsAdjustmentConstants: PlanetAdjustmentConstants = {
    primaryOffsetBaseline: 7620,
    primaryDenominatorBase: 2700,
    secondaryScaleFactor: 4 / 15,
  }
  const adjustedLongitude = applyPlanetaryAdjustments(meanLongitude, solarLongitudeCorrected, marsAdjustmentConstants)
  return getSignIndex(adjustedLongitude)
}

export function calculateMoon(monthTh: number, yearBe: number, day: number, hour: number, minute: number): number {
  const G_VALS_MOON: Record<number, number> = { 0: 0.0, 1: 77.0, 2: 148.0, 3: 209.0, 4: 256.0, 5: 286.0, 6: 296.0 }
  const { relativeJulianDay, timeOfDayHours, solarLongitudeMean } = calculateBaseValues(
    monthTh,
    yearBe,
    day,
    hour,
    minute,
  )
  const lunarMeanCycle =
    ((relativeJulianDay - 1) * 703 + 650 + Math.trunc((timeOfDayHours * 703) / 24)) % 20760
  const meanCycleQuotient = Math.floor(lunarMeanCycle / 692)
  const meanCycleRemainder = lunarMeanCycle % 692
  const meanLongitudeEstimate = meanCycleQuotient * 720 + Math.trunc(1.04 * meanCycleRemainder) - 40 + solarLongitudeMean
  const meanLongitude = wrap21600(meanLongitudeEstimate)
  const anomalyCycle = (relativeJulianDay - 1 - 621) % 3232
  const anomalyLongitude = Math.trunc(((anomalyCycle + timeOfDayHours / 24) / 3232) * 21600) + 2
  const anomalyLongitudeWrapped = wrap21600(anomalyLongitude)
  const longitudeDifferenceRaw = meanLongitude - anomalyLongitudeWrapped
  const longitudeDifference = wrap21600(longitudeDifferenceRaw)
  const quadrantIndex = Math.floor(Math.trunc(longitudeDifference / 5400)) + 1
  const directionMultiplier = [1, 2].includes(quadrantIndex) ? -1 : 1

  let quadrantArcMinutes: number
  if (quadrantIndex === 1) quadrantArcMinutes = longitudeDifference
  else if (quadrantIndex === 2) quadrantArcMinutes = 10800 - longitudeDifference
  else if (quadrantIndex === 3) quadrantArcMinutes = longitudeDifference - 10800
  else quadrantArcMinutes = 21600 - longitudeDifference

  const tableIndexFloor = Math.floor(Math.trunc(quadrantArcMinutes / 900))
  const tableIndexCeil = tableIndexFloor + 1
  const tableValueFloor = G_VALS_MOON[tableIndexFloor] ?? G_VALS_MOON[6]
  const tableValueCeil = G_VALS_MOON[tableIndexCeil] ?? G_VALS_MOON[6]
  const interpolationFactor = quadrantArcMinutes / 900 - tableIndexFloor
  const quadrantAdjustment = Math.floor(
    Math.trunc(interpolationFactor * (tableValueCeil - tableValueFloor) + tableValueFloor),
  )
  const adjustedLongitude = meanLongitude + quadrantAdjustment * directionMultiplier
  const wrappedLongitude = wrap21600(adjustedLongitude)
  const signIndex = Math.floor(wrappedLongitude / 1800)
  const finalSignIndex = signIndex < 12 ? signIndex : 0
  return finalSignIndex
}

export function calculateSun(monthTh: number, yearBe: number, day: number, hour: number, minute: number): number {
  const preciseLongitude = calculateSunPrecisePosition(monthTh, yearBe, day, hour, minute)
  return getSignIndex(preciseLongitude)
}

export function calculateSunDegrees(
  monthTh: number,
  yearBe: number,
  day: number,
  hour: number,
  minute: number,
): number {
  const preciseLongitude = calculateSunPrecisePosition(monthTh, yearBe, day, hour, minute)
  const minutesWithinCurrentSign = preciseLongitude % 1800
  const degreesInSign = Math.trunc(minutesWithinCurrentSign / 60)
  return degreesInSign
}

export function calculateSunMinutes(
  monthTh: number,
  yearBe: number,
  day: number,
  hour: number,
  minute: number,
): number {
  const preciseLongitude = calculateSunPrecisePosition(monthTh, yearBe, day, hour, minute)
  const minutesWithinCurrentSign = preciseLongitude % 1800
  const minutesWithinDegree = Math.trunc(minutesWithinCurrentSign % 60)
  return minutesWithinDegree
}

export function calculateAscendant(
  day: number,
  monthTh: number,
  yearBe: number,
  hour: number,
  minute: number,
  province: string,
): number {
  const sunLongitude = calculateSunPrecisePosition(monthTh, yearBe, day, hour, minute)
  const sunSignIndex = Math.floor(Math.trunc(sunLongitude / 1800))
  const sunMinutesInSign = sunLongitude % 1800
  const sunDegreesWithinSign = Math.trunc(sunMinutesInSign / 60)
  const sunMinutesWithinDegree = Math.trunc(sunMinutesInSign % 60)
  const provinceSunriseOffsetMinutes = PROVINCE_TIME_OFFSETS[province] ?? 18
  const localTimeMinutes = hour * 60 + minute
  const minutesBeforeSunSign = SIGN_DURATIONS_MINUTES.slice(0, sunSignIndex).reduce(
    (sum, duration) => sum + duration,
    0,
  )
  const sunProgressDegrees = sunDegreesWithinSign + sunMinutesWithinDegree / 60
  const sunSignDurationMinutes = SIGN_DURATIONS_MINUTES[sunSignIndex]
  const sunTraversalMinutes =
    sunSignDurationMinutes > 0 ? sunSignDurationMinutes * (sunProgressDegrees / 30) : 0
  const sunTotalProgressionMinutes = minutesBeforeSunSign + sunTraversalMinutes
  const sunriseTimeMinutes = 360 + provinceSunriseOffsetMinutes
  let elapsedSinceSunrise = (localTimeMinutes - sunriseTimeMinutes) % 1440
  if (elapsedSinceSunrise < 0) elapsedSinceSunrise += 1440
  let ascendantMinutesOfDay = (sunTotalProgressionMinutes + elapsedSinceSunrise) % 1440
  if (ascendantMinutesOfDay < 0) ascendantMinutesOfDay += 1440

  let ascendantSignIndex = 0
  let cumulativeMinutes = 0.0
  let degreesWithinAscendantSign = 0.0

  for (let signIndex = 0; signIndex < SIGN_DURATIONS_MINUTES.length; signIndex++) {
    const signDuration = SIGN_DURATIONS_MINUTES[signIndex]
    if (signDuration <= 0) continue

    const startOfSign = cumulativeMinutes
    const endOfSign = cumulativeMinutes + signDuration

    const wrapsAround = startOfSign >= endOfSign
    const isWithinSign = wrapsAround
      ? ascendantMinutesOfDay >= startOfSign || ascendantMinutesOfDay < endOfSign
      : ascendantMinutesOfDay >= startOfSign && ascendantMinutesOfDay < endOfSign

    if (isWithinSign) {
      ascendantSignIndex = signIndex
      let minutesIntoAscendantSign = (ascendantMinutesOfDay - startOfSign) % 1440
      if (minutesIntoAscendantSign < 0) minutesIntoAscendantSign += 1440
      degreesWithinAscendantSign = (minutesIntoAscendantSign * 30) / signDuration
      break
    }

    cumulativeMinutes = endOfSign % 1440
  }

  const ascendantLongitudeMinutes = (ascendantSignIndex * 30 + degreesWithinAscendantSign) * 60
  const ascendantSign = Math.trunc(ascendantLongitudeMinutes / 1800)
  return ascendantSign
}

export function calculateTanuseth(positions: Record<string, number>, ascSign: number): number {
  try {
    const lord1Idx = MAP_PLANETS[ascSign]
    const lord1Name = SIGN_PLANETS[lord1Idx]
    const firstLordSign = positions[lord1Name]

    const lord2Idx = MAP_PLANETS[firstLordSign]
    const lord2Name = SIGN_PLANETS[lord2Idx]
    const secondLordSign = positions[lord2Name]

    const ascendantDistance = ((firstLordSign - ascSign) % 12) + 1
    const secondStepDistance = ((secondLordSign - firstLordSign) % 12) + 1

    const result = (ascendantDistance * secondStepDistance) % 7 || 7
    return result
  } catch {
    return -1
  }
}

export function calculateAllPositions(input: CalculationInput): CalculationResult {
  const { day, monthTh, yearBe, yearBc, hour, minute, province } = input
  const normalizedYearBe = resolveYearBe(yearBe, yearBc)

  const positions: PlanetPositions = {
    ascendant: calculateAscendant(day, monthTh, normalizedYearBe, hour, minute, province),
    sun: calculateSun(monthTh, normalizedYearBe, day, hour, minute),
    moon: calculateMoon(monthTh, normalizedYearBe, day, hour, minute),
    mars: calculateMars(monthTh, normalizedYearBe, day, hour, minute),
    mercury: calculateMercury(monthTh, normalizedYearBe, day, hour, minute),
    jupiter: calculateJupiter(monthTh, normalizedYearBe, day, hour, minute),
    venus: calculateVenus(monthTh, normalizedYearBe, day, hour, minute),
    saturn: calculateSaturn(monthTh, normalizedYearBe, day, hour, minute),
    rahu: calculateRahu(monthTh, normalizedYearBe, day, hour, minute),
    ketu: calculateKetu(monthTh, normalizedYearBe, day, hour, minute),
    uranus: calculateUranus(monthTh, normalizedYearBe, day, hour, minute),
  }

  const planetPositionsForTanuseth = {
    ลัคนา: positions.ascendant,
    อาทิตย์: positions.sun,
    จันทร์: positions.moon,
    อังคาร: positions.mars,
    พุธ: positions.mercury,
    พฤหัสบดี: positions.jupiter,
    ศุกร์: positions.venus,
    เสาร์: positions.saturn,
    ราหู: positions.rahu,
    เกตุ: positions.ketu,
    มฤตยู: positions.uranus,
  }

  const tanuseth = calculateTanuseth(planetPositionsForTanuseth, positions.ascendant)
  const sunDeg = calculateSunDegrees(monthTh, normalizedYearBe, day, hour, minute)
  const sunMin = calculateSunMinutes(monthTh, normalizedYearBe, day, hour, minute)

  // Generate channel outputs
  const outputArray: string[] = new Array(13).fill("")

  if (tanuseth !== -1) {
    for (let ch = 0; ch < 12; ch++) {
      let channelOutput = ""

      // Check each planet for this channel
      Object.entries(positions).forEach(([planetKey, position]) => {
        if (position === ch) {
          const [symbol, tanusethNum] = PLANET_SYMBOLS[planetKey]
          channelOutput += symbol
          if (tanusethNum !== null && tanuseth === tanusethNum) {
            channelOutput += "*"
          }
        }
      })

      outputArray[ch] = channelOutput
    }
  }

  return {
    positions,
    tanuseth,
    channelOutputs: outputArray.slice(0, 12),
    sunPosition: [sunDeg, sunMin],
  }
}
