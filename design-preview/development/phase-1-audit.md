# Phase 1 audit and independent lead-management plan

Reviewed November 1, 2026. Source baseline: `fadeb949f38fc4912c437200a1aa9ffa54320e84`.

## Audit findings

| Area | Observed state | Action / remaining work |
| --- | --- | --- |
| Public custom domain | HTTPS requests from this environment to the homepage, preview, robots.txt and sitemap.xml returned HTTP 503. Web retrieval also could not access the domain. | Verify DNS, domain routing, certificate and hosting from the owner's environment. This does not establish that every visitor sees an outage. No DNS or domain configuration was changed. |
| GitHub source | `main` has the original root homepage plus the newer `design-preview/` pages. No CNAME file was listed. | The preview remains separate; do not promote it to root during this phase. GitHub Pages settings/DNS ownership have not been verified. |
| Original root homepage | Contains section-anchor links and no HTML form. | A working preview form does not automatically update the root homepage or custom domain. |
| Custom intake | Demo only: no endpoint, database, email, Discord, scheduler, CRM, or persistence. The old script validated, reset and showed an example success message. | Keep preview mode explicit. Do not claim live leads are captured. |
| Initial data collection | Required name, phone, state, ZIP, and Medicare/Medicaid status; optional reason. | Require name, phone, state, general reason and phone permission. ZIP/email are optional. Remove Medicare/Medicaid status and all open medical questions. |
| Contact preference | No preferred time or time zone. | Add optional call window with a required time zone when a window is selected. This is not an appointment. |
| Consent | One checkbox covered calls, texts and email. | Separate the requested phone call from optional email permission. No automated calling, texting, lead sharing or reminder enrollment. Wording is a draft for review against actual operations before activation. |
| Confirmation | Demo displayed a simulated submitted message. | Demo now says no request was sent. Prepared live code requires a validated server receipt before clearing entries or displaying success. |
| Privacy | No linked notice for the form. | Add a truthful preview notice. Replace it with an operation-specific live notice before collection. |
| Appointment scheduling | No provider account or URL configured. | Optional link is hidden. Prepared code shows it only after a live receipt and a configured HTTPS booking URL. No fake booking buttons or booking confirmations. |
| Design | The owner clarified that the original cream/green design must be preserved. | Restored the form and preview privacy page to the shared cream/green palette. Keep these colors for future work. |
| Existing conversion content | Contextual help links, benefits scenarios, Word Guide navigation and optional preparation already exist. | Preserve them. The two help-page header actions already go directly to the request form. |
| SEO | Preview pages intentionally have `noindex, nofollow`. | Keep it while the site is a demo. Domain/canonical/indexing/sitemap/Search Console work belongs to the verified production launch, not the preview. |

## Phase 1 implementation

- Cream/green responsive form with name, U.S. phone, optional email, state, optional ZIP, general topic and optional time/time-zone preference.
- Phone permission names Erica Vargas-Navarro of EricaVN Insurance. Optional email permission is separate. Neither is preselected.
- Clear no-enrollment/no-coverage-change language; no health status, uploads, free text, SSN or Medicare-number fields.
- Accessible labels, native required-field checks, focus management, error message and a duplicate-click guard.
- Preview runs without network or browser-storage writes and clears fictional entries after completion.
- Future live adapter posts only to a configured HTTPS endpoint with an exact approved origin. It omits cookies, rejects redirects, sets a timeout and waits for `accepted: true` plus a safe request reference.
- Failed/unconfirmed submissions keep entries. Unchanged retries reuse an in-memory idempotency key; edited requests receive a new key. No automatic retry.
- Optional scheduling link uses the owner's configured HTTPS URL, with no name, phone, email, health information or form answers in the URL or referrer.

This is frontend preparation, not a deployed backend. The public configuration deliberately retains `mode: 'preview'`, `liveIntakeApproved: false` and null endpoint/scheduling settings. Do not change those flags merely to remove the preview banner.

## Independent architecture for Phase 2

Public GitHub-hosted website → owner-controlled HTTPS submission endpoint → private database transaction (lead + consent event + notification-outbox item) → minimal notification → authenticated owner dashboard/CRM → manual requested follow-up.

GitHub Pages is static hosting and cannot privately process/store lead records itself. Keep public source and private business records in separate systems. Never save actual responses, secrets, database exports or recordings in this repository.

### Candidate services to evaluate, not provisioned

| Candidate | Why consider it | Required configuration / tradeoff |
| --- | --- | --- |
| Cloudflare Workers + D1 in Erica's account | Separate intake service, SQL data export, free/paid options; D1 documents encryption at rest and in transit. | Private owner authentication/dashboard and authorization must be implemented. Provider terms, processing region, backups and suitability must be reviewed for the actual data. Free-tier limits are not a production budget guarantee. |
| Supabase Postgres + server-side function in Erica's account | Portable SQL database, owner authentication and an administrative interface. | Deny anonymous table reads/writes, enable RLS, test permissions, keep service-role credentials on the server, and review backup/export needs and current pricing. |
| Cal.com individual scheduling | A current free individual plan is a candidate for avoiding an unnecessary booking subscription. | Owner account/calendar connection, working public booking link, business hours, time-zone handling, privacy terms, cancellation and rescheduling must be tested. Do not assume automated SMS is authorized by this intake. |

Keep the domain, hosting, database owner account, phone-number account and scheduler under Erica's control. FMO tools may later consume authorized records, but must not become the sole copy. Actual book/renewal ownership is contractual; technology ownership does not establish commission rights.

### Private record model

- `leads`: internal ID, opaque public reference, server UTC received timestamp, name, normalized phone, optional email/ZIP, state, topic, preferred window/time zone, lead source enum, status, and update timestamp.
- `consent_events`: immutable event ID, lead ID, server UTC timestamp, phone/email permission values, exact approved wording/version, corresponding privacy version, form version, consent document hash, and source path. Capture later withdrawals as new events; do not overwrite original evidence. Decide any IP/device collection separately rather than collecting it by default.
- `lead_events`: authenticated actor, timestamp and state transition; statuses `new`, `contacted`, `appointment_scheduled`, `follow_up_needed`, `completed`. A completed inquiry is not automatically an enrollment.
- `notification_outbox`: lead ID, channel, status, attempts and next retry time. Create in the same transaction as the record; do not depend on successful notification delivery to preserve a lead.
- `appointments`: scheduler's opaque event ID, lead ID if matched securely inside authenticated systems, event time/time zone, cancellation/reschedule state. A preferred callback window is never an appointment event.

Use least-privilege service credentials, owner MFA, authenticated record access, encryption in transit/at rest, redacted application logs, tested recovery and documented exports. A request reference is not a password and must not grant record access.

### Notification content

Discord/email owner alert example: `New website inquiry · reference ABC12345 · status New · received [UTC time] · Open private dashboard`.

No name, phone, email, state, ZIP, topic, diagnosis, consent answers, documents, audio or attachments. Dashboard links require owner authentication and contain no personal details or bearer access token. A private Discord channel is still not the records database. Store Discord webhook and email-service credentials only as server-side secrets. Notification failures require retries/owner visibility; the stored request remains intact.

### Submission contract (server not implemented yet)

`POST <approved HTTPS intake endpoint>`, JSON body with `Idempotency-Key: <UUID>`. See `intake-contract.schema.json`.

The server must enforce a small body limit (proposed maximum 8 KB), content type, origin policy, schema/field allowlists, lengths, enum values, U.S. phone normalization, topic, phone permission, and conditional email/time-zone requirements. Reject unknown fields and uploads. Add server-side rate limiting and an appropriate anti-abuse control before collection. Respond to valid CORS preflights for Content-Type and Idempotency-Key only from approved origins. Origin/CORS checks alone are not authentication or bot protection.

The server must use its own approved, versioned consent text and trusted UTC clock. Compare submitted versions/text with the approved version; reject stale or altered copies. Do not treat browser flags as evidence that compliance has been reviewed.

Commit the private record, consent event and outbox item atomically before responding. Bind an idempotency key to the validated payload: identical retries return the same reference; reusing a key with different data is rejected. Never reveal whether a phone/email already exists.

Successful committed response:

```json
{"accepted": true, "requestId": "opaque-reference-123"}
```

Use safe, non-personal errors for 400/413/429/5xx. No contact details in logs, response bodies or analytics. A 200 status without a valid receipt must not show success. Test timeout-after-save/idempotent retry, database failure, notification failure, double clicks, invalid consent, CORS/abuse controls, anonymous read denial and unauthenticated dashboard access.

## Compliance review and launch gates

Reviewed federal sources below as of November 1, 2026. This is an implementation review and launch checklist, not a certification of compliance across 19 states.

1. Confirm the legal business name/contact, active licenses, carrier appointments/readiness and the service areas/year in which assistance can be offered. The state dropdown follows the user's provided list; it is not independent licensing verification.
2. Review existing benefit/SSBCI content and applicable disclaimers before production marketing. Determine applicable MA/Part D TPMO disclosures and obtain current organization/product counts by service area. Current standardized wording and display requirements must come from 42 CFR 422.2267(e)(41) and the Part D counterpart. Do not publish invented counts, a generic substitute, or unfilled placeholders. No organization/plan counts were supplied, so this remains a launch blocker.
3. Requested follow-up must match the contact permission. No cold-call, automated-call, text, automated reminder or third-party lead-sharing program is enabled. Review TCPA/DNC requirements, applicable state calling/texting rules and actual technology before expanding outreach.
4. Permission to contact is not a Scope of Appointment. Obtain/document an SOA before a personal marketing appointment as applicable. The current federal rule no longer imposes the old blanket 48-hour waiting period; verify any stricter carrier requirements.
5. Review actual processor contracts, access controls, breach response, privacy contacts/rights and retention obligations for the data collected and states served. Do not claim that a service is HIPAA/CMS compliant merely because it encrypts data. Keep medical records and enrollment data out of this minimal contact intake.
6. Publish an accurate live privacy notice and approved contact permission; connect the selected private storage/endpoint; update config versions. Preserve exact consent wording and withdrawal history.
7. Decide a documented retention schedule for inquiry/PTC/SOA records with applicable contracts/law. Do not automatically apply the call-recording period to every form record. Current federal marketing/sales call retention is at least six years: audio for years 1–3 and audio or complete accurate transcripts for years 4–6. Recording consent and state-law requirements need separate review before calls are recorded.
8. Confirm that live success means durable storage; test private notifications without personal data. Verify backups, access denial and owner-controlled export/restore. Sanitize CSV exports against spreadsheet-formula injection; keep full-fidelity JSON/SQL exports protected.
9. If scheduling is added, connect the actual professional calendar, test availability/cancellation/rescheduling/confirmations, and review any reminder permissions. Do not imply booking or SOA completion from a form submission.
10. Resolve domain routing, preserve the confirmed cream/green design, then explicitly promote to the production address and complete SEO/indexing/Search Console work. No domain change, production-root replacement, real test submission or account purchase is part of this phase.

## Sources

- [GitHub Pages: creating a site and server-side limitations](https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site)
- [42 CFR 422.2264: beneficiary contact and appointments](https://www.ecfr.gov/current/title-42/chapter-IV/subchapter-B/part-422/subpart-V/section-422.2264)
- [42 CFR 422.2267: required materials, including TPMO disclosure](https://www.ecfr.gov/current/title-42/chapter-IV/subchapter-B/part-422/subpart-V/section-422.2267)
- [42 CFR 422.2274: third-party requirements, recording and sharing](https://www.ecfr.gov/current/title-42/chapter-IV/subchapter-B/part-422/subpart-V/section-422.2274)
- [FCC consumer guidance on consent and Do-Not-Call](https://docs.fcc.gov/public/attachments/DOC-408396A1.pdf)
- [FCC rule published October 26, 2026, effective November 25, 2026](https://www.govinfo.gov/content/pkg/FR-2026-10-26/html/2026-21821.htm) — distinguish future effective provisions from today's requirements before automated outreach.
- [Cloudflare D1 overview](https://developers.cloudflare.com/d1/)
- [Cloudflare D1 data security](https://developers.cloudflare.com/d1/reference/data-security/)
- [Supabase data security](https://supabase.com/docs/guides/database/secure-data)
- [Supabase row-level security](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Cal.com current plans](https://cal.com/pricing)

## Verification record

- `node design-preview/development/request-form.test.cjs`: 15 integration/guardrail checks passed, using mocked responses and fictional data only. Tests cover no-network preview, fail-closed setup, invalid phone, conditional time zone/email, verified receipt, failed receipt, preserved values, retry idempotency, duplicate clicks, unsafe scheduling URLs, rate limits and production preview settings.
- Chrome desktop: completed preview with fictional contact details; preferred time without a time zone was blocked; selecting the zone allowed preview completion; confirmation explicitly denied sending/saving/booking.
- Responsive browser iframes at 390 px and 320 px outer widths (375 px and 305 px content widths with scrollbars): no horizontal overflow; no controls extended past the narrow viewport. At phone width, selecting optional email permission without an address was blocked; fictional email allowed preview completion. This is a responsive layout check, not testing on physical iOS/Android devices.
- Privacy notice and return-to-form links verified in the browser. Desktop and narrow layouts were visually inspected during Phase 1. The temporary dark theme was subsequently removed at the owner’s request; the original cream/green palette is authoritative.
- Script syntax, local links/anchors, HTML structure, labels and frozen public preview configuration checked before commit. No production storage, notification, real appointment, DNS, call recording, carrier readiness or full 19-state legal review was verified.

No real beneficiary records were used. A mocked receipt is not evidence of working production storage.
