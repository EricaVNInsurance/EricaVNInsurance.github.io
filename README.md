# EricaVN Insurance website

Official website project for EricaVN Insurance.

## Current preview

- [Homepage](https://ericavninsurance.github.io/design-preview/)
- [Learning center](https://ericavninsurance.github.io/design-preview/learn-medicare.html)
- [Word guide](https://ericavninsurance.github.io/design-preview/medicare-words.html)
- [Custom request form demo](https://ericavninsurance.github.io/design-preview/request-medicare-help.html)

The approved design and content are in `design-preview/`. The root homepage and earlier preview files are retained. The redesign has not been promoted to the main website address.

## Completed page work

- Shared warm white, charcoal, and deep green design with responsive layouts.
- Homepage, help page, 15 educational guides, and a separate word guide.
- Desktop and mobile navigation, current-page indicators, keyboard focus styles, and skip links.
- Branded request form with required-field validation and a confirmation preview.
- Source links and review dates on educational content.

## Form status

The request form is a **demo only**. It does not transmit or persist entries and does not send email, text messages, or Discord notifications. Use fictional information when reviewing it. The preview button validates entries, resets the fields, and displays a clearly labeled example confirmation.

`request-form.js` intentionally has no submission endpoint or storage calls. Keep the demo notice and no-collection behavior until a submission service is configured and tested. Never add private records, credentials, or Discord webhook secrets to this public repository.

## Remaining launch work

1. Select and configure appropriate private response storage and a server-side submission endpoint.
2. Connect notification delivery; test validation, successful storage, delivery failures, and duplicate protection.
3. Confirm business contact details, licensing information, privacy notice, and applicable business/carrier disclosures.
4. Replace demo-only wording and verify that confirmation appears only after a request is successfully received.
5. Promote the finished version to the root website when requested.

## Validation

The final preview pass checks local links, anchors, assets, page titles, descriptions, and headings. The custom form's required-field behavior, confirmation preview, reset behavior, and keyboard navigation have been reviewed in a browser using fictional details. No real beneficiary records are used in testing.

## Maintenance

Pages use shared `styles.css` and `navigation.js`. The custom form adds `request-form.css` and `request-form.js`. Relative links keep the preview self-contained. Recheck Medicare facts against official sources before changing educational guidance; update review dates when the facts are reviewed.
