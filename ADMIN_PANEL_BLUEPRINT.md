# Admin Panel Blueprint

## App Classification

This app is primarily a booking/scheduling app with payment. It is not currently a SaaS app, content platform, internal dashboard, API service, AI wrapper, or true marketplace in code.

Reason: customers request moving quotes and can book/pay. Provider quotes are hardcoded in `src/lib/pricing.ts`, not managed as marketplace participants.

## Do Not Build Yet Without Auth

No authentication, admin users, roles, or permissions currently exist. An admin panel should not be exposed until this foundation exists.

Minimum foundation:
- Admin authentication.
- Role or permission model.
- Server-side route protection for `/admin`.
- Server-side route protection for admin APIs.
- Audit log for dangerous actions.

## Manageable Entities

| Entity | Exists Today | Classification | Notes |
|---|---:|---|---|
| Bookings | Yes | Essential now | Main operations object and PII holder |
| Payments | Partial | Essential now | Stored as Stripe ids on Booking |
| Customers | Partial | Useful soon | Model exists but booking flow does not create/link customers |
| Providers/drivers | No, hardcoded | Useful soon | Needed if rates/providers should change without code deploy |
| Rates/pricing settings | No, code only | Useful soon | Currently hardcoded in `src/lib/pricing.ts` |
| Audit logs | No | Useful soon | Needed before manual status changes |
| App/service health | No | Useful soon | Read-only checks for Stripe, Resend, DB, geo provider |
| Content pages | Code only | Nice-to-have | Static pages can remain code-managed |
| Coupons/discounts | No | Avoid for now | User explicitly excluded discounts for now |
| Uploaded files | No | Avoid for now | No file upload feature |
| API keys/secrets | Env only | Avoid admin editing | Never expose secrets in admin UI |

## Diagnostic Questions

### Who are the admin users?

Not defined in code. Likely owner/operator/support staff, but this must be formalized before implementation.

### What can go wrong in production that an admin must fix quickly?

- Customer entered wrong phone/email.
- Pending booking was paid but webhook failed.
- Customer asks for booking status.
- Duplicate/spam pending bookings.
- Wrong booking status after support action.
- Provider/rate data needs urgent correction once it becomes database-backed.

### What data needs manual review or approval?

- Pending bookings with failed checkout.
- Paid sessions without confirmed booking.
- Webhook amount mismatch.
- High-value or unusual bookings.
- Repeated bookings from same contact details/IP if abuse controls are added.

### What user actions need moderation?

None currently. There is no public user-generated content.

### What business settings change without code deployment?

Useful future settings:
- Provider active/inactive status.
- Provider hourly rates and van capacity.
- Minimum hours.
- Contact phone/WhatsApp.
- Service cities.
- Free vs Google geo provider status.

### What logs or metrics are needed?

- Booking created.
- Checkout session created/reused.
- Stripe webhook received.
- Booking confirmed.
- Confirmation email sent/failed.
- Admin status changed.
- Admin contact detail edited.

### What actions are dangerous?

- Marking booking confirmed/completed/cancelled.
- Editing price.
- Editing move date/time.
- Editing customer contact details.
- Retrying/reflecting payment confirmation.
- Deleting or anonymizing records.

All dangerous actions need confirmation and audit logs.

### Which resources need search/filter/export?

Bookings:
- Search by booking id, email, phone, collection/delivery postcode.
- Filter by status, move date range, created date range, payment status.
- Export CSV for operations/finance, behind admin-only permission.

### Which actions should be role-restricted?

- Support: view bookings, edit contact details, add notes.
- Operations: update booking status and move details.
- Finance/admin: view payment ids, export, handle refunds if implemented.
- Super admin: manage admin users, provider rates/settings.

### What should never be editable from admin?

- Production API keys and secrets.
- Raw Stripe payment ids except as read-only.
- Audit logs.
- Booking id.
- Webhook event authenticity.
- Historical paid amount without a formal adjustment/refund model.

## Recommended Admin Structure

### 1. Bookings

Purpose: support and operations dashboard.

Access: admin, support, operations.

Fields/actions:
- View booking id, status, created date, move date/time.
- View customer name/email/phone.
- View route addresses, postcodes, stairs, stops.
- View van size, helpers, booked hours, price.
- Edit contact details.
- Add internal note once notes model exists.
- Change status with confirmation.

Filters/search:
- Booking id.
- Email/phone.
- Status.
- Move date.
- Collection/delivery postcode.

Audit logging: required for edits and status changes.

Priority: Critical.

Complexity: Medium.

Risk if built poorly: PII exposure, accidental status changes, support confusion.

### 2. Payments

Purpose: debug Stripe checkout and webhook state.

Access: admin, finance.

Fields/actions:
- View Stripe session id.
- View Stripe payment id.
- View booking price.
- View payment/booking status.
- Link to Stripe Dashboard.
- No direct refund action in MVP.

Filters/search:
- Stripe session id.
- Booking id.
- Status.
- Date range.

Audit logging: required if any action is added.

Priority: Critical.

Complexity: Medium.

Risk if built poorly: incorrect financial handling.

### 3. Customers

Purpose: support repeat customers and group bookings.

Access: admin, support.

Fields/actions:
- View customer profile.
- View linked bookings.
- Correct name/phone after verification.

Filters/search:
- Email.
- Phone.
- Name.

Audit logging: required for edits.

Priority: High, but only after booking flow creates/links `Customer`.

Complexity: Medium.

Risk if built poorly: privacy leakage and duplicate records.

### 4. Providers and Rates

Purpose: replace hardcoded provider data in `src/lib/pricing.ts`.

Access: admin, operations.

Fields/actions:
- Provider/company name.
- Active/inactive.
- Max van type.
- Hourly adjustment or hourly rates.
- Rating/review display data.

Filters/search:
- Active.
- Van type.

Audit logging: required.

Priority: High after MVP booking flow stabilizes.

Complexity: Medium.

Risk if built poorly: wrong customer prices.

### 5. Audit Log

Purpose: accountability for admin changes.

Access: admin only.

Fields/actions:
- Read-only event list.
- Actor, action, resource, before/after summary, timestamp.

Filters/search:
- Actor.
- Booking id.
- Action.
- Date.

Audit logging: this is the audit record.

Priority: High.

Complexity: Medium.

Risk if built poorly: no accountability after operational mistakes.

### 6. Service Health

Purpose: simple read-only operational diagnostics.

Access: admin only.

Fields/actions:
- Database reachable.
- Stripe configured.
- Stripe webhook configured.
- Resend configured.
- Geo provider mode.
- Rate limiting configured.

Filters/search: none.

Audit logging: not needed for read-only.

Priority: Medium.

Complexity: Low.

Risk if built poorly: exposing secret values. Show configured/not configured only.

## Suggested Routes

- `/admin/login`
- `/admin`
- `/admin/bookings`
- `/admin/bookings/[id]`
- `/admin/payments`
- `/admin/customers`
- `/admin/providers`
- `/admin/audit-log`
- `/admin/health`

## Suggested Data Additions

Only after auth is decided:

- `AdminUser`
- `AdminRole`
- `AuditLog`
- `BookingNote`
- optional `Provider`
- optional `PricingRule`
- optional webhook event log

## MVP Build Order

1. Admin auth and protected layout.
2. Booking list/detail read-only.
3. Booking contact edit and status change with audit log.
4. Payment read-only diagnostics.
5. Health page.
6. Provider/rate management after pricing is moved out of code.

## Avoid for Now

- CMS-style page editor.
- Coupon management.
- Driver dashboard.
- File uploads.
- Secret/API key editing.
- Complex analytics.
- Refund automation before payment operations are fully defined.
