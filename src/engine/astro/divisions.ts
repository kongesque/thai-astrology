import { modulo } from "./math"

const NAVAMSA_NAMES = ["ปฐมนวางค์","ทุติยนวางค์","ตติยนวางค์","จัตตุถนวางค์","ปัญจมนวางค์","ฉัฏฐมนวางค์","สัตตมนวางค์","อัฏฐมนวางค์","นวมนวางค์"] as const
const DREKKANA_NAMES = ["ปฐมตรียางค์","ทุติยตรียางค์","ตติยตรียางค์"] as const
const MANSION_NAMES = ["อัศวินีนักษัตรที่ ๑","ภรณีนักษัตรที่ ๒","กัตติกานักษัตรที่ ๓","โรหิณีนักษัตรที่ ๔","มฤคศิระนักษัตรที่ ๕","อารทรานักษัตรที่ ๖","ปุนรวสุนักษัตรที่ ๗","ปุษยะนักษัตรที่ ๘","อาศเลษานักษัตรที่ ๙","มาฆะนักษัตรที่ ๑๐","ปุรพผลคุณีนักษัตรที่ ๑๑","อุตรผลคุณีนักษัตรที่ ๑๒","หัสตะนักษัตรที่ ๑๓","จิตรานักษัตรที่ ๑๔","สวาตินักษัตรที่ ๑๕","วิสาขะนักษัตรที่ ๑๖","อนุราธานักษัตรที่ ๑๗","เชษฐะนักษัตรที่ ๑๘","มูละนักษัตรที่ ๑๙","ปุรพาษาฒนักษัตรที่ ๒๐","อุตราษาฒนักษัตรที่ ๒๑","ศรวณะนักษัตรที่ ๒๒","ธนิษฐะนักษัตรที่ ๒๓","ศตภิสัชนักษัตร์ที่ ๒๔","ปุรพภัทรบทนักษัตรที่ ๒๕","อุตรภัทรบทนักษัตรที่ ๒๖","เรวตินักษัตรที่ ๒๗"] as const
const QUARTER_NAMES = ["ปฐมบาท","ทุติยบาท","ตติยบาท","จัตตุถบาท"] as const
const MANSION_QUALITIES = ["บูรณ","บูรณ","ฉินท","บูรณ","ภินท","บูรณ","ฉินท","บูรณ","บูรณ"] as const
const RERK_NAMES = ["ทลิทโทฤกษ์","มหันธโนฤกษ์","โจโรฤกษ์","ภูมิปาโลฤกษ์","เทศาตรีฤกษ์","เทวีฤกษ์","เพชฌฆาฏฤกษ์","ราชาฤกษ์","สมโณฤกษ์"] as const

const DREKKANA_QUALITY_SECTIONS = [0, 1, 2, 2, 1, 0, 1, 2, 0, 2, 1, 0] as const
const DREKKANA_QUALITIES = ["พิษนาค", "พิษครุฑ", "พิษสุนัข"] as const

export function subdivisionLabels(arcMinutes: number) {
  const sign = Math.floor(arcMinutes / 1800)
  const navamsaSection = Math.floor(modulo(arcMinutes, 1800) / 200)
  const drekkanaSection = Math.floor(modulo(arcMinutes, 1800) / 600)
  const mansion = Math.floor(arcMinutes / 800)
  const quarter = Math.floor(modulo(arcMinutes, 800) / 200)
  return {
    navamsaName: NAVAMSA_NAMES[navamsaSection],
    navamsaQuality: Math.floor(arcMinutes / 200) % 12 === sign ? "วรโคตม" : null,
    drekkanaName: DREKKANA_NAMES[drekkanaSection],
    drekkanaQuality: DREKKANA_QUALITY_SECTIONS[sign] === drekkanaSection ? DREKKANA_QUALITIES[drekkanaSection] : null,
    nakshatraName: MANSION_NAMES[mansion],
    nakshatraQuarterName: QUARTER_NAMES[quarter],
    nakshatraQuality: MANSION_QUALITIES[mansion % 9],
    rerk: RERK_NAMES[mansion % 9],
  }
}
