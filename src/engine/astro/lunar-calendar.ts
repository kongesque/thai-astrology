import { LUNAR_NEW_YEAR_DAY_OFFSETS, LUNAR_INTERCALATIONS } from "./lunar-year-rules"

export interface ThaiLunarDate {
  /** วันจันทรคติเปลี่ยนที่เที่ยงคืน แยกจากเฟสที่คำนวณด้วยมุมจันทร์–อาทิตย์ */
  dayBoundary: "civil-midnight"
  yearType: "ordinary" | "intercalary-month" | "intercalary-day"
  phase: "waxing" | "waning"
  day: number
  month: number
  secondEighthMonth: boolean
  label: string
}

const thaiDigits = (value: number): string => String(value).replace(/\d/g, n => "๐๑๒๓๔๕๖๗๘๙"[Number(n)])

/** นับวันจากต้นเดือนห้า โดยเพิ่มเดือนหรือวันตามประเภทปี */
export function lunarDateFromOffset(offset: number, intercalation: number): ThaiLunarDate | null {
  if (!Number.isInteger(offset) || offset < 1 || ![0, 1, 2].includes(intercalation)) return null
  const months = [5, 6, 7, 8, ...(intercalation === 1 ? [88] : []), 9, 10, 11, 12, 1, 2, 3, 4, 5, 6]
  let day = offset
  for (const month of months) {
    const length = month === 7 && intercalation === 2 ? 30 : month % 2 ? 29 : 30
    if (day <= length) {
      const lunarDay = day <= 15 ? day : day - 15
      const phase = day <= 15 ? "waxing" : "waning"
      // เดือนแปดหลังมี marker แยก แต่คืนเลขเดือนเป็น 8 เหมือนเดิม
      const labelDay = lunarDay < 10 ? " " + thaiDigits(lunarDay) : thaiDigits(lunarDay)
      const labelMonth = month < 10 ? " " + thaiDigits(month) : thaiDigits(month)
      return { dayBoundary: "civil-midnight", yearType: intercalation === 0 ? "ordinary" : intercalation === 1 ? "intercalary-month" : "intercalary-day", phase, day: lunarDay, month: month === 88 ? 8 : month, secondEighthMonth: month === 88, label: (phase === "waxing" ? "ข" : "ร") + labelDay + "ด" + labelMonth }
    }
    day -= length
  }
  return null
}

export function calculateThaiLunarDate(horakhun: number, chulaSakarat: number, yearBe: number): ThaiLunarDate | null {
  if (yearBe <= 2124 || yearBe >= 2620) return null
  const yearOffset = chulaSakarat - 943
  const newYearDayOffset = LUNAR_NEW_YEAR_DAY_OFFSETS[yearOffset]
  if (newYearDayOffset === undefined) return null
  const thaloengHorakhun = Math.floor((chulaSakarat * 292207 + 373) / 800) + 1
  return lunarDateFromOffset(horakhun - thaloengHorakhun + newYearDayOffset, LUNAR_INTERCALATIONS[yearOffset])
}
