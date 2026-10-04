<h1 align="center">Thai Astrology - ไลบรารีโหราศาสตร์ไทย</h1>

<p align="center">
  ผูกดวงกำเนิด คำนวณลัคนาและดาวจรตามหลักสุริยยาตร์ใน JavaScript และ TypeScript
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/thai-astrology"><img src="https://img.shields.io/npm/v/thai-astrology?color=cb3837" alt="npm version" /></a>
  <a href="https://github.com/kongesque/thai-astrology"><img src="https://img.shields.io/badge/GitHub-thai--astrology-181717?logo=github" alt="GitHub repository" /></a>
  <a href="https://github.com/kongesque/thai-astrology/actions/workflows/ci.yml"><img src="https://github.com/kongesque/thai-astrology/actions/workflows/ci.yml/badge.svg" alt="CI status" /></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-2563eb" alt="MIT License" /></a>
</p>

<p align="center">
  <a href="README-en.md">English</a> &nbsp;|&nbsp;
  <a href="#ผูกดวงกำเนิดและคำนวณลัคนา">เริ่มใช้งาน</a> &nbsp;|&nbsp;
  <a href="#api-คำนวณโหราศาสตร์ไทย">API</a> &nbsp;|&nbsp;
  <a href="https://github.com/kongesque/thai-astrology/issues">แจ้งปัญหา</a>
</p>

`thai-astrology` เป็น **ไลบรารีโอเพนซอร์สสำหรับคำนวณโหราศาสตร์ไทยด้วย JavaScript และ TypeScript** ใช้ผูกดวงกำเนิด คำนวณลัคนา สมผุสดาว และดาวจรตามหลักสุริยยาตร์ พร้อมข้อมูลทักษาและปฏิทินจันทรคติไทย ระบุวันเวลาเกิด พิกัด และกรอบเวลาคำนวณ แล้วอ่านตำแหน่งดาวและข้อมูลดวงจากผลลัพธ์ได้โดยตรง

นำไปใช้ในเว็บผูกดวง แอปโหราศาสตร์ หรือบริการ API ได้ ทั้งหน้าคำนวณลัคนา การดูดาวจรเทียบดวงกำเนิด และปฏิทินจันทรคติ รวมถึงใช้ศึกษาหรือทดลองคำนวณสุริยยาตร์ ผลลัพธ์แปลงเป็น JSON เพื่อนำไปแสดงผลหรือแปลผลตามหลักพยากรณ์ที่ใช้ได้ เมื่อใช้ข้อมูลเดิม ผลคำนวณก็จะเหมือนเดิมเสมอ

รองรับ **Node.js 16+**, ESM และ CommonJS พร้อม TypeScript types ใช้ในเบราว์เซอร์ผ่าน bundler ได้ โดยไม่มี runtime dependencies

<p align="center">
  <img src="assets/rasi-chart.svg" alt="ตัวอย่างผูกดวงกำเนิดสุริยยาตร์: ราศีจักรเลขไทยและลัคนาเมษ" width="100%" />
</p>

<p align="center">
  <sub><a href="https://github.com/kongesque/thai-astrology/blob/main/scripts/render-readme-chart.cjs">ตัวอย่างราศีจักรสุริยยาตร์</a> · 21 เมษายน พ.ศ. 2325 เวลา 06:54 น. กรุงเทพมหานคร</sub><br />
  <sub>เลขไทยแทนดาว <code>ลั</code> แทนลัคนา และ <code>*</code> แทนตนุเศษ</sub>
</p>

## คำนวณอะไรได้บ้าง

- **ดวงกำเนิด:** สมผุสดาว 10 ดวง ลัคนา ภพ เจ้าเรือน ตนุเศษ นักษัตรฤกษ์ ประเภทฤกษ์ และมาตรฐานดาว
- **จักรทั้งสาม:** ราศีจักร นวางค์จักร และตรียางค์จักร พร้อมช่องดวงที่เลือกใช้เลขไทยหรืออารบิกได้
- **ดาวจรและปฏิทิน:** ตำแหน่งดาวจรเทียบดวงกำเนิด ทักษา ดิถี และวันเดือนปีตามปฏิทินจันทรคติไทย

## ผูกดวงกำเนิดและคำนวณลัคนา

```bash
npm install thai-astrology
```

แนวทางหลักสำหรับผูกดวงคือ ใช้วันเวลาเกิดตามนาฬิกาท้องถิ่น หา UTC offset ตามวันเกิด แล้วส่งทั้งกรอบสมผุสดาว (`planetaryTimeReference`) และอาทิตย์ขึ้นตามพิกัด (`ascendantReference`) แอปเติมพิกัดจากจังหวัด/เมืองและหา offset ให้ได้ ผู้ใช้ไม่ต้องกรอกค่ากรอบดาวเอง

ตัวอย่างนี้กำหนดกรอบดาว +06:42:04 ในแอป โดยอ้างอิงกรอบกรุงเทพฯ จากข้อมูล IANA ไม่ใช่กรอบบังคับของทุกตำรา ทั้งสองฟิลด์ต้องส่งอย่างชัดเจน API ไม่เปิดให้เองเมื่อเว้นค่า ดู [วิธี traditional](#วิธี-traditional) สำหรับการเรียกแบบเดิม

```ts
import { calculateThaiHoroscope, createSunriseReference, resolveCivilTimeOffset } from "thai-astrology"

const civilTime = { yearCe: 2024, month: 9, day: 15, hour: 8, minute: 30 }
const { utcOffsetHours } = resolveCivilTimeOffset(civilTime, "Asia/Bangkok")
const ascendantReference = createSunriseReference({ province: "เชียงใหม่", utcOffsetHours, timePrecision: "minute" })
const planetaryTimeReference = {
  civilUtcOffsetSeconds: Math.round(utcOffsetHours * 3600),
  referenceUtcOffsetSeconds: 6 * 3600 + 42 * 60 + 4,
}

const horoscope = calculateThaiHoroscope({
  date: { year: civilTime.yearCe, era: "CE", month: civilTime.month, day: civilTime.day },
  time: { hour: civilTime.hour, minute: civilTime.minute },
  ascendantReference,
  planetaryTimeReference,
})

console.log(horoscope.points.sun.degrees, horoscope.points.sun.minutes) // 27 56
console.log(horoscope.points.ascendant.signName) // กันย์
console.log(horoscope.timing.sunrise?.roundedTimeMinutes) // 372 = 06:12
```

ถ้าใช้ CommonJS ให้เปลี่ยน `import` เป็น `const { calculateThaiHoroscope, createSunriseReference, resolveCivilTimeOffset } = require("thai-astrology")`

ภาพประกอบด้านบนใช้ดวง ค.ศ. 1782 ด้วยวิธี traditional เป็นคนละดวงกับตัวอย่างเริ่มต้น

### วันเกิด เวลาเกิด และจังหวัด

| ข้อมูล | วิธีระบุ |
| --- | --- |
| `date` | วันที่ตามปฏิทินเกรกอเรียน ใช้ `era: "BE"` สำหรับ พ.ศ. หรือ `"CE"` สำหรับ ค.ศ. เช่น พ.ศ. 2567 = ค.ศ. 2024 |
| `time` | ต้องระบุเวลาเกิดตามเวลาท้องถิ่น ชั่วโมง 0-23 และนาที 0-59 |
| `location` (ไม่บังคับ) | ระบุชื่อจังหวัดภาษาไทยใน `province` ดูรายชื่อทั้ง 77 จังหวัดได้จาก `getThaiAstrologyProvinces()` |
| `planetaryTimeReference` | แนวทางหลักส่ง offset civil และกรอบสมผุสดาวเป็นวินาที; เว้นได้สำหรับวิธี traditional |
| `ascendantReference` | แนวทางหลักส่ง `method: "sunrise"`, พิกัด, `utcOffsetHours` รวม DST และ `timePrecision: "minute"` สำหรับเวลาในตาราง; เว้นความละเอียดเพื่อใช้เวลาต่อเนื่องเดิม |

วันและเวลาต้องเป็นค่าที่ถูกต้องและใช้ชนิด `number` เมื่อใช้วิธี traditional หากไม่ระบุจังหวัดจะใช้ค่าแก้เวลาเป็นศูนย์ หากต้องการกำหนดค่าเอง ให้ใส่ `location.localTimeCorrectionMinutes` เป็นจำนวนนาที ค่านี้จะใช้แทนค่าแก้เวลาของจังหวัด ไม่ต้องระบุชื่อหรือเพศในการคำนวณ

### ไม่ทราบสถานที่เกิดหรือเวลาเกิด

- **ไม่ทราบสถานที่เกิด:** ใช้วิธี traditional โดยเว้น `ascendantReference` และ `location` ระบบใช้จุดอ้างอิง 06:00 และค่าแก้เวลาเป็นศูนย์ ซึ่งอาจกระทบลัคนาและเรือนชะตา หากทราบ UTC offset ยังระบุกรอบสมผุสดาวแยกได้
- **ไม่ทราบเวลาเกิด:** ต้องระบุ `time` เสมอ ยังไม่มีเวลาเริ่มต้นหรือโหมดวันเกิดอย่างเดียว
- **เมื่อใช้เวลาสมมติ:** ระบุสมมติฐานให้ชัดและงดใช้ผลที่อิงลัคนา ตำแหน่งดาวเป็นค่าประมาณ และทักษาอาจต่างกันก่อนหรือหลัง 06:00

API สุริยยาตร์ระดับล่างใช้ `province: "ไม่ระบุจังหวัด"` สำหรับค่าแก้เวลาเป็นศูนย์ (ยังรองรับชื่อเดิม `"ไม่ใช้จังหวัด"`) ส่วน legacy ใช้ 18 นาทีเมื่อไม่รู้จักจังหวัดและไม่ได้กำหนดค่าแก้เวลาเอง เพื่อคงพฤติกรรมเดิม ไม่ใช่การประมาณสถานที่เกิด

### อาทิตย์ขึ้นตามพิกัด

ใช้ `timePrecision: "minute"` เพื่อปัดเวลาอาทิตย์ขึ้นเป็นนาทีใกล้ที่สุดก่อนหาลัคนา ค่าอาทิตย์ขึ้นก่อนปัดยังอ่านได้จาก `timing.sunrise.timeMinutes` ไม่ระบุหรือใช้ `"continuous"` จะคงผลเดิม การปัดเป็นการเลือกความละเอียดของเวลาอ้างอิง ไม่เพิ่มความแม่นยำทางกายภาพของเวลาอาทิตย์ขึ้น

```ts
const seasonal = calculateThaiHoroscope({
  date: { year: 2024, era: "CE", month: 6, day: 21 },
  time: { hour: 8, minute: 30 },
  ascendantReference: {
    method: "sunrise", latitude: 13.7563, longitude: 100.5018, utcOffsetHours: 7,
    timePrecision: "minute",
  },
  planetaryTimeReference: { civilUtcOffsetSeconds: 7 * 3600, referenceUtcOffsetSeconds: 6 * 3600 + 42 * 60 + 4 },
})
console.log(seasonal.timing.sunrise?.roundedTimeMinutes) // 352 = 05:52
```

ตัวเลือกนี้รองรับ ค.ศ. 1900–2100 เก็บเวลาอาทิตย์ขึ้นก่อนปัดค่าไว้ และไม่บวกค่าแก้เวลาจังหวัดซ้ำ ต้องระบุ UTC offset เอง รองรับการหาอาทิตย์ขึ้นต่างประเทศ แต่ลัคนายังคงใช้อันโตนาทีคงที่ และสมผุสดาวใช้เวลาท้องถิ่นแบบ traditional เมื่อไม่เลือกกรอบเวลาต่างหาก จึงไม่ใช่เอนจินลัคนาเรขาคณิตทั่วโลก ดู [`calculateSunrise()` และกรณีไม่มีอาทิตย์ขึ้น](docs/api.md#เวลาอาทิตย์ขึ้นตามพิกัด) ในคู่มือ

เลือกจังหวัดเพื่อเติมพิกัด แล้วเอนจินหาอาทิตย์ขึ้นจากวันที่ในดวงให้อัตโนมัติ:

```ts
import { calculateThaiHoroscope, createSunriseReference, getThaiAstrologyProvinceLocations, getThaiAstrologyCountries } from "thai-astrology"

const provinceOptions = getThaiAstrologyProvinceLocations() // 77 จังหวัด พร้อมพิกัดที่แก้ไขได้
const countryOptions = getThaiAstrologyCountries() // 250 ประเทศ/ดินแดน ชื่อภาษาอังกฤษ
const reference = createSunriseReference({ province: "กรุงเทพมหานคร", utcOffsetHours: 7 })
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

พิกัดเริ่มต้นเป็นจุดเมืองศูนย์กลางจังหวัดจาก [GeoNames](https://www.geonames.org/) ภายใต้ [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/); ข้อมูลถูกลดรูปเป็นพิกัดและชื่อที่ใช้ในไลบรารี ระบุ `latitude` และ `longitude` ทั้งคู่ใน `createSunriseReference()` เพื่อใช้สถานที่จริงแทนได้ ต่างประเทศใช้พิกัดทั้งคู่พร้อม UTC offset ที่รวม DST ของวันนั้น และเลือกใส่ `countryCode` เช่น `"US"` ได้ รายการประเทศเป็นชื่อสำหรับฟอร์ม ไม่มีพิกัดหรือ UTC ค่าเดียวประจำประเทศ ต้องระบุ offset เองรวมถึงไทยในอดีต ดู [ตัวอย่างต่างประเทศและข้อมูลสถานที่](docs/api.md#เลือกจังหวัดและประเทศ)

**เลือกประเทศ → ค้นหาเมือง → เติมพิกัดและหา UTC offset ตามวันเกิดให้อัตโนมัติ:**

```ts
import { calculateThaiHoroscope, searchThaiAstrologyLocations, createSunriseReferenceForLocation } from "thai-astrology"

const civilTime = { yearCe: 2024, month: 6, day: 21, hour: 8, minute: 30 }
const result = searchThaiAstrologyLocations({ countryCode: "US", query: "New York" })
const city = result.items[0]
if (!city) throw new Error("Location not found")
const reference = createSunriseReferenceForLocation({ locationId: city.id, civilTime })
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

`countryCode` ใช้กรองรายการสถานที่จริงแล้ว ตัวช่วยค้นหาคืนพิกัดและชื่อเขตเวลา IANA; ตัวช่วยสร้าง reference ใช้ `Intl` หา offset ตามวันเวลาเกิด รวม DST และเวลาประวัติศาสตร์ รายการเริ่มต้นมี 1,945 จุดใน 243 ประเทศ/ดินแดน รวมจังหวัดไทยครบ 77 จุด ไม่ใช่รายชื่อทุกเมือง ประเทศที่ไม่มีจุดในรายการยังระบุพิกัดเองได้ หากแก้พิกัดต้องส่งเขตเวลาหรือ UTC ที่ตรวจแล้ว เวลาซ้ำช่วงเปลี่ยน DST ต้องเลือก `earlier`/`later`; เวลาที่ไม่มีจริงจะถูกปฏิเสธ กฎเวลาขึ้นกับฐานข้อมูลของ runtime ดู [ตัวอย่างและขอบเขต](docs/api.md#ค้นหาสถานที่ตามประเทศและหา-offset)

### ระบุกรอบเวลาสำหรับสมผุสดาว

`planetaryTimeReference` เป็นตัวเลือกที่ต้องระบุทั้ง `civilUtcOffsetSeconds` (offset ของเวลาเกิด รวม DST) และ `referenceUtcOffsetSeconds` (offset ของกรอบคำนวณที่เลือก) เป็นวินาทีจำนวนเต็ม ช่วง ±50,400 ระบบแปลงเวลาและทดวันให้ดาว ส่วนวันจันทรคติ ทักษา และนาฬิกาลัคนายังใช้วันเวลา civil เดิม ไม่เดาเมริเดียนจากจังหวัด

```ts
const framed = calculateThaiHoroscope({
  date: { year: 2024, era: "CE", month: 1, day: 1 },
  time: { hour: 0, minute: 0 },
  planetaryTimeReference: {
    civilUtcOffsetSeconds: 7 * 3600,
    referenceUtcOffsetSeconds: 6 * 3600 + 42 * 60 + 4,
  },
})
console.log(framed.diagnostics.planetaryTime?.dayOffset) // -1
console.log(framed.diagnostics.planetaryTime?.secondOfDay) // 85324 = 23:42:04
```

กรอบ +06:42:04 นี้เป็นตัวอย่างกรอบกรุงเทพฯ จาก IANA ไม่ใช่ค่าบังคับของสุริยยาตร์ทุกตำรา หากไม่ระบุตัวเลือก ผลและนาฬิกาเดิมคงอยู่ ใช้ร่วมกับ `ascendantReference` ได้โดย offset civil ต้องตรงกัน ดู [การใช้งาน](docs/api.md#กรอบเวลาสมผุสดาว)

### วิธี traditional

หากต้องการใช้กรอบเวลาเดิม ให้เว้น `planetaryTimeReference` และ `ascendantReference` ดาวใช้เวลา civil ที่ป้อนโดยตรง ลัคนาใช้จุดอ้างอิง 06:00 พร้อมค่าแก้เวลาจังหวัด การเว้น `location` ใช้ค่าแก้เวลาเป็นศูนย์ วันจันทรคติยังใช้สูตรปัจจุบันเหมือนกัน ส่วน `generateThaiAstrologyChart()` ที่ไม่ระบุ `method` ยังคงใช้ legacy

### อ่านตำแหน่งดาว ลัคนา และข้อมูลดวง

| ส่วนของผลลัพธ์ | ข้อมูลที่ได้ |
| --- | --- |
| `points` | สมผุสหรือตำแหน่งดาวและลัคนา พร้อมข้อมูลฤกษ์และมาตรฐานดาว เช่น `points.moon` คือข้อมูลของจันทร์ |
| `houses` | เรือนชะตาทั้ง 12 ภพ ดาวเจ้าเรือน และดาวที่สถิตในแต่ละภพ |
| `factors` | ตนุลัคน์หรือดาวเจ้าเรือนลัคนา (`ascendantRuler`) ตนุเศษ และดาวร่วมราศีกับลัคนา (`ascendantOccupants`) |
| `charts` | ตำแหน่งและช่องดวงของราศีจักร (Rasi) นวางค์จักร (Navamsa) และตรียางค์จักร (Drekkana) |
| `calendar` | วันทางโหราศาสตร์ ดิถี และวันที่ในปฏิทินจันทรคติไทย |
| `taksa` | บริวาร อายุ เดช ศรี มูละ อุตสาหะ มนตรี และกาลกิณี |
| `relationships` | ดาวกุม (ร่วมราศี) เล็ง ตรีโกณ จตุโกณ และโยค โดยนับจากราศี |

เลขราศีเริ่มที่เมษ = 0 ส่วนเลขภพเริ่มที่ตนุ = 1 ช่องดวงเรียงจากเมษถึงมีน ส่วน `houses` เริ่มนับจากลัคนา ค่าสมผุสมีทั้งองศารวม (`longitudeDegrees`) และลิปดารวม (`longitudeArcMinutes`)

อ่านลัคนา ตนุลัคน์ ตนุเศษ ทักษา และวันที่จันทรคติจาก `horoscope` ในตัวอย่างเริ่มต้น:

```ts
// ใช้ horoscope จากตัวอย่างเริ่มต้น
console.log(horoscope.points.ascendant.signName) // กันย์
console.log(horoscope.points[horoscope.factors.ascendantRuler].nameThai) // พุธ
console.log(horoscope.factors.tanuseth.nameThai) // พฤหัสบดี
console.log(horoscope.taksa.kalakini) // 6 = ศุกร์
console.log(horoscope.calendar.thaiLunarDate?.label) // ข๑๓ด๑๐
```

ดูคำอธิบายฟิลด์ หน่วย และตัวอย่างเพิ่มเติมใน [คู่มือ API](https://github.com/kongesque/thai-astrology/blob/main/docs/api.md)

### อ่านวันที่จันทรคติไทย

`calendar.thaiLunarDate` คืนข้างขึ้น/ข้างแรม วันที่กี่ค่ำ และเดือนจันทรคติ อ่านจาก `phase`, `day`, `month` หรือใช้ `label` เป็นข้อความย่อเลขไทย เดือนแปดหลังคืน `month: 8` และ `secondEighthMonth: true`

```ts
import { calculateThaiHoroscope } from "thai-astrology"

const { calendar } = calculateThaiHoroscope({
  date: { year: 2567, era: "BE", month: 9, day: 15 },
  time: { hour: 12, minute: 0 },
})

console.log(calendar.thaiLunarDate?.label) // ข๑๓ด๑๐ = ขึ้น 13 ค่ำ เดือน 10
```

รองรับ ค.ศ. **1582–2076** (พ.ศ. **2125–2619**) นอกช่วงนี้เป็น `null` ผลวันที่อาจต่างจากปฏิทินที่เผยแพร่ ส่วน `calendar.lunarDay` เป็นดิถีจากมุมจันทร์กับอาทิตย์ จึงอาจต่างจากวันที่จันทรคติ ดูตัวอย่างและข้อจำกัดใน [คู่มือ API จันทรคติ](https://github.com/kongesque/thai-astrology/blob/main/docs/api.md#ปฏิทินจันทรคติไทย-calendarthailunardate)

## คำนวณดาวจรเทียบดวงกำเนิด

ระบุข้อมูลเกิดและวันเวลาที่ต้องการดูดาวจร ทั้งสองชุดใช้รูปแบบเดียวกัน:

```ts
import { calculateHoroscopeTransits, createSunriseReference } from "thai-astrology"

const ascendantReference = createSunriseReference({ province: "เชียงใหม่", utcOffsetHours: 7 })
const planetaryTimeReference = {
  civilUtcOffsetSeconds: 7 * 3600,
  referenceUtcOffsetSeconds: 6 * 3600 + 42 * 60 + 4,
}
const result = calculateHoroscopeTransits({
  date: { year: 2024, era: "CE", month: 9, day: 15 },
  time: { hour: 8, minute: 30 },
  ascendantReference,
  planetaryTimeReference,
}, {
  date: { year: 2025, era: "CE", month: 9, day: 15 },
  time: { hour: 8, minute: 30 },
  ascendantReference,
  planetaryTimeReference,
})

console.log(result.transit.points.sun.signName)
console.log(result.comparison.sun.longitudeDifferenceDegrees)
```

ตัวอย่างทั้งสองวันใช้เชียงใหม่และ UTC+7 หากใช้คนละสถานที่หรือช่วง DST ให้หา offset และสร้าง reference แยกสำหรับแต่ละวัน

ผลลัพธ์แบ่งเป็น `natal` (ดวงกำเนิด), `transit` (ดวงจร) และ `comparison` (ผลเปรียบเทียบ) ต้องระบุวันเวลาของทั้งสองดวงเอง หากต้องการดูดาวจรวันนี้ ให้ส่งวันเวลาปัจจุบันเข้าไปด้วย

## API คำนวณโหราศาสตร์ไทย

| API | ใช้ทำอะไร |
| --- | --- |
| `calculateThaiHoroscope(input)` | ผูกดวงกำเนิด พร้อมตำแหน่งดาวและข้อมูลดวงทั้งหมด |
| `calculateHoroscopeTransits(natalInput, transitInput)` | คำนวณดวงจรและเปรียบเทียบกับดวงกำเนิด |
| `validateHoroscopeInput(input)` | ตรวจข้อมูลจากฟอร์มหรือ API ก่อนคำนวณ อ่านผลจาก `valid` และรายละเอียดข้อผิดพลาดจาก `issues` |
| `getThaiAstrologyProvinces()` | สร้างรายการเลือกจังหวัดพร้อมค่าแก้เวลา |
| `getThaiAstrologyProvinceLocations()` | 77 จังหวัดพร้อมพิกัดเมืองศูนย์กลางสำหรับอาทิตย์ขึ้น |
| `getThaiAstrologyCountries()` | ชื่อภาษาอังกฤษและรหัสประเทศ/ดินแดนสำหรับรายการเลือก |
| `createSunriseReference(selection)` | ใช้พิกัดจังหวัดหรือพิกัดจริง สร้างตัวเลือกอาทิตย์ขึ้น |
| `searchThaiAstrologyLocations(input)` | ค้นหาสถานที่ตามประเทศและชื่อ คืนพิกัด เขตเวลา จำนวนทั้งหมด และหน้าผลลัพธ์ |
| `createSunriseReferenceForLocation(input)` | สร้าง reference จากสถานที่ พร้อม offset ตามวันเกิดหรือ UTC ที่ระบุเอง |
| `resolveCivilTimeOffset(input, timeZone)` | หา offset ของเวลา civil ตามกฎเขตเวลา และตรวจเวลาซ้ำ/เวลาขาด |
| `calculateSunrise(input)` | หาเวลาอาทิตย์ขึ้นตามวัน พิกัด และ UTC offset หรือคืน `status: "no-rise"` |
| `calculateDetailedPositions(input)` | คำนวณตำแหน่งแบบละเอียดด้วยสุริยยาตร์ รับข้อมูลชนิด `CalculationInput` |
| `generateThaiAstrologyChart(input)` | สร้างช่องดวงด้วย API รูปแบบเดิม ใช้วิธี `legacy` เป็นค่าเริ่มต้น |

เมื่อข้อมูลไม่ถูกต้อง `validateHoroscopeInput` จะคืนผลตรวจให้โดยไม่ throw ส่วน `calculateThaiHoroscope` และ `calculateHoroscopeTransits` จะ throw `HoroscopeInputError` ซึ่งมีรายละเอียดใน `issues` ดูชนิดข้อมูลทั้งหมดได้ที่ [HoroscopeInput / ThaiHoroscope](src/horoscope.ts) และ [CalculationInput](src/engine/astro-calculation.ts)

**วิธีคำนวณ:** `calculateThaiHoroscope` และ `calculateDetailedPositions` ใช้สุริยยาตร์เสมอ หากใช้ `generateThaiAstrologyChart` และต้องการคำนวณด้วยสุริยยาตร์ ให้ระบุ `method: "suriyayatra"` สำหรับ API รูปแบบเดิม `yearBe` คือ พ.ศ. และ `yearBc` คือ **ค.ศ.** เลือกระบุปีเพียงฟิลด์เดียว

## หลักการและข้อจำกัด

- **หลักสุริยยาตร์:** ผลคำนวณอาจต่างจากสมผุสดาราศาสตร์สมัยใหม่หรือการคำนวณของสำนักอื่น ข้อมูลที่ได้ใช้ประกอบการอ่านดวง ยังไม่มีคำพยากรณ์สำเร็จรูป
- **เวลาที่รับเป็นเวลาท้องถิ่น:** อินพุตตัวเลขต้องทราบ offset รวม DST; ตัวช่วย IANA เป็นทางเลือกสำหรับหา offset ตามวันเวลา ค่าแก้เวลาจังหวัดใช้ปรับจุดอ้างอิง 06:00 ไม่ใช่ UTC offset เลือกอาทิตย์ขึ้นตามพิกัดได้ด้วย `ascendantReference` แต่ลัคนายังใช้อันโตนาทีคงที่และตำแหน่งอาทิตย์ ณ เวลาเกิด UTC ใน `ascendantReference` ใช้กับอาทิตย์ขึ้น; หากจะแปลงนาฬิกาดาวให้ระบุ `planetaryTimeReference` แยกต่างหาก
- **ช่วงปีและความละเอียด:** รับวันที่ตามปฏิทินเกรกอเรียน ค.ศ. 1-9999 ส่วนจันทรคติไทยรองรับ พ.ศ. 2125-2619 หากอยู่นอกช่วงนี้ `calendar.thaiLunarDate` จะเป็น `null` สมผุสดาวละเอียดถึงลิปดาจำนวนเต็ม ส่วนลิปดาลัคนาอาจมีทศนิยม นับภพตามราศี (`whole-sign`) โดยให้ราศีที่ลัคนาสถิตเป็นภพตนุ
- **ทักษากับจันทรคติเปลี่ยนวันคนละเวลา:** ทักษาเปลี่ยนวันเวลา 06:00 และไม่แทนพุธกลางคืนด้วยราหู ส่วนจันทรคติไทยเปลี่ยนวันตอนเที่ยงคืน วันที่จันทรคติแยกจากดิถีที่คำนวณด้วยมุมจันทร์-อาทิตย์ เกตุไทยใช้รอบ 679 วัน
- **การอ่านผลดาวจร:** มุมสัมพันธ์ระหว่างดาวนับจากราศี ยังไม่คำนวณมุมตามองศาพร้อมระยะเผื่อมุม (orb) ความเร็วดาว ดาวพักร์ หรือเวลาย้ายราศี ผลต่างสมผุสจึงไม่ใช่ความเร็วดาว ณ ขณะนั้น และตารางเวลาต้นราศีไม่ได้บอกเวลาย้ายราศีในอนาคตอย่างละเอียด

## พัฒนาและร่วมปรับปรุง

ใช้ Node.js 24 ในการพัฒนา และรันชุดตรวจสอบก่อนส่งโค้ด:

```bash
git clone https://github.com/kongesque/thai-astrology.git
cd thai-astrology
npm ci
npm run check
```

`npm run check` ตรวจ TypeScript รันชุดทดสอบ และทดสอบการติดตั้งแพ็กเกจจริง CI ทดสอบบน Node.js 16, 22 และ 24 แก้โค้ดได้ใน `src/` และสร้างภาพราศีจักรใหม่ด้วย `npm run docs:chart`

หากพบปัญหาหรืออยากเสนอสิ่งที่ควรเพิ่ม เปิด [GitHub Issue](https://github.com/kongesque/thai-astrology/issues) ได้เลย ถ้าผลคำนวณต่างจากที่คาดไว้ ช่วยแนบวัน เวลา จังหวัด วิธีคำนวณ และผลที่คาดว่าจะได้ เพื่อให้ตรวจสอบได้ง่ายขึ้น ไม่ต้องแนบชื่อหรือข้อมูลส่วนตัว

เผยแพร่ภายใต้ [MIT License](LICENSE)

แหล่งอ้างอิงของสูตร ข้อมูลเปิด และสัญญาอนุญาต: [SOURCES.md](SOURCES.md)
