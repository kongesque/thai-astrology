import type { CalculationInput, CalculationResult } from "./engine/astro-calculation";
import { type RulingPlanetInfo } from "./engine/astro/ruling-planets";
export * from "./engine/astro-calculation";
export * from "./engine/astro/ruling-planets";
export interface ThaiAstrologyChart extends CalculationResult {
    rulingPlanets?: RulingPlanetInfo;
    rulingPlanetsError?: string;
}
type ChannelNumeralSystem = "arabic" | "thai";
export interface FormatChannelOutputsOptions {
    numerals?: ChannelNumeralSystem;
}
export declare const formatChannelOutputs: (chart: Pick<CalculationResult, "channelOutputs">, options?: FormatChannelOutputsOptions | ChannelNumeralSystem) => string[];
export declare const generateThaiAstrologyChart: (input: CalculationInput) => ThaiAstrologyChart;
//# sourceMappingURL=index.d.ts.map