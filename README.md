<h1 align="center">Thai Astrology - ไลบรารีโหราศาสตร์ไทย</h1>

<p align="center">
  ผูกดวงกำเนิด คำนวณลัคนาและดาวจรด้วยสุริยยาตร์ใน JavaScript และ TypeScript
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

<p align="center">
  <img src="assets/rasi-chart.svg" alt="ตัวอย่างผูกดวงกำเนิดสุริยยาตร์: ราศีจักรเลขไทยและลัคนาเมษ" width="100%" />
</p>

`thai-astrology` คือ **ไลบรารีโอเพนซอร์สสำหรับคำนวณโหราศาสตร์ไทยด้วย JavaScript และ TypeScript** ใช้หลักสุริยยาตร์ (Suriyayatra) ผูกดวงกำเนิด คำนวณลัคนา สมผุสดาว ดาวจร ทักษา และปฏิทินจันทรคติไทย รับวัน เวลา และจังหวัด แล้วคืนข้อมูลดวงชะตาผ่าน API

ใช้เป็นแกนคำนวณสำหรับเว็บผูกดวง แอปโหราศาสตร์ หรือ API ผลลัพธ์แปลงเป็น JSON ได้ ข้อมูลนำเข้าเดียวกันให้ผลคำนวณเดียวกัน และนำไปใช้กับกฎการอ่านดวงของคุณได้ ต่อยอดเป็นหน้าคำนวณลัคนา เครื่องมือเปรียบเทียบดาวจรกับดวงกำเนิด ปฏิทินจันทรคติไทย หรือสื่อการเรียนรู้และทดลองหลักสุริยยาตร์ได้

รองรับ **Node.js 16+**, ESM และ CommonJS มี TypeScript types ใช้กับเบราว์เซอร์ผ่าน bundler ได้ และไม่มี runtime dependencies

## คำนวณอะไรได้บ้าง

- **ดวงกำเนิด:** สมผุสดาว 10 ดวง ลัคนา ภพ เจ้าเรือน ตนุเศษ นักษัตร ฤกษ์ และดาวมาตรฐาน
- **ข้อมูลจักร:** ราศีจักร นวางค์จักร และตรียางค์จักร พร้อมช่องดวงเป็นเลขไทยหรืออารบิก
- **ดาวจรและปฏิทิน:** เปรียบเทียบกับดวงกำเนิด พร้อมทักษา ดิถี และวันที่จันทรคติไทย

## ผูกดวงกำเนิดและคำนวณลัคนา

```bash
npm install thai-astrology
```

ตัวอย่างนี้คำนวณดวงเดียวกับภาพราศีจักรด้านบน:

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

สำหรับ CommonJS ใช้ `const { calculateThaiHoroscope } = require("thai-astrology")` แทนบรรทัด `import`

ในภาพ เลขกลางวงคือองศาและลิปดาอาทิตย์ เลขไทยแทนดาว `ลั` แทนลัคนา และ `*` แทนตนุเศษ ตัวอย่าง ค.ศ. 1782 อยู่นอกช่วง ค.ศ. 1900-2100 ที่ใช้ตรวจเทียบผล จึงไม่ใช่การรับรองความแม่นยำย้อนหลัง

### วันเกิด เวลาเกิด และจังหวัด

| ข้อมูล | วิธีระบุ |
| --- | --- |
| `date` | วันที่ตามปฏิทินสากล ใช้ `era: "BE"` สำหรับ พ.ศ. หรือ `"CE"` สำหรับ ค.ศ. เช่น พ.ศ. 2567 = ค.ศ. 2024 |
| `time` | เวลาท้องถิ่น ชั่วโมง 0-23 และนาที 0-59 ต้องระบุเวลาเกิด |
| `location` (ไม่บังคับ) | `province` เป็นชื่อจังหวัดภาษาไทย เลือกได้จาก `getThaiAstrologyProvinces()` ซึ่งมีครบ 77 จังหวัด |

ระบุวันและเวลาที่ถูกต้องด้วยชนิด `number` หากไม่ระบุสถานที่ ค่าแก้เวลาจะเป็นศูนย์ หรือกำหนดเองด้วย `location.localTimeCorrectionMinutes` ซึ่งมีหน่วยเป็นนาทีและใช้แทนค่าของจังหวัด ชื่อและเพศไม่จำเป็นต่อการคำนวณ

### อ่านตำแหน่งดาว ลัคนา และข้อมูลดวง

| ส่วนของผลลัพธ์ | ข้อมูลที่ได้ |
| --- | --- |
| `points` | สมผุสดาวและลัคนา เช่น `points.moon` สำหรับจันทร์ |
| `houses` | ภพทั้ง 12 ภพ เจ้าเรือน และดาวที่อยู่ในแต่ละภพ |
| `factors` | ตนุลัคน์ (`ascendantRuler`) ตนุเศษ และดาวร่วมราศีลัคนา (`ascendantOccupants`) |
| `charts` | ตำแหน่งและช่องดวงของราศีจักร (Rasi) นวางค์จักร (Navamsa) และตรียางค์จักร (Drekkana) |
| `calendar` | วันทางโหราศาสตร์ ดิถี และวันที่ในปฏิทินจันทรคติไทย |
| `taksa` | บริวาร อายุ เดช ศรี มูละ อุตสาหะ มนตรี และกาลกิณี |
| `relationships` | ดาวร่วมราศี เล็ง ตรีโกณ จตุสดัย และโยค |

เลขราศีเริ่มจากเมษ = 0 ส่วนเลขภพเริ่มจากตนุ = 1 ช่องดวงเรียงจากเมษถึงมีน แต่ `houses` เรียงจากลัคนา สมผุสมีทั้งองศารวม (`longitudeDegrees`) และลิปดารวม (`longitudeArcMinutes`)

## คำนวณดาวจรเทียบดวงกำเนิด

ส่งข้อมูลกำเนิดและวันเวลาที่ต้องการดูดาวจร โดยใช้รูปแบบข้อมูลเดียวกัน:

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

ผลลัพธ์มี `natal` (ดวงกำเนิด), `transit` (ดวงจร) และ `comparison` (ข้อมูลเปรียบเทียบ) ทั้งสองวันเวลาต้องระบุเอง ไม่มีการใช้เวลาปัจจุบันโดยอัตโนมัติ

## API คำนวณโหราศาสตร์ไทย

| API | ใช้เมื่อ |
| --- | --- |
| `calculateThaiHoroscope(input)` | ต้องการข้อมูลดวงกำเนิดครบในผลลัพธ์เดียว |
| `calculateHoroscopeTransits(natalInput, transitInput)` | ต้องการดวงกำเนิด ดวงจร และผลเปรียบเทียบ |
| `validateHoroscopeInput(input)` | ตรวจข้อมูลจากฟอร์มหรือ API ก่อนคำนวณ คืน `valid` และ `issues` เมื่อข้อมูลไม่ถูกต้อง |
| `getThaiAstrologyProvinces()` | สร้างรายการเลือกจังหวัดพร้อมค่าแก้เวลา |
| `calculateDetailedPositions(input)` | ต้องการผลสุริยยาตร์แบบละเอียด โดยใช้ชนิด `CalculationInput` |
| `generateThaiAstrologyChart(input)` | ใช้งานรูปแบบ API เดิม ค่าเริ่มต้นเป็น `legacy` |

`validateHoroscopeInput` ไม่ throw เมื่อข้อมูลไม่ถูกต้อง ส่วน `calculateThaiHoroscope` และ `calculateHoroscopeTransits` จะ throw `HoroscopeInputError` พร้อม `issues` ดูชนิดข้อมูลเต็มได้ที่ [HoroscopeInput / ThaiHoroscope](src/horoscope.ts) และ [CalculationInput](src/engine/astro-calculation.ts)

**เลือกวิธีคำนวณ:** `calculateThaiHoroscope` และ `calculateDetailedPositions` ใช้สุริยยาตร์เสมอ สำหรับ `generateThaiAstrologyChart` ให้ระบุ `method: "suriyayatra"` หากต้องการวิธีเดียวกัน ใน input รูปเดิม `yearBe` คือ พ.ศ. ส่วน `yearBc` คือ **ค.ศ.** ระบุปีเพียงฟิลด์เดียว

## หลักการและข้อจำกัด

- **ใช้สุริยยาตร์ตามกฎของไลบรารี** ผลอาจต่างจากสมผุสดาราศาสตร์สมัยใหม่หรือโหราศาสตร์ต่างสำนัก ผลลัพธ์เป็นข้อมูลประกอบการอ่านดวง ไม่ได้สร้างคำพยากรณ์สำเร็จรูป
- **ใช้เวลาท้องถิ่น** ไม่มีการแปลงเขตเวลาหรือ DST อัตโนมัติ ค่าแก้เวลาจังหวัดใช้ปรับจุดอ้างอิง 06:00 ไม่ใช่ UTC offset ลัคนาใช้อันโตนาทีแบบคงที่และตรึงอาทิตย์ ณ เวลาเกิด ไม่ได้หาอาทิตย์ขึ้นหรือลัคนาจากละติจูด/ลองจิจูด
- **มีขอบเขตปีและความละเอียด** รับวันที่สากล ค.ศ. 1-9999 จันทรคติไทยรองรับ พ.ศ. 2125-2619; นอกช่วงนี้ `calendar.thaiLunarDate` เป็น `null` สมผุสดาวละเอียดถึงลิปดาจำนวนเต็ม ลิปดาลัคนาอาจมีทศนิยม ภพใช้ระบบราศีเต็ม (`whole-sign`)
- **ทักษาและจันทรคตินับวันต่างกัน** ทักษาเปลี่ยนวันเวลา 06:00 โดยไม่แทนพุธกลางคืนด้วยราหู จันทรคติไทยเปลี่ยนที่เที่ยงคืนและแยกจากดิถีที่คำนวณด้วยมุมจันทร์-อาทิตย์ เกตุไทยใช้รอบ 679 วัน
- **ดาวจรเปรียบเทียบตำแหน่ง** ความสัมพันธ์ดาวคิดระดับราศี ยังไม่มีมุมตามองศาพร้อม orb ความเร็วดาว สถานะพักร์ หรือการค้นหาเวลาย้ายราศี ผลต่างสมผุสไม่ใช่ความเร็ว ณ ขณะนั้น และตารางเวลาต้นราศีไม่ใช่เวลาย้ายราศีในอนาคตแบบละเอียด

## พัฒนาและร่วมปรับปรุง

ใช้ Node.js 24 สำหรับพัฒนา และตรวจสอบก่อนส่งการเปลี่ยนแปลง:

```bash
git clone https://github.com/kongesque/thai-astrology.git
cd thai-astrology
npm ci
npm run check
```

`npm run check` ตรวจ TypeScript ทดสอบพฤติกรรม และตรวจแพ็กเกจที่ติดตั้งจริง การตรวจเทียบในเครื่องจะทำงานเมื่อมีทรัพยากรเสริม หากไม่มีจะข้ามขั้นตอนนั้น CI ทดสอบบน Node.js 16, 22 และ 24 แก้ไขโค้ดใน `src/` และสร้างภาพตัวอย่างใหม่ด้วย `npm run docs:chart`

พบปัญหาหรือมีข้อเสนอแนะ แจ้งได้ที่ [GitHub Issues](https://github.com/kongesque/thai-astrology/issues) หากเป็นผลคำนวณที่ต่างกัน โปรดแนบวัน เวลา จังหวัด วิธีคำนวณ และผลที่คาดหวัง โดยไม่ต้องระบุชื่อหรือข้อมูลส่วนตัว

เผยแพร่ภายใต้ [MIT License](LICENSE)
