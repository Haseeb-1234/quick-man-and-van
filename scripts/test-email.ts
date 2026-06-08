import "dotenv/config"
import { sendBookingConfirmationEmail } from "../src/lib/booking-email"

// Admin: sibtainsafdar47@gmail.com (default in resend.ts)
// Customer: haseebahsan168@gmail.com
const fakeBooking = {
  id: "test1234abcd5678",
  customerId: null,
  collectionAddress: "10 Downing Street",
  collectionPostcode: "SW1A 2AA",
  deliveryAddress: "Buckingham Palace",
  deliveryPostcode: "SW1A 1AA",
  stops: [],
  collectionStairs: 1,
  deliveryStairs: 0,
  moveDate: new Date("2026-07-01T09:00:00Z"),
  vanSize: "Medium",
  helpers: 1,
  price: 175.0,
  bookedHours: 7,
  bookedVanType: 1,
  stripePaymentId: null,
  stripeSessionId: null,
  checkoutToken: null,
  status: "CONFIRMED" as const,
  contactEmail: "haseebahsan168@gmail.com",
  contactName: "Haseeb",
  contactPhone: "07700000000",
  createdAt: new Date(),
  updatedAt: new Date(),
}

async function main() {
  console.log("Sending test email to", fakeBooking.contactEmail, "...")
  const ok = await sendBookingConfirmationEmail(fakeBooking as any)
  if (ok) {
    console.log("✓ Email sent successfully")
  } else {
    console.error("✗ Email failed — check RESEND_API_KEY is set and valid")
  }
}

main()
