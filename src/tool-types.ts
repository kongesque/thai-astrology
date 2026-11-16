import type { HoroscopeInput, HoroscopeInputIssue, HoroscopeInputValidation, HoroscopeTransitResult, ThaiHoroscope } from "./horoscope"
import type { AstrologyLocationSearch, AstrologyLocationSearchResult } from "./engine/astro/location-search"
import type { BirthplaceResolutionInput, ResolvedBirthplace } from "./birthplace"

export type HoroscopeSection = "points" | "houses" | "charts" | "factors" | "calendar" | "taksa" | "relationships" | "timing" | "diagnostics"

/** Selected responses always retain the calculation profile and normalized civil inputs. */
export type SelectedHoroscope = Pick<ThaiHoroscope, "schemaVersion" | "profile" | "input"> & Partial<Pick<ThaiHoroscope, HoroscopeSection>>

export interface SelectedHoroscopeTransits {
  natal: SelectedHoroscope
  transit: SelectedHoroscope
  comparison: HoroscopeTransitResult["comparison"]
}

export interface AstrologyToolInputs {
  search_locations: AstrologyLocationSearch
  resolve_birthplace: BirthplaceResolutionInput
  validate_horoscope_input: { input: unknown }
  calculate_horoscope: { input: HoroscopeInput; sections?: HoroscopeSection[] }
  calculate_transits: { natal: HoroscopeInput; transit: HoroscopeInput; sections?: HoroscopeSection[] }
}

export interface AstrologyToolOutputs {
  search_locations: AstrologyLocationSearchResult
  resolve_birthplace: ResolvedBirthplace
  validate_horoscope_input: HoroscopeInputValidation
  calculate_horoscope: SelectedHoroscope
  calculate_transits: SelectedHoroscopeTransits
}

export type AstrologyToolName = keyof AstrologyToolInputs

export interface AstrologyToolError {
  code: "UNKNOWN_TOOL" | "INVALID_ARGUMENTS" | "INVALID_INPUT" | "CALCULATION_ERROR" | "INVALID_BIRTHPLACE" | "AMBIGUOUS_CIVIL_TIME"
  message: string
  issues?: HoroscopeInputIssue[]
}

export type AstrologyToolResult<T = AstrologyToolOutputs[AstrologyToolName]> =
  | { schemaVersion: "1.0"; ok: true; data: T }
  | { schemaVersion: "1.0"; ok: false; error: AstrologyToolError }

/** Concrete aliases keep published schemas aligned with the transport envelope. */
export interface AstrologyToolResults {
  search_locations: AstrologyToolResult<AstrologyToolOutputs["search_locations"]>
  resolve_birthplace: AstrologyToolResult<AstrologyToolOutputs["resolve_birthplace"]>
  validate_horoscope_input: AstrologyToolResult<AstrologyToolOutputs["validate_horoscope_input"]>
  calculate_horoscope: AstrologyToolResult<AstrologyToolOutputs["calculate_horoscope"]>
  calculate_transits: AstrologyToolResult<AstrologyToolOutputs["calculate_transits"]>
}
