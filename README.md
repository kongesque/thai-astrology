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

`thai-astrology` เป็น **ไลบรารีโอเพนซอร์สสำหรับคำนวณโหราศาสตร์ไทยด้วย JavaScript และ TypeScript** ใช้ผูกดวงกำเนิด คำนวณลัคนา สมผุสดาว และดาวจรตามหลักสุริยยาตร์ พร้อมข้อมูลทักษาและปฏิทินจันทรคติไทย ระบุวัน เดือน ปี และเวลาเกิด แล้วอ่านตำแหน่งดาวและข้อมูลดวงจากผลลัพธ์ได้โดยตรง

นำไปใช้ในเว็บผูกดวง แอปโหราศาสตร์ หรือบริการ API ได้ ทั้งหน้าคำนวณลัคนา การดูดาวจรเทียบดวงกำเนิด และปฏิทินจันทรคติ รวมถึงใช้ศึกษาหรือทดลองคำนวณสุริยยาตร์ ผลลัพธ์แปลงเป็น JSON เพื่อนำไปแสดงผลหรือแปลผลตามหลักพยากรณ์ที่คุณใช้ได้ เมื่อใช้ข้อมูลเดิม ผลคำนวณก็จะเหมือนเดิมเสมอ

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

ลองผูกดวงเดียวกับราศีจักรในภาพด้านบน:

```ts
import { calculateThaiHoroscope } from "thai-astrology"

const horoscope = calculateThaiHoroscope({
  date: { year: 2325, era: "BE", month: 4, day: 21 },
  time: { hour: 6, minute: 54 },
  location: { province: "กรุงเทพมหานคร" },
})

console.log(horoscope.points.sun.degrees, horoscope.points.sun.minutes) // 10 42
console.log(horoscope.points.ascendant.signName) // เมษ
console.log(horoscope.charts.rasi.channels.thai[0]) // ลั๑*
```

ถ้าใช้ CommonJS ให้เปลี่ยนบรรทัด `import` เป็น `const { calculateThaiHoroscope } = require("thai-astrology")`

ดวงตัวอย่างเป็นของ ค.ศ. 1782 ซึ่งอยู่นอกช่วงที่ตรวจเทียบผลไว้ (ค.ศ. 1900-2100) จึงใช้ประกอบตัวอย่าง ไม่ได้รับรองความแม่นยำย้อนหลัง

### วันเกิด เวลาเกิด และจังหวัด

| ข้อมูล | วิธีระบุ |
| --- | --- |
| `date` | วันที่ตามปฏิทินเกรกอเรียน ใช้ `era: "BE"` สำหรับ พ.ศ. หรือ `"CE"` สำหรับ ค.ศ. เช่น พ.ศ. 2567 = ค.ศ. 2024 |
| `time` | เวลาเกิดตามเวลาท้องถิ่น ระบุชั่วโมง 0-23 และนาที 0-59 |
| `location` (ไม่บังคับ) | ระบุชื่อจังหวัดภาษาไทยใน `province` ดูรายชื่อทั้ง 77 จังหวัดได้จาก `getThaiAstrologyProvinces()` |

วันและเวลาต้องเป็นค่าที่ถูกต้องและใช้ชนิด `number` หากไม่ระบุจังหวัดจะใช้ค่าแก้เวลาเป็นศูนย์ หากต้องการกำหนดค่าเอง ให้ใส่ `location.localTimeCorrectionMinutes` เป็นจำนวนนาที ค่านี้จะใช้แทนค่าแก้เวลาของจังหวัด ไม่ต้องระบุชื่อหรือเพศในการคำนวณ

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

ตัวอย่างอ่านลัคนา ตนุลัคน์ ตนุเศษ ทักษา และวันที่จันทรคติ:

```ts
import { calculateThaiHoroscope } from "thai-astrology"

const horoscope = calculateThaiHoroscope({
  date: { year: 2567, era: "BE", month: 9, day: 15 },
  time: { hour: 8, minute: 30 },
  location: { province: "เชียงใหม่" },
})

console.log(horoscope.points.ascendant.signName) // กันย์
console.log(horoscope.points[horoscope.factors.ascendantRuler].nameThai) // พุธ
console.log(horoscope.factors.tanuseth.nameThai) // พฤหัสบดี
console.log(horoscope.taksa.kalakini) // 6 = ศุกร์
console.log(horoscope.calendar.thaiLunarDate?.label) // ข๑๓ด๑๐
```

`thaiLunarDate` คือวันที่ตามปฏิทินจันทรคติไทย ในตัวอย่างคือขึ้น 13 ค่ำ เดือน 10 ส่วน `calendar.lunarDay` เป็นดิถีจากมุมจันทร์กับอาทิตย์ จึงอาจได้คนละค่า ดูคำอธิบายฟิลด์ หน่วย และตัวอย่างเพิ่มเติมใน [คู่มือ API](https://github.com/kongesque/thai-astrology/blob/main/docs/api.md)

## คำนวณดาวจรเทียบดวงกำเนิด

ระบุข้อมูลเกิดและวันเวลาที่ต้องการดูดาวจร ทั้งสองชุดใช้รูปแบบเดียวกัน:

```ts
import { calculateHoroscopeTransits } from "thai-astrology"

const result = calculateHoroscopeTransits({
  date: { year: 2325, era: "BE", month: 4, day: 21 },
  time: { hour: 6, minute: 54 },
  location: { province: "กรุงเทพมหานคร" },
}, {
  date: { year: 2567, era: "BE", month: 9, day: 15 },
  time: { hour: 8, minute: 30 },
  location: { province: "เชียงใหม่" },
})

console.log(result.transit.points.sun.signName)
console.log(result.comparison.sun.longitudeDifferenceDegrees)
```

ผลลัพธ์แบ่งเป็น `natal` (ดวงกำเนิด), `transit` (ดวงจร) และ `comparison` (ผลเปรียบเทียบ) ต้องระบุวันเวลาของทั้งสองดวงเอง หากต้องการดูดาวจรวันนี้ ให้ส่งวันเวลาปัจจุบันเข้าไปด้วย

## API คำนวณโหราศาสตร์ไทย

| API | ใช้ทำอะไร |
| --- | --- |
| `calculateThaiHoroscope(input)` | ผูกดวงกำเนิด พร้อมตำแหน่งดาวและข้อมูลดวงทั้งหมด |
| `calculateHoroscopeTransits(natalInput, transitInput)` | คำนวณดวงจรและเปรียบเทียบกับดวงกำเนิด |
| `validateHoroscopeInput(input)` | ตรวจข้อมูลจากฟอร์มหรือ API ก่อนคำนวณ อ่านผลจาก `valid` และรายละเอียดข้อผิดพลาดจาก `issues` |
| `getThaiAstrologyProvinces()` | สร้างรายการเลือกจังหวัดพร้อมค่าแก้เวลา |
| `calculateDetailedPositions(input)` | คำนวณตำแหน่งแบบละเอียดด้วยสุริยยาตร์ รับข้อมูลชนิด `CalculationInput` |
| `generateThaiAstrologyChart(input)` | สร้างช่องดวงด้วย API รูปแบบเดิม ใช้วิธี `legacy` เป็นค่าเริ่มต้น |

เมื่อข้อมูลไม่ถูกต้อง `validateHoroscopeInput` จะคืนผลตรวจให้โดยไม่ throw ส่วน `calculateThaiHoroscope` และ `calculateHoroscopeTransits` จะ throw `HoroscopeInputError` ซึ่งมีรายละเอียดใน `issues` ดูชนิดข้อมูลทั้งหมดได้ที่ [HoroscopeInput / ThaiHoroscope](src/horoscope.ts) และ [CalculationInput](src/engine/astro-calculation.ts)

**วิธีคำนวณ:** `calculateThaiHoroscope` และ `calculateDetailedPositions` ใช้สุริยยาตร์เสมอ หากใช้ `generateThaiAstrologyChart` และต้องการคำนวณด้วยสุริยยาตร์ ให้ระบุ `method: "suriyayatra"` สำหรับ API รูปแบบเดิม `yearBe` คือ พ.ศ. และ `yearBc` คือ **ค.ศ.** เลือกระบุปีเพียงฟิลด์เดียว

## หลักการและข้อจำกัด

- **หลักสุริยยาตร์:** ผลคำนวณอาจต่างจากสมผุสดาราศาสตร์สมัยใหม่หรือการคำนวณของสำนักอื่น ข้อมูลที่ได้ใช้ประกอบการอ่านดวง ยังไม่มีคำพยากรณ์สำเร็จรูป
- **เวลาที่รับเป็นเวลาท้องถิ่น:** ต้องจัดการเขตเวลาและ DST เอง ค่าแก้เวลาจังหวัดใช้ปรับจุดอ้างอิง 06:00 ไม่ใช่ UTC offset ลัคนาใช้อันโตนาทีคงที่และคงตำแหน่งอาทิตย์ไว้ ณ เวลาเกิด ไม่ได้คำนวณเวลาอาทิตย์ขึ้นหรือลัคนาจากละติจูดและลองจิจูด
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

`npm run check` ตรวจ TypeScript รันชุดทดสอบ และทดสอบการติดตั้งแพ็กเกจจริง ส่วนการตรวจเทียบในเครื่องจะรันเมื่อมีข้อมูลเสริมสำหรับตรวจสอบ หากไม่มีจะข้ามขั้นตอนนี้ CI ทดสอบบน Node.js 16, 22 และ 24 แก้โค้ดได้ใน `src/` และสร้างภาพราศีจักรใหม่ด้วย `npm run docs:chart`

หากพบปัญหาหรืออยากเสนอสิ่งที่ควรเพิ่ม เปิด [GitHub Issue](https://github.com/kongesque/thai-astrology/issues) ได้เลย ถ้าผลคำนวณต่างจากที่คาดไว้ ช่วยแนบวัน เวลา จังหวัด วิธีคำนวณ และผลที่คาดว่าจะได้ เพื่อให้ตรวจสอบได้ง่ายขึ้น ไม่ต้องแนบชื่อหรือข้อมูลส่วนตัว

เผยแพร่ภายใต้ [MIT License](LICENSE)
