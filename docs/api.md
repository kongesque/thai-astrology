# คู่มือ API โหราศาสตร์ไทย

[README](../README.md) · [English](api-en.md)

คู่มือนี้รวมข้อมูลที่ใช้แสดงดวงและเขียนกฎพยากรณ์ เริ่มจากวัน เวลา และสถานที่เกิดด้วย `calculateThaiHoroscope()` แล้วเลือกอ่านผลที่ต้องการ ผลลัพธ์แปลงเป็น JSON ได้ ชื่อดาว ราศี ภพ และฤกษ์ในผลลัพธ์เป็นภาษาไทย

เลือกอ่านตามงาน: [สถานที่ในไทย](#ข้อมูลนำเข้าและ-api-หลัก) · [ค้นหาเมืองและ DST](#ค้นหาสถานที่ตามประเทศและหา-offset) · [พิกัดละเอียด](#เลือกจังหวัดและประเทศ) · [ผลตำแหน่งดาว](#สมผุสดาวและลัคนา-points) · [ดาวจร](#ผลเปรียบเทียบดาวจร) · [รับข้อมูลจากฟอร์ม](#ตรวจข้อมูลและชนิดข้อมูล) · [ใช้จุดอ้างอิง 06:00 เมื่อใด](#จุดอ้างอิง-0600)

## ข้อมูลนำเข้าและ API หลัก

สถานที่เกิดในไทย ระบุวัน เวลา และจังหวัดได้เลย ระบบจะคำนวณอาทิตย์ขึ้นตามวันและพิกัดจังหวัด พร้อมหา UTC ตามวันเวลาเกิดให้ สำหรับ ค.ศ. 1900–2100 ไม่ต้องกรอกค่าแก้เวลาเพิ่ม

```ts
import { calculateThaiHoroscope } from "thai-astrology"

const horoscope = calculateThaiHoroscope({
  date: { year: 2024, era: "CE", month: 9, day: 15 },
  time: { hour: 8, minute: 30 },
  location: { province: "เชียงใหม่" },
})

console.log(horoscope.points.ascendant.signName) // กันย์
console.log(horoscope.points.sun.signName) // สิงห์
console.log(horoscope.calendar.thaiLunarDate?.label) // ข๑๓ด๑๐ = ขึ้น 13 ค่ำ เดือน 10
```

## นำผลไปแสดงในแอป

ใช้ `horoscope` จากตัวอย่างแรก ช่องราศีจักรมี 12 ช่องเรียงจากเมษถึงมีน แอปเป็นผู้กำหนดหน้าตาผัง หากต้องการตารางสมผุส อ่านตำแหน่งแต่ละจุดจาก `points`

```ts
const channels = horoscope.charts.rasi.channels.thai
const positions = Object.values(horoscope.points).map(point => ({
  name: point.nameThai,
  sign: point.signName,
  degrees: point.degrees,
  minutes: point.minutes,
}))
console.log(channels)
console.log(positions)
```

ลิปดาของดาวเป็นจำนวนเต็ม แต่ลิปดาลัคนาอาจมีทศนิยม เก็บตัวเลขที่ API คืนไว้ แล้วเลือกรูปแบบแสดงผลแยกต่างหาก ช่องดวงมีเครื่องหมาย `ลั` และ `*` ให้แล้ว ไม่ต้องประกอบเอง

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

นักษัตรแบ่งจักรราศีเป็น 27 ส่วน แต่ละนักษัตรมี 4 บาทฤกษ์ ส่วน `rerk` บอกชื่อฤกษ์ใน 9 หมวด เช่น มหันธโนฤกษ์หรือภูมิปาโลฤกษ์ แยกจากเลขนักษัตรใน `nakshatraIndex`

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

ใช้ฟิลด์นี้อ่านขึ้น/แรมกี่ค่ำและเดือนจันทรคติ ส่งวันที่ตามปฏิทินเกรกอเรียนและเวลาท้องถิ่น โดยต้องระบุ `time` ละ `location` ได้ รองรับ ค.ศ. **1582–2076** (พ.ศ. **2125–2619**) นอกช่วงนี้ฟิลด์เป็น `null`

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

ส่งข้อมูลดวงกำเนิดและดวงจรแยกกัน แต่ละดวงใช้วัน เวลา และสถานที่ของตัวเอง ตัวอย่างนี้ใช้เชียงใหม่ในสองปี หากดวงจรอยู่ต่างประเทศ ให้เตรียมสถานที่และ UTC ตามตัวอย่างเลือกเมือง

```ts
import { calculateHoroscopeTransits } from "thai-astrology"
import type { HoroscopeInput } from "thai-astrology"

function inputForYear(year: number): HoroscopeInput {
  return {
    date: { year, era: "CE", month: 9, day: 15 },
    time: { hour: 8, minute: 30 },
    location: { province: "เชียงใหม่" },
  }
}
const result = calculateHoroscopeTransits(inputForYear(2024), inputForYear(2025))

console.log(result.transit.points.sun.signName)
console.log(result.comparison.sun.longitudeDifferenceDegrees)
```

`calculateHoroscopeTransits(natalInput, transitInput)` รับข้อมูลสองดวงตามรูปแบบเดียวกัน และคืน `natal`, `transit`, `comparison` ต้องระบุวันเวลาของทั้งสองดวงเอง

| ฟิลด์ | ความหมาย |
| --- | --- |
| `transit.points[key]` | ตำแหน่งดาวจร ณ วันเวลาที่ระบุ `house` นับจากลัคนาของดวงจร |
| `comparison[key].natalHouse` | ภพที่ดาวจรสถิตเมื่อนับจากลัคนาดวงกำเนิด 1-12 |
| `comparison[key].longitudeDifferenceDegrees` | ผลต่างสมผุสดาวจรกับดาวกำเนิดดวงเดียวกัน เลือกส่วนต่างสั้นที่สุดในช่วง -180 ถึงน้อยกว่า 180 องศา |

`comparison` มีเฉพาะคีย์ดาว ไม่รวมลัคนา ผลต่างสมผุสไม่ใช่ระยะโคจรสะสม ความเร็วดาว หรือสถานะพักร์

## ตรวจข้อมูลและชนิดข้อมูล

แปลงช่องตัวเลขจากฟอร์มก่อนสร้างข้อมูลดวง เช่น `"8"` เป็นข้อความ แต่ `8` คือชั่วโมง ตรวจว่าไม่ว่างก่อนแปลงค่า ตรวจ `date`/`time` ก่อน หากเป็นต่างประเทศ จึงหาสถานที่และ UTC ก่อนประกอบข้อมูลทั้งหมด เมื่อประกอบครบแล้วตรวจข้อมูลทั้งชุดได้อีกครั้ง

```ts
import { validateHoroscopeInput } from "thai-astrology"

const formInput: unknown = {
  date: { year: 2024, era: "CE", month: 9, day: 15 },
  time: { hour: 8, minute: 30 },
}
const validation = validateHoroscopeInput(formInput)
if (!validation.valid) {
  console.log(validation.issues) // จับคู่ issue.field กับช่องในฟอร์ม
} else {
  console.log(validation.value.date.yearCe) // 2024
}
```

`validateHoroscopeInput()` รับ `unknown` และไม่แปลงข้อความเป็นตัวเลข เมื่อไม่ผ่าน `issues` จะบอก `field`, `code` (`required`, `type`, `range`, `unknown`) และ `message` เมื่อผ่าน `value` มีจุดอ้างอิงที่เลือกและเหตุผลเมื่อใช้จุดอ้างอิง 06:00 แทน พร้อมข้อมูลที่จัดรูปแบบแล้ว มีทั้ง `date.yearBe` และ `date.yearCe` ไม่ใช่รูปแบบนำเข้าสำหรับส่งกลับไปคำนวณ

`calculateThaiHoroscope()` และ `calculateHoroscopeTransits()` จะ throw `HoroscopeInputError` เมื่อข้อมูลไม่ถูกต้อง อ่านรายการข้อผิดพลาดได้จาก `error.issues` ชนิดข้อมูลทั้งหมด รวมถึง `profile`, `timing` และ `diagnostics` ดูได้ใน [horoscope.ts](../src/horoscope.ts), [DetailedPosition](../src/engine/astro/suriyayatra.ts) และ [CalculationInput](../src/engine/astro-calculation.ts)

ดู [หลักการและข้อจำกัด](../README.md#หลักการและข้อจำกัด) ก่อนนำผลไปใช้

## ตารางฟังก์ชันและข้อมูลนำเข้า

| ฟิลด์นำเข้า | ชนิดและเงื่อนไข |
| --- | --- |
| `date.year`, `date.era` | ปีจำนวนเต็ม ใช้ `"BE"` สำหรับ พ.ศ. 544-10542 หรือ `"CE"` สำหรับ ค.ศ. 1-9999 |
| `date.month`, `date.day` | เดือน 1-12 และวันที่ที่มีอยู่จริงตามปฏิทินเกรกอเรียน ทั้งสองค่าเป็นจำนวนเต็ม |
| `time.hour`, `time.minute` | เวลาเกิดตามเวลาท้องถิ่น ชั่วโมง 0-23 นาที 0-59 เป็นจำนวนเต็ม |
| `location.province` | ไม่บังคับ ใช้ชื่อจังหวัดภาษาไทยจาก `getThaiAstrologyProvinces()` |

ตัวเลือกต่อไปนี้ใช้เมื่อกำหนดเวลาอ้างอิงเอง ดูตัวอย่างใน [การตั้งค่าขั้นสูง](#การตั้งค่าขั้นสูง)

| ตัวเลือกเพิ่มเติม | ชนิดและเงื่อนไข |
| --- | --- |
| `location.localTimeCorrectionMinutes` | ไม่บังคับ จำนวนนาทีตั้งแต่ -1440 ถึง 1440 ใช้แทนค่าแก้เวลาของจังหวัด |
| `referenceMode` | เว้นไว้ในการใช้งานทั่วไป; ระบุ `"traditional"` เมื่อใช้ [จุดอ้างอิง 06:00](#จุดอ้างอิง-0600) ค่าเริ่มต้นของพารามิเตอร์คือ `"auto"` |
| `planetaryTimeReference` | ไม่บังคับ ระบุ `civilUtcOffsetSeconds` และ `referenceUtcOffsetSeconds` เป็นวินาทีจำนวนเต็ม ช่วง ±50,400 |
| `ascendantReference` | ไม่บังคับ เลือก `method: "sunrise"` พร้อม `latitude` (-90..90), `longitude` (-180..180) และ `utcOffsetHours` (-14..14) ที่รวม DST แล้ว |

เมื่อใช้จุดอ้างอิง 06:00 หากไม่ระบุจังหวัดหรือค่าแก้เวลา จะใช้ค่าแก้เวลาเป็นศูนย์ ชื่อจังหวัดที่ไม่อยู่ในรายการต้องระบุค่าแก้เวลาเอง ค่านี้ปรับจุดอ้างอิง 06:00 ของการหาลัคนา ไม่ใช่เขตเวลาหรือ UTC offset สำหรับต่างประเทศต้องหาหรือระบุ UTC offset ที่รวม DST ก่อนส่งข้อมูล

| API | ผลลัพธ์ |
| --- | --- |
| `calculateThaiHoroscope(input)` | `ThaiHoroscope`: ดวงกำเนิดแบบมีโครงสร้าง ใช้สุริยยาตร์เสมอ |
| `calculateHoroscopeTransits(natalInput, transitInput)` | ดวงกำเนิด ดวงจร และผลเปรียบเทียบ |
| `validateHoroscopeInput(input)` | `{ valid: true, value }` หรือ `{ valid: false, issues }` โดยไม่ throw เมื่อข้อมูลผิด |
| `getThaiAstrologyProvinces()` | รายการ 77 จังหวัด แต่ละรายการมี `province` และ `localTimeCorrectionMinutes` |
| `calculateMeanSolarTimeCorrection(input)` | ส่วนต่างเวลานาฬิกากับเวลาสุริยะเฉลี่ย เป็นนาทีจากลองจิจูดและ UTC offset; ไม่ปัดค่า |
| `getThaiAstrologyProvinceLocations()` | 77 จังหวัดพร้อมพิกัดเมืองศูนย์กลางสำหรับอาทิตย์ขึ้น |
| `getThaiAstrologyCountries()` | ชื่อภาษาอังกฤษและรหัสประเทศ/ดินแดนสำหรับรายการเลือก |
| `createSunriseReference(selection)` | ใช้พิกัดจังหวัดหรือพิกัดจริง สร้างตัวเลือกอาทิตย์ขึ้น |
| `searchThaiAstrologyLocations(input)` | ค้นหาสถานที่ตามประเทศและชื่อ คืนพิกัด เขตเวลา จำนวนทั้งหมด และหน้าผลลัพธ์ |
| `createSunriseReferenceForLocation(input)` | สร้างจุดอ้างอิงอาทิตย์ขึ้นจากสถานที่ พร้อม offset ตามวันเกิดหรือ UTC ที่ระบุเอง |
| `resolveCivilTimeOffset(input, timeZone)` | หา UTC offset ตามวันเวลาและเขตเวลา พร้อมตรวจเวลาที่ซ้ำหรือไม่มีจริง |
| `calculateSunrise(input)` | เวลาอาทิตย์ขึ้นตามวัน พิกัด และ UTC offset หรือผล `status: "no-rise"` |
| `calculateDetailedPositions(input)` | สมผุสและข้อมูลประกอบแบบละเอียด ใช้สุริยยาตร์ รับ `CalculationInput` |
| `generateThaiAstrologyChart(input)` | ช่องดวงแบบเดิม ค่าเริ่มต้นเป็น `legacy`; เลือก `method: "suriyayatra"` ได้ |

API แบบเดิมใช้ `day`, `monthTh`, `hour`, `minute`, `province` และปีอย่างใดอย่างหนึ่ง: `yearBe` คือ พ.ศ. ส่วน `yearBc` คือ **ค.ศ.** แม้ชื่อฟิลด์จะเป็น `yearBc` ตัวอย่าง `yearBe: 2567` เท่ากับ `yearBc: 2024`

### ข้อมูลเกิดที่ไม่ทราบ

ต้องระบุเวลาเกิด ไม่รองรับการผูกดวงจากวันเกิดอย่างเดียวหรือการเติมชั่วโมงให้เอง หากใช้เวลาสมมติ ให้เก็บสมมติฐานนั้นและอย่าถือผลที่อิงลัคนาว่าแน่นอน เมื่อไม่ทราบจังหวัด เว้น `location` ได้ แต่จะใช้จุดอ้างอิง 06:00 โดยไม่มีค่าแก้เวลา ส่วนอาทิตย์ขึ้นตามสถานที่ต้องมีพิกัดและ UTC offset ที่ทราบ ประเทศอย่างเดียวไม่พอ

## การตั้งค่าขั้นสูง

ใช้ส่วนนี้เมื่อเกิดต่างประเทศ ต้องการพิกัดละเอียด หรือมีข้อตกลงเรื่องเวลาอ้างอิงที่ต้องใช้ตามตำรา สำหรับวันเกิดในไทย ค.ศ. 1900–2100 ที่ระบุจังหวัดในรายการ ใช้ตัวอย่างแรกได้เลย

### อาทิตย์ขึ้นและกรอบเวลาดาว

การคำนวณตามตัวอย่างแรกใช้ **อาทิตย์ขึ้นตามวันและสถานที่** เป็นจุดอ้างอิงลัคนา โดยปัดเวลาอาทิตย์ขึ้นเป็นนาทีใกล้ที่สุด ส่วนสมผุสดาวแปลงจากเวลาท้องถิ่นเข้าสู่กรอบ +06:42:04 ระบบเติมพิกัดจังหวัดและ UTC ตามวันเวลาเกิดให้ ไม่ต้องเลือกชื่อวิธีคำนวณ

กรอบ +06:42:04 อ้างอิงเวลาพลเรือนกรุงเทพฯ ในอดีต เป็นข้อตกลงของไลบรารี ไม่ใช่กรอบบังคับของทุกตำราสุริยยาตร์ ดูหลักฐานใน [SOURCES.md](../SOURCES.md)

เมื่อไม่ได้ส่งจุดอ้างอิงเอง หากปีอยู่นอกช่วงที่รองรับ ไม่ระบุจังหวัด หรือกำหนดค่าแก้เวลาเอง ระบบจะใช้ [จุดอ้างอิง 06:00](#จุดอ้างอิง-0600) แทน เมื่อบันทึกหรือแสดงผลดวง ควรเก็บข้อมูลวิธีที่ใช้จริงด้วย:

| ฟิลด์ผลลัพธ์ | ความหมาย |
| --- | --- |
| `profile.referenceMode` | `"auto"` = อาทิตย์ขึ้นตามวันและจังหวัด, `"traditional"` = จุดอ้างอิง 06:00, `"explicit"` = ใช้ค่าที่ส่งมาเอง |
| `profile.referenceFallback` | เหตุผลที่ใช้จุดอ้างอิง 06:00 แทน: `"year-out-of-range"`, `"missing-province"` หรือ `"explicit-correction"`; ไม่มีฟิลด์นี้เมื่อไม่ได้ใช้วิธีแทน |
| `input.ascendantReference`, `input.planetaryTimeReference` | พิกัด ความละเอียด และค่าเวลาอ้างอิงที่เลือกแล้ว เก็บไว้เพื่อคำนวณซ้ำด้วยค่าเดิม |
| `timing.referenceTimeMinutes` | จุดอ้างอิงลัคนาที่ใช้จริง เป็นนาทีจากเที่ยงคืน |

เมื่อส่ง `ascendantReference` หรือ `planetaryTimeReference` เอง ระบบจะใช้ตามที่ส่ง **ไม่เติมอีกตัวเลือกให้** จึงควรส่งทั้งคู่ตามตัวอย่างพิกัดหรือเมืองด้านล่าง หากต้องการใช้ข้อตกลงเดียวกับตัวอย่างแรก ไม่บวกค่าแก้จังหวัดซ้ำกับอาทิตย์ขึ้น

UTC ตามวันที่ใช้กฎ IANA ผ่าน `Intl` ของระบบ เวลาที่ไม่มีจริงหรือซ้ำกันจะเป็นข้อผิดพลาด ไม่เปลี่ยนไปใช้จุดอ้างอิง 06:00 ให้เอง หากต้องการผลซ้ำข้ามเวอร์ชันระบบ ให้เก็บค่าอ้างอิงทั้งสองที่เลือกแล้วและส่งกลับโดยตรง

จุดอ้างอิงต่างกันอาจทำให้ลัคนาข้ามราศี แม้ใช้เวลาเกิดเดียวกัน ควรใช้ข้อตกลงเดียวกันตลอดการอ่านดวง หากเวลาเกิดเป็นเวลาประมาณ ให้ตรวจรอยต่อราศีตามวัน สถานที่ และวิธีที่ใช้ ไม่มีช่วงคลาดเคลื่อนเป็นนาทีที่ใช้ได้กับทุกดวง

### เวลาอาทิตย์ขึ้นตามพิกัด

```ts
import { calculateSunrise, calculateThaiHoroscope } from "thai-astrology"

const reference = {
  method: "sunrise" as const, latitude: 13.7563, longitude: 100.5018, utcOffsetHours: 7,
  timePrecision: "minute" as const,
}
const event = calculateSunrise({ yearCe: 2024, month: 6, day: 21, ...reference })
if (event.status === "rise") console.log(event.roundedTimeMinutes) // 352 = 05:52

const chart = calculateThaiHoroscope({
  date: { year: 2024, era: "CE", month: 6, day: 21 },
  time: { hour: 8, minute: 30 },
  ascendantReference: reference,
  planetaryTimeReference: {
    civilUtcOffsetSeconds: Math.round(reference.utcOffsetHours * 3600),
    referenceUtcOffsetSeconds: 6 * 3600 + 42 * 60 + 4,
  },
})
console.log(chart.timing.sunrise?.timeMinutes) // นาทีตั้งแต่เที่ยงคืน ก่อนปัดค่า
```

พิกัดใช้หน่วยองศา ละติจูดเหนือและลองจิจูดตะวันออกเป็นบวก ส่วน `utcOffsetHours` ใช้หน่วยชั่วโมง รองรับวันที่ ค.ศ. 1900–2100 ทั้งในและนอกประเทศไทย ใช้โมเดล NOAA/Meeus กับขอบฟ้าระดับทะเลที่ศูนย์กลางอาทิตย์ต่ำกว่าขอบฟ้า 50′ ไม่ชดเชยภูเขา ความสูง หรืออากาศจริง ต้องส่ง UTC offset ที่ใช้ในวันนั้นเอง พิกัดไม่กำหนดเขตเวลาและไม่มีการค้น DST อัตโนมัติ

`calculateSunrise()` คืนผลตามตาราง หากไม่มีอาทิตย์ขึ้นในวันนั้น จะได้ `status: "no-rise"` และการนำจุดอ้างอิงนี้ไปผูกดวงจะ throw `RangeError` หากต้องการใช้จุดอ้างอิง 06:00 แทน ให้เลือกตาม [ตัวอย่างด้านล่าง](#จุดอ้างอิง-0600) ส่วน API ระดับล่างให้เว้น `ascendantReference`

| ฟิลด์เมื่อ `status: "rise"` | ความหมาย |
| --- | --- |
| `timeMinutes` | เวลาอาทิตย์ขึ้นก่อนปัด เป็นนาทีจากเที่ยงคืน ตั้งแต่ 0 ถึงน้อยกว่า 1440 |
| `roundedTimeMinutes` | ปัดเป็นนาทีใกล้ที่สุด อาจได้ 1440 หรือ 24:00 |
| `altitudeResidualDegrees` | ค่าคลาดเคลื่อนจากการหาคำตอบเชิงตัวเลข ไม่ใช่ความแม่นยำทางกายภาพ |

สำหรับลัคนา ตัวอย่างใช้ `timePrecision: "minute"` เช่นเดียวกับการระบุจังหวัดในตัวอย่างแรก หากส่งจุดอ้างอิงเองแล้วเว้นค่านี้ หรือใช้ `"continuous"` จะใช้เวลาก่อนปัด ทั้งสองตัวช่วยสถานที่รับค่านี้ได้

ความละเอียดเปลี่ยนเฉพาะจุดอ้างอิงลัคนาและเวลาเริ่มทั้ง 12 ราศี ไม่เปลี่ยนเวลาอาทิตย์ขึ้นดิบ สมผุสดาว หรือวันจันทรคติ หากปัดได้ 24:00 จะใช้ 00:00 ในวงรอบลัคนาโดยไม่เลื่อนวันที่

ค่าแก้เวลาจังหวัดเป็นศูนย์ หากส่ง `localTimeCorrectionMinutes` ที่ไม่ใช่ศูนย์ร่วมกันจะถูกปฏิเสธ เลือกตัวเลือกเดียวกันได้ใน `CalculationInput`; `generateThaiAstrologyChart` ต้องระบุ `method: "suriyayatra"`

`ascendantReference` เปลี่ยนจุดอ้างอิงลัคนา อันโตนาทียังคงที่และอาทิตย์คงตำแหน่งเวลาเกิด หากไม่เลือก `planetaryTimeReference` สมผุสดาวยังใช้เวลาท้องถิ่นตามที่กรอก; offset ใน sunrise ไม่เลื่อนสมผุสดาว จึงยังไม่ใช่การคำนวณลัคนาเรขาคณิตหรือสมผุสดาราศาสตร์ทั่วโลก

### เลือกจังหวัดและประเทศ

สำหรับฟอร์มเลือกสถานที่ ใช้รายการจังหวัดพร้อมพิกัดและรายการประเทศได้ดังนี้ การผูกดวงจากจังหวัดไทยยังใช้ `location: { province }` ตามตัวอย่างแรกได้ ไม่ต้องสร้างจุดอ้างอิงเอง

```ts
import { getThaiAstrologyProvinceLocations, getThaiAstrologyCountries } from "thai-astrology"

const provinceOptions = getThaiAstrologyProvinceLocations()
const countryOptions = getThaiAstrologyCountries()
console.log(provinceOptions.length) // 77
console.log(countryOptions.length) // 250
```

รายการจังหวัดมี `province`, `countryCode: "TH"`, `latitude`, `longitude`, `timeZone: "Asia/Bangkok"`, `coordinateKind: "province-seat"` และ `geonameId` พิกัด WGS84 เป็นจุดเมืองศูนย์กลาง ไม่ใช่ขอบเขตจังหวัดหรือสถานที่เกิดของทุกคน ส่วน `getThaiAstrologyProvinces()` คืนชื่อจังหวัดและค่าแก้เวลาจุดอ้างอิง 06:00 ที่คำนวณจากลองจิจูดในกรอบ UTC+7 แล้วปัดเป็นนาที ทั้งสองฟังก์ชันคืนรายการใหม่ทุกครั้ง

`createSunriseReference()` ช่วยเติมพิกัดจาก `province` หรือรับ `latitude` และ `longitude` ที่ระบุเอง ต้องส่ง `utcOffsetHours` ด้วยเสมอ หากให้จังหวัดและพิกัดทั้งคู่จะใช้พิกัดที่ส่ง ไม่ผสมพิกัดข้างหนึ่งกับค่าจังหวัด ตัวช่วยนี้ไม่ค้นเขตเวลา ใช้ [ตัวช่วยเลือกเมือง](#ค้นหาสถานที่ตามประเทศและหา-offset) เมื่อต้องการหา UTC ตามวันเวลาเกิด

รายการประเทศมีชื่ออังกฤษและรหัสสองตัว รวม `XK` ตาม GeoNames ไม่รวม `AN`/`CS` ที่ยุบแล้ว `countryCode` เป็นข้อมูลเลือกใส่ ใช้รหัสตัวพิมพ์ใหญ่จากรายการ ไม่ใช้ประเทศเพียงอย่างเดียวเพื่อหาพิกัดหรือ DST และไม่ตรวจพรมแดน ห้ามจับคู่ประเทศอื่นกับชื่อจังหวัดไทย เมื่อเปลี่ยนประเทศในฟอร์มให้ล้างสถานที่ พิกัด และเขตเวลาเดิมก่อนเลือกใหม่

ข้อมูลจาก [GeoNames](https://www.geonames.org/) ดึง 4 ตุลาคม 2026 ภายใต้ [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) ลดรูปเป็นข้อมูลสำหรับรายการเลือก โดยคงชื่อจังหวัดเดิมของไลบรารี ดู [แหล่งอ้างอิงและสัญญาอนุญาต](../SOURCES.md)

### ค้นหาสถานที่ตามประเทศและหา offset

เลือกประเทศก่อนค้นชื่อเมือง แล้วใช้เมืองที่เลือกหา UTC ตามวันเวลาเกิด ตัวอย่างนิวยอร์กวันที่ 21 มิถุนายน 2024 ใช้ EDT หรือ UTC−4 ไม่ต้องกรอก DST แยกเอง

```ts
import { calculateThaiHoroscope, searchThaiAstrologyLocations, createSunriseReferenceForLocation } from "thai-astrology"

const civilTime = { yearCe: 2024, month: 6, day: 21, hour: 8, minute: 30 }
const result = searchThaiAstrologyLocations({ countryCode: "US", query: "New York" })
const city = result.items[0]
if (!city) throw new Error("Location not found")
const reference = createSunriseReferenceForLocation({ locationId: city.id, civilTime, timePrecision: "minute" })
console.log(reference.utcOffsetHours) // -4 (EDT)
const chart = calculateThaiHoroscope({
  date: { year: civilTime.yearCe, era: "CE", month: civilTime.month, day: civilTime.day },
  time: { hour: civilTime.hour, minute: civilTime.minute },
  ascendantReference: reference,
  planetaryTimeReference: {
    civilUtcOffsetSeconds: Math.round(reference.utcOffsetHours * 3600),
    referenceUtcOffsetSeconds: 6 * 3600 + 42 * 60 + 4,
  },
})
console.log(chart.timing.sunrise?.roundedTimeMinutes) // 325 = 05:25
```

`searchThaiAstrologyLocations()` คืน `{ items, total }` โดย `total` คือจำนวนที่พบก่อนแบ่งหน้า ค้นได้ทั้งชื่อเมืองอังกฤษและชื่อจังหวัดไทย ไม่แยกตัวพิมพ์ และรองรับอักษรละตินที่มีเครื่องหมายกำกับ

| ข้อมูลค้นหา | เงื่อนไข |
| --- | --- |
| `countryCode` | รหัสประเทศจาก `getThaiAstrologyCountries()` จำเป็นต้องระบุ |
| `query` | คำค้น เลือกใส่ได้ |
| `limit` | จำนวนต่อหน้า ค่าเริ่มต้น 50 สูงสุด 100 |
| `offset` | ตำแหน่งเริ่มต้น เป็นจำนวนเต็มไม่ติดลบ |

แต่ละสถานที่มี `id`, `countryCode`, `nameEnglish`, `latitude`, `longitude`, `timeZone`, `coordinateKind` และ `geonameId` จังหวัดไทยมี `nameThai` และ `province` เพิ่มด้วย รายการผลลัพธ์เป็นสำเนาใหม่ทุกครั้ง และมีลำดับคงที่ตามชุดข้อมูลที่มากับไลบรารี

รายการเริ่มต้นมีเมืองหลวง เมืองใหญ่สิบอันดับจากข้อมูลต้นทางต่อประเทศ เมืองใหญ่ที่สุดที่มีข้อมูลต่อเขตเวลา และจังหวัดไทยครบ 77 จุด รวม 1,945 จุดใน 243 ประเทศ/ดินแดน ไม่ใช่ทุกเมืองหรือทุกเขตเวลาทั่วโลก ประเทศที่ไม่มีรายการจะได้ `items: []`; ไม่แทนด้วยเมืองจากประเทศอื่น ใช้พิกัดเองได้ ข้อมูล GeoNames ภายใต้ CC BY 4.0 ถูกลดรูปโดยไม่เปลี่ยนค่าพิกัดหรือชื่อเขตเวลา

`createSunriseReferenceForLocation()` รับ `locationId` จากผลค้น หรือพิกัดทั้งคู่ `countryCode` เลือกใส่ได้และต้องตรงกับประเทศของ ID ที่เลือก หากส่ง `utcOffsetHours` จะใช้ค่านั้นและไม่เรียก `Intl` หากไม่ส่ง ต้องมี `civilTime: { yearCe, month, day, hour, minute }` และใช้เขตเวลาของสถานที่หรือ `timeZone` ที่ระบุเอง เพื่อหา offset ตามวันเวลาเกิด รองรับ ค.ศ. 1900–2100

แก้พิกัดทั้งคู่แทนจุดเริ่มต้นได้ แต่หากต้องการให้ตัวช่วยหา UTC ต้องระบุ `timeZone` ที่ตรวจแล้วด้วย หรือส่ง UTC offset เอง ไม่เดาเขตเวลาจากพิกัดที่แก้ เพราะอาจข้ามพรมแดนเขตเวลา หากเปลี่ยนประเทศในฟอร์มให้ล้างสถานที่ พิกัด และเขตเวลาเดิมก่อนเลือกใหม่

`resolveCivilTimeOffset(civilTime, timeZone, disambiguation?)` คืน `timeZone`, `utcOffsetHours`, `utcEpochMilliseconds` และ `ambiguous` ใช้กฎ IANA ผ่าน `Intl.DateTimeFormat` ของ runtime โดยไม่อ่านเขตเวลาหรือเวลาปัจจุบันของเครื่อง ค่าเริ่มต้น `disambiguation: "reject"` ปฏิเสธเวลาซ้ำ หากต้องการให้เลือก `"earlier"` หรือ `"later"` อย่างชัดเจน เวลาที่ไม่มีจริงช่วงเลื่อนนาฬิกาหรือวันที่ข้ามจะถูกปฏิเสธเสมอ ไม่เลื่อนเวลาเกิดให้เอง

ตัวช่วยเขตเวลาแยกจากแกนคำนวณ ซึ่งรับ UTC เป็นตัวเลขและให้ผลเดิมเมื่อข้อมูลเหมือนกัน กฎของ `Intl` อาจต่างตามเวอร์ชันฐานข้อมูลเวลา สำหรับงานที่ต้องทำซ้ำเหมือนเดิมให้เก็บ offset ที่ resolve แล้วและเวอร์ชัน runtime หรือระบุ UTC เอง หาก runtime ไม่รองรับชื่อเขตเวลา ให้ระบุ offset ที่ตรวจสอบแล้ว

UTC ที่หาได้อิงเวลาเกิดที่กรอก และใช้ค่าเดียวตลอดการหาอาทิตย์ขึ้นในวันนั้น หากวันนั้นเปลี่ยน DST เวลาอาทิตย์ขึ้นที่แสดงยังใช้ offset นี้ ไม่ได้จำลองการเปลี่ยนนาฬิกาภายในวัน ลัคนายังใช้อันโตนาทีสามัญ ส่วนกรอบเวลาดาวกำหนดแยกตามหัวข้อถัดไป

### กรอบเวลาสมผุสดาว

`planetaryTimeReference` แยก **UTC ของสถานที่เกิด** ออกจาก **กรอบคำนวณดาว** ใช้ได้กับ `calculateThaiHoroscope()`, `calculateDetailedPositions()` และผังดวงที่ระบุ `method: "suriyayatra"` ไม่รองรับ `legacy` ดวงกำเนิดและดวงจรกำหนดแยกกันได้

| ค่า | หน่วยและหน้าที่ |
| --- | --- |
| `civilUtcOffsetSeconds` | UTC ของวันเวลาเกิด รวม DST |
| `referenceUtcOffsetSeconds` | กรอบเวลาที่ใช้คำนวณสมผุสดาว; ตัวอย่างใช้ +06:42:04 = 24,124 วินาที |

ทั้งสองค่าเป็นวินาทีจำนวนเต็มในช่วง ±50,400 สูตรคือ `เวลาอ้างอิง = เวลาท้องถิ่น − offset ท้องถิ่น + offset อ้างอิง` ระบบทดวันข้ามเดือนและปีให้ หากวันอ้างอิงหลุด ค.ศ. 1–9999 จะปฏิเสธ `Math.round(utcOffsetHours * 3600)` ในตัวอย่างใช้แปลงหน่วยชั่วโมงกลับเป็นวินาทีจำนวนเต็ม

เมื่อใช้ร่วมกับอาทิตย์ขึ้น ค่า UTC ของทั้งสองตัวเลือกต้องตรงกัน อาทิตย์ขึ้นและเวลาเกิดของลัคนายังอิงเวลาท้องถิ่น แต่สมผุสอาทิตย์ที่เปลี่ยนอาจทำให้ลัคนาและภพเปลี่ยนได้ วันจันทรคติ จ.ศ. ปฏิทิน และทักษายังคงอิงวันเกิดที่กรอก ส่วนดิถีเชิงมุมอิงสมผุสจันทร์–อาทิตย์

API ระดับล่างไม่เติมกรอบเวลาดาวนี้ให้ หากไม่ส่งจะใช้เวลาท้องถิ่นตามที่กรอก ส่วน API แบบมีโครงสร้างเติมให้เมื่อระบุจังหวัดในช่วงวันที่รองรับ กรณี offset ทั้งสองเท่ากันจะใช้เวลาคำนวณเดิม

`diagnostics.planetaryTime` มี `horakhun`, `secondOfDay`, `dayOffset` และ offset ทั้งสองสำหรับตรวจเวลาที่แปลงแล้ว เป็นการแปลงด้วย offset คงที่ ไม่ใช่ UT1/TT หรือ leap seconds ส่วน `diagnostics.solarCycleUnits` เป็นค่าภายในสำหรับเลือกปีอ้างอิง ไม่ควรนำไปหารเป็นมัธยมอาทิตย์โดยตรงใกล้รอยต่อปี

### จุดอ้างอิง 06:00

ใช้เมื่อผูกดวงตามตำราหรือระบบที่กำหนด **06:00 พร้อมค่าแก้ลองจิจูด** เป็นจุดอ้างอิงลัคนา หรือเมื่อใช้วันที่นอกช่วงคำนวณอาทิตย์ขึ้นและต้องการระบุข้อตกลงนี้ให้ชัดเจน โดยเวลาดาวจะใช้เวลาท้องถิ่นตามที่กรอก

ระบุ `referenceMode: "traditional"` และเว้น `ascendantReference` กับ `planetaryTimeReference` ค่านี้เลือกข้อตกลงเวลา ไม่ได้เปลี่ยนเอนจินหรือปฏิทิน และไม่รับประกันผลเหมือนรุ่นเก่าทุกค่า เพราะค่าแก้จังหวัดคำนวณจากพิกัดแล้ว

```ts
import { calculateThaiHoroscope } from "thai-astrology"

const horoscope = calculateThaiHoroscope({
  date: { year: 2024, era: "CE", month: 9, day: 15 },
  time: { hour: 8, minute: 30 },
  location: { province: "เชียงใหม่" },
  referenceMode: "traditional",
})

console.log(horoscope.timing.referenceTimeMinutes) // 384 = 06:24
```

#### ค่าแก้เวลาสุริยะเฉลี่ยจากพิกัด

`calculateMeanSolarTimeCorrection({ longitude, utcOffsetHours })` คำนวณส่วนต่างระหว่างเวลานาฬิกาท้องถิ่นกับเวลาสุริยะเฉลี่ย เป็นนาที ตามสูตร `60 × utcOffsetHours − 4 × longitude` ค่าบวกหมายถึงเวลาบนนาฬิกาท้องถิ่นนำเวลาสุริยะเฉลี่ย ใช้ลองจิจูดตะวันออกเป็นบวก (-180 ถึง 180) และ UTC offset ของวันเวลาเกิด (-14 ถึง 14 ชั่วโมง รวม DST และรองรับเศษชั่วโมง)

ค่าแก้จังหวัดสำหรับจุดอ้างอิง 06:00 ใช้ `Math.round(60 × 7 − 4 × longitude)` จากพิกัดเมืองศูนย์กลาง กรอบ UTC+7 เป็นข้อตกลงของวิธีนี้ ไม่ใช่การค้นเขตเวลาประวัติศาสตร์ หากต้องการค่าแก้ที่กำหนดเองเฉพาะดวง ระบุ `localTimeCorrectionMinutes` ได้

ตัวอย่างนี้เลือกใช้ค่าแก้ที่ไม่ปัด พร้อม UTC ตามวันเวลาเกิด:

```ts
import { calculateMeanSolarTimeCorrection, calculateThaiHoroscope, getThaiAstrologyProvinceLocations, resolveCivilTimeOffset } from "thai-astrology"

const birthplace = getThaiAstrologyProvinceLocations().find(place => place.province === "กรุงเทพมหานคร")
if (!birthplace) throw new Error("Province not found")
const civilTime = { yearCe: 2024, month: 6, day: 21, hour: 8, minute: 30 }
const { utcOffsetHours } = resolveCivilTimeOffset(civilTime, birthplace.timeZone)
const correction = calculateMeanSolarTimeCorrection({ longitude: birthplace.longitude, utcOffsetHours })
const chart = calculateThaiHoroscope({
  date: { year: civilTime.yearCe, era: "CE", month: civilTime.month, day: civilTime.day },
  time: { hour: civilTime.hour, minute: civilTime.minute },
  referenceMode: "traditional",
  location: { province: birthplace.province, localTimeCorrectionMinutes: correction },
})
console.log(correction.toFixed(5)) // 17.99424 นาที
console.log(chart.timing.referenceTimeMinutes) // ประมาณ 377.99424 นาทีจากเที่ยงคืน
```

ฟังก์ชันคืนทศนิยมโดยไม่ปัด ไม่วนค่าข้ามวัน และไม่ค้นเขตเวลาเอง หากต้องการนาทีเต็ม ให้เลือก `Math.round(correction)` อย่างชัดเจน ค่าสูงสุดตามขอบเขตข้อมูลนำเข้าคือ ±1560 นาที แต่ `localTimeCorrectionMinutes` รับเพียง ±1440 นาที ค่าที่เกินช่วงนี้จะถูกปฏิเสธเมื่อส่งเข้าดวง

ค่าแก้นี้ไม่รวมสมการเวลา ฤดูกาล หรือละติจูด จึงไม่ใช่เวลาอาทิตย์ขึ้นรายวัน และไม่ได้รับรองว่าลัคนาจะตรงกับอีกวิธีมากขึ้น สำหรับอาทิตย์ขึ้นตามวันและพิกัด ใช้ตัวอย่างแรกหรือตัวอย่างพิกัดด้านบน และไม่บวกค่าแก้นี้ซ้ำ ดูสูตรและขอบเขตใน [SOURCES.md](../SOURCES.md)
