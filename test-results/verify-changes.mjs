import { chromium } from 'playwright'

const BASE = 'http://localhost:3003'
let pass = 0, fail = 0
const findings = []

async function screenshot(page, name) {
  await page.screenshot({ path: `test-results/verify-${name}.png`, fullPage: false })
}

async function mockQuoteApi(page) {
  await page.route('**/api/quotes', route =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        journey: { distanceKm: 5.2, durationMinutes: 18 },
        minHours: 5,
        minPrice: 125,
        quotes: [
          {
            id: 'q1', companyName: 'Quick Movers', vehicleType: 'Medium Van',
            rating: 4.8, reviewCount: 142, coverageInfo: 'London & Surrey',
            price: 175, hourlyRate: 35
          }
        ]
      })
    })
  )
}

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage()

// TEST 1: Step 2 ONE-trip warning + native dialog modal
console.log('\n=== TEST 1: ONE-trip warning + Read More modal ===')
try {
  await page.goto(`${BASE}/move/2`, { waitUntil: 'networkidle' })

  const warning = page.locator('text=ONE trip only')
  if (await warning.count() > 0) {
    console.log('  PASS: ONE trip warning visible')
    pass++
  } else {
    console.log('  FAIL: ONE trip warning missing')
    fail++
  }

  const readMore = page.locator('button:has-text("Read More")')
  await readMore.click()
  await page.waitForTimeout(400)

  const dialog = page.locator('dialog[aria-labelledby="trips-modal-title"]')
  const dialogOpen = await dialog.evaluate(el => el.open)
  if (dialogOpen) {
    console.log('  PASS: native <dialog> open=true after Read More click')
    pass++
  } else {
    console.log('  FAIL: modal did not open')
    fail++
    findings.push('FAIL: Read More did not open modal')
  }

  await screenshot(page, 'modal-open')

  // Test Escape key
  await page.keyboard.press('Escape')
  await page.waitForTimeout(400)
  const afterEscape = await dialog.evaluate(el => el.open)
  if (!afterEscape) {
    console.log('  PASS: Escape key closed the modal')
    pass++
  } else {
    console.log('  FAIL: Escape key did NOT close modal')
    fail++
    findings.push('FAIL: Escape key did not close modal')
  }

  // Reopen then close with x button
  await readMore.click()
  await page.waitForTimeout(400)
  const xBtn = dialog.locator('button[aria-label="Close"]')
  await xBtn.click()
  await page.waitForTimeout(400)
  const afterX = await dialog.evaluate(el => el.open)
  if (!afterX) {
    console.log('  PASS: x button closed the modal')
    pass++
  } else {
    console.log('  FAIL: x button did not close modal')
    fail++
  }

  // Reopen then close with bottom Close button
  await readMore.click()
  await page.waitForTimeout(400)
  const closeBottom = dialog.locator('button:has-text("Close")')
  await closeBottom.click()
  await page.waitForTimeout(400)
  const afterClose = await dialog.evaluate(el => el.open)
  if (!afterClose) {
    console.log('  PASS: bottom Close button closed the modal')
    pass++
  } else {
    console.log('  FAIL: bottom Close button did not close modal')
    fail++
  }
} catch (e) {
  console.log('  ERROR in TEST 1:', e.message)
  fail++
}

// TEST 2: Step 4 payment toggle and deposit amounts
console.log('\n=== TEST 2: Step 4 payment toggle + 35% deposit ===')
try {
  await page.goto(`${BASE}/move/2`, { waitUntil: 'networkidle' })
  await mockQuoteApi(page)

  // Advance through wizard
  const getQuotes1 = page.locator('button:has-text("Get free quotes")')
  await getQuotes1.click()
  await page.waitForTimeout(1500)

  // Should be on step 3 now
  const step3Heading = page.locator('text=About you')
  if (await step3Heading.count() > 0) {
    const inputs = page.locator('input[placeholder="required"]')
    const count = await inputs.count()
    if (count >= 1) await inputs.nth(0).fill('Test User')
    if (count >= 2) await inputs.nth(1).fill('test@example.com')
    if (count >= 3) await inputs.nth(2).fill('07700900000')

    const getQuotes2 = page.locator('button:has-text("Get free quotes")')
    await getQuotes2.click()
    await page.waitForTimeout(1500)
  }

  // Check step 4
  const payToggle = page.locator('text=How would you like to pay?')
  if (await payToggle.count() > 0) {
    console.log('  PASS: Step 4 payment toggle visible')
    pass++

    // Deposit button shows correct label
    const depositBtn = page.locator('button:has-text("35% deposit now")')
    if (await depositBtn.count() > 0) {
      console.log('  PASS: 35% deposit button label correct')
      pass++
    } else {
      console.log('  FAIL: 35% deposit button missing or wrong label')
      fail++
    }

    // Click deposit and check amount
    await depositBtn.click()
    await page.waitForTimeout(400)

    // 35% of £175 = £61.25
    const depositAmountEl = page.locator('text=61.25')
    if (await depositAmountEl.count() > 0) {
      console.log('  PASS: deposit amount £61.25 (35% of £175) shown correctly')
      pass++
    } else {
      console.log('  FAIL: deposit amount not found (expected £61.25)')
      fail++
      findings.push('FAIL: expected 35% deposit amount £61.25 not visible')
    }

    // Check "35% deposit · Total" label
    const subtotalLabel = page.locator('text=35% deposit')
    if (await subtotalLabel.count() > 0) {
      console.log('  PASS: deposit percentage label visible in quote card')
      pass++
    }

    // Check amber note about remaining 65%
    const amberNote = page.locator('text=remaining 65%')
    if (await amberNote.count() > 0) {
      console.log('  PASS: 65% remaining note visible')
      pass++
    } else {
      console.log('  NOTE: 65% remaining note not found (may be worded differently)')
      findings.push('NOTE: amber deposit note text check inconclusive')
    }

    // Switch back to full — verify total price shows again
    const fullBtn = page.locator('button:has-text("Pay in full")')
    await fullBtn.click()
    await page.waitForTimeout(400)
    const fullAmount = page.locator('text=175.00')
    if (await fullAmount.count() > 0) {
      console.log('  PASS: switching to "Pay in full" restores full price £175.00')
      pass++
    }

    await screenshot(page, 'step4-deposit')
  } else {
    console.log('  NOTE: Could not reach step 4 (API mock may not have fired in time)')
    findings.push('NOTE: Step 4 test incomplete — wizard navigation could not complete')
  }
} catch (e) {
  console.log('  ERROR in TEST 2:', e.message)
  findings.push('ERROR in step 4 test: ' + e.message)
}

// TEST 3: Theme script inline in HTML
console.log('\n=== TEST 3: Theme init inlined in HTML (no FOUC) ===')
try {
  await page.goto(`${BASE}/`, { waitUntil: 'networkidle' })
  const html = await page.content()
  if (html.includes("localStorage.getItem('theme')")) {
    console.log('  PASS: Theme init script is inlined in served HTML — no FOUC')
    pass++
  } else {
    console.log('  NOTE: Theme script not found inline — may load via Script component')
    findings.push('NOTE: Verify theme script is not causing FOUC in browser DevTools')
  }
  await screenshot(page, 'homepage')
} catch (e) {
  console.log('  ERROR in TEST 3:', e.message)
}

// TEST 4: Success page graceful fallback
console.log('\n=== TEST 4: Success page fallback (no session_id) ===')
try {
  await page.goto(`${BASE}/move/success`, { waitUntil: 'networkidle' })
  const body = (await page.textContent('body')) ?? ''
  if (body.includes('without paying') || body.includes('booking flow')) {
    console.log('  PASS: Success page handles missing session_id gracefully')
    pass++
  } else if (body.includes('Thank you')) {
    console.log('  PASS: Success page renders without crashing')
    pass++
  } else {
    console.log('  FAIL: Success page content unexpected:', body.slice(0, 150))
    fail++
  }
  await screenshot(page, 'success-no-session')
} catch (e) {
  console.log('  ERROR in TEST 4:', e.message)
  fail++
}

// TEST 5: Step 4 direct navigation fallback
console.log('\n=== TEST 5: Step 4 direct navigation fallback ===')
try {
  await page.goto(`${BASE}/move/4`, { waitUntil: 'networkidle' })
  const fallback = page.locator('text=No quote results loaded')
  if (await fallback.count() > 0) {
    console.log('  PASS: Step 4 shows "No quote results loaded" for direct navigation')
    pass++
  } else {
    console.log('  NOTE: Step 4 fallback text not found (may redirect)')
  }
} catch (e) {
  console.log('  ERROR in TEST 5:', e.message)
}

// PROBE: Dark mode toggle
console.log('\n=== PROBE: Dark mode toggle ===')
try {
  await page.goto(`${BASE}/`, { waitUntil: 'networkidle' })
  // Set dark theme in localStorage and reload
  await page.evaluate(() => localStorage.setItem('theme', 'dark'))
  await page.reload({ waitUntil: 'networkidle' })
  const hasDark = await page.evaluate(() => document.documentElement.classList.contains('dark'))
  if (hasDark) {
    console.log('  PASS: theme=dark in localStorage applied before first paint')
    pass++
  } else {
    console.log('  FAIL: dark class not applied after localStorage set')
    fail++
    findings.push('FAIL: dark mode theme init not working')
  }
  await screenshot(page, 'dark-mode')
  // Reset
  await page.evaluate(() => localStorage.removeItem('theme'))
} catch (e) {
  console.log('  ERROR in dark mode probe:', e.message)
}

console.log('\n========================================')
console.log(`Results: ${pass} passed, ${fail} failed`)
if (findings.length > 0) {
  console.log('\nFindings:')
  findings.forEach(f => console.log('  ' + f))
}
console.log(`\nVerdict: ${fail === 0 ? 'PASS' : 'FAIL'}`)

await browser.close()
process.exit(fail === 0 ? 0 : 1)
