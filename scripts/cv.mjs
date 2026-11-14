import { chromium } from 'playwright'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { resolve } from 'node:path'

const root = resolve(fileURLToPath(import.meta.url), '../..')
const versions = {
  no: { source: 'cv/cv.html', output: 'public/Ase-Sagebakken-CV.pdf' },
  en: { source: 'cv/cv.en.html', output: 'public/Ase-Sagebakken-CV-en.pdf' },
}

const languages = process.argv.slice(2)
const unknown = languages.filter((language) => !(language in versions))
if (unknown.length) {
  console.error(`Unknown language: ${unknown.join(', ')}. Use: ${Object.keys(versions).join(', ')}`)
  process.exit(1)
}

const browser = await chromium.launch()
try {
  for (const language of languages.length ? languages : Object.keys(versions)) {
    const { source, output } = versions[language]
    const page = await browser.newPage()
    await page.goto(pathToFileURL(resolve(root, source)).href, { waitUntil: 'networkidle' })
    await page.evaluate(() => document.fonts.ready)
    await page.pdf({ path: resolve(root, output), preferCSSPageSize: true, printBackground: true })
    await page.close()
    console.log(`${source} → ${output}`)
  }
} finally {
  await browser.close()
}
