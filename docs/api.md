# คู่มือ API โหราศาสตร์ไทย

[README](../README.md) · [English](api-en.md)

คู่มือนี้รวมข้อมูลที่ใช้แสดงดวงและเขียนกฎพยากรณ์ เริ่มจาก `calculateThaiHoroscope()` แล้วเลือกอ่านส่วนที่ต้องการ ผลลัพธ์แปลงเป็น JSON ได้ ชื่อดาว ราศี ภพ และฤกษ์ในผลลัพธ์เป็นภาษาไทย

## ข้อมูลนำเข้าและ API หลัก

```ts
import { calculateThaiHoroscope, type HoroscopeInput } from "thai-astrology"

const input: HoroscopeInput = {
  date: { year: 2567, era: "BE", month: 9, day: 15 },
  time: { hour: 8, minute: 30 },
  location: { province: "เชียงใหม่" },
}
const horoscope = calculateThaiHoroscope(input)

console.log(horoscope.points.sun.signName) // สิงห์
console.log(horoscope.calendar.thaiLunarDate?.label) // ข๑๓ด๑๐
```

| ฟิลด์นำเข้า | ชนิดและเงื่อนไข |
| --- | --- |
| `date.year`, `date.era` | ปีจำนวนเต็ม ใช้ `"BE"` สำหรับ พ.ศ. 544-10542 หรือ `"CE"` สำหรับ ค.ศ. 1-9999 |
| `date.month`, `date.day` | เดือน 1-12 และวันที่ที่มีอยู่จริงตามปฏิทินเกรกอเรียน ทั้งสองค่าเป็นจำนวนเต็ม |
| `time.hour`, `time.minute` | เวลาเกิดตามเวลาท้องถิ่น ชั่วโมง 0-23 นาที 0-59 เป็นจำนวนเต็ม |
| `location.province` | ไม่บังคับ ใช้ชื่อจังหวัดภาษาไทยจาก `getThaiAstrologyProvinces()` |
| `location.localTimeCorrectionMinutes` | ไม่บังคับ จำนวนนาทีตั้งแต่ -1440 ถึง 1440 ใช้แทนค่าแก้เวลาของจังหวัด |

ถ้าไม่ระบุจังหวัดหรือค่าแก้เวลา จะใช้ค่าแก้เวลาเป็นศูนย์ ชื่อจังหวัดที่ไม่อยู่ในรายการต้องระบุค่าแก้เวลาเอง ค่านี้ปรับจุดอ้างอิง 06:00 ของการหาลัคนา ไม่ใช่เขตเวลาหรือ UTC offset ต้องจัดการเขตเวลาและ DST ก่อนส่งข้อมูล

| API | ผลลัพธ์ |
| --- | --- |
| `calculateThaiHoroscope(input)` | `ThaiHoroscope`: ดวงกำเนิดแบบมีโครงสร้าง ใช้สุริยยาตร์เสมอ |
| `calculateHoroscopeTransits(natalInput, transitInput)` | ดวงกำเนิด ดวงจร และผลเปรียบเทียบ |
| `validateHoroscopeInput(input)` | `{ valid: true, value }` หรือ `{ valid: false, issues }` โดยไม่ throw เมื่อข้อมูลผิด |
| `getThaiAstrologyProvinces()` | รายการ 77 จังหวัด แต่ละรายการมี `province` และ `localTimeCorrectionMinutes` |
| `calculateDetailedPositions(input)` | สมผุสและข้อมูลประกอบแบบละเอียด ใช้สุริยยาตร์ รับ `CalculationInput` |
| `generateThaiAstrologyChart(input)` | ช่องดวงแบบเดิม ค่าเริ่มต้นเป็น `legacy`; เลือก `method: "suriyayatra"` ได้ |

API แบบเดิมใช้ `day`, `monthTh`, `hour`, `minute`, `province` และปีอย่างใดอย่างหนึ่ง: `yearBe` คือ พ.ศ. ส่วน `yearBc` คือ **ค.ศ.** แม้ชื่อฟิลด์จะเป็น `yearBc` ตัวอย่าง `yearBe: 2567` เท่ากับ `yearBc: 2024`

## สมผุสดาวและลัคนา: `points`

`points.ascendant` คือลัคนา ส่วนดาวใช้คีย์ตามตาราง เลขดาวใช้ในทักษาและมุมสัมพันธ์ ไม่ใช่เลขราศี

| คีย์ | ชื่อดาว | เลขดาว |
| --- | --- | --- |
| `sun` | อาทิตย์ | 1 |
| `moon` | จันทร์ | 2 |
| `mars` | อังคาร | 3 |
| `mercury` | พุธ | 4 |
| `jupiter` | พฤหัสบดี | 5 |
| `venus` | ศุกร์ | 6 |
| `saturn` | เสาร์ | 7 |
| `rahu` | ราหู | 8 |
| `ketu` | เกตุ | 9 |
| `uranus` | มฤตยู | 0 |

แต่ละจุดมีฟิลด์ต่อไปนี้ โดย `points.ascendant.number` เป็น `null`

| ฟิลด์ | ความหมายและหน่วย |
| --- | --- |
| `key`, `nameThai`, `number` | คีย์ ชื่อภาษาไทย และเลขดาว |
| `sign`, `signName` | เลขราศี 0-11 และชื่อราศี เมษ = 0 เรียงถึงมีน = 11 |
| `degrees`, `minutes` | องศา 0-29 และลิปดา 0 ถึงน้อยกว่า 60 ภายในราศี ลิปดาลัคนาอาจมีทศนิยม |
| `longitudeDegrees` | สมผุสองศารวม นับจากต้นราศีเมษ 0 ถึงน้อยกว่า 360 องศา |
| `longitudeArcMinutes` | สมผุสลิปดารวม 0 ถึงน้อยกว่า 21600 ลิปดา; 60 ลิปดา = 1 องศา |
| `house` | ภพที่สถิต 1-12 นับจากราศีลัคนา |
| `ruledHouses` | เลขภพที่ดาวเป็นเจ้าเรือน อาจเป็นอาร์เรย์ว่าง |
| `dignities` | มาตรฐานดาว เช่น `"เกษตรบดี"`, `"มหาอุจ"`, `"นิจ"` อาจมีหลายค่า หรือเป็นอาร์เรย์ว่าง |

ฟิลด์ฤกษ์และดวงแบ่งย่อยอยู่ในจุดเดียวกัน:

| ฟิลด์ | ข้อมูล |
| --- | --- |
| `rerk` | ชื่อฤกษ์จากตำแหน่งนั้น เช่น `"ภูมิปาโลฤกษ์"` อ่านฤกษ์ของจันทร์จาก `points.moon.rerk` |
| `nakshatraIndex`, `nakshatraName` | เลขนักษัตร 0-26 และชื่อ |
| `nakshatraQuarter`, `nakshatraQuarterName`, `nakshatraQuality` | บาทฤกษ์ 1-4 ชื่อบาท และข้อความประกอบ |
| `nakshatraMinutes` | ตำแหน่งภายในนักษัตร เทียบความยาวหนึ่งนักษัตรเป็น 60 ส่วนและปัดลง; ไม่ใช่ลิปดารวม |
| `navamsaSign`, `navamsaRuler`, `navamsaSection` | ราศีในนวางค์จักร 0-11 เลขดาวเจ้าเรือน และลำดับนวางค์ 1-9 ภายในราศีเดิม |
| `drekkanaSign`, `drekkanaRuler`, `drekkanaSection` | ราศีในตรียางค์จักร 0-11 เลขดาวเจ้าเรือน และลำดับตรียางค์ 1-3 ภายในราศีเดิม |
| `navamsaName`, `drekkanaName` | ชื่อนวางค์และตรียางค์ |
| `navamsaQuality`, `drekkanaQuality` | ข้อความประกอบ หรือ `null` เมื่อไม่มี |

ลัคนาและมฤตยูไม่มีป้ายมาตรฐานดาวในวิธีคำนวณนี้ ชื่อที่ API คืนอาจสะกดต่างจากตำราบางเล่ม เช่น `"มหาอุจ"` ซึ่งมักเขียนว่า “มหาอุจจ์” ให้ใช้ค่าที่ API คืนเมื่อตรวจเทียบข้อความ

## ภพ เจ้าเรือน ตนุลัคน์ และตนุเศษ

`houses` เป็นอาร์เรย์ 12 ภพ เริ่มที่ `houses[0]` = ภพตนุ ใช้เรือนชะตาตามราศี (`whole-sign`) โดยราศีลัคนาเป็นภพที่ 1

| ฟิลด์ | ข้อมูล |
| --- | --- |
| `houses[i].number`, `.nameThai` | เลขและชื่อภพ: ตนุ กดุมภะ สหัชชะ พันธุ ปุตตะ อริ ปัตนิ มรณะ ศุภะ กัมมะ ลาภะ วินาศะ |
| `houses[i].sign`, `.signNameThai` | เลขราศี 0-11 และชื่อราศีของภพ |
| `houses[i].ruler` | ดาวเจ้าเรือน มี `key`, `number`, `nameThai` และ `house` ที่ดาวเจ้าเรือนนั้นสถิต |
| `houses[i].occupants` | คีย์ดาวที่สถิตในภพนั้น อาจเป็นอาร์เรย์ว่าง |
| `houses[i].containsAscendant` | `true` สำหรับภพตนุ |
| `factors.ascendantRuler` | คีย์ดาวตนุลัคน์ หรือดาวเจ้าเรือนราศีลัคนา ใช้ `points[key]` อ่านชื่อและตำแหน่ง |
| `factors.tanuseth` | ตนุเศษ มี `key`, `number`, `nameThai` และ `calculation` สำหรับตรวจลำดับการคำนวณ |
| `factors.ascendantOccupants` | คีย์ดาวที่ร่วมราศีกับลัคนา เป็นรายการเดียวกับดาวในภพตนุ |

ตนุลัคน์เป็นดาวเจ้าเรือนลัคนา ตนุเศษเป็นดาวที่ได้จากการคำนวณตนุเศษ ส่วนดาวร่วมราศีกับลัคนาดูจากตำแหน่งดาว ทั้งสามค่าไม่จำเป็นต้องเป็นดาวดวงเดียวกัน

## ปฏิทินจันทรคติไทย: `calendar.thaiLunarDate`

ใช้ฟิลด์นี้อ่านขึ้น/แรมกี่ค่ำและเดือนจันทรคติ ส่งวันที่ตามปฏิทินเกรกอเรียนและเวลาท้องถิ่น โดยต้องระบุ `time` แต่ละ `location` ได้ รองรับ ค.ศ. **1582–2076** (พ.ศ. **2125–2619**) นอกช่วงนี้ฟิลด์เป็น `null`

```ts
import { calculateThaiHoroscope } from "thai-astrology"

const { calendar } = calculateThaiHoroscope({
  date: { year: 2026, era: "CE", month: 7, day: 29 },
  time: { hour: 12, minute: 0 },
})
const lunar = calendar.thaiLunarDate

if (lunar) {
  const phase = lunar.phase === "waxing" ? "ขึ้น" : "แรม"
  const month = lunar.secondEighthMonth ? "8 หลัง" : String(lunar.month)
  console.log(`${phase} ${lunar.day} ค่ำ เดือน ${month}`) // ขึ้น 15 ค่ำ เดือน 8 หลัง
}
```

| ฟิลด์ | ความหมาย |
| --- | --- |
| `phase` | `"waxing"` = ขึ้น, `"waning"` = แรม |
| `day` | วันที่ 1–15 ของข้างขึ้นหรือข้างแรม เดือนที่มี 29 วันสิ้นสุดที่แรม 14 ค่ำ |
| `month` | เดือนจันทรคติ 1–12 แยกจากเดือนเกรกอเรียนที่นำเข้า |
| `secondEighthMonth` | `true` คือเดือนแปดหลัง เดือนแปดทั้งสองเดือนคืน `month: 8` |
| `yearType` | `"ordinary"` = ปกติมาส ปกติวาร (354 วัน), `"intercalary-month"` = อธิกมาส (เพิ่มเดือนแปดหลัง รวม 384 วัน), `"intercalary-day"` = อธิกวาร (เพิ่มวันในเดือน 7 รวม 355 วัน) |
| `dayBoundary` | `"civil-midnight"`: เริ่มวันตามปฏิทินเวลา 00:00 ท้องถิ่น |
| `label` | ข้อความย่อเลขไทย เช่น `"ข๑๓ด๑๐"`; `ด๘๘` คือเดือนแปดหลัง อาจมีช่องว่างจัดแนว ควรสร้างข้อความจากฟิลด์แทนการแยกข้อมูลจากข้อความนี้ |

การคำนวณใช้ตารางปฏิทินรายปี ผลอาจต่างจากปฏิทินที่เผยแพร่ โดยเฉพาะกฎอธิกมาส/อธิกวารและวันที่ใกล้ขึ้นปีใหม่จุลศักราช `yearType` อิงจุลศักราชที่คำนวณได้และอาจเปลี่ยนตามเวลาเถลิงศก ช่วงปีที่รองรับไม่ได้รับรองความถูกต้องทุกวัน

| ฟิลด์อื่นใน `calendar` | ความหมาย |
| --- | --- |
| `civilWeekday` | วันตามปฏิทิน เปลี่ยนวันเวลา 00:00; 1 = อาทิตย์ ถึง 7 = เสาร์ |
| `astrologicalWeekday` | วันทางโหราศาสตร์ เปลี่ยนวันเวลา 06:00 ใช้เลขวันเดียวกัน |
| `lunarPhase`, `lunarDay` | ข้างขึ้น/ข้างแรมและดิถี 1–15 จากมุมจันทร์กับอาทิตย์ อาจต่างจาก `thaiLunarDate` |
| `elongationDegrees` | มุมจันทร์นับจากอาทิตย์ 0 ถึงน้อยกว่า 360 องศา |
| `julianDayNumber`, `horakhun`, `chulaSakarat` | เลขวันจูเลียน หรคุณ และจุลศักราช |

วันที่ 15 กันยายน ค.ศ. 2024 เวลา 08:30 น. เชียงใหม่ มี `lunarDay` เป็น 12 แต่ `thaiLunarDate.day` เป็น 13 เมื่อต้องการแสดงวันที่จันทรคติ ให้อ่าน `thaiLunarDate.phase` คู่กับ `.day`

## ทักษา: `taksa`

| ฟิลด์ | ชื่อทักษา |
| --- | --- |
| `boriwan` | บริวาร |
| `ayu` | อายุ |
| `det` | เดช |
| `si` | ศรี |
| `mula` | มูละ |
| `utsaha` | อุตสาหะ |
| `montri` | มนตรี |
| `kalakini` | กาลกิณี |

ทุกช่องคืนเลขดาว ไม่ใช่ชื่อดาว เช่น `kalakini: 6` คือศุกร์ `method` เป็น `"weekday-0600"` และ `center` เป็น 9 (เกตุ) ทักษาเปลี่ยนวันเวลา 06:00 และไม่สลับพุธกลางคืนเป็นราหู

## ช่องดวงและมุมสัมพันธ์

`charts.rasi`, `charts.navamsa` และ `charts.drekkana` คือราศีจักร นวางค์จักร และตรียางค์จักร แต่ละดวงมี `positions` เป็นเลขราศีของดาวและลัคนา และ `channels.thai` / `channels.arabic` เป็นข้อความ 12 ช่องเรียงจากเมษถึงมีน `ลั` แทนลัคนา และ `*` กำกับตนุเศษ

`relationships` เรียง 12 ราศีเช่นกัน แต่ละรายการมี `sign` (เลขราศี) และ `ruler` (เลขดาวเจ้าเรือน) รายการดาวต่อไปนี้ใช้ **เลขดาว**:

| ฟิลด์ | ราศีที่นับจากราศีอ้างอิงเป็น 1 |
| --- | --- |
| `conjunction` | กุม: ดาวร่วมราศี |
| `opposition` | เล็ง: ราศีที่ 7 |
| `trines[0]`, `trines[1]` | ตรีโกณ: ราศีที่ 5 และ 9 |
| `squares[0]`, `squares[1]`, `squares[2]` | กลุ่มจตุโกณ: ราศีที่ 4, 7 และ 10 จึงรวมเล็งด้วย |
| `sextiles[0]`, `sextiles[1]` | โยค: ราศีที่ 3 และ 11 |

ความสัมพันธ์นี้นับตามราศี ไม่ได้ตรวจมุมตามองศาหรือระยะเผื่อมุม (orb)

## ผลเปรียบเทียบดาวจร

`calculateHoroscopeTransits(natalInput, transitInput)` รับข้อมูลสองดวงตามรูปแบบเดียวกัน และคืน `natal`, `transit`, `comparison` ต้องระบุวันเวลาของทั้งสองดวงเอง

| ฟิลด์ | ความหมาย |
| --- | --- |
| `transit.points[key]` | ตำแหน่งดาวจร ณ วันเวลาที่ระบุ `house` นับจากลัคนาของดวงจร |
| `comparison[key].natalHouse` | ภพที่ดาวจรสถิตเมื่อนับจากลัคนาดวงกำเนิด 1-12 |
| `comparison[key].longitudeDifferenceDegrees` | ผลต่างสมผุสดาวจรกับดาวกำเนิดดวงเดียวกัน เลือกส่วนต่างสั้นที่สุดในช่วง -180 ถึงน้อยกว่า 180 องศา |

`comparison` มีเฉพาะคีย์ดาว ไม่รวมลัคนา ผลต่างสมผุสไม่ใช่ระยะโคจรสะสม ความเร็วดาว หรือสถานะพักร์

## ตรวจข้อมูลและชนิดข้อมูล

`validateHoroscopeInput()` รับ `unknown` และไม่แปลงข้อความเป็นตัวเลข เมื่อไม่ผ่าน `issues` จะบอก `field`, `code` (`required`, `type`, `range`, `unknown`) และ `message` เมื่อผ่าน `value` เป็นข้อมูลที่จัดรูปแบบแล้ว มีทั้ง `yearBe` และ `yearCe` ไม่ใช่รูปแบบนำเข้าสำหรับส่งกลับไปคำนวณ

`calculateThaiHoroscope()` และ `calculateHoroscopeTransits()` จะ throw `HoroscopeInputError` เมื่อข้อมูลไม่ถูกต้อง อ่านรายการข้อผิดพลาดได้จาก `error.issues` ชนิดข้อมูลทั้งหมด รวมถึง `profile`, `timing` และ `diagnostics` ดูได้ใน [horoscope.ts](../src/horoscope.ts), [DetailedPosition](../src/engine/astro/suriyayatra.ts) และ [CalculationInput](../src/engine/astro-calculation.ts)

ดู [หลักการและข้อจำกัด](../README.md#หลักการและข้อจำกัด) ก่อนนำผลไปใช้
