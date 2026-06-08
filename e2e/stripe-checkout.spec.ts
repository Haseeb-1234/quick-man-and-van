
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

test("full booking flow reaches Stripe checkout", async ({ page }) => {
  await mockAddressAutocomplete(page)

  // ── Step 1: Route ────────────────────────────────────────────────────────
  await page.goto("/move/1")

  // Collection address
  const addressInputs = page.getByPlaceholder("Start typing, then select address")
  await addressInputs.first().fill("Victoria Street")
  await page.waitForSelector("button:has-text('1 Victoria Street')", { timeout: 8000 })
  await page.locator("button", { hasText: "1 Victoria Street" }).first().click()

  // Delivery address
  await addressInputs.last().fill("Baker Street")
  await page.waitForSelector("button:has-text('221B Baker Street')", { timeout: 8000 })
  await page.locator("button", { hasText: "221B Baker Street" }).first().click()

  await page.getByRole("button", { name: "Next" }).click()

  // ── Step 2: Move details ─────────────────────────────────────────────────
  await page.waitForURL("**/move/2", { timeout: 20000 })

  // Keep all defaults (Medium van, 5 h, Driver helping, tomorrow).
  await page.getByRole("button", { name: "Get free quotes" }).click()

  // ── Step 3: Contact info ─────────────────────────────────────────────────
  await page.waitForURL("**/move/3", { timeout: 20000 })

  await page.getByLabel("Your name").fill("Test User")
  await page.getByLabel("Your email").fill("test@example.com")
  await page.getByLabel("Your phone number").fill("07700900000")

  await page.getByRole("button", { name: "Get free quotes" }).click()

  // ── Step 4: Quotes ───────────────────────────────────────────────────────
  await page.waitForURL("**/move/4", { timeout: 20000 })

  // Verify at least one quote card is rendered.
  const bookButtons = page.getByRole("button", { name: "Book now" })
  await expect(bookButtons.first()).toBeVisible({ timeout: 10000 })

  const quotePrice = page.locator("article").first().locator("text=/£[0-9]+\\.[0-9]{2}/")
  await expect(quotePrice).toBeVisible()
  console.log("Quote price found — proceeding to checkout")

  // ── Stripe redirect ──────────────────────────────────────────────────────
  // Clicking "Book now" creates a real PENDING booking + Stripe session,
  // then redirects via window.location.assign. We wait for the Stripe URL.
  await Promise.all([
    page.waitForURL(/checkout\.stripe\.com/, { timeout: 30000 }),
    bookButtons.first().click(),
  ])

  const finalUrl = page.url()
  console.log("✅ Stripe checkout URL:", finalUrl)

  expect(finalUrl).toContain("checkout.stripe.com")
  // The URL should be for your live Stripe account (not test mode).
  expect(finalUrl).not.toContain("livemode=false")
})

test("homepage loads and Get a Quote CTA is visible", async ({ page }) => {
  await page.goto("/")
  await expect(page).toHaveTitle(/Man and Van/i)
  // Look for any prominent CTA that starts the booking flow.
  const cta = page.getByRole("link", { name: /quote|book|get started/i }).first()
  await expect(cta).toBeVisible({ timeout: 10000 })
})
