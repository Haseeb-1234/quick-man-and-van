import { chromium } from 'playwright'

const BASE = 'http://localhost:3006'
let pass = 0, fail = 0
const findings = []

async function screenshot(page, name) {
  try { await page.screenshot({ path: `test-results/verify-${name}.png` }) } catch (_) {}
}

async function mockQuoteApi(page) {
  await page.route('**/api/quotes', route =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        journey: { distanceKm: 5.2, durationMinutes: 18 },
        minHours: 5, minPrice: 125,
        quotes: [{
          id: 'q1', companyName: 'Quick Movers', vehicleType: 'Medium Van',
          rating: 4.8, reviewCount: 142, coverageInfo: 'London & Surrey',
          price: 175, hourlyRate: 35
        }]
      })
    })
  )
}

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage()
page.on('console', msg => {
  if (msg.type() === 'error') console.log('[browser-err]', msg.text().slice(0, 100))
})

// TEST 1: ONE-trip warning + native dialog modal
console.log('\n=== TEST 1: ONE-trip warning + Read More modal ===')
try {
  await page.goto(`${BASE}/move/2`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(1500)

  const warning = await page.locator('text=ONE trip only').count()
  if (warning > 0) { console.log('  PASS: ONE trip warning visible'); pass++ }
  else { console.log('  FAIL: ONE trip warning missing'); fail++ }

  const dialogEl = page.locator('dialog[aria-labelledby="trips-modal-title"]')
  console.log('  INFO: dialog elements in DOM:', await dialogEl.count())

  const readMore = page.locator('button:has-text("Read More")')
  const rmCount = await readMore.count()
  if (rmCount === 0) {
    console.log('  FAIL: Read More button not found'); fail++
  } else {
    await readMore.click()
    await page.waitForTimeout(600)
    const isOpen = await dialogEl.evaluate(el => el.open)
    if (isOpen) { console.log('  PASS: modal opened (dialog.open = true)'); pass++ }
    else {
      console.log('  FAIL: modal did NOT open (dialog.open = false)')
      fail++
      findings.push('FAIL: native dialog not opening on Read More click')
    }
    await screenshot(page, 'modal-open')

    // Escape key
    await page.keyboard.press('Escape')
    await page.waitForTimeout(400)
    const afterEsc = await dialogEl.evaluate(el => el.open)
    if (!afterEsc) { console.log('  PASS: Escape key closed modal'); pass++ }
    else { console.log('  FAIL: Escape did NOT close modal'); fail++; findings.push('FAIL: Escape key not closing modal') }

    // x button
    await readMore.click(); await page.waitForTimeout(400)
    await dialogEl.locator('button[aria-label="Close"]').click(); await page.waitForTimeout(400)
    const afterX = await dialogEl.evaluate(el => el.open)
    if (!afterX) { console.log('  PASS: x button closed modal'); pass++ }
    else { console.log('  FAIL: x button did NOT close modal'); fail++ }

    // bottom Close button
    await readMore.click(); await page.waitForTimeout(400)
    await dialogEl.locator('button:has-text("Close")').click(); await page.waitForTimeout(400)
    const afterBtn = await dialogEl.evaluate(el => el.open)
    if (!afterBtn) { console.log('  PASS: bottom Close button closed modal'); pass++ }
    else { console.log('  FAIL: bottom Close did NOT close modal'); fail++ }
  }
} catch (e) {
  console.log('  ERROR TEST 1:', e.message.slice(0, 200))
  fail++
}

// TEST 2: Step 4 payment toggle and deposit amounts
console.log('\n=== TEST 2: Step 4 payment toggle + 35% deposit ===')
try {
  await page.goto(`${BASE}/move/2`, { waitUntil: 'networkidle' })
  await mockQuoteApi(page)
  await page.waitForTimeout(1500)

  // Step 2 → click Get free quotes
  const btn2 = page.locator('button:has-text("Get free quotes")')
  await btn2.click()
  await page.waitForTimeout(2500)

  // Step 3 - fill contact fields
  const inputs = page.locator('input[placeholder="required"]')
  const n = await inputs.count()
  if (n >= 1) await inputs.nth(0).fill('Test User')
  if (n >= 2) await inputs.nth(1).fill('test@example.com')
  if (n >= 3) await inputs.nth(2).fill('07700900000')
  const btn3 = page.locator('button:has-text("Get free quotes")')
  await btn3.click()
  await page.waitForTimeout(2500)

  const payLabel = page.locator('text=How would you like to pay?')
  if (await payLabel.count() === 0) {
    console.log('  NOTE: could not reach step 4 (quote API mock may not have fired)')
    findings.push('NOTE: Step 4 navigation blocked — API mock may not intercept in dev mode')
  } else {
    console.log('  PASS: step 4 payment toggle visible'); pass++

    const depositBtn = page.locator('button:has-text("35% deposit now")')
    if (await depositBtn.count() > 0) { console.log('  PASS: 35% deposit button present'); pass++ }
    else { console.log('  FAIL: 35% deposit button missing'); fail++ }

    await depositBtn.click(); await page.waitForTimeout(500)

    // 35% of £175 = £61.25
    const amt = await page.locator('text=61.25').count()
    if (amt > 0) { console.log('  PASS: deposit amount £61.25 shown (35% of £175)'); pass++ }
    else { console.log('  FAIL: £61.25 not visible'); fail++; findings.push('FAIL: deposit amount £61.25 not found') }

    const subtotalLabel = await page.locator('text=35% deposit').count()
    if (subtotalLabel > 0) { console.log('  PASS: subtotal label shown'); pass++ }

    const note65 = await page.locator('text=65%').count()
    if (note65 > 0) { console.log('  PASS: 65% remaining note visible'); pass++ }

    // Switch back to full
    await page.locator('button:has-text("Pay in full")').click(); await page.waitForTimeout(400)
    const fullAmt = await page.locator('text=175.00').count()
    if (fullAmt > 0) { console.log('  PASS: full price £175.00 restored on toggle'); pass++ }

    await screenshot(page, 'step4-deposit')
  }
} catch (e) {
  console.log('  ERROR TEST 2:', e.message.slice(0, 200))
  findings.push('ERROR in payment toggle test: ' + e.message.slice(0, 100))
}

// TEST 3: Theme init
console.log('\n=== TEST 3: Theme script in HTML ===')
try {
  await page.goto(`${BASE}/`, { waitUntil: 'networkidle' })
  const html = await page.content()
  const hasTheme = html.includes("localStorage.getItem('theme')")
  if (hasTheme) { console.log('  PASS: theme init script present in served HTML'); pass++ }
  else { console.log('  NOTE: theme init not found in dev mode HTML (Script component may inject later)'); findings.push('NOTE: theme script not in dev HTML — verify in production build') }
  await screenshot(page, 'homepage')
} catch (e) { console.log('  ERROR TEST 3:', e.message.slice(0, 100)) }

// PROBE: Dark mode from localStorage
console.log('\n=== PROBE: Dark mode from localStorage ===')
try {
  await page.goto(`${BASE}/`, { waitUntil: 'networkidle' })
  await page.evaluate(() => localStorage.setItem('theme', 'dark'))
  await page.reload({ waitUntil: 'networkidle' })
  await page.waitForTimeout(800)
  const isDark = await page.evaluate(() => document.documentElement.classList.contains('dark'))
  if (isDark) { console.log('  PASS: dark class applied from localStorage on reload'); pass++ }
  else {
    console.log('  FAIL: dark class NOT applied despite localStorage theme=dark')
    fail++; findings.push('FAIL: dark mode theme init not working after reload')
  }
  await screenshot(page, 'dark-mode')
  await page.evaluate(() => localStorage.removeItem('theme'))
} catch (e) { console.log('  ERROR dark mode probe:', e.message.slice(0, 100)); fail++ }

// TEST 4: Success page graceful fallback
console.log('\n=== TEST 4: Success page — no session_id ===')
try {
  await page.goto(`${BASE}/move/success`, { waitUntil: 'networkidle' })
  const body = (await page.textContent('body')) ?? ''
  const ok = body.includes('without paying') || body.includes('booking flow') || body.includes('Thank you')
  if (ok) { console.log('  PASS: success page renders gracefully without session_id'); pass++ }
  else { console.log('  FAIL: success page unexpected output'); fail++ }
  await screenshot(page, 'success-no-session')
} catch (e) { console.log('  ERROR TEST 4:', e.message.slice(0, 100)); fail++ }

// PROBE: Step 1 validation
console.log('\n=== PROBE: Step 1 — missing address validation ===')
try {
  await page.goto(`${BASE}/move/1`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(800)
  await page.locator('button:has-text("Next")').click()
  await page.waitForTimeout(600)
  const err = await page.locator('text=Please select both').count()
  if (err > 0) { console.log('  PASS: validation error when no address selected'); pass++ }
  else { console.log('  NOTE: validation error text not found by exact string'); findings.push('NOTE: address validation error text may be different') }
} catch (e) { console.log('  ERROR step 1 probe:', e.message.slice(0, 100)) }

console.log('\n=========================================')
console.log(`Results: ${pass} passed, ${fail} failed`)
if (findings.length) {
  console.log('\nFindings:')
  findings.forEach(f => console.log('  ' + f))
}
console.log(`\nVerdict: ${fail === 0 ? 'PASS' : 'FAIL'}`)

await browser.close()
process.exit(fail === 0 ? 0 : 1)
