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
  <a href="#เริ่มใช้งาน">เริ่มใช้งาน</a> &nbsp;|&nbsp;
  <a href="docs/api.md">API</a> &nbsp;|&nbsp;
  <a href="https://github.com/kongesque/thai-astrology/issues">แจ้งปัญหา</a>
</p>

`thai-astrology` ใช้คำนวณดวงกำเนิด ลัคนา สมผุสดาว และดาวจรตามหลักสุริยยาตร์ พร้อมทักษาและปฏิทินจันทรคติไทย ส่งวันเวลาเกิดและจังหวัด แล้วนำข้อมูลที่ได้ไปแสดงในเว็บ แอป หรือบริการ API ของคุณได้

รองรับ **Node.js 16+**, JavaScript และ TypeScript ใช้ได้ทั้ง ESM, CommonJS และเบราว์เซอร์ผ่าน bundler โดยไม่มี runtime dependencies

## เริ่มใช้งาน

ติดตั้งแพ็กเกจ:

```bash
npm install thai-astrology
```

ผูกดวงจากวันเกิด เวลาเกิด และจังหวัด:

```ts
import {
  calculateThaiHoroscope,
  createSunriseReference,
  resolveCivilTimeOffset,
} from "thai-astrology"

// แก้ข้อมูลเกิดตรงนี้ โดย yearCe ใช้ปี ค.ศ.
const birth = { yearCe: 2024, month: 9, day: 15, hour: 8, minute: 30 }
const province = "เชียงใหม่"

const { utcOffsetHours } = resolveCivilTimeOffset(birth, "Asia/Bangkok")
const horoscope = calculateThaiHoroscope({
  date: { year: birth.yearCe, era: "CE", month: birth.month, day: birth.day },
  time: { hour: birth.hour, minute: birth.minute },
  ascendantReference: createSunriseReference({
    province, utcOffsetHours, timePrecision: "minute",
  }),
  planetaryTimeReference: {
    civilUtcOffsetSeconds: Math.round(utcOffsetHours * 3600),
    referenceUtcOffsetSeconds: 6 * 3600 + 42 * 60 + 4,
  },
})

console.log(horoscope.points.ascendant.signName) // กันย์
console.log(horoscope.points.sun.signName) // สิงห์
console.log(horoscope.calendar.thaiLunarDate?.label) // ข๑๓ด๑๐ = ขึ้น 13 ค่ำ เดือน 10
```

กรอกข้อมูลเกิดที่ `birth` และเลือกจังหวัดที่ `province` โดย `yearCe` ใช้ปี ค.ศ. ถ้ามีปี พ.ศ. ให้ลบ 543 ชั่วโมงใช้ 0–23 และนาที 0–59 ตามนาฬิกาท้องถิ่น ไม่ต้องระบุชื่อหรือเพศ

โค้ดส่วนที่เหลือเป็นการตั้งค่าของแอป: หา UTC offset ตามวันที่ ใช้พิกัดจังหวัดคำนวณอาทิตย์ขึ้นรายวันแบบปัดนาที และคำนวณดาวในกรอบกรุงเทพฯ ประวัติศาสตร์ +06:42:04 ให้คงกรอบนี้ไว้เมื่อเปลี่ยนสถานที่ เพราะเป็นคนละค่ากับ UTC ของสถานที่เกิด ผู้ใช้ป้อนเพียงข้อมูลเกิด

สำหรับ CommonJS เปลี่ยน import เป็น `const { calculateThaiHoroscope, createSunriseReference, resolveCivilTimeOffset } = require("thai-astrology")`

อ่านวิธีใช้ [ต่างประเทศ พิกัดละเอียด และข้อมูลจากฟอร์ม](docs/api.md) ต่อในคู่มือ API หากต้องการคงวิธีอ้างอิง 06:00 พร้อมค่าแก้จังหวัด อ่าน [การตั้งค่า traditional](docs/api.md#วิธี-traditional)

## นำข้อมูลไปแสดงราศีจักร

อ่านเลขในผังจาก `horoscope` ที่คำนวณไว้:

```ts
console.log(horoscope.charts.rasi.channels.thai)
// ["", "๕*๐", "๓", "", "๑๔", "ลั๖", "", "", "๙", "๒", "๗", "๘"]
```

ผลลัพธ์เป็นข้อความ 12 ช่อง เรียงจากเมษถึงมีน ช่องว่างหมายถึงไม่มีดาว `ลั` แทนลัคนา และ `*` กำกับตนุเศษ ใช้ `channels.arabic` หากต้องการเลขอารบิก หรือเปลี่ยน `rasi` เป็น `navamsa` / `drekkana` เพื่ออ่านนวางค์จักร / ตรียางค์จักร

<p align="center">
  <img src="assets/rasi-chart.svg" alt="ตัวอย่างผูกดวงกำเนิดสุริยยาตร์: ราศีจักรเลขไทยและลัคนาเมษ" width="100%" />
  <br /><sub>ตัวอย่างภาพ: 21 เมษายน พ.ศ. 2325 เวลา 06:54 น. กรุงเทพมหานคร เป็นคนละดวงกับตัวอย่างโค้ดด้านบน</sub>
</p>

ไลบรารีคืนข้อมูลสำหรับวาดผัง คุณเลือกหน้าตาและรูปแบบการแสดงผลเองได้ ดู [สคริปต์สร้างภาพตัวอย่าง](scripts/render-readme-chart.cjs) สำหรับการสร้าง SVG

## อ่านผลส่วนอื่น

| ต้องการอ่าน | ฟิลด์ |
| --- | --- |
| ตำแหน่งดาวและลัคนา พร้อมองศา/ลิปดา | `points.sun`, `points.moon`, `points.ascendant` |
| ภพทั้ง 12 เจ้าเรือน และดาวที่สถิต | `houses` |
| ตนุลัคน์ ตนุเศษ และดาวร่วมราศีลัคนา | `factors` |
| ข้อมูลฤกษ์และมาตรฐานดาว | ฟิลด์ใน `points` ของแต่ละดาว |
| วันจันทรคติไทย | `calendar.thaiLunarDate` |
| ทักษาทั้งแปด | `taksa` |

ผลลัพธ์แปลงเป็น JSON ได้ และข้อมูลเดียวกันให้ผลคำนวณเดิมเสมอ การแปลผลและข้อความพยากรณ์เป็นส่วนที่แอปของคุณกำหนดเอง

## ใช้งานต่อในคู่มือ API

[คู่มือ API ภาษาไทย](docs/api.md) อธิบายฟิลด์ หน่วย ตัวเลือก และตัวอย่างเพิ่มเติม เลือกอ่านตามงานที่ทำ:

- [อาทิตย์ขึ้นตามพิกัดและกรอบเวลาดาว](docs/api.md#อาทิตย์ขึ้นและกรอบเวลาดาว)
- [เลือกจังหวัด ประเทศ และสถานที่ต่างประเทศ](docs/api.md#เลือกจังหวัดและประเทศ)
- [ค้นหาเมืองและหา UTC offset รวม DST](docs/api.md#ค้นหาสถานที่ตามประเทศและหา-offset)
- [ตรวจข้อมูลที่รับจากฟอร์ม](docs/api.md#ตรวจข้อมูลและชนิดข้อมูล)
- [คำนวณดาวจรเทียบดวงกำเนิด](docs/api.md#ผลเปรียบเทียบดาวจร)
- [API รูปแบบเดิมและรายการฟังก์ชันทั้งหมด](docs/api.md#ข้อมูลนำเข้าและ-api-หลัก)

## หลักการและข้อจำกัด

- ตัวอย่างนี้ต้องมีเวลาและสถานที่เกิด เวลาสมมติหรือพิกัดเมืองศูนย์กลางจังหวัดอาจทำให้ลัคนาและภพเปลี่ยนได้ หากทราบพิกัดจริง ให้ใช้พิกัดนั้น
- ขั้นตอนอาทิตย์ขึ้นและเขตเวลารองรับ ค.ศ. 1900–2100 ตัวอย่างระบุการตั้งค่าคำนวณครบแล้ว หากเรียกด้วย `date`/`time`/`location` อย่างเดียวจะใช้ค่าเริ่มต้นอีกแบบ
- ลัคนาใช้อันโตนาทีสามัญ ไม่ใช่ลัคนาเรขาคณิตสมัยใหม่ มุมสัมพันธ์นับตามราศี รายละเอียดวิธีคำนวณอยู่ในคู่มือ API
- วันจันทรคติรองรับ ค.ศ. 1582–2076 นอกช่วงนี้คืน `null` และผลวันที่อาจต่างจากปฏิทินที่เผยแพร่

`calculateThaiHoroscope()` ใช้สุริยยาตร์เสมอ ส่วน API เดิม `generateThaiAstrologyChart()` ใช้ `legacy` เป็นค่าเริ่มต้น ต้องระบุ `method: "suriyayatra"` เมื่อต้องการวิธีเดียวกัน

## พัฒนาและร่วมปรับปรุง

ใช้ Node.js 24 สำหรับพัฒนา:

```bash
npm ci
npm run check
```

แก้โค้ดใน `src/` และสร้างภาพตัวอย่างใหม่ด้วย `npm run docs:chart` หากพบปัญหา แจ้งผ่าน [GitHub Issues](https://github.com/kongesque/thai-astrology/issues) พร้อมวัน เวลา สถานที่ และวิธีคำนวณ โดยไม่ใส่ข้อมูลส่วนบุคคล

เผยแพร่ภายใต้ [MIT License](LICENSE) ข้อมูลสถานที่จาก [GeoNames](https://www.geonames.org/) ใช้ [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) ดูแหล่งอ้างอิงสูตรและข้อมูลใน [SOURCES.md](SOURCES.md)
