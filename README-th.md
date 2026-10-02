# Thai Astrology — โหราศาสตร์ไทย

[English](README.md) | [ภาษาไทย](README-th.md)

Thai Astrology เป็นไลบรารี TypeScript สำหรับคำนวณดวงตามหลักโหราศาสตร์ไทย โดยใช้ข้อมูลวัน เวลา และจังหวัดเกิดเพื่อหาตำแหน่งดาว จัดวางดวงใน 12 ช่อง คำนวณลัคนาและตนุเศษ ไม่มีแพ็กเกจอื่นที่จำเป็นขณะใช้งาน รองรับ Node.js ตั้งแต่รุ่น 16 และมีไฟล์ประกาศชนิดข้อมูลสำหรับ TypeScript

## การติดตั้ง

```bash
npm install thai-astrology
```

## การใช้งาน

```ts
import {
  formatChannelOutputs,
  generateThaiAstrologyChart,
} from "thai-astrology"

const chart = generateThaiAstrologyChart({
  day: 15,
  monthTh: 9,
  yearBe: 2566, // พ.ศ. 2566 ตรงกับ ค.ศ. 2023
  hour: 14,
  minute: 45,
  province: "กรุงเทพมหานคร",
})

console.log(formatChannelOutputs(chart))
console.log(formatChannelOutputs(chart, "thai"))
console.log(formatChannelOutputs(chart, "arabic"))
console.log(chart.sunPosition)
```

ใช้ `yearBe` สำหรับปีพุทธศักราช หรือใช้ฟิลด์เดิม `yearBc` สำหรับปีคริสต์ศักราช เช่น `yearBc: 2023` ให้ผลเท่ากับ `yearBe: 2566` โดยระบุปีเพียงฟิลด์เดียว ชื่อ `yearBc` เป็นชื่อเดิมของ API และไม่ได้หมายถึงปีก่อนคริสต์ศักราช

สำหรับ CommonJS สามารถเรียกใช้ API เดียวกันได้ด้วย `require`:

```js
const { generateThaiAstrologyChart, formatChannelOutputs } = require("thai-astrology")
```

ตัวอย่างผลลัพธ์ตามลำดับคำสั่งด้านบน:

```text
[ '58', '0',  '9',  '6', '14', '23', '',   '', 'ลั',  '',   '7*', '' ]

[ '๕๘', '๐',  '๙',  '๖', '๑๔', '๒๓', '',   '', 'ลั',  '',   '๗*', '' ]

[ '58', '0',  '9',  '6', '14', '23', '',   '', 'ลั',  '',   '7*', '' ]

[ 27, 29 ]
```

## API หลัก

- `generateThaiAstrologyChart(input: CalculationInput): ThaiAstrologyChart` — คืนค่าตำแหน่งดาว ตนุเศษ ข้อมูลดวง 12 ช่อง และข้อมูลดาวที่อยู่ร่วมกับลัคนาเมื่อระบุได้ หากไม่สามารถระบุข้อมูลดาวร่วมลัคนาได้ ผลลัพธ์จะมีฟิลด์ `rulingPlanetsError`
- `formatChannelOutputs(chart, options?: { numerals?: "arabic" | "thai" } | "arabic" | "thai")` — ลบป้ายชื่อช่องและแสดงตัวเลขเป็นเลขอารบิกหรือเลขไทย โดยค่าเริ่มต้นเป็นเลขอารบิก

## การพัฒนา

```bash
nvm use
npm ci
npm run check
```

ใช้ Node.js 24 เป็นรุ่นหลักสำหรับการพัฒนา แพ็กเกจยังรองรับ Node.js ตั้งแต่รุ่น 16 และกำหนดให้ CI ตรวจสอบกับ Node.js รุ่น 16, 22 และ 24

```text
src/
  index.ts                    จุดรวม API ที่เปิดให้ใช้งาน
  engine/
    astro-calculation.ts      การคำนวณทางโหราศาสตร์
    astro/ruling-planets.ts   ฟังก์ชันเกี่ยวกับดาวร่วมลัคนา
test/
  run.cjs                     ทดสอบความเข้ากันได้กับรุ่นที่เผยแพร่
  fixtures/                   ผลลัพธ์อ้างอิงจาก npm รุ่น 0.1.7
scripts/                      ล้างไฟล์ build และตรวจสอบแพ็กเกจ
.github/workflows/            การตรวจสอบด้วย CI
dist/                         JavaScript และไฟล์ประกาศชนิดข้อมูลที่สร้างขึ้น
```

แก้ไขโค้ดใน `src/` ส่วน `dist/` สร้างขึ้นใหม่อัตโนมัติและไม่ติดตามด้วย Git การตั้งค่า VS Code ซ่อน `dist/` และ `node_modules/` ใน Explorer เพื่อให้ค้นหาไฟล์ต้นฉบับได้ง่าย แพ็กเกจ npm ประกอบด้วย `dist/` ซอร์ส TypeScript สำหรับการอ้างอิงจาก declaration maps เอกสาร README สัญญาอนุญาต และข้อมูลแพ็กเกจ

คำสั่ง `npm run check` ตรวจสอบชนิดข้อมูล ทดสอบความเข้ากันได้กับรุ่นที่เผยแพร่ สร้างไฟล์แพ็กเกจ และทดสอบการติดตั้งแพ็กเกจจริงผ่าน CommonJS, ESM imports และ TypeScript

## สัญญาอนุญาต

MIT © ผู้ร่วมพัฒนา
