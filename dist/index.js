"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateThaiAstrologyChart = exports.formatChannelOutputs = void 0;
const astro_calculation_1 = require("./engine/astro-calculation");
const ruling_planets_1 = require("./engine/astro/ruling-planets");
__exportStar(require("./engine/astro-calculation"), exports);
__exportStar(require("./engine/astro/ruling-planets"), exports);
const THAI_DIGITS = ["๐", "๑", "๒", "๓", "๔", "๕", "๖", "๗", "๘", "๙"];
const CHANNEL_PREFIX_PATTERN = /^Channel\s+\d+:/i;
const stripChannelLabel = (value) => value.replace(CHANNEL_PREFIX_PATTERN, "").trimStart();
const convertDigits = (value, system) => {
    if (system === "thai") {
        return value.replace(/\d/g, (digit) => { var _a; return (_a = THAI_DIGITS[Number(digit)]) !== null && _a !== void 0 ? _a : digit; });
    }
    return value.replace(/[๐-๙]/g, (digit) => {
        const index = THAI_DIGITS.indexOf(digit);
        return index === -1 ? digit : index.toString();
    });
};
const formatChannelOutputs = (chart, options = {}) => {
    const { numerals = "arabic" } = typeof options === "string" ? { numerals: options } : options;
    return chart.channelOutputs.map((token) => convertDigits(stripChannelLabel(token), numerals));
};
exports.formatChannelOutputs = formatChannelOutputs;
const generateThaiAstrologyChart = (input) => {
    const result = (0, astro_calculation_1.calculateAllPositions)(input);
    try {
        const rulingPlanets = (0, ruling_planets_1.findRulingPlanets)(result.channelOutputs);
        return {
            ...result,
            rulingPlanets,
        };
    }
    catch (error) {
        const message = error instanceof Error ? error.message : "Unable to determine ruling planets";
        return {
            ...result,
            rulingPlanetsError: message,
        };
    }
};
exports.generateThaiAstrologyChart = generateThaiAstrologyChart;
//# sourceMappingURL=index.js.map