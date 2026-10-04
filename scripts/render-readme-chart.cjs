'use strict'

// Run after npm run build. The illustration uses public API output only.
const { mkdirSync, writeFileSync } = require('node:fs')
const { join } = require('node:path')
const { calculateThaiHoroscope } = require('../dist')

const horoscope = calculateThaiHoroscope({
  date: { year: 2325, era: 'BE', month: 4, day: 21 },
  time: { hour: 6, minute: 54 },
  location: { province: 'กรุงเทพมหานคร' },
})
// Houses start at the ascendant; chart channels start at Aries (sign index 0).
const signs = [...horoscope.houses].sort((a, b) => a.sign - b.sign).map(house => house.signNameThai)
const channels = horoscope.charts.rasi.channels.thai
const center = { x: 480, y: 490 }
const radius = 326
const halfSquare = 59
const points = [
  [480, 292], [365, 300], [292, 370], [270, 490],
  [292, 610], [354, 676], [480, 682], [606, 676],
  [668, 610], [685, 490], [668, 370], [593, 300],
]
const escape = value => String(value).replace(/[&<>"']/g, character => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;',
}[character]))
const number = value => value.toFixed(2)
const line = (x1, y1, x2, y2) => `<line x1="${number(x1)}" y1="${number(y1)}" x2="${number(x2)}" y2="${number(y2)}"/>`
const divisions = []
const chord = Math.sqrt(radius * radius - halfSquare * halfSquare)
for (const offset of [-halfSquare, halfSquare]) {
  divisions.push(line(center.x + offset, center.y - chord, center.x + offset, center.y + chord))
  divisions.push(line(center.x - chord, center.y + offset, center.x + chord, center.y + offset))
}
for (const x of [-1, 1]) {
  for (const y of [-1, 1]) {
    divisions.push(line(center.x + x * halfSquare, center.y + y * halfSquare,
      center.x + x * radius / Math.sqrt(2), center.y + y * radius / Math.sqrt(2)))
  }
}
const labels = signs.map((sign, index) => {
  const angle = -90 - index * 30
  const radians = angle * Math.PI / 180
  const x = center.x + 305 * Math.cos(radians)
  const y = center.y + 305 * Math.sin(radians)
  let rotation = angle + 90
  while (rotation < -90) rotation += 180
  while (rotation > 90) rotation -= 180
  // Keep Capricorn's right-hand label upright in the opposite reading direction.
  if (index === 9) rotation += 180
  return `<text class="sign" transform="translate(${number(x)} ${number(y)}) rotate(${rotation})">${escape(sign)}</text>`
})
const planets = channels.map((channel, index) => {
  if (!channel) return ''
  const [x, y] = points[index]
  const colored = escape(channel)
    .replace('ลั', '<tspan fill="#e00000">ลั</tspan>')
    .replace('*', '<tspan fill="#e00000" font-size="21">*</tspan>')
  return `<text class="planet" x="${x}" y="${y}" aria-label="${escape(signs[index])} ${escape(channel)}">${colored}</text>`
})
const ascendant = horoscope.points.ascendant
const sun = horoscope.points.sun
// Center the circular chart in a 3:2 landscape image without stretching it.
const chartScale = 0.92
const chartTranslation = {
  x: 480 - center.x * chartScale,
  y: 320 - center.y * chartScale,
}
const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="960" height="640" viewBox="0 0 960 640" role="img" aria-labelledby="title description">
  <title id="title">Thai Astrology: ตัวอย่างราศีจักรสุริยยาตร์และลัคนา</title>
  <desc id="description">ดวงกำเนิด 21 เมษายน พ.ศ. 2325 เวลา 06:54 น. กรุงเทพมหานคร คำนวณด้วยสุริยยาตร์ ตัวเลขกลางวงคือองศาอาทิตย์กำเนิด ${sun.degrees} องศา ${sun.minutes} ลิปดา ลัคนา${escape(ascendant.signName)} ${ascendant.degrees} องศา ${ascendant.minutes} ลิปดา ${escape(channels.map((channel, index) => `${signs[index]}: ${channel || 'ไม่มีดาว'}`).join('; '))}</desc>
  <style>
    text { font-family: 'Sarabun', 'Arial Unicode MS', Tahoma, Arial, sans-serif; font-weight: 400; text-anchor: middle; fill: #111; }
    .sign { font-size: 26px; fill: #003366; dominant-baseline: central; }
    .planet { font-size: 40px; letter-spacing: 1px; dominant-baseline: central; stroke: #fff; stroke-width: 0.6px; paint-order: fill stroke; }
    .angle { font-family: Arial, Tahoma, sans-serif; font-size: 20px; font-weight: 600; }
  </style>
  <rect width="960" height="640" fill="#fff"/>
  <g transform="translate(${number(chartTranslation.x)} ${number(chartTranslation.y)}) scale(${chartScale})">
  <circle cx="480" cy="490" r="326" fill="#fff" stroke="#111" stroke-width="1.1"/>
  <g stroke="#111" stroke-width="0.75">${divisions.join('\n    ')}</g>
  <circle cx="480" cy="490" r="285" fill="none" stroke="#111" stroke-width="1.8"/>
  <circle cx="480" cy="490" r="279" fill="none" stroke="#111" stroke-width="0.8"/>
  ${labels.join('\n  ')}
  ${planets.filter(Boolean).join('\n  ')}
  <text class="angle" x="480" y="486" aria-label="องศาอาทิตย์กำเนิด"><tspan x="480">${sun.degrees}°</tspan><tspan x="480" dy="23">${String(sun.minutes).padStart(2, '0')}′</tspan></text>
  </g>
</svg>
`
const directory = join(__dirname, '..', 'assets')
mkdirSync(directory, { recursive: true })
writeFileSync(join(directory, 'rasi-chart.svg'), svg)
console.log('Generated assets/rasi-chart.svg from calculateThaiHoroscope')
