import { test, expect } from "playwright/test"

const LOCAL = "http://localhost:3001"

test("autocomplete returns Google results", async ({ request }) => {
  const res = await request.get(`${LOCAL}/api/addresses/autocomplete?term=10+Downing+Street`)
  expect(res.ok()).toBeTruthy()

  const data = await res.json()
  console.log("Provider:", data.provider)
  console.log("First result:", data.suggestions?.[0]?.address ?? "(none)")
  console.log("Total suggestions:", data.suggestions?.length ?? 0)

  expect(data.provider).toBe("google")
  expect(data.suggestions.length).toBeGreaterThan(0)
  expect(data.suggestions[0].address).toContain("Downing")
})
