# คู่มือ API โหราศาสตร์ไทย

[README](../README.md) · [English](api-en.md)

คู่มือนี้รวมข้อมูลที่ใช้แสดงดวงและเขียนกฎพยากรณ์ เริ่มจาก `calculateThaiHoroscope()` แล้วเลือกอ่านส่วนที่ต้องการ ผลลัพธ์แปลงเป็น JSON ได้ ชื่อดาว ราศี ภพ และฤกษ์ในผลลัพธ์เป็นภาษาไทย

เลือกอ่านตามงาน: [สถานที่ในไทย](#ข้อมูลนำเข้าและ-api-หลัก) · [ค้นหาเมืองและ DST](#ค้นหาสถานที่ตามประเทศและหา-offset) · [พิกัดละเอียด](#เลือกจังหวัดและประเทศ) · [ผลตำแหน่งดาว](#สมผุสดาวและลัคนา-points) · [ดาวจร](#ผลเปรียบเทียบดาวจร) · [รับข้อมูลจากฟอร์ม](#ตรวจข้อมูลและชนิดข้อมูล)

## ข้อมูลนำเข้าและ API หลัก

แนะนำให้เริ่มด้วยโหมด `auto` ซึ่งเป็นค่าเริ่มต้น ไม่ต้องระบุโหมดเพิ่ม สถานที่เกิดในไทย ระบุวัน เวลา และจังหวัดได้เลย API จะหาอาทิตย์ขึ้น UTC ตามวันที่ และกรอบเวลาดาวให้เองสำหรับ ค.ศ. 1900–2100

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
console.log(horoscope.profile.referenceMode) // auto
```

## อาทิตย์ขึ้นและกรอบเวลาดาว

ค่าเริ่มต้น `referenceMode: "auto"` ทำสามขั้นตอนให้เอง:

1. `resolveCivilTimeOffset` หา UTC ของสถานที่เกิด ณ วันเวลาเกิด
2. `createSunriseReference` เติมพิกัดจังหวัด แล้วดวงคำนวณอาทิตย์ขึ้นตามวันที่ของตัวเองแบบปัดนาทีใกล้ที่สุด
3. `planetaryTimeReference` แปลงเวลาคำนวณดาวเข้าสู่กรอบ +06:42:04 ที่เลือกไว้

คง `referenceUtcOffsetSeconds` ไว้เมื่อใช้วิธีนี้ รวมถึงสถานที่ต่างประเทศ เปลี่ยนเฉพาะ `civilUtcOffsetSeconds` ตาม UTC ของสถานที่เกิด กรอบกรุงเทพฯ ประวัติศาสตร์นี้เป็นข้อตกลงของแอป ไม่ใช่ epoch บังคับของทุกตำรา อ่านหลักฐานสูตรและเวลาใน [แหล่งอ้างอิง](../SOURCES.md)

| ตัวเลือก | ใช้กับอะไร | ค่าในตัวอย่าง |
| --- | --- | --- |
| `ascendantReference` | อาทิตย์ขึ้นรายวันสำหรับลัคนา | พิกัดจังหวัด, UTC ตามวันที่, `timePrecision: "minute"` |
| `planetaryTimeReference` | เวลาคำนวณดาว | UTC ของสถานที่เกิด → +06:42:04 |
| `location.localTimeCorrectionMinutes` | จุดอ้างอิง 06:00 แบบ traditional | ไม่ส่งเมื่อใช้อาทิตย์ขึ้นตามพิกัด |

โหมดอัตโนมัติต้องมีจังหวัดไทยที่อยู่ในรายการ ปี ค.ศ. 1900–2100 และไม่ได้ระบุจุดอ้างอิงหรือค่าแก้จังหวัดเอง `input` จะเก็บพิกัดและ UTC ที่เลือกแล้ว ส่วน `profile.referenceMode` บอกว่าใช้ `"auto"`, `"traditional"` หรือ `"explicit"` หากใช้วิธีเดิมแทน จะมี `profile.referenceFallback` เป็น `"year-out-of-range"`, `"missing-province"` หรือ `"explicit-correction"`

หากระบุ `ascendantReference` หรือ `planetaryTimeReference` จะใช้ตามที่ส่งมา ไม่เติมอีกตัวเลือกหรือเปลี่ยนความละเอียดอาทิตย์ขึ้นให้เอง ประเทศอย่างเดียวไม่เปิดโหมดเลือกสถานที่อัตโนมัติ สำหรับต่างประเทศให้ใช้ตัวช่วยสถานที่และ UTC ด้านล่าง และไม่บวกค่าแก้จังหวัดซ้ำกับอาทิตย์ขึ้น

UTC อัตโนมัติใช้ข้อมูล IANA ผ่าน `Intl` ของระบบ เวลาท้องถิ่นที่ไม่มีจริงหรือซ้ำกันจะเป็นข้อผิดพลาด ไม่เปลี่ยนไปใช้วิธีเดิมโดยเงียบ ๆ หากต้องการคำนวณซ้ำข้ามเวอร์ชันระบบ ให้เก็บ `input.ascendantReference` และ `input.planetaryTimeReference` ไว้แล้วส่งสองค่านี้โดยตรง จะไม่ค้นเขตเวลาใหม่

การเปลี่ยนค่าเริ่มต้นนี้มีผลกับดวงกำเนิดและดาวจรแบบมีโครงสร้างที่เคยระบุเพียงจังหวัด เลือก `referenceMode: "traditional"` เพื่อคงผลเดิม ส่วน `calculateDetailedPositions()` และ `generateThaiAstrologyChart()` ยังใช้ค่าเริ่มต้นเดิม

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

## เวลาอาทิตย์ขึ้นตามพิกัด

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

รองรับวันที่ ค.ศ. 1900–2100 ทั้งในและนอกประเทศไทย ใช้โมเดล NOAA/Meeus กับขอบฟ้าระดับทะเลที่ศูนย์กลางอาทิตย์ต่ำกว่าขอบฟ้า 50′ ไม่ชดเชยภูเขา ความสูง หรืออากาศจริง ต้องส่ง UTC offset ที่ใช้ในวันนั้นเอง พิกัดไม่กำหนดเขตเวลาและไม่มีการค้น DST อัตโนมัติ

`calculateSunrise()` คืน `status: "rise"` พร้อม `timeMinutes` ก่อนปัดค่า (0 ถึงน้อยกว่า 1440), `roundedTimeMinutes` สำหรับแสดงผลหรือใช้กับความละเอียดระดับนาที (อาจเป็น 1440 หรือ 24:00) และ `altitudeResidualDegrees` ซึ่งเป็นเศษเชิงตัวเลข ไม่ใช่ความแม่นยำทางกายภาพ หากวันนั้นไม่มีอาทิตย์ขึ้น คืน `status: "no-rise"` การใช้ตัวเลือกนี้กับดวงที่ไม่มีอาทิตย์ขึ้นจะ throw `RangeError`; ถ้าต้องการวิธีเดิมใน API แบบมีโครงสร้าง ให้เลือก `referenceMode: "traditional"` และไม่ระบุจุดอ้างอิง ส่วน API ระดับล่างให้เว้น `ascendantReference`

`timePrecision: "minute"` ใช้เวลาอาทิตย์ขึ้นที่ปัดเป็นนาทีใกล้ที่สุดกับลัคนาและเวลาเริ่มทั้ง 12 ราศี เมื่อส่งจุดอ้างอิงเอง หากไม่ระบุความละเอียดหรือใช้ `"continuous"` จะใช้เวลาก่อนปัดและคงผลเดิม ส่วนการเลือกจังหวัดอัตโนมัติใช้ `"minute"` ค่านี้ส่งผ่าน `createSunriseReference` และ `createSunriseReferenceForLocation` ได้ด้วย ไม่เปลี่ยนเวลาอาทิตย์ขึ้นดิบ สมผุสดาวหรือวันจันทรคติ ถ้าปัดได้ 24:00 จะใช้ 00:00 ในวงรอบลัคนา ไม่เลื่อนวันที่

ค่าแก้เวลาจังหวัดเป็นศูนย์ หากส่ง `localTimeCorrectionMinutes` ที่ไม่ใช่ศูนย์ร่วมกันจะถูกปฏิเสธ เลือกตัวเลือกเดียวกันได้ใน `CalculationInput`; `generateThaiAstrologyChart` ต้องระบุ `method: "suriyayatra"`

`ascendantReference` เปลี่ยนจุดอ้างอิงลัคนา อันโตนาทียังคงที่และอาทิตย์คงตำแหน่งเวลาเกิด หากไม่เลือก `planetaryTimeReference` สมผุสดาวยังใช้นาฬิกา civil-local แบบ traditional; offset ใน sunrise ไม่เลื่อนสมผุสดาว จึงยังไม่ใช่การคำนวณลัคนาเรขาคณิตหรือสมผุสดาราศาสตร์ทั่วโลก

## เลือกจังหวัดและประเทศ

เลือกจังหวัดเพื่อเติมพิกัด แล้วเอนจินหาอาทิตย์ขึ้นจากวันที่ในดวงให้อัตโนมัติ:

```ts
import { calculateThaiHoroscope, createSunriseReference, getThaiAstrologyProvinceLocations, getThaiAstrologyCountries } from "thai-astrology"

const provinceOptions = getThaiAstrologyProvinceLocations() // 77 จังหวัด พร้อมพิกัดที่แก้ไขได้
const countryOptions = getThaiAstrologyCountries() // 250 ประเทศ/ดินแดน ชื่อภาษาอังกฤษ
const reference = createSunriseReference({ province: "กรุงเทพมหานคร", utcOffsetHours: 7, timePrecision: "minute" })
const provincial = calculateThaiHoroscope({
  date: { year: 2024, era: "CE", month: 6, day: 21 },
  time: { hour: 8, minute: 30 },
  ascendantReference: reference,
  planetaryTimeReference: {
    civilUtcOffsetSeconds: Math.round(reference.utcOffsetHours * 3600),
    referenceUtcOffsetSeconds: 6 * 3600 + 42 * 60 + 4,
  },
})
console.log(provincial.timing.sunrise?.roundedTimeMinutes) // 352 = 05:52
```

```ts
import { calculateThaiHoroscope, createSunriseReference } from "thai-astrology"

// นิวยอร์กใช้ EDT (UTC−4) ในวันที่ตัวอย่าง ประเทศเป็นข้อมูลเลือกใส่
const foreign = createSunriseReference({
  countryCode: "US", latitude: 40.7128, longitude: -74.006, utcOffsetHours: -4,
  timePrecision: "minute",
})
const foreignChart = calculateThaiHoroscope({
  date: { year: 2024, era: "CE", month: 6, day: 21 },
  time: { hour: 8, minute: 30 },
  ascendantReference: foreign,
  planetaryTimeReference: {
    civilUtcOffsetSeconds: Math.round(foreign.utcOffsetHours * 3600),
    referenceUtcOffsetSeconds: 6 * 3600 + 42 * 60 + 4,
  },
})
console.log(foreignChart.timing.sunrise?.roundedTimeMinutes) // 325 = 05:25
```

`getThaiAstrologyProvinceLocations()` คืนรายการใหม่ทุกครั้ง มี `province`, `countryCode: "TH"`, `latitude`, `longitude`, `timeZone: "Asia/Bangkok"`, `coordinateKind: "province-seat"` และ `geonameId` ที่เปิดตรวจจุดต้นทางได้ พิกัด WGS84 เป็นเมืองศูนย์กลางจังหวัด ไม่ใช่ขอบเขตจังหวัดหรือสถานที่เกิดของทุกคน `timeZone` เป็นข้อมูลประกอบ; เอนจินไม่มีการค้น offset จากชื่อนี้ รายการจังหวัดเดิม `getThaiAstrologyProvinces()` ยังคงคืนค่าแก้เวลาแบบเดิม

`createSunriseReference()` รับ `province` หรือพิกัดทั้งคู่ พร้อม `utcOffsetHours` เสมอ หากระบุจังหวัดและพิกัดทั้งคู่จะใช้พิกัดที่ระบุ ไม่ผสมค่าข้างหนึ่งกับพิกัดจังหวัด ส่งผลลัพธ์เข้า `ascendantReference` ของดวงกำเนิด/ดวงจรได้โดยตรง วันที่ของแต่ละดวงกำหนดอาทิตย์ขึ้นใหม่ ไม่เก็บเวลาอาทิตย์ขึ้นคงที่ประจำจังหวัด

`getThaiAstrologyCountries()` คืนชื่ออังกฤษและรหัสสองตัว 250 ประเทศ/ดินแดน รวม `XK` ตาม GeoNames และไม่รวม `AN`/`CS` ที่ยุบแล้ว `countryCode` เลือกใส่ในตัวช่วยได้ ใช้รหัสตัวพิมพ์ใหญ่จากรายการ ประเทศเพียงอย่างเดียวยังไม่พอ ต้องระบุพิกัดและ offset; ไม่ตรวจพรมแดนและไม่เดา DST ประเทศอื่นใช้ร่วมกับชื่อจังหวัดไทยไม่ได้ หากเปลี่ยนประเทศในฟอร์มให้ล้างจังหวัดและค่าพิกัดเดิมก่อนรับสถานที่ใหม่

ข้อมูลสถานที่จาก [GeoNames](https://www.geonames.org/) ดึง 4 ตุลาคม 2026 ภายใต้ [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) โดยลดรูปเป็นข้อมูลที่จำเป็นต่อรายการเลือก ใช้ชื่อจังหวัดเดิมของไลบรารี ดู [แหล่งอ้างอิงและสัญญาอนุญาต](../SOURCES.md)

## ค้นหาสถานที่ตามประเทศและหา offset

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

`searchThaiAstrologyLocations({ countryCode, query?, limit?, offset? })` กำหนดประเทศด้วยรหัสจาก `getThaiAstrologyCountries()` แล้วค้นชื่อเมืองภาษาอังกฤษหรือชื่อจังหวัดภาษาไทย การค้นไม่แยกตัวพิมพ์และรองรับอักษรละตินที่มีเครื่องหมายกำกับ คืน `{ items, total }` โดย `total` นับก่อนแบ่งหน้า `limit` เริ่มต้น 50 สูงสุด 100; `offset` เป็นจำนวนเต็มไม่ติดลบ แต่ละจุดมี `id`, `countryCode`, `nameEnglish`, พิกัด, `timeZone`, `coordinateKind` และ `geonameId`; จังหวัดไทยมี `nameThai` และ `province` ด้วย รายการผลลัพธ์เป็นสำเนาใหม่ทุกครั้ง ลำดับคงที่ตาม snapshot

รายการเริ่มต้นมีเมืองหลวง เมืองใหญ่สิบอันดับจากข้อมูลต้นทางต่อประเทศ เมืองใหญ่ที่สุดที่มีข้อมูลต่อเขตเวลา และจังหวัดไทยครบ 77 จุด รวม 1,945 จุดใน 243 ประเทศ/ดินแดน ไม่ใช่ทุกเมืองหรือทุกเขตเวลาทั่วโลก ประเทศที่ไม่มีรายการจะได้ `items: []`; ไม่แทนด้วยเมืองจากประเทศอื่น ใช้พิกัดเองได้ ข้อมูล GeoNames ภายใต้ CC BY 4.0 ถูกลดรูปโดยไม่เปลี่ยนค่าพิกัดหรือชื่อเขตเวลา

`createSunriseReferenceForLocation()` รับ `locationId` จากผลค้น หรือพิกัดทั้งคู่ `countryCode` เลือกใส่ได้และต้องตรงกับประเทศของ ID ที่เลือก หากส่ง `utcOffsetHours` จะใช้ค่านั้นและไม่เรียก `Intl` หากไม่ส่ง ต้องมี `civilTime: { yearCe, month, day, hour, minute }` และใช้เขตเวลาของสถานที่หรือ `timeZone` ที่ระบุเอง เพื่อหา offset ตามวันเวลาเกิด รองรับ ค.ศ. 1900–2100

แก้พิกัดทั้งคู่แทนจุดเริ่มต้นได้ แต่โหมดอัตโนมัติต้องระบุ `timeZone` ที่ตรวจแล้วด้วย หรือส่ง UTC offset เอง ไม่เดาเขตเวลาจากพิกัดที่แก้ เพราะอาจข้ามพรมแดนเขตเวลา หากเปลี่ยนประเทศในฟอร์มให้ล้างสถานที่ พิกัด และเขตเวลาเดิมก่อนเลือกใหม่

`resolveCivilTimeOffset(civilTime, timeZone, disambiguation?)` คืน `timeZone`, `utcOffsetHours`, `utcEpochMilliseconds` และ `ambiguous` ใช้กฎ IANA ผ่าน `Intl.DateTimeFormat` ของ runtime โดยไม่อ่านเขตเวลาหรือเวลาปัจจุบันของเครื่อง ค่าเริ่มต้น `disambiguation: "reject"` ปฏิเสธเวลาซ้ำ หากต้องการให้เลือก `"earlier"` หรือ `"later"` อย่างชัดเจน เวลาที่ไม่มีจริงช่วงเลื่อนนาฬิกาหรือวันที่ข้ามจะถูกปฏิเสธเสมอ ไม่เลื่อนเวลาเกิดให้เอง

ตัวช่วยนี้เป็น adapter สำหรับรับข้อมูล แกนคำนวณเดิมยังรับ offset ตัวเลขและให้ผลคงที่เมื่อข้อมูลเหมือนกัน กฎของ `Intl` อาจต่างตามเวอร์ชันฐานข้อมูลเวลา สำหรับงานที่ต้องทำซ้ำเหมือนเดิมให้เก็บ offset ที่ resolve แล้วและเวอร์ชัน runtime หรือระบุ UTC เอง หาก runtime ไม่รองรับชื่อเขตเวลา ให้ระบุ offset ที่ตรวจสอบแล้ว

Offset อัตโนมัติอ้างอิงเวลาที่กรอก โมเดลอาทิตย์ขึ้นเดิมยังใช้ offset เดียวตลอดวัน หากวันนั้นเปลี่ยน DST เวลาอาทิตย์ขึ้นที่แสดงใช้กรอบ offset ที่เลือก; ยังไม่ได้จำลองนาฬิกา civil ที่เปลี่ยนภายในวัน และไม่ได้เพิ่มลัคนาเรขาคณิตหรือเลื่อนสมผุสดาวเป็นนาฬิกา UTC

## กรอบเวลาสมผุสดาว

เลือก `planetaryTimeReference` ใน `calculateThaiHoroscope`, `calculateDetailedPositions` หรือ chart wrapper ที่ระบุ `method: "suriyayatra"` ทั้งดวงกำเนิดและดาวจรเลือกแยกกันได้ ไม่รองรับ legacy

```ts
import { calculateThaiHoroscope, resolveCivilTimeOffset } from "thai-astrology"

const civil = { yearCe: 2024, month: 1, day: 1, hour: 0, minute: 0 }
const offset = resolveCivilTimeOffset(civil, "Asia/Bangkok")
const chart = calculateThaiHoroscope({
  date: { year: civil.yearCe, era: "CE", month: civil.month, day: civil.day },
  time: { hour: civil.hour, minute: civil.minute },
  planetaryTimeReference: {
    civilUtcOffsetSeconds: Math.round(offset.utcOffsetHours * 3600),
    referenceUtcOffsetSeconds: 6 * 3600 + 42 * 60 + 4,
  },
})
console.log(chart.diagnostics.planetaryTime?.dayOffset) // -1
console.log(chart.diagnostics.planetaryTime?.secondOfDay) // 85324
```

ทั้งสอง offset ต้องเป็นวินาทีจำนวนเต็มตั้งแต่ -50,400 ถึง 50,400 โดย civil รวม DST ของเวลาเกิด และ reference เป็นกรอบที่ผู้ใช้เลือกเอง สูตรคือ `เวลา reference = เวลา civil − offset civil + offset reference` ทดวันได้รวมถึงข้ามปี/วันอธิกสุรทิน; ถ้าวัน reference หลุด ค.ศ. 1–9999 จะปฏิเสธ ไม่มีการปัดกรอบเป็นนาทีหรือทำ 23:59 ให้เป็น 24:00

ตัวอย่าง +06:42:04 มาจากข้อมูลเวลาพลเรือน IANA ไม่รับรองว่าเป็นเมริเดียนของทุกสูตรสุริยยาตร์ ประเทศ/พิกัดไม่เลือกรอบดาวอัตโนมัติ สำหรับต่างประเทศให้ resolve offset ของสถานที่และวันเวลานั้น แล้วใช้กรอบดาวที่ได้ตรวจหลักฐานแล้ว `Math.round` ข้างบนเพียงคืน offset IANA ที่มีหน่วยวินาทีจากการแทนเป็นชั่วโมง ไม่ใช่การจูนสมผุสดาว

API ระดับล่างยังใช้เวลาดาวตามเวลาท้องถิ่นเมื่อไม่ระบุตัวเลือกนี้ ส่วน API แบบมีโครงสร้างจะเติมให้เมื่อเลือกจังหวัดอัตโนมัติ ใช้ `referenceMode: "traditional"` เพื่อคงเวลาดาวเดิม ระบุ offset เท่ากันก็ให้ค่าคำนวณเดิมพร้อม diagnostics เพิ่ม เมื่อกรอบต่างกัน ขั้นเวลาในรอบอาทิตย์/จันทร์/เกตุใช้เศษส่วนวินาทีแบบจำนวนเต็มก่อนหาร จึงรักษาวินาทีของกรอบอ้างอิง วัน civil, `calendar.chulaSakarat`, วันจันทรคติ และทักษาคงเดิม แต่ดิถีเชิงมุมจันทร์–อาทิตย์อิงสมผุสที่เปลี่ยน เวลาและอาทิตย์ขึ้นของลัคนาอยู่ในกรอบ civil; ตำแหน่งอาทิตย์ใหม่อาจทำให้ลัคนาและเรือนเปลี่ยน หากใช้ sunrise ร่วมกัน offset civil ทั้งสองตัวเลือกต้องตรงกัน

`diagnostics.planetaryTime` เพิ่มเฉพาะเมื่อเลือก มี `horakhun`, `secondOfDay`, `dayOffset` และ offset ทั้งสอง จ.ศ. สำหรับ epoch ดาวใช้กรอบที่เลือก ขณะที่ จ.ศ. ปฏิทินยังอิง civil โมเดลนี้เป็นการแปลงกรอบคำนวณแบบ fixed offset ไม่ใช่การแปลง UT1/TT หรือจำลอง leap seconds

ในขั้นมัธยมอาทิตย์ สูตรปัจจุบันลดรอบปีที่ฐานวันก่อนบวกหน่วยเวลา ส่วน `diagnostics.solarCycleUnits` ยังลดรอบผลรวมตามเดิมเพื่อใช้กับการเลือกปี epoch จึงไม่ควรนำค่านี้ไปหารเป็นมัธยมอาทิตย์โดยตรงใกล้รอยต่อปี

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

สร้างตัวเลือกคำนวณแยกตามวันที่ของแต่ละดวง ตัวอย่างนี้ใช้จังหวัดและเวลาเดียวกันในสองปี หากดวงจรอยู่คนละสถานที่ ให้สร้างพิกัดอาทิตย์ขึ้นและ UTC ของดวงจรเอง

```ts
import {
  calculateHoroscopeTransits,
  createSunriseReference,
  resolveCivilTimeOffset,
} from "thai-astrology"
import type { HoroscopeInput } from "thai-astrology"

function inputForYear(yearCe: number): HoroscopeInput {
  const birth = { yearCe, month: 9, day: 15, hour: 8, minute: 30 }
  const { utcOffsetHours } = resolveCivilTimeOffset(birth, "Asia/Bangkok")
  return {
    date: { year: yearCe, era: "CE", month: birth.month, day: birth.day },
    time: { hour: birth.hour, minute: birth.minute },
    ascendantReference: createSunriseReference({
      province: "เชียงใหม่", utcOffsetHours, timePrecision: "minute",
    }),
    planetaryTimeReference: {
      civilUtcOffsetSeconds: Math.round(utcOffsetHours * 3600),
      referenceUtcOffsetSeconds: 6 * 3600 + 42 * 60 + 4,
    },
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

## วิธี traditional

เลือก `referenceMode: "traditional"` และเว้นจุดอ้างอิงทั้งสอง เพื่อคงเวลาดาวตามเวลาท้องถิ่นที่กรอกและลัคนาอ้างอิง 06:00 พร้อมค่าแก้จังหวัด ทั้งสองโหมดใช้ปฏิทินจันทรคติปัจจุบันเหมือนกัน นี่เป็นการเลือกวิธีคำนวณ ไม่ใช่เวอร์ชันไลบรารี

```ts
import { calculateThaiHoroscope } from "thai-astrology"

const horoscope = calculateThaiHoroscope({
  date: { year: 2024, era: "CE", month: 9, day: 15 },
  time: { hour: 8, minute: 30 },
  location: { province: "เชียงใหม่" },
  referenceMode: "traditional",
})

console.log(horoscope.profile.referenceMode) // traditional
```

## ตารางฟังก์ชันและข้อมูลนำเข้า

| ฟิลด์นำเข้า | ชนิดและเงื่อนไข |
| --- | --- |
| `date.year`, `date.era` | ปีจำนวนเต็ม ใช้ `"BE"` สำหรับ พ.ศ. 544-10542 หรือ `"CE"` สำหรับ ค.ศ. 1-9999 |
| `date.month`, `date.day` | เดือน 1-12 และวันที่ที่มีอยู่จริงตามปฏิทินเกรกอเรียน ทั้งสองค่าเป็นจำนวนเต็ม |
| `time.hour`, `time.minute` | เวลาเกิดตามเวลาท้องถิ่น ชั่วโมง 0-23 นาที 0-59 เป็นจำนวนเต็ม |
| `referenceMode` | ไม่บังคับ ใช้ `"auto"` เป็นค่าเริ่มต้น หรือ `"traditional"` เพื่อคงวิธีเดิม หากระบุจุดอ้างอิงเองจะใช้ตามที่ส่ง |
| `location.province` | ไม่บังคับ ใช้ชื่อจังหวัดภาษาไทยจาก `getThaiAstrologyProvinces()` |
| `location.localTimeCorrectionMinutes` | ไม่บังคับ จำนวนนาทีตั้งแต่ -1440 ถึง 1440 ใช้แทนค่าแก้เวลาของจังหวัด |
| `planetaryTimeReference` | ไม่บังคับ ระบุ `civilUtcOffsetSeconds` และ `referenceUtcOffsetSeconds` เป็นวินาทีจำนวนเต็ม ช่วง ±50,400 |
| `ascendantReference` | ไม่บังคับ เลือก `method: "sunrise"` พร้อม `latitude` (-90..90), `longitude` (-180..180) และ `utcOffsetHours` (-14..14) ที่รวม DST แล้ว |

เมื่อใช้จุดอ้างอิงเดิม หากไม่ระบุจังหวัดหรือค่าแก้เวลา จะใช้ค่าแก้เวลาเป็นศูนย์ ชื่อจังหวัดที่ไม่อยู่ในรายการต้องระบุค่าแก้เวลาเอง ค่านี้ปรับจุดอ้างอิง 06:00 ของการหาลัคนา ไม่ใช่เขตเวลาหรือ UTC offset สำหรับต่างประเทศต้องหาหรือระบุ UTC offset ที่รวม DST ก่อนส่งข้อมูล

| API | ผลลัพธ์ |
| --- | --- |
| `calculateThaiHoroscope(input)` | `ThaiHoroscope`: ดวงกำเนิดแบบมีโครงสร้าง ใช้สุริยยาตร์เสมอ |
| `calculateHoroscopeTransits(natalInput, transitInput)` | ดวงกำเนิด ดวงจร และผลเปรียบเทียบ |
| `validateHoroscopeInput(input)` | `{ valid: true, value }` หรือ `{ valid: false, issues }` โดยไม่ throw เมื่อข้อมูลผิด |
| `getThaiAstrologyProvinces()` | รายการ 77 จังหวัด แต่ละรายการมี `province` และ `localTimeCorrectionMinutes` |
| `getThaiAstrologyProvinceLocations()` | 77 จังหวัดพร้อมพิกัดเมืองศูนย์กลางสำหรับอาทิตย์ขึ้น |
| `getThaiAstrologyCountries()` | ชื่อภาษาอังกฤษและรหัสประเทศ/ดินแดนสำหรับรายการเลือก |
| `createSunriseReference(selection)` | ใช้พิกัดจังหวัดหรือพิกัดจริง สร้างตัวเลือกอาทิตย์ขึ้น |
| `searchThaiAstrologyLocations(input)` | ค้นหาสถานที่ตามประเทศและชื่อ คืนพิกัด เขตเวลา จำนวนทั้งหมด และหน้าผลลัพธ์ |
| `createSunriseReferenceForLocation(input)` | สร้าง reference จากสถานที่ พร้อม offset ตามวันเกิดหรือ UTC ที่ระบุเอง |
| `resolveCivilTimeOffset(input, timeZone)` | หา offset ของเวลา civil ตามกฎเขตเวลา และตรวจเวลาซ้ำ/เวลาขาด |
| `calculateSunrise(input)` | เวลาอาทิตย์ขึ้นตามวัน พิกัด และ UTC offset หรือผล `status: "no-rise"` |
| `calculateDetailedPositions(input)` | สมผุสและข้อมูลประกอบแบบละเอียด ใช้สุริยยาตร์ รับ `CalculationInput` |
| `generateThaiAstrologyChart(input)` | ช่องดวงแบบเดิม ค่าเริ่มต้นเป็น `legacy`; เลือก `method: "suriyayatra"` ได้ |

API แบบเดิมใช้ `day`, `monthTh`, `hour`, `minute`, `province` และปีอย่างใดอย่างหนึ่ง: `yearBe` คือ พ.ศ. ส่วน `yearBc` คือ **ค.ศ.** แม้ชื่อฟิลด์จะเป็น `yearBc` ตัวอย่าง `yearBe: 2567` เท่ากับ `yearBc: 2024`

### ข้อมูลเกิดที่ไม่ทราบ

ต้องระบุเวลาเกิด ไม่มีโหมดวันเกิดอย่างเดียวหรือชั่วโมงเริ่มต้น หากใช้เวลาสมมติ ให้เก็บสมมติฐานนั้นและอย่าถือผลที่อิงลัคนาว่าแน่นอน เมื่อไม่ทราบจังหวัด เว้น `location` ได้เพื่อใช้ค่าแก้เวลาเป็นศูนย์ ส่วนอาทิตย์ขึ้นตามสถานที่ต้องมีพิกัดและ UTC offset ที่ทราบ ประเทศอย่างเดียวไม่พอ

## ตรวจข้อมูลและชนิดข้อมูล

แปลงช่องตัวเลขจากฟอร์มก่อนสร้างข้อมูลดวง เช่น `"8"` เป็นข้อความ แต่ `8` คือชั่วโมง ตรวจว่าไม่ว่างก่อนแปลงค่า ตรวจ `date`/`time` ก่อน แล้วจึงหาสถานที่/UTC และประกอบตัวเลือกตามตัวอย่างด้านบน เมื่อประกอบครบแล้วตรวจข้อมูลทั้งชุดได้อีกครั้ง

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

`validateHoroscopeInput()` รับ `unknown` และไม่แปลงข้อความเป็นตัวเลข เมื่อไม่ผ่าน `issues` จะบอก `field`, `code` (`required`, `type`, `range`, `unknown`) และ `message` เมื่อผ่าน `value` มีจุดอ้างอิงที่เลือกและเหตุผลเมื่อใช้วิธีเดิม พร้อมข้อมูลที่จัดรูปแบบแล้ว มีทั้ง `date.yearBe` และ `date.yearCe` ไม่ใช่รูปแบบนำเข้าสำหรับส่งกลับไปคำนวณ

`calculateThaiHoroscope()` และ `calculateHoroscopeTransits()` จะ throw `HoroscopeInputError` เมื่อข้อมูลไม่ถูกต้อง อ่านรายการข้อผิดพลาดได้จาก `error.issues` ชนิดข้อมูลทั้งหมด รวมถึง `profile`, `timing` และ `diagnostics` ดูได้ใน [horoscope.ts](../src/horoscope.ts), [DetailedPosition](../src/engine/astro/suriyayatra.ts) และ [CalculationInput](../src/engine/astro-calculation.ts)

ดู [หลักการและข้อจำกัด](../README.md#หลักการและข้อจำกัด) ก่อนนำผลไปใช้
