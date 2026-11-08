# Learning assistant activation

The bottom-right widget is live in the GitHub Pages preview in guided mode. The AI adapter and Worker backend are prepared but are NOT connected or live-tested. No production AI request has been made. Do not mark AI active until the checks below pass.

## Private configuration

Deploy this Worker in an owner-controlled Cloudflare account using the official Wrangler workflow. Store OPENAI_API_KEY and a random RATE_SALT as encrypted Worker secrets, never in GitHub, HTML, JavaScript, URLs, or chat. Set OPENAI_MODEL to an account-accessible Responses API model supporting web_search and domain filtering; confirm the model and usage budget with the owner before activation. Model and search usage can incur API charges. No model or budget has been selected here.

Keep both rate-limit bindings. These limit requests per Cloudflare location and are not a global spend cap; configure provider project spend/rate controls and monitor usage. CORS alone cannot stop direct automated clients. Evaluate additional bot controls before public promotion. ALLOWED_ORIGINS must list exact approved website origins; add the custom domain only when actually used. No real inquiry or medical-record storage belongs in this service.

Run `node --test worker.test.mjs` with a modern Node runtime. Deploy from this folder with the official Wrangler CLI after configuring credentials and the settings above. The public API path is `/chat`. No production URL is prefilled or guessed.

## Connect the widget

Set design-preview/learning-chat-config.js with aiEnabled true, endpoint equal to the actual deployed HTTPS `/chat` URL, and approvedOrigin equal to that endpoint's origin. There must be no credentials in this public file. The visitor opts into AI before any question is transmitted. Up to six recent AI messages are included to support follow-up questions. Guided messages are not retroactively sent. Turning off AI clears the in-page AI context, but cannot retract a request already delivered to the provider. Start over cancels pending requests and clears the local conversation.

The Worker requests `store: false`; do not describe that as zero retention or as a guarantee about provider logs. Review the applicable provider data terms and update the site's operation-specific privacy notice before production activation. Simple identifier checks are not comprehensive de-identification: visitors must avoid names, contact data and medical details.

## Verify before enabling

Test a real general question, a follow-up, source links, personal-coverage handoff, service failure, timeout, rate limits, mismatched origins, visitor opt-in/off, reset during a request, keyboard close and phone-sized layout. Confirm source-year accuracy and evaluate representative Medicare questions before promoting the service. A linked official source is not proof every generated statement is correct. The system prompt is a behavioral control, not a guarantee or certification.

The backend can only search official Medicare/CMS/SSA/Medicaid/eCFR sources. It has no IntegrityCONNECT, PlanEnroll, contact-form, database or enrollment credentials. Existing contact links remain demonstration links until intake is activated separately.

References checked November 7, 2026:
- https://developers.openai.com/api/docs/guides/tools-web-search
- https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/
