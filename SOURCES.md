# Sources / แหล่งอ้างอิง

[README ไทย](README.md) · [English README](README-en.md)

แหล่งสาธารณะสำหรับสูตร ข้อมูลสถานที่ เขตเวลา และการตรวจเลขคณิต MIT เป็นสัญญาอนุญาตของไลบรารี ข้อมูลสถานที่ที่ดัดแปลงจาก GeoNames ใช้ CC BY 4.0 การอ้างบทความหรือตำราไม่ได้ให้สิทธิ์คัดลอกเนื้อหาทั้งหมด

Public references for formulas, location data, civil time and numerical arithmetic. MIT covers the library; adapted GeoNames data uses CC BY 4.0. Citing an article or book does not grant permission to reproduce its full contents.

## Formulas / สูตรคำนวณ

| Source / แหล่ง | Scope / ขอบเขต |
| --- | --- |
| [J. C. Eade, Rules for Interpolation in the Thai Calendar](https://thesiamsociety.org/wp-content/uploads/2000/03/JSS_088_0r_Eade_RulesForInterpolationInThaiCalendar.pdf) | Classical annual and lunar arithmetic in Appendix A / เลขคณิตรายปีและจันทร์ในภาคผนวก A |
| [pythaidate annual rules](https://github.com/hmmbug/pythaidate/blob/f526c4d9d9ee2a854bf790aaf6d6ee6db90f3f25/pythaidate/lsyear.py), [calendar conversion](https://github.com/hmmbug/pythaidate/blob/f526c4d9d9ee2a854bf790aaf6d6ee6db90f3f25/pythaidate/csdate.py), [MIT](https://github.com/hmmbug/pythaidate/blob/f526c4d9d9ee2a854bf790aaf6d6ee6db90f3f25/LICENSE.txt) | Annual rules, intercalation and calendar conversion / กฎรายปี อธิกมาส อธิกวาร และการแปลงปฏิทิน |
| [Gislén 2018](https://lucris.lub.lu.se/ws/portalfiles/portal/60786189/2018JAHH...21...02G.pdf) | Historical Thai calendar conventions and intercalation / แนวปฏิบัติปฏิทินไทยและการแทรกวัน |
| [Thanan: calculation steps](https://thanan4astro.blogspot.com/2015/02/blog-post_11.html), [AstroNeemo part 2](https://www.astroneemo.net/index.php/2016-08-07-05-21-50/2016-09-26-02-31-15/1177-2.html), [part 4](https://www.astroneemo.net/index.php/2016-08-07-05-21-50/2016-09-26-02-31-15/1179-4.html), [part 10](https://www.astroneemo.net/index.php/2016-08-07-05-21-50/2016-09-26-02-31-15/1185-10) | Annual/day/time reckoning and lunar correction tables / ลำดับรายปี รายวัน ระหว่างวัน และตารางแก้จันทร์ |
| [Horawittaya chapter 8 reproduction](https://www.astroneemo.net/index.php/2016-08-07-05-21-50/2016-09-26-02-29-18/56-1/1149-horawittaya-1-chapter-8.html) | Ordinary rising-duration table / ตารางอันโตนาทีสามัญ |
| [NOAA solar calculation implementation](https://gml.noaa.gov/grad/solcalc/main.js), [calculation details](https://gml.noaa.gov/grad/solcalc/calcdetails.html) | Solar coordinates, equation of time and sunrise / พิกัดอาทิตย์ สมการเวลา และอาทิตย์ขึ้น |
| [NOAA General Solar Position Calculations](https://gml.noaa.gov/grad/solcalc/solareqns.PDF) | Civil/solar clock relation: removing the equation-of-time term gives civil minus mean solar time = `60 × UTC hours − 4 × east longitude`. The traditional provincial calculation selects UTC+7 and nearest-minute rounding as application conventions / ความสัมพันธ์เวลานาฬิกากับเวลาสุริยะ ใช้อ้างอิงค่าแก้ตามพิกัด ส่วนกรอบ UTC+7 และการปัดนาทีในวิธี traditional เป็นข้อตกลงของไลบรารี |
| [USNO rise/set definitions](https://aa.usno.navy.mil/faq/RST_defs), [annual rise/set tables](https://aa.usno.navy.mil/data/RS_OneYear), [API](https://aa.usno.navy.mil/data/api) | Standard horizon/refraction convention and public event predictions / นิยามขอบฟ้า การหักเห และเวลาเหตุการณ์สาธารณะ |
| [USNO Julian dates](https://aa.usno.navy.mil/faq/JD_formula) | Gregorian-date and Julian-day relationships / ความสัมพันธ์วันเกรกอเรียนกับเลขวันจูเลียน |

Minute precision rounds sunrise to the nearest minute as an explicit API convention. It does not increase physical sunrise accuracy or prescribe a universal classical rounding rule. / ความละเอียดระดับนาทีเป็น convention ที่ API ระบุ ไม่เพิ่มความแม่นยำทางกายภาพของอาทิตย์ขึ้นหรือเป็นกฎการปัดของทุกตำรา

## Locations and time / สถานที่และเวลา

| Source / แหล่ง | Scope / ขอบเขต |
| --- | --- |
| [GeoNames](https://www.geonames.org/), [Thailand data](https://download.geonames.org/export/dump/TH.zip), [country information](https://download.geonames.org/export/dump/countryInfo.txt), [cities15000](https://download.geonames.org/export/dump/cities15000.zip), [timezone metadata](https://download.geonames.org/export/dump/timeZones.txt), [schema](https://download.geonames.org/export/dump/readme.txt), [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) | Adapted provincial-seat/city WGS84 coordinates, names and timezone identifiers / พิกัด WGS84 ชื่อจังหวัด เมือง และรหัสเขตเวลาที่ดัดแปลงใช้ในไลบรารี |
| [IANA timezone database](https://www.iana.org/time-zones), [2025b Asia rules](https://data.iana.org/time-zones/tzdb-2025b/asia), [license](https://github.com/eggert/tz/blob/2025b/LICENSE) | Civil offsets, DST and historical Bangkok time; runtime resolution uses its own timezone database / UTC civil, DST และเวลาประวัติศาสตร์กรุงเทพฯ โดย runtime ใช้ฐานข้อมูลของตัวเอง |
| [ECMA-402 DateTimeFormat](https://tc39.es/ecma402/#sec-intl.datetimeformat.prototype.formattoparts) | Date-aware civil offset resolution / การหา offset ตามวันเวลา |

The Bangkok +06:42:04 reference is a selectable historical civil-time frame, not a universal classical epoch. / กรอบกรุงเทพฯ +06:42:04 เป็นกรอบเวลา civil ประวัติศาสตร์ที่เลือกใช้ได้ ไม่ใช่ epoch บังคับของทุกตำรา

## Numerical arithmetic / เลขคณิตเชิงตัวเลข

[NIST DLMF linear interpolation](https://dlmf.nist.gov/3.3#i) · [ECMAScript Number](https://tc39.es/ecma262/multipage/ecmascript-data-types-and-values.html#sec-ecmascript-language-types-number-type)

These describe interpolation and binary64 arithmetic, not the physical validity of classical planetary coefficients. / อธิบายการแทรกค่าและเลข binary64 ไม่ได้รับรองสัมประสิทธิ์ดาวทางกายภาพ
