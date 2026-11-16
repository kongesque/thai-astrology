import type { HoroscopeInput, HoroscopeInputIssue, HoroscopeInputValidation, HoroscopeTransitResult, ThaiHoroscope } from "./horoscope"
import type { AstrologyLocationSearch, AstrologyLocationSearchResult } from "./engine/astro/location-search"

export interface AstrologyToolInputs {
  search_locations: AstrologyLocationSearch
  validate_horoscope_input: { input: unknown }
  calculate_horoscope: { input: HoroscopeInput }
  calculate_transits: { natal: HoroscopeInput; transit: HoroscopeInput }
}

export interface AstrologyToolOutputs {
  search_locations: AstrologyLocationSearchResult
  validate_horoscope_input: HoroscopeInputValidation
  calculate_horoscope: ThaiHoroscope
  calculate_transits: HoroscopeTransitResult
}

export type AstrologyToolName = keyof AstrologyToolInputs

export interface AstrologyToolError {
  code: "UNKNOWN_TOOL" | "INVALID_ARGUMENTS" | "INVALID_INPUT" | "CALCULATION_ERROR"
  message: string
  issues?: HoroscopeInputIssue[]
}

export type AstrologyToolResult<T = AstrologyToolOutputs[AstrologyToolName]> =
  | { schemaVersion: "1.0"; ok: true; data: T }
  | { schemaVersion: "1.0"; ok: false; error: AstrologyToolError }

/** Concrete aliases keep published schemas aligned with the transport envelope. */
export interface AstrologyToolResults {
  search_locations: AstrologyToolResult<AstrologyToolOutputs["search_locations"]>
  validate_horoscope_input: AstrologyToolResult<AstrologyToolOutputs["validate_horoscope_input"]>
  calculate_horoscope: AstrologyToolResult<AstrologyToolOutputs["calculate_horoscope"]>
  calculate_transits: AstrologyToolResult<AstrologyToolOutputs["calculate_transits"]>
}
