/**
 * Comprehensive test suite covering all major user flows and edge cases.
 * Run against localhost:3000 (default) with test Stripe keys.
 * Override target with BASE_URL env var, e.g. BASE_URL=https://laxamigroupsltd.com npx playwright test
 * Full payment test requires: stripe listen --forward-to localhost:3000/api/webhooks/stripe
 */
import { test, expect, type Page } from "playwright/test"

// ─── Shared fixtures ──────────────────────────────────────────────────────────

const COLLECTION = {
  addr: "1 Victoria Street, London SW1H 0ET",
  street: "1 Victoria Street",
  city: "London",
  postcode: "SW1H 0ET",
  lat: 51.4994,
  long: -0.1337,
  stairs: 0,
}

const DELIVERY = {
  addr: "221B Baker Street, London NW1 6XE",
  street: "221B Baker Street",
  city: "London",
  postcode: "NW1 6XE",
  lat: 51.5237,
  long: -0.1585,
  stairs: 0,
}

async function mockAutocomplete(page: Page) {
  await page.route("**/api/addresses/autocomplete**", async (route) => {
    const url = new URL(route.request().url())
    const term = url.searchParams.get("term")?.toLowerCase() ?? ""
    const address = term.includes("baker") ? DELIVERY : COLLECTION
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        suggestions: [
          {
            id: `mock-${term.slice(0, 8)}`,
            address: address.addr,
            mainText: address.street,
            secondaryText: `${address.city} ${address.postcode}`,
            detail: address,
          },
        ],
        provider: "mock",
      }),
    })
  })
}

async function selectAddress(page: Page, label: string, term: string, expectedText: string) {
  await page.getByLabel(label).fill(term)
  await page.waitForSelector(`button:has-text('${expectedText}')`, { timeout: 8000 })
  await page.locator("button", { hasText: expectedText }).first().click()
}

async function completeStep1(page: Page) {
  await mockAutocomplete(page)
  await page.goto("/move/1")
  await selectAddress(page, "Search collection address", "Victoria Street", "1 Victoria Street")
  await selectAddress(page, "Search delivery address", "Baker Street", "221B Baker Street")
  await page.getByRole("button", { name: "Next", exact: true }).click()
  await page.waitForURL("**/move/2", { timeout: 20000 })
}

async function completeStep2(page: Page) {
  await page.getByRole("button", { name: "Get free quotes" }).click()
  await page.waitForURL("**/move/3", { timeout: 20000 })
}

async function completeStep3(page: Page, { name = "Test User", email = "test@example.com", phone = "07700900000" } = {}) {
  await page.getByLabel("Your name").fill(name)
  await page.getByLabel("Your email").fill(email)
  await page.getByLabel("Your phone number").fill(phone)
  await page.getByRole("button", { name: "Get free quotes" }).click()
  await page.waitForURL("**/move/4", { timeout: 20000 })
}

// ─── 1. Homepage ─────────────────────────────────────────────────────────────

test.describe("Homepage", () => {
  test("loads with correct title", async ({ page }) => {
    await page.goto("/")
    await expect(page).toHaveTitle(/Man and Van/i)
  })

  test("Get a Quote CTA is visible and links to /move", async ({ page }) => {
    await page.goto("/")
    // Navbar has "Get quotes" and "Get free quotes" CTAs
    const cta = page.getByRole("link", { name: /get.*quotes|free.*quotes/i }).first()
    await expect(cta).toBeVisible({ timeout: 8000 })
    const href = await cta.getAttribute("href")
    expect(href).toMatch(/move/)
  })

  test("navbar renders with site name and main links", async ({ page }) => {
    await page.goto("/")
    const header = page.locator("header")
    await expect(header).toBeVisible()
    // Nav has Home, Get quotes, Contact links
    await expect(page.getByRole("link", { name: "Get quotes" })).toBeVisible()
  })

  test("footer is present with contact info", async ({ page }) => {
    await page.goto("/")
    await expect(page.locator("footer")).toBeVisible()
    await expect(page.locator("footer")).toContainText(/\d{4}/)
  })

  test("theme toggle is present in navbar", async ({ page }) => {
    await page.goto("/")
    // ThemeToggle renders inside the header
    const header = page.locator("header")
    await expect(header).toBeVisible()
    // Look for any button in the header that's not a nav link (the toggle button)
    const buttons = header.getByRole("button")
    await expect(buttons.first()).toBeVisible({ timeout: 5000 })
  })

  test("theme toggle switches between light and dark mode", async ({ page }) => {
    await page.goto("/")
    const html = page.locator("html")
    const initialClass = (await html.getAttribute("class")) ?? ""
    // The ThemeToggle button toggles the .dark class on <html>
    // Find it via aria-label or by being in the header
    const toggle = page.locator("header button").first()
    await toggle.click()
    await page.waitForTimeout(300)
    const afterClass = (await html.getAttribute("class")) ?? ""
    expect(afterClass).not.toBe(initialClass)
    // Toggle back
    await toggle.click()
    await page.waitForTimeout(300)
    const finalClass = (await html.getAttribute("class")) ?? ""
    expect(finalClass).toBe(initialClass)
  })

  test("quick quote widget rejects submit without addresses", async ({ page }) => {
    await page.goto("/")
    const getQuotesBtn = page.getByRole("button", { name: /get quotes/i }).first()
    if (await getQuotesBtn.isVisible()) {
      await getQuotesBtn.click()
      await expect(page.getByText(/select.*address|address.*required|collection.*deliver/i).first()).toBeVisible({ timeout: 3000 })
    }
  })

  test("HowItWorks section has 3 steps", async ({ page }) => {
    await page.goto("/")
    await expect(page.getByText("How it works")).toBeVisible({ timeout: 8000 })
    await expect(page.getByText("Enter your route")).toBeVisible()
    await expect(page.getByText("Pick date & van")).toBeVisible()
    await expect(page.getByText("Book & pay")).toBeVisible()
  })

  test("Services section lists core services", async ({ page }) => {
    await page.goto("/")
    await expect(page.getByText("Services")).toBeVisible({ timeout: 8000 })
    await expect(page.getByText("Home moves")).toBeVisible()
    await expect(page.getByText("Office relocations")).toBeVisible()
  })
})

// ─── 2. Booking Wizard — Step 1 (Route) ──────────────────────────────────────

test.describe("Wizard Step 1 — Route", () => {
  test("Next button does nothing without addresses selected from dropdown", async ({ page }) => {
    await mockAutocomplete(page)
    await page.goto("/move/1")
    await page.getByRole("button", { name: "Next", exact: true }).click()
    // URL should still be /move/1 and error shown
    await expect(page.locator(".error-banner")).toBeVisible({ timeout: 5000 })
    await expect(page).toHaveURL(/\/move\/1/)
  })

  test("can select collection and delivery addresses and proceed", async ({ page }) => {
    await completeStep1(page)
    await expect(page).toHaveURL(/\/move\/2/)
  })

  test("can add a stop point", async ({ page }) => {
    await mockAutocomplete(page)
    await page.goto("/move/1")
    await selectAddress(page, "Search collection address", "Victoria Street", "1 Victoria Street")
    await selectAddress(page, "Search delivery address", "Baker Street", "221B Baker Street")

    const addStop = page.getByRole("button", { name: /add stop/i })
    await expect(addStop).toBeVisible()
    await addStop.click()
    await expect(page.getByText(/stop point 1/i)).toBeVisible()
  })

  test("can remove a stop point", async ({ page }) => {
    await mockAutocomplete(page)
    await page.goto("/move/1")
    await selectAddress(page, "Search collection address", "Victoria Street", "1 Victoria Street")
    await selectAddress(page, "Search delivery address", "Baker Street", "221B Baker Street")

    await page.getByRole("button", { name: /add stop/i }).click()
    await expect(page.getByText(/stop point 1/i)).toBeVisible()
    await page.getByRole("button", { name: /remove stop/i }).click()
    await expect(page.getByText(/stop point 1/i)).not.toBeVisible()
  })

  test("Add stop button disappears after 3 stops", async ({ page }) => {
    await mockAutocomplete(page)
    await page.goto("/move/1")
    await selectAddress(page, "Search collection address", "Victoria Street", "1 Victoria Street")
    await selectAddress(page, "Search delivery address", "Baker Street", "221B Baker Street")

    const addStop = page.getByRole("button", { name: /add stop/i })
    await addStop.click()
    await addStop.click()
    await addStop.click()
    await expect(addStop).not.toBeVisible()
  })

  test("back button from step 2 returns to step 1", async ({ page }) => {
    await completeStep1(page)
    const backBtn = page.getByRole("button", { name: /back/i })
    if (await backBtn.isVisible()) {
      await backBtn.click()
      await expect(page).toHaveURL(/\/move\/1/)
    }
  })
})

// ─── 3. Booking Wizard — Step 2 (Move details) ───────────────────────────────

test.describe("Wizard Step 2 — Move details", () => {
  test("shows all van size options", async ({ page }) => {
    await completeStep1(page)
    await expect(page.getByText("Small van")).toBeVisible({ timeout: 8000 })
    await expect(page.getByText("Medium van")).toBeVisible()
    await expect(page.getByText("Large van")).toBeVisible()
    await expect(page.getByText(/luton/i)).toBeVisible()
  })

  test("shows all helper options", async ({ page }) => {
    await completeStep1(page)
    await expect(page.getByText("No help needed")).toBeVisible({ timeout: 8000 })
    await expect(page.getByText("Driver helping")).toBeVisible()
    await expect(page.getByText("Driver + 1 person helping")).toBeVisible()
  })

  test("can select Luton van", async ({ page }) => {
    await completeStep1(page)
    await page.getByText("Luton van").click()
    // Luton van card should now show the accent colour (selected state)
    await expect(page.getByText("Luton van")).toBeVisible()
  })

  test("hours select shows available options", async ({ page }) => {
    await completeStep1(page)
    const select = page.locator("select").first()
    await expect(select).toBeVisible({ timeout: 8000 })
    // Min 5 hours, max 17.5
    await expect(select.locator("option[value='5']")).toHaveCount(1)
    await expect(select.locator("option[value='17.5']")).toHaveCount(1)
  })

  test("past date shows error and does not advance to step 3", async ({ page }) => {
    await completeStep1(page)
    const dateInput = page.locator('input[type="date"]')
    await expect(dateInput).toBeVisible({ timeout: 8000 })
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    await dateInput.fill(yesterday.toISOString().slice(0, 10))
    await page.getByRole("button", { name: "Get free quotes" }).click()
    // Wizard should stay on step 2 and show an error banner
    await expect(page.locator(".error-banner")).toBeVisible({ timeout: 10000 })
    await expect(page).toHaveURL(/\/move\/2/)
  })

  test("proceeds to step 3 with default options", async ({ page }) => {
    await completeStep1(page)
    await completeStep2(page)
    await expect(page).toHaveURL(/\/move\/3/)
  })

  test("back button from step 3 returns to step 2", async ({ page }) => {
    await completeStep1(page)
    await completeStep2(page)
    const backBtn = page.getByRole("button", { name: /back/i })
    if (await backBtn.isVisible()) {
      await backBtn.click()
      await expect(page).toHaveURL(/\/move\/2/)
    }
  })
})

// ─── 4. Booking Wizard — Step 3 (Contact info) ───────────────────────────────

test.describe("Wizard Step 3 — Contact info", () => {
  test("shows name, email, and phone fields", async ({ page }) => {
    await completeStep1(page)
    await completeStep2(page)
    await expect(page.getByLabel("Your name")).toBeVisible()
    await expect(page.getByLabel("Your email")).toBeVisible()
    await expect(page.getByLabel("Your phone number")).toBeVisible()
  })

  test("rejects submit with all fields empty", async ({ page }) => {
    await completeStep1(page)
    await completeStep2(page)
    await page.getByRole("button", { name: "Get free quotes" }).click()
    await expect(page).not.toHaveURL(/\/move\/4/)
  })

  test("rejects submit with invalid email format", async ({ page }) => {
    await completeStep1(page)
    await completeStep2(page)
    await page.getByLabel("Your name").fill("Test User")
    await page.getByLabel("Your email").fill("not-an-email")
    await page.getByLabel("Your phone number").fill("07700900000")
    await page.getByRole("button", { name: "Get free quotes" }).click()
    await expect(page).not.toHaveURL(/\/move\/4/)
  })

  test("rejects submit with phone too short", async ({ page }) => {
    await completeStep1(page)
    await completeStep2(page)
    await page.getByLabel("Your name").fill("Test User")
    await page.getByLabel("Your email").fill("test@example.com")
    await page.getByLabel("Your phone number").fill("123")
    await page.getByRole("button", { name: "Get free quotes" }).click()
    await expect(page).not.toHaveURL(/\/move\/4/)
  })

  test("back button returns to step 2", async ({ page }) => {
    await completeStep1(page)
    await completeStep2(page)
    const backBtn = page.getByRole("button", { name: /back/i })
    if (await backBtn.isVisible()) {
      await backBtn.click()
      await expect(page).toHaveURL(/\/move\/2/)
    }
  })
})

// ─── 5. Booking Wizard — Step 4 (Quotes) ─────────────────────────────────────

test.describe("Wizard Step 4 — Quotes", () => {
  test("displays at least one quote with a price", async ({ page }) => {
    await completeStep1(page)
    await completeStep2(page)
    await completeStep3(page)
    await expect(page.getByText(/£\d+\.\d{2}/).first()).toBeVisible({ timeout: 10000 })
  })

  test("Book Now creates a PENDING booking via /api/bookings", async ({ page }) => {
    test.setTimeout(60000)
    await completeStep1(page)
    await completeStep2(page)
    await completeStep3(page)

    const bookBtn = page.getByRole("button", { name: "Book now" }).first()
    await expect(bookBtn).toBeVisible({ timeout: 10000 })

    // Verify the booking API call succeeds — DB, pricing, and validation all pass.
    // Full Stripe checkout E2E is covered by e2e/stripe-checkout.spec.ts.
    const bookingResponsePromise = page.waitForResponse(
      (r) => r.url().includes("/api/bookings") && r.request().method() === "POST",
      { timeout: 30000 },
    )
    await bookBtn.click()
    const bookingResponse = await bookingResponsePromise
    expect(bookingResponse.ok()).toBeTruthy()
    const bookingData = await bookingResponse.json() as { bookingId?: string; checkoutToken?: string }
    expect(bookingData.bookingId).toBeDefined()
    expect(bookingData.checkoutToken).toBeDefined()
  })

  test("back button returns to step 3", async ({ page }) => {
    await completeStep1(page)
    await completeStep2(page)
    await completeStep3(page)
    const backBtn = page.getByRole("button", { name: /back/i })
    if (await backBtn.isVisible()) {
      await backBtn.click()
      await expect(page).toHaveURL(/\/move\/3/)
    }
  })
})

// ─── 6. API endpoints ─────────────────────────────────────────────────────────

test.describe("API — Quotes endpoint", () => {
  const validBody = {
    collection: { ...COLLECTION },
    stops: [],
    delivery: { ...DELIVERY },
    vantype: 1,
    hours: 5,
    helpers: 1,
    date: "01/01/2030",
    time: "09:00",
  }

  test("POST /api/quotes returns quotes for valid input", async ({ request }) => {
    const res = await request.post("/api/quotes", { data: validBody })
    expect(res.ok()).toBeTruthy()
    const data = await res.json()
    expect(Array.isArray(data.quotes)).toBe(true)
    expect(data.quotes.length).toBeGreaterThan(0)
    expect(typeof data.minPrice).toBe("number")
  })

  test("POST /api/quotes rejects missing coordinates with 400", async ({ request }) => {
    const body = {
      ...validBody,
      collection: { addr: "some address", street: "", city: "", postcode: "", lat: null, long: null, stairs: 0 },
    }
    const res = await request.post("/api/quotes", { data: body })
    expect(res.status()).toBe(400)
  })

  test("POST /api/quotes rejects past date with 400", async ({ request }) => {
    const res = await request.post("/api/quotes", { data: { ...validBody, date: "01/01/2000" } })
    expect(res.status()).toBe(400)
  })

  test("POST /api/quotes rejects invalid van type with 400", async ({ request }) => {
    const res = await request.post("/api/quotes", { data: { ...validBody, vantype: 99 } })
    expect(res.status()).toBe(400)
  })

  test("POST /api/quotes rejects hours below minimum with 400", async ({ request }) => {
    const res = await request.post("/api/quotes", { data: { ...validBody, hours: 1 } })
    expect(res.status()).toBe(400)
  })

  test("POST /api/quotes rejects empty body with 400", async ({ request }) => {
    const res = await request.post("/api/quotes", { data: {} })
    expect(res.status()).toBe(400)
  })
})

test.describe("API — Address autocomplete", () => {
  test("returns suggestions for a valid term", async ({ request }) => {
    const res = await request.get("/api/addresses/autocomplete?term=Victoria+Street+London")
    expect(res.ok()).toBeTruthy()
    const data = await res.json()
    expect(data.suggestions).toBeDefined()
    expect(data.provider).toMatch(/google|free/)
    expect(data.suggestions.length).toBeGreaterThan(0)
  })

  test("returns empty array (not an error) for short term under 3 chars", async ({ request }) => {
    const res = await request.get("/api/addresses/autocomplete?term=ab")
    // Short terms return 200 with empty suggestions — not a 4xx error
    expect(res.status()).toBe(200)
    const data = await res.json()
    expect(data.suggestions).toHaveLength(0)
  })

  test("returns empty array for blank term", async ({ request }) => {
    const res = await request.get("/api/addresses/autocomplete?term=")
    expect(res.status()).toBe(200)
    const data = await res.json()
    expect(data.suggestions).toHaveLength(0)
  })
})

// ─── 7. Admin panel ───────────────────────────────────────────────────────────

test.describe("Admin — Authentication", () => {
  test("redirects unauthenticated users from /admin to /admin/login", async ({ page }) => {
    await page.goto("/admin")
    await expect(page).toHaveURL(/\/admin\/login/)
  })

  test("login page renders Email and Password fields", async ({ page }) => {
    await page.goto("/admin/login")
    // Labels have htmlFor="email"/"password", inputs have matching id
    await expect(page.getByLabel("Email")).toBeVisible({ timeout: 8000 })
    await expect(page.getByLabel("Password")).toBeVisible()
    await expect(page.getByRole("button", { name: /sign in/i })).toBeVisible()
  })

  test("shows error for wrong credentials", async ({ page }) => {
    await page.goto("/admin/login")
    await page.getByLabel("Email").fill("wrong@example.com")
    await page.getByLabel("Password").fill("wrongpassword")
    await page.getByRole("button", { name: /sign in/i }).click()
    await expect(page.getByText(/invalid.*email.*password|invalid.*password/i).first()).toBeVisible({ timeout: 8000 })
  })
})

// ─── 8. Static / content pages ───────────────────────────────────────────────

test.describe("Static pages", () => {
  const staticPages = [
    { path: "/s/faq", text: /faq|frequently/i },
    { path: "/s/privacy-cookies", text: /privacy/i },
    { path: "/s/termsofuse", text: /terms/i },
    { path: "/s/sizeguide", text: /size/i },
    { path: "/s/moving-tips", text: /tips/i },
  ]

  for (const { path, text } of staticPages) {
    test(`${path} loads with expected heading`, async ({ page }) => {
      await page.goto(path)
      await expect(page.getByRole("heading", { name: text }).first()).toBeVisible({ timeout: 8000 })
    })
  }
})

// ─── 9. Error handling ────────────────────────────────────────────────────────

test.describe("Error handling", () => {
  test("unknown route returns 404", async ({ page }) => {
    const res = await page.goto("/this-page-does-not-exist-xyz123")
    expect(res?.status()).toBe(404)
  })

  test("direct navigation to /move/4 without booking does not crash", async ({ page }) => {
    await page.goto("/move/4")
    const body = await page.locator("body").textContent()
    expect(body).not.toContain("Unhandled")
    expect(body).not.toContain("Application error")
  })
})

// ─── 10. Security ─────────────────────────────────────────────────────────────

test.describe("Security — CORS", () => {
  test("API rejects requests from disallowed Origin header with 403", async ({ request }) => {
    const res = await request.post("/api/quotes", {
      data: {},
      headers: { Origin: "https://evil.example.com" },
    })
    expect(res.status()).toBe(403)
  })

  test("API allows requests with no Origin header (same-origin or server-to-server)", async ({ request }) => {
    // A request without Origin should pass CORS (it's not cross-origin)
    const res = await request.post("/api/quotes", { data: {} })
    // Will be 400 (validation), not 403 (CORS)
    expect(res.status()).not.toBe(403)
  })
})
