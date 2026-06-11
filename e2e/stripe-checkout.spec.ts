import { test, expect, type Page } from "playwright/test"

// Real London coordinates so the routing API returns a valid journey.
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

// Intercept the address autocomplete API so we don't need real Google Maps
// interaction. The suggestion carries a `detail` object with coordinates, so
// the wizard treats it as a fully-resolved address without a second API call.
async function mockAddressAutocomplete(page: Page) {
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
            id: `mock-${address === DELIVERY ? "delivery" : "collection"}`,
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

// Stripe's Payment Element renders card inputs inside an iframe whose name/src
// varies by checkout version. Iterating frames is the most resilient approach.
async function fillStripeCardFields(page: Page) {
  for (const frame of page.frames()) {
    try {
      const cardInput = frame.locator('input[placeholder="1234 1234 1234 1234"]')
      if (await cardInput.count({ timeout: 1000 }) > 0) {
        await cardInput.fill("4242 4242 4242 4242")
        await frame.locator('input[placeholder="MM / YY"]').fill("12 / 26")
        await frame.locator('input[placeholder="CVC"]').fill("123")
        return
      }
    } catch {
      // frame not ready, try next
    }
  }
  throw new Error("Stripe card input iframe not found — run with PWDEBUG=1 to inspect the page structure")
}

async function goThroughBookingWizard(page: Page) {
  await mockAddressAutocomplete(page)

  // ── Step 1: Route ────────────────────────────────────────────────────────
  await page.goto("/move/1")

  await page.getByLabel("Search collection address").fill("Victoria Street")
  await page.waitForSelector("button:has-text('1 Victoria Street')", { timeout: 8000 })
  await page.locator("button", { hasText: "1 Victoria Street" }).first().click()

  await page.getByLabel("Search delivery address").fill("Baker Street")
  await page.waitForSelector("button:has-text('221B Baker Street')", { timeout: 8000 })
  await page.locator("button", { hasText: "221B Baker Street" }).first().click()

  await page.getByRole("button", { name: "Next", exact: true }).click()

  // ── Step 2: Move details ─────────────────────────────────────────────────
  await page.waitForURL("**/move/2", { timeout: 20000 })
  await page.getByRole("button", { name: "Get free quotes" }).click()

  // ── Step 3: Contact info ─────────────────────────────────────────────────
  await page.waitForURL("**/move/3", { timeout: 20000 })

  await page.getByLabel("Your name").fill("Haseeb Ahsan (e2e)")
  await page.getByLabel("Your email").fill("haseebahsan168@gmail.com")
  await page.getByLabel("Your phone number").fill("07700900000")
  await page.getByRole("button", { name: "Get free quotes" }).click()

  // ── Step 4: Quotes ───────────────────────────────────────────────────────
  await page.waitForURL("**/move/4", { timeout: 20000 })

  const bookButtons = page.getByRole("button", { name: "Book now" })
  await expect(bookButtons.first()).toBeVisible({ timeout: 10000 })

  const quotePrice = page.locator("article p").filter({ hasText: /£\d+\.\d{2}/ }).first()
  await expect(quotePrice).toBeVisible()
  console.log("Quote price found — proceeding to checkout")

  // ── Stripe redirect ──────────────────────────────────────────────────────
  await Promise.all([
    page.waitForURL(/checkout\.stripe\.com/, { timeout: 30000 }),
    bookButtons.first().click(),
  ])
}

test("full booking flow → Stripe payment → success page", async ({ page }) => {
  test.setTimeout(180_000)

  await goThroughBookingWizard(page)

  const checkoutUrl = page.url()
  console.log("✅ Stripe checkout URL:", checkoutUrl)
  expect(checkoutUrl).toContain("checkout.stripe.com")
  // cs_test_ confirms test Stripe keys are active.
  expect(checkoutUrl).toMatch(/\/c\/pay\/cs_test_/)

  // ── Stripe payment form ──────────────────────────────────────────────────
  // Do NOT use waitForLoadState("networkidle") — Stripe keeps WebSocket
  // connections open indefinitely, so networkidle never fires.
  await page.waitForLoadState("load")
  // Allow the Payment Element iframe extra time to mount its inputs.
  await page.waitForTimeout(3000)

  // Stripe Link may intercept when it recognises the email. Dismiss it so
  // we reach the plain card form. "Pay without Link" is shown at the bottom.
  const payWithoutLink = page.getByRole("link", { name: /pay without link/i })
    .or(page.getByText(/pay without link/i))
  if (await payWithoutLink.count() > 0 && await payWithoutLink.first().isVisible()) {
    await payWithoutLink.first().click()
    await page.waitForTimeout(2000)
  }

  // Card number, expiry, and CVC live inside Stripe's secure payment iframe.
  // Iterate frames to find the one that actually contains the card input —
  // this is more resilient than guessing the iframe name/src.
  await fillStripeCardFields(page)

  // "Cardholder name" is rendered outside the card iframe in hosted checkout.
  await page.locator('input[placeholder="Full name on card"]').fill("Test User")

  console.log("Card details entered — submitting payment")

  // Submit and wait for Stripe to redirect back to /move/success
  await Promise.all([
    page.waitForURL(/\/move\/success/, { timeout: 60000 }),
    page.getByRole("button", { name: /^pay/i }).click(),
  ])

  console.log("✅ Redirected to success page:", page.url())
  await expect(page.getByRole("heading", { name: "Thank you" })).toBeVisible({ timeout: 10000 })
  await expect(page).toHaveURL(/\/move\/success\?session_id=/)
})

test("homepage loads and Get a Quote CTA is visible", async ({ page }) => {
  await page.goto("/")
  await expect(page).toHaveTitle(/Man and Van/i)
  // Look for any prominent CTA that starts the booking flow.
  const cta = page.getByRole("link", { name: /quote|book|get started/i }).first()
  await expect(cta).toBeVisible({ timeout: 10000 })
})
