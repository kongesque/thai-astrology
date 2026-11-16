import { calculateHoroscopeTransits, calculateThaiHoroscope, HoroscopeInputError, validateHoroscopeInput } from "./horoscope"
import type { HoroscopeTransitResult, ThaiHoroscope } from "./horoscope"
import { searchThaiAstrologyLocations } from "./engine/astro/location-search"
import { BirthplaceResolutionError, resolveHoroscopeBirthplace } from "./birthplace"
import { getThaiAstrologySchemas } from "./schemas"
import type { AstrologyJsonSchema, AstrologyToolSchemas } from "./schemas"
import type { AstrologyToolError, AstrologyToolInputs, AstrologyToolName, AstrologyToolOutputs, AstrologyToolResult, HoroscopeSection, SelectedHoroscope } from "./tool-types"
export type { AstrologyToolError, AstrologyToolInputs, AstrologyToolName, AstrologyToolOutputs, AstrologyToolResult, HoroscopeSection, SelectedHoroscope, SelectedHoroscopeTransits } from "./tool-types"

export interface AstrologyToolDefinition extends AstrologyToolSchemas {
  name: AstrologyToolName
  description: string
}

const descriptions: Record<AstrologyToolName, string> = {
  search_locations: "Search the offline birthplace catalog within an ISO countryCode. Returns location IDs, coordinates and IANA zones, with total and pagination. Query accepts English or Thai labels. Pass the selected ID with an explicit civil date/time to resolve_birthplace to prepare horoscope input.",
  resolve_birthplace: "Resolve a catalog locationId or precise coordinates with an explicit Gregorian civil date, BE/CE era and local time into ready-to-calculate horoscope input. Resolves dated IANA offsets including DST in CE 1900–2100. Repeated times require earlier/later disambiguation; nonexistent times fail. Edited coordinates require an explicit IANA zone or civil offset. Uses minute sunrise and the +06:42:04 planetary reference frame by default; both settings are reported and selectable. Explicit offsets bypass IANA and require whole-second precision. Pass data.input to validation or horoscope tools. Resolution does not guarantee sunrise exists.",
  validate_horoscope_input: "Validate an untrusted horoscope input and inspect normalized references or field issues before calculation. Supply a Gregorian civil date, explicit BE/CE era and local hour/minute. Validation success does not guarantee sunrise exists at the selected coordinates.",
  calculate_horoscope: "Calculate a Suriyayatra horoscope from a Gregorian civil date, BE/CE era and local time. Thai province codes such as TH-50 select dated civil offsets and sunrise automatically in CE 1900–2100. Foreign coordinates require explicit sunrise and clock settings. Returns longitudes in degrees/arcminutes, zero-based signs, houses 1–12, Thai labels and resolved references. Do not guess missing birth times. Optional sections selects result sections; profile, normalized input and schemaVersion are always retained. Omit sections for the full chart; use [] for metadata only.",
  calculate_transits: "Compare explicit natal and transit civil inputs using Suriyayatra. Each input follows calculate_horoscope conventions. Returns both full horoscopes, natal houses occupied by transiting points and signed longitude differences in degrees. Supply the transit date/time explicitly; no current clock is used. Optional sections selects the same sections in natal and transit charts; metadata and comparison are always retained. Omit sections for full charts.",
}
const schemas = getThaiAstrologySchemas()

/** Fresh definitions, suitable for translation to a provider's tool format. */
export function getThaiAstrologyTools(): AstrologyToolDefinition[] {
  const copies = getThaiAstrologySchemas()
  return (Object.keys(descriptions) as AstrologyToolName[]).map(name => ({ name, description: descriptions[name], ...copies[name] }))
}

const record = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null && !Array.isArray(value)

// Only the JSON Schema vocabulary emitted by our development-time generator is needed here.
function matches(value: unknown, schema: AstrologyJsonSchema, root: AstrologyJsonSchema, path: string): string | undefined {
  if (typeof schema.$ref === "string") {
    const definitions = root.$defs as Record<string, AstrologyJsonSchema>
    return matches(value, definitions[schema.$ref.slice("#/$defs/".length)], root, path)
  }
  if (schema.not) return `${path}: value is not allowed`
  if (Array.isArray(schema.anyOf)) {
    return schema.anyOf.some(branch => matches(value, branch, root, path) === undefined) ? undefined : `${path}: value does not match an allowed shape or value`
  }
  if (Object.prototype.hasOwnProperty.call(schema, "const") && value !== schema.const) return `${path}: expected ${JSON.stringify(schema.const)}`
  if (schema.type === "null" && value !== null) return `${path}: expected null`
  if (schema.type === "string" && typeof value !== "string") return `${path}: expected a string`
  if (schema.type === "boolean" && typeof value !== "boolean") return `${path}: expected a boolean`
  if (schema.type === "number" && (typeof value !== "number" || !Number.isFinite(value))) return `${path}: expected a finite number`
  if (schema.type === "array") {
    if (!Array.isArray(value)) return `${path}: expected an array`
    if (typeof schema.minItems === "number" && value.length < schema.minItems || typeof schema.maxItems === "number" && value.length > schema.maxItems) return `${path}: incorrect array length`
    for (let index = 0; index < value.length; index++) {
      const child = Array.isArray(schema.prefixItems) ? schema.prefixItems[index] : schema.items
      if (child) {
        const issue = matches(value[index], child as AstrologyJsonSchema, root, `${path}.${index}`)
        if (issue) return issue
      }
    }
  }
  if (schema.type === "object") {
    if (!record(value)) return `${path}: expected an object`
    const properties = schema.properties as Record<string, AstrologyJsonSchema>
    for (const key of schema.required as string[] ?? []) if (!Object.prototype.hasOwnProperty.call(value, key)) return `${path}.${key}: required`
    for (const key of Object.keys(value)) {
      if (!Object.prototype.hasOwnProperty.call(properties, key)) return `${path}.${key}: unknown field`
      const issue = matches(value[key], properties[key], root, `${path}.${key}`)
      if (issue) return issue
    }
  }
  return undefined
}

const failure = (code: AstrologyToolError["code"], message: string, issues?: AstrologyToolError["issues"]): AstrologyToolResult<never> => ({
  schemaVersion: "1.0", ok: false, error: { code, message, ...(issues ? { issues } : {}) },
})

function selectSections(chart: ThaiHoroscope, sections?: HoroscopeSection[]): SelectedHoroscope {
  if (sections === undefined) return chart
  const selected: SelectedHoroscope = { schemaVersion: chart.schemaVersion, profile: chart.profile, input: chart.input }
  for (const section of sections) Object.assign(selected, { [section]: chart[section] })
  return selected
}

// Known calls without a selection preserve the full-result TypeScript contract.
export function executeThaiAstrologyTool(name: "calculate_horoscope", args: { input?: unknown; sections?: undefined }): AstrologyToolResult<ThaiHoroscope>
export function executeThaiAstrologyTool(name: "calculate_transits", args: { natal?: unknown; transit?: unknown; sections?: undefined }): AstrologyToolResult<HoroscopeTransitResult>
export function executeThaiAstrologyTool<K extends AstrologyToolName>(name: K, args: unknown): AstrologyToolResult<AstrologyToolOutputs[K]>
export function executeThaiAstrologyTool(name: string, args: unknown): AstrologyToolResult
export function executeThaiAstrologyTool(name: string, args: unknown): AstrologyToolResult {
  if (!Object.prototype.hasOwnProperty.call(descriptions, name)) return failure("UNKNOWN_TOOL", "Unknown astrology tool")
  const key = name as AstrologyToolName
  const schema = schemas[key].inputSchema
  const issue = matches(args, schema, schema, "arguments")
  if (issue) return failure("INVALID_ARGUMENTS", issue)
  try {
    let data: AstrologyToolOutputs[AstrologyToolName]
    switch (key) {
      case "search_locations": data = searchThaiAstrologyLocations(args as AstrologyToolInputs["search_locations"]); break
      case "resolve_birthplace": data = resolveHoroscopeBirthplace(args as AstrologyToolInputs["resolve_birthplace"]); break
      case "validate_horoscope_input": data = validateHoroscopeInput((args as AstrologyToolInputs["validate_horoscope_input"]).input); break
      case "calculate_horoscope": {
        const { input, sections } = args as AstrologyToolInputs["calculate_horoscope"]
        data = selectSections(calculateThaiHoroscope(input), sections)
        break
      }
      case "calculate_transits": {
        const { natal, transit, sections } = args as AstrologyToolInputs["calculate_transits"]
        // Prefix both inputs' issues so a caller can repair the correct civil fields.
        const issues = ([ ["natal", natal], ["transit", transit] ] as const).flatMap(([prefix, input]) => {
          const validation = validateHoroscopeInput(input)
          return validation.valid ? [] : validation.issues.map(item => ({ ...item, field: `${prefix}.${item.field}` }))
        })
        if (issues.length) return failure("INVALID_INPUT", "Invalid natal or transit input", issues)
        const result = calculateHoroscopeTransits(natal, transit)
        data = sections === undefined ? result : { natal: selectSections(result.natal, sections), transit: selectSections(result.transit, sections), comparison: result.comparison }
        break
      }
    }
    return { schemaVersion: "1.0", ok: true, data }
  } catch (error) {
    if (error instanceof BirthplaceResolutionError) return failure(error.code, error.message, error.issues)
    if (error instanceof HoroscopeInputError) return failure("INVALID_INPUT", error.message, error.issues)
    if (error instanceof RangeError) return failure(key === "search_locations" ? "INVALID_ARGUMENTS" : "CALCULATION_ERROR", error.message)
    // Programming errors must remain visible to the host application's error handling.
    throw error
  }
}
