import type { CalculationInput, CalculationResult } from "./engine/astro-calculation"
import { calculateAllPositions } from "./engine/astro-calculation"
import type { RulingPlanetInfo } from "./engine/astro/ruling-planets"
import { findRulingPlanets } from "./engine/astro/ruling-planets"

export * from "./engine/astro-calculation"
export * from "./engine/astro/ruling-planets"

const THAI_DIGITS = ["๐", "๑", "๒", "๓", "๔", "๕", "๖", "๗", "๘", "๙"] as const

type ThaiDigit = (typeof THAI_DIGITS)[number]

type ChannelNumeralSystem = "arabic" | "thai"

export interface FormatChannelOutputsOptions {
  numerals?: ChannelNumeralSystem
}

const CHANNEL_PREFIX_PATTERN = /^Channel\s+\d+:/i

const stripChannelLabel = (value: string): string => value.replace(CHANNEL_PREFIX_PATTERN, "").trimStart()

const convertDigits = (value: string, system: ChannelNumeralSystem): string => {
  if (system === "thai") {
    return value.replace(/\d/g, (digit) => THAI_DIGITS[Number(digit)] ?? digit)
  }

  return value.replace(/[๐-๙]/g, (digit) => {
    const index = THAI_DIGITS.indexOf(digit as ThaiDigit)
    return index === -1 ? digit : index.toString()
  })
}

export const formatChannelOutputs = (
  chart: Pick<CalculationResult, "channelOutputs">,
  options: FormatChannelOutputsOptions | ChannelNumeralSystem = {},
): string[] => {
  const { numerals = "arabic" } = typeof options === "string" ? { numerals: options } : options
  return chart.channelOutputs.map((token) => convertDigits(stripChannelLabel(token), numerals))
}

export interface ThaiAstrologyChart extends CalculationResult {
  rulingPlanets?: RulingPlanetInfo
  rulingPlanetsError?: string
}

export const generateThaiAstrologyChart = (input: CalculationInput): ThaiAstrologyChart => {
  const result = calculateAllPositions(input)
  try {
    const rulingPlanets = findRulingPlanets(result.channelOutputs)
    return {
      ...result,
      rulingPlanets,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to determine ruling planets"
    return {
      ...result,
      rulingPlanetsError: message,
    }
  }
}
