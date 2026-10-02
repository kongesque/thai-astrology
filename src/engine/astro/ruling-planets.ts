export const PLANET_NAME_MAP: Record<string, string> = {
  "1": "ดาวอาทิตย์",
  "2": "ดาวจันทร์",
  "3": "ดาวอังคาร",
  "4": "ดาวพุธ",
  "5": "ดาวพฤหัสบดี",
  "6": "ดาวศุกร์",
  "7": "ดาวเสาร์",
  "8": "ดาวราหู",
  "9": "ดาวเกตุ",
  "0": "ดาวมฤตยู",
};

export type RulingPlanetInfo = {
  numbers: string[];
  names: string[];
};

const ASCENDANT_PATTERN = /ลั/;

const isAscendantToken = (value: unknown): value is string =>
  typeof value === "string" && ASCENDANT_PATTERN.test(value);

const THAI_TO_ARABIC_DIGIT_MAP: Record<string, string> = {
  "๐": "0",
  "๑": "1",
  "๒": "2",
  "๓": "3",
  "๔": "4",
  "๕": "5",
  "๖": "6",
  "๗": "7",
  "๘": "8",
  "๙": "9",
};

const normalizeDigits = (value: string): string =>
  value.replace(/[๐-๙]/g, (digit) => THAI_TO_ARABIC_DIGIT_MAP[digit] ?? digit);

const extractAscendantEntry = (chart: unknown[]): { token: string; index: number } => {
  const index = chart.findIndex(isAscendantToken);

  if (index === -1) {
    throw new Error("Unable to locate ascendant information in chart");
  }

  const token = chart[index];

  if (typeof token !== "string") {
    throw new Error("Ascendant token is not a string");
  }

  return { token, index };
};

const extractRulingNumbers = (token: string): string[] => {
  const normalized = normalizeDigits(token);
  const matches = normalized.match(/\d/g) ?? [];
  const uniqueNumbers = Array.from(new Set(matches));

  if (uniqueNumbers.length === 0) {
    throw new Error("No ruling planets found in ascendant token");
  }

  return uniqueNumbers;
};

export const findRulingPlanets = (chart: unknown): RulingPlanetInfo => {
  if (!Array.isArray(chart)) {
    throw new Error("Chart must be an array");
  }

  const { token: ascendantToken } = extractAscendantEntry(chart);

  const numbers = extractRulingNumbers(ascendantToken);
  const names = numbers
    .map((digit) => PLANET_NAME_MAP[digit])
    .filter((name): name is string => Boolean(name));

  if (names.length === 0) {
    throw new Error("Unable to map ruling planet numbers to names");
  }

  return { numbers, names };
};

export const formatRulingPlanets = ({ names, numbers }: RulingPlanetInfo) =>
  names.map((name, index) => `${name} (${numbers[index] ?? "?"})`).join(" และ ");
